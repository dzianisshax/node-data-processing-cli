import readline from 'readline';
import { stdin, stdout, exit } from 'node:process';
import { moveUp, moveToDir, listFiles } from './navigation.js';

export function startRepl(state) {
  // Initialize the readline interface
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
    prompt: '> ',
  });

  // Display the initial welcome
  console.log('Welcome to Data Processing CLI!');
  console.log(`You are currently in ${state.cwd}`);

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
        state.cwd = moveUp(state.cwd);
        break;

      case 'cd':
        state.cwd = await moveToDir(state.cwd, args[0]);
        break;

      case 'ls':
        await listFiles(state.cwd);
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
