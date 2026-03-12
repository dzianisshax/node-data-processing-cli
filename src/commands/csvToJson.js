import fs from 'fs';
import { resolvePath } from '../utils/pathResolver.js';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

class CsvToJsonTransform extends Transform {
  constructor() {
    super({ readableObjectMode: false, writableObjectMode: false });
    this.buffer = '';
    this.headers = null;
    this.isFirstRecord = true;
  }

  _transform(chunk, _, callback) {
    // Add new chunk to the buffer and split by newline
    this.buffer += chunk.toString();
    const lines = this.buffer.split(/\r?\n/);

    // Keep the last partial line in the buffer
    this.buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      if (!this.headers) {
        // First line: parse headers and start the JSON array
        this.headers = line.split(',').map((h) => h.trim());
        this.push('[\n');
      } else {
        // Subsequent lines: create objects based on headers
        const values = line.split(',');
        const obj = {};

        this.headers.forEach((header, index) => {
          obj[header] = values[index] ? values[index].trim() : '';
        });

        const prefix = this.isFirstRecord ? '  ' : ',\n  ';
        this.push(prefix + JSON.stringify(obj));
        this.isFirstRecord = false;
      }
    }
    callback();
  }

  _flush(callback) {
    // Process any remaining data in the buffer
    if (this.buffer.trim()) {
      if (!this.headers) {
        this.push('[\n'); // Edge case: Only a header row existed
      } else {
        const values = this.buffer.split(',');
        const obj = {};
        this.headers.forEach((header, index) => {
          obj[header] = values[index] ? values[index].trim() : '';
        });
        const prefix = this.isFirstRecord ? '  ' : ',\n  ';
        this.push(prefix + JSON.stringify(obj));
      }
    }

    // Close the JSON array
    if (!this.headers) {
      this.push('[]'); // File was completely empty
    } else {
      this.push('\n]\n');
    }
    callback();
  }
}

/**
 * Convert a CSV file to a JSON file.
 * * @param {string} cwd - Current working directory.
 * * @param {any} options - Path to the input CSV file and path to the output JSON file.
 */
export async function convertCsvToJson(cwd, options) {
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

  const readStream = fs.createReadStream(inputPath);
  const transformStream = new CsvToJsonTransform();
  const writeStream = fs.createWriteStream(outputPath);

  try {
    // Readable Stream → Transform Stream → Writable Stream pipeline
    await pipeline(readStream, transformStream, writeStream);
    console.log(`Success: Converted ${input} to ${output}`);
  } catch (err) {
    console.log('Operation failed');
  }
}
