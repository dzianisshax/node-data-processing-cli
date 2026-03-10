import readline from 'readline';
import { stdin, stdout, cwd, chdir, exit } from 'node:process';
import { resolve } from 'node:path';

// Initialize the readline interface
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
  prompt: '> ',
});

console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${cwd()}`);

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
      if (cwd() === resolve(cwd(), '..')) {
        // If already in the root directory, does nothing (no error)
        break;
      }

      // Moves up one directory level from the current working directory
      chdir('..');

      // After successful navigation, prints the new current working directory path
      console.log('The new current working directory path:', cwd());
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
