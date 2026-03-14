import { resolvePath } from '../utils/pathResolver.js';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createDecipheriv, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export async function decrypt(cwd, options) {
  const { input, output, password } = options;
  let outputPath;

  try {
    // Input, output, and password are required
    if (!input || !output || !password) {
      throw new Error('Invalid arguments');
    }

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

    // Async generator to parse the stream, extract metadata, and decrypt
    async function* decryptStream(source) {
      let buffer = Buffer.alloc(0);
      let decipher = null;
      let initialized = false;

      for await (const chunk of source) {
        // Concatenate incoming chunk to our sliding buffer
        buffer = Buffer.concat([buffer, chunk]);

        // Phase 1: Extract Salt (16 bytes) and IV (12 bytes)
        if (!initialized) {
          if (buffer.length >= 28) {
            const salt = buffer.subarray(0, 16);
            const iv = buffer.subarray(16, 28);

            // Remove the header from the buffer
            buffer = buffer.subarray(28);

            // Derive the 32-byte key using the exact same parameters
            const key = await scryptAsync(password, salt, 32);

            // Initialize the decipher
            decipher = createDecipheriv('aes-256-gcm', key, iv);
            initialized = true;
          } else {
            // Wait for more data if we don't have enough to read the header
            continue;
          }
        }

        // Phase 2: Decrypt the ciphertext while holding back 16 bytes for the authTag
        if (initialized && buffer.length > 16) {
          const chunkToDecrypt = buffer.subarray(0, buffer.length - 16);
          // Keep only the last 16 bytes in the buffer
          buffer = buffer.subarray(buffer.length - 16);

          yield decipher.update(chunkToDecrypt);
        }
      }

      // End of Stream checks
      if (!initialized || buffer.length !== 16) {
        throw new Error('Invalid file format or missing authentication tag.');
      }

      // Phase 3: Apply the auth tag (the last 16 bytes) and finalize
      decipher.setAuthTag(buffer);

      // This throws if the password/tag is incorrect
      yield decipher.final();
    }

    // Execute the pipeline end-to-end
    await pipeline(
      createReadStream(inputPath),
      decryptStream,
      createWriteStream(outputPath),
    );

    console.log(`Successfully decrypted to ${outputPath}`);
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
