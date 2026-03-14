import { parentPort, workerData } from 'worker_threads';
import { createReadStream } from 'fs';
import readline from 'readline';

function parseLogLine(line) {
  // Format: <isoTimestamp> <level> <service> <statusCode> <responseTimeMs> <method> <path>
  const parts = line.trim().split(' ');

  if (parts.length < 7) return null;

  const level = parts[1];
  const statusCode = parseInt(parts[3], 10);
  const responseTimeMs = parseInt(parts[4], 10);
  const path = parts.slice(6).join(' '); // Path might contain spaces

  // Validate data
  if (isNaN(statusCode) || isNaN(responseTimeMs)) return null;

  return {
    level,
    statusCode,
    responseTimeMs,
    path,
  };
}

function getStatusClass(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return '2xx';
  if (statusCode >= 300 && statusCode < 400) return '3xx';
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500 && statusCode < 600) return '5xx';
  return 'other';
}

async function processChunk(filePath, start, end) {
  const stats = {
    total: 0,
    levels: {},
    status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    paths: new Map(),
    totalResponseTime: 0,
  };

  const stream = createReadStream(filePath, {
    start,
    end,
    encoding: 'utf8',
  });

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const parsed = parseLogLine(line);
    if (!parsed) continue;

    stats.total++;

    // Count by level
    stats.levels[parsed.level] = (stats.levels[parsed.level] || 0) + 1;

    // Count by status class
    const statusClass = getStatusClass(parsed.statusCode);
    if (stats.status[statusClass] !== undefined) {
      stats.status[statusClass]++;
    }

    // Count by path
    stats.paths.set(parsed.path, (stats.paths.get(parsed.path) || 0) + 1);

    // Sum response times
    stats.totalResponseTime += parsed.responseTimeMs;
  }

  // Convert Map to array for serialization
  return {
    ...stats,
    paths: Array.from(stats.paths.entries()),
  };
}

// Main worker logic
async function run() {
  try {
    const { filePath, start, end, index } = workerData;

    console.log(`Worker ${index} processing chunk: ${start}-${end}`);

    const result = await processChunk(filePath, start, end);

    parentPort.postMessage(result);
  } catch (error) {
    console.error(`Worker error:`, error);
    throw error;
  }
}

run();
