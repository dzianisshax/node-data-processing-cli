import { resolvePath } from '../utils/pathResolver.js';
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512'];

/**
 * Calculate a cryptographic hash of a file.
 * @param {string} cwd - Current working directory.
 * @param {any} options - The path to the input file, hash algorithm and --save flag.
 */
export async function hash(cwd, options) {
  const { input, algorithm = 'sha256', save } = options;

  try {
    // Input is required, and algorithm must be one of the supported three
    if (!input || !SUPPORTED_ALGORITHMS.includes(algorithm)) {
      throw new Error('Invalid arguments or unsupported algorithm');
    }

    // Resolve path relative to the current working directory
    const inputPath = resolvePath(cwd, input);

    const hash = createHash(algorithm);

    const digest = await new Promise((resolve, reject) => {
      const readStream = createReadStream(inputPath);

      // Catch stream errors (e.g., file doesn't exist)
      readStream.on('error', reject);
      hash.on('error', reject);

      // Pipe the file data into the hash, and resolve the hex digest when finished
      readStream.pipe(hash).on('finish', () => {
        resolve(hash.digest('hex'));
      });
    });

    console.log(`${algorithm}: ${digest}`);

    // Write hash to <inputFilename>.<algorithm> if --save is provided
    if (save) {
      await writeFile(`${inputPath}.${algorithm}`, digest);
    }
  } catch (error) {
    // Any failure (missing file, bad algorithm, write error)
    console.log('Operation failed');
  }
}
