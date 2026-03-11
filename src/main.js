import { initCwd, getCwd } from './utils/pathResolver.js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { stdin, stdout, exit } from 'node:process';
import { moveUp, moveToDir, listFiles } from './navigation.js';

// Initialize the custom CWD once at startup.
initCwd(fileURLToPath(new URL('.', import.meta.url)));

// Initialize the readline interface
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
  prompt: '> ',
});

console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${getCwd()}`);

// Display the initial prompt
rl.prompt();

// Listen for user input
rl.on('line', async (line) => {
  // Split entered string on command and args
  const input = line.trim().split(' ');
  const command = input[0].toLowerCase();
  const args = input.slice(1);

  switch (command) {
    case 'up':
      moveUp();
      break;

    case 'cd':
      await moveToDir(args[0]);
      break;

    case 'ls':
      await listFiles();
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
