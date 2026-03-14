import { resolvePath } from '../utils/pathResolver.js';
import { createReadStream, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import readline from 'readline';

const NUM_WORKERS = cpus().length;

async function findLineBoundaries(filePath, numChunks) {
  const stats = await readFile(filePath, { encoding: 'utf8' });
  const fileSize = stats.length;
  const chunkSize = Math.ceil(fileSize / numChunks);
  const boundaries = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, fileSize);

    // Adjust start to beginning of line (except first chunk)
    let adjustedStart = start;
    if (i > 0) {
      // Find next newline after start
      const stream = createReadStream(filePath, {
        start: start - 1,
        end: Math.min(start + 1024, fileSize),
        encoding: 'utf8',
      });

      const rl = readline.createInterface({ input: stream });
      let firstLine = '';
      for await (const line of rl) {
        firstLine = line;
        break;
      }

      // Start position = position after first line in this chunk
      adjustedStart = start + Buffer.byteLength(firstLine) + 1;
    }

    // Adjust end to end of line
    let adjustedEnd = end;
    if (i < numChunks - 1) {
      // Find next newline after end
      const stream = createReadStream(filePath, {
        start: end,
        end: Math.min(end + 1024, fileSize),
        encoding: 'utf8',
      });

      const rl = readline.createInterface({ input: stream });
      let firstLine = '';
      for await (const line of rl) {
        firstLine = line;
        break;
      }

      // End position = position before this line
      adjustedEnd = end + Buffer.byteLength(firstLine) + 1;
    }

    if (adjustedStart < fileSize) {
      boundaries.push({
        start: adjustedStart,
        end: adjustedEnd,
        index: i,
      });
    }
  }

  return boundaries;
}

function mergeStats(workerStats) {
  const merged = {
    total: 0,
    levels: {},
    status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    paths: new Map(),
    totalResponseTime: 0,
  };

  for (const stat of workerStats) {
    merged.total += stat.total;

    // Merge levels
    for (const [level, count] of Object.entries(stat.levels)) {
      merged.levels[level] = (merged.levels[level] || 0) + count;
    }

    // Merge status classes
    for (const [statusClass, count] of Object.entries(stat.status)) {
      merged.status[statusClass] += count;
    }

    // Merge paths
    for (const [path, count] of stat.paths) {
      merged.paths.set(path, (merged.paths.get(path) || 0) + count);
    }

    merged.totalResponseTime += stat.totalResponseTime;
  }

  // Calculate average response time
  const avgResponseTimeMs =
    merged.total > 0
      ? Number((merged.totalResponseTime / merged.total).toFixed(2))
      : 0;

  // Get top 10 paths
  const topPaths = Array.from(merged.paths.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths,
    avgResponseTimeMs,
  };
}

/**
 * Compute statistics for a large log file using Worker Threads for parallel processing.
 * Use the provided script to generate a large log file for testing:
 * node scripts/generate-logs.cjs --output workspace/logs.txt --lines 500000
 * @param {string} cwd - Current working directory.
 * @param {any} options - path to the input log file and path to the output JSON file.
 */
export async function logStats(cwd, options) {
  const { input, output } = options;

  // Resolve paths relative to the current working directory
  const inputPath = resolvePath(cwd, input);
  const outputPath = resolvePath(cwd, output);

  // Check if input file exists
  if (!existsSync(inputPath)) {
    console.error('Operation failed');
    return;
  }

  try {
    console.log(`Processing log file: ${inputPath}`);
    console.log(`Using ${NUM_WORKERS} workers...`);

    // Find line boundaries for each chunk
    const boundaries = await findLineBoundaries(inputPath, NUM_WORKERS);

    // Create workers
    const workers = boundaries.map((boundary) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker('./src/workers/logWorker.js', {
          workerData: {
            filePath: inputPath,
            start: boundary.start,
            end: boundary.end,
            index: boundary.index,
          },
        });

        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });

    // Wait for all workers to complete
    const workerStats = await Promise.all(workers);

    // Merge statistics
    const finalStats = mergeStats(workerStats);

    // Write output file
    await writeFile(outputPath, JSON.stringify(finalStats, null, 2));

    console.log(`Statistics written to: ${outputPath}`);
  } catch (error) {
    console.error('Operation failed:', error.message);
  }
}
