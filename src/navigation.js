import { resolvePath } from './utils/pathResolver.js';
import { stat, readdir } from 'node:fs/promises';

/**
 * Move up one directory level.
 * * @param {any} state - State object.
 */
export function moveUp(state) {
  const newPath = resolvePath(state.cwd, '..');

  if (state.cwd !== newPath) {
    // After successful navigation, prints the new current working directory path
    console.log('The new current working directory:', newPath);
    state.cwd = newPath;
  }
  // If already in the root directory, does nothing (no error)
}

/**
 * Navigates to the specified directory.
 * * @param {any} state - State object.
 * * @param {string} pathToDirectory - Relative or absolute path to navigate to.
 */
export async function moveToDir(state, pathToDirectory) {
  // Path is required -  do nothing
  if (!pathToDirectory) {
    return;
  }

  const newPath = resolvePath(state.cwd, pathToDirectory);

  try {
    const stats = await stat(newPath);
    if (stats.isDirectory()) {
      console.log('The new current working directory path:', newPath);
      state.cwd = newPath;
    } else {
      // If path is not a directory
      console.log('Operation failed');
    }
  } catch (error) {
    // If path doesn't exist
    if (error.code === 'ENOENT') {
      console.log('Operation failed');
    }
  }
}

/**
 * List files and directories in current directory.
 * * @param {string} cwd - Current working directory.
 */
export async function listFiles(cwd) {
  try {
    // Read directory contents, including file type information
    const entries = await readdir(cwd, { withFileTypes: true });

    // Separate the entries into folders and files
    const folders = entries.filter((entry) => entry.isDirectory());
    const files = entries.filter((entry) => entry.isFile());

    // Sort alphabetically (case-insensitive)
    const sortAlphabetically = (a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

    // Sort both arrays
    folders.sort(sortAlphabetically);
    files.sort(sortAlphabetically);

    // Combine them: folders first, then files
    const sortedEntries = [...folders, ...files];

    // Log the results
    for (const entry of sortedEntries) {
      const type = entry.isDirectory() ? '[folder]' : '[file]';
      // Pad the name string so the output aligns nicely in the console
      console.log(`${entry.name.padEnd(20)} ${type}`);
    }
  } catch (error) {
    console.error(`Failed to read directory: ${error.message}`);
  }
}
