import { getCwd } from './utils/pathResolver.js';
import { startRepl } from './repl.js';

// Please note that in some systems, there is no home directory as such.
// The program takes the initial directory from the location
// where the main function starts—specifically, the src folder.
const state = {
  cwd: getCwd(new URL('.', import.meta.url)),
};

// Display the initial welcome
console.log('=================================');
console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${state.cwd}`);
console.log('=================================');

startRepl(state);
