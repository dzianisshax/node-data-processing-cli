/**
 * Parses a command line string into a command, positional arguments, and options.
 */
export function parseArgs(input) {
  const tokens = input.trim().split(/\s+/);
  if (tokens.length === 0 || tokens[0] === '') return null;

  const command = tokens[0];
  const args = [];
  const options = {};

  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i].startsWith('--')) {
      const key = tokens[i].slice(2);
      // If the next token exists and isn't another flag, treat it as the value
      const value =
        tokens[i + 1] && !tokens[i + 1].startsWith('--') ? tokens[++i] : true;
      options[key] = value;
    } else {
      args.push(tokens[i]);
    }
  }

  return { command, args, options };
}
