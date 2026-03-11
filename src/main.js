import { getCwd } from './utils/pathResolver.js';
import { startRepl } from './repl.js';

const state = {
  cwd: getCwd(new URL('.', import.meta.url)),
};

startRepl(state);
