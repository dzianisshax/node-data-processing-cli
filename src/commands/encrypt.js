import { resolvePath } from '../utils/pathResolver.js';
import { createReadStream, createWriteStream } from 'fs';
import { open, unlink } from 'node:fs/promises';
import { pipeline } from 'stream/promises';
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Promisify the scrypt key derivation function
const scryptAsync = promisify(scrypt);

/**
 * Encrypt a file using AES-256-GCM.
 * @param {string} cwd - Current working directory.
 * @param {any} options - The paths and password.
 */
export async function encrypt(cwd, options) {
  const { input, output, password } = options;

  // Hoisted so we can access it in the catch block
  let outputPath;

  try {
    // Input, output and password are required
    if (!input || !output || !password) {
      throw new Error('Invalid arguments');
    }

    // Resolve path relative to the current working directory
    const inputPath = resolvePath(cwd, input);
    outputPath = resolvePath(cwd, output);

    // Verify input file exists and is readable.
    // We open and immediately close it just to trigger an early throw if missing.
    try {
      const inputHandle = await open(inputPath, 'r');
      await inputHandle.close();
    } catch (err) {
      throw new Error('Operation failed: Input file is missing or unreadable.');
    }

    // Generate Salt (16 bytes) and IV (12 bytes)
    const salt = randomBytes(16);
    const iv = randomBytes(12);

    // Derive a 32-byte key from the password and salt
    const key = await scryptAsync(password, salt, 32);

    // Initialize the AES-256-GCM Cipher
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // Define an async generator to format the binary output stream
    // Format: [Salt (16)] + [IV (12)] + [Ciphertext (...)] + [AuthTag (16)]
    async function* buildOutputFormat(source) {
      // Yield the header into the stream first
      yield salt;
      yield iv;

      // Yield the encrypted chunks as they come in
      for await (const chunk of source) {
        yield chunk;
      }

      // Yield the AuthTag at the very end
      yield cipher.getAuthTag();
    }

    // Execute the pipeline end-to-end
    await pipeline(
      createReadStream(inputPath),
      cipher,
      buildOutputFormat,
      createWriteStream(outputPath),
    );

    console.log(`Successfully encrypted to ${outputPath}`);
  } catch (err) {
    console.log('Operation failed');

    // Clean up
    if (outputPath) {
      try {
        await unlink(outputPath);
      } catch (cleanupErr) {
        // We gracefully ignore this. If the file didn't exist yet,
        // unlink throws an error, which is perfectly fine here.
      }
    }
  }
}
