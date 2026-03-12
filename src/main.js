import { getCwd } from './utils/pathResolver.js';
import { startRepl } from './repl.js';

const state = {
  cwd: getCwd(new URL('.', import.meta.url)),
};

// Display the initial welcome
console.log('=================================');
console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${state.cwd}`);
console.log('=================================');

startRepl(state);
