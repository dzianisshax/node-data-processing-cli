import process from 'process';

export function parseArgs(line) {
  // Split entered string on command and args
  const input = line.trim().split(' ');
  const command = input[0].toLowerCase();
  const args = input.slice(1);
}
