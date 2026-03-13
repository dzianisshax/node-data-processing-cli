import { resolvePath } from '../utils/pathResolver.js';
import { createReadStream } from 'fs';

/**
 * Processes the file using Streams to count lines, words, and only visible characters.
 * @param {string} cwd - Current working directory.
 * @param {any} options - The path to the input file.
 */
export function count(cwd, options) {
  return new Promise((resolvePromise) => {
    const { input } = options;

    if (!input) {
      console.log('Operation failed: --input is required.');
      return;
    }
    // Resolve path relative to the current working directory
    const inputPath = resolvePath(cwd, input);

    // Read the stream as UTF-8 to properly count characters and evaluate regex
    const stream = createReadStream(inputPath, { encoding: 'utf8' });

    let lines = 0;
    let words = 0;
    let characters = 0;
    let hasTrailingChars = false;

    // State to track word boundaries across stream chunks
    let inWord = false;

    stream.on('data', (chunk) => {
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];

        // Count lines by newline character
        if (char === '\n') {
          lines++;
          // Reset because the line properly ended
          hasTrailingChars = false;
        } else {
          // We hit a character that isn't a newline
          hasTrailingChars = true;
        }

        // A word is a sequence of non-whitespace characters
        const isSpace = /\s/.test(char);

        // Count only visible (non-whitespace) characters
        if (!isSpace) {
          characters++;
        }

        if (!isSpace && !inWord) {
          // Transitioned from whitespace (or start) to a character
          words++;
          inWord = true;
        } else if (isSpace && inWord) {
          // Transitioned from a word back to whitespace
          inWord = false;
        }
      }
    });

    stream.on('end', () => {
      // If the stream ended but the last characters didn't include a newline,
      // count it as one final line.
      if (hasTrailingChars) {
        lines++;
      }

      console.log(`Lines: ${lines}`);
      console.log(`Words: ${words}`);
      console.log(`Characters: ${characters}`);
      resolvePromise();
    });

    stream.on('error', (_) => {
      // If the input file doesn't exist
      console.log('Operation failed');
      resolvePromise();
    });
  });
}
