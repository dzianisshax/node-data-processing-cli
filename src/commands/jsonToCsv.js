import fs from 'node:fs';
import { resolvePath } from '../utils/pathResolver.js';

/**
 * Convert a JSON file (array of objects) to a CSV file.
 * * @param {string} cwd - Current working directory.
 * * @param {any} options - Path to the input JSON file and path to the output CSV file.
 */
export async function convertJsonToCsv(cwd, options) {
  const { input, output } = options;

  if (!input || !output) {
    console.log('Operation failed: --input and --output are required.');
    return;
  }

  // Resolve paths relative to the current working directory
  const inputPath = resolvePath(cwd, input);
  const outputPath = resolvePath(cwd, output);

  // If the input file doesn't exist
  if (!fs.existsSync(inputPath)) {
    console.log('Operation failed');
    return;
  }

  try {
    const readStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
    let rawData = '';

    // Consume the read stream
    for await (const chunk of readStream) {
      rawData += chunk;
    }

    // Parse the JSON. This will throw a SyntaxError if it's invalid
    const data = JSON.parse(rawData);

    // Validate that the input is a non-empty array of objects
    if (
      !Array.isArray(data) ||
      data.length === 0 ||
      typeof data[0] !== 'object'
    ) {
      throw new Error('Invalid JSON structure');
    }

    // Extract headers from the first object's keys
    const headers = Object.keys(data[0]);

    // Create the write stream for the output
    const writeStream = fs.createWriteStream(outputPath, {
      encoding: 'utf8',
    });

    // Write the CSV header row
    writeStream.write(headers.join(',') + '\n');

    // Process and stream each object as a CSV row
    for (const item of data) {
      const row = headers.map((header) => {
        let val = item[header];
        if (val === null || val === undefined) val = '';

        // Convert to string and handle basic CSV escaping (commas, quotes, newlines)
        val = String(val);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });

      // Write the formatted row to the stream
      const canContinue = writeStream.write(row.join(',') + '\n');

      // Handle backpressure if the stream buffer gets full
      if (!canContinue) {
        await new Promise((resolve) => writeStream.once('drain', resolve));
      }
    }

    // Close the stream once all data is written
    writeStream.end();
    console.log(`Success: Converted ${input} to ${output}`);
  } catch (err) {
    // If the file doesn't exist (ENOENT) or contains invalid JSON (SyntaxError)
    console.log('Operation failed');
  }
}
