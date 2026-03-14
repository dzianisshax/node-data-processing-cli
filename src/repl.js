import readline from 'readline';
import { stdin, stdout, exit } from 'node:process';
import { moveUp, moveToDir, listFiles } from './navigation.js';
import { parseArgs } from './utils/argParser.js';
import { convertCsvToJson } from './commands/csvToJson.js';
import { convertJsonToCsv } from './commands/jsonToCsv.js';
import { count } from './commands/count.js';
import { hash } from './commands/hash.js';
import { hashCompare } from './commands/hashCompare.js';
import { encrypt } from './commands/encrypt.js';
import { decrypt } from './commands/decrypt.js';
import { logStats } from './commands/logStats.js'

export function startRepl(state) {
  // Initialize the readline interface
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
    prompt: '> ',
  });

  // Display the initial prompt
  rl.prompt();

  // Listen for user input
  rl.on('line', async (line) => {
    // Parse a command line string
    const parsed = parseArgs(line);
    if (!parsed) {
      rl.prompt();
      return;
    }
    const { command, args, options } = parsed;

    switch (command) {
      case 'up':
        moveUp(state);
        break;

      case 'cd':
        await moveToDir(state, args[0]);
        break;

      case 'ls':
        await listFiles(state.cwd);
        break;

      case 'csv-to-json':
        await convertCsvToJson(state.cwd, options);
        break;

      case 'json-to-csv':
        await convertJsonToCsv(state.cwd, options);
        break;

      case 'count':
        await count(state.cwd, options);
        break;

      case 'hash':
        await hash(state.cwd, options);
        break;

      case 'hash-compare':
        await hashCompare(state.cwd, options);
        break;

      case 'encrypt':
        await encrypt(state.cwd, options);
        break;

      case 'decrypt':
        await decrypt(state.cwd, options);
        break;

        case 'log-stats':
        await logStats(state.cwd, options);
        break;

      case '.exit':
        // Calling close() will trigger the 'close' event below
        rl.close();
        return;

      default:
        if (command) {
          console.log(`Unknown or invalid command: '${command}'`);
        } else {
          console.log('Invalid input');
        }
        break;
    }

    // Re-prompt after command execution
    rl.prompt();

    // Handle termination (exit command, Ctrl+C, or end of input)
  }).on('close', () => {
    console.log('Thank you for using Data Processing CLI!');
    exit(0);
  });
}
