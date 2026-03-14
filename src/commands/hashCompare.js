import { resolvePath } from '../utils/pathResolver.js';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

/**
 * Calculate file hash and compare it with a value stored in a hash file.
 * @param {string} cwd - Current working directory.
 * @param {any} options - The paths and hash algorithm.
 */
export async function hashCompare(cwd, options) {
  const { input, hash, algorithm = 'sha256' } = options;

  try {
    // Input and hash is required, and algorithm must be one of the supported three
    if (!input || !hash || !SUPPORTED_ALGORITHMS.includes(algorithm)) {
      throw new Error('Invalid arguments or unsupported algorithm');
    }

    // Resolve path relative to the current working directory
    const inputPath = resolvePath(cwd, input);
    const hashPath = resolvePath(cwd, hash);

    // Read the expected hash
    // We use .trim() to ignore trailing newlines and whitespace, and .toLowerCase() for case-insensitivity
    const expectedHashRaw = await readFile(hashPath, 'utf8');
    const expectedHash = expectedHashRaw.trim().toLowerCase();

    // Calculate the hash using the Streams API
    const calculatedHash = await new Promise((resolve, reject) => {
      const inputStream = createReadStream(inputPath);
      const hashStream = createHash(algorithm);

      // Handle missing files or read errors
      inputStream.on('error', reject);
      hashStream.on('error', reject);

      inputStream.pipe(hashStream);

      hashStream.on('finish', () => {
        resolve(hashStream.digest('hex').toLowerCase());
      });
    });

    // Compare hashes
    if (calculatedHash === expectedHash) {
      console.log('OK');
    } else {
      console.log('MISMATCH');
    }
  } catch (error) {
    // Catches input or hash file doesn't exist, algorithm is not supported errors
    console.log('Operation failed');
  }
}
