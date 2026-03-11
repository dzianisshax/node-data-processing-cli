import { resolvePath } from './utils/pathResolver.js';
import { stat, readdir } from 'node:fs/promises';

/**
 * Move up one directory level.
 * * @param {string} cwd - Current working directory.
 * * @returns {string} The absolute path of the current working directory.
 */
export function moveUp(cwd) {
  const newPath = resolvePath(cwd, '..');

  if (cwd !== newPath) {
    // After successful navigation, prints the new current working directory path
    console.log('The new current working directory:', newPath);
    return newPath;
  } else {
    // If already in the root directory, does nothing (no error)
    return cwd;
  }
}

/**
 * Navigates to the specified directory.
 * * @param {string} cwd - Current working directory.
 * * @param {string} pathToDirectory - Relative or absolute path to navigate to.
 * * @returns {string} The absolute path of the current working directory.
 */
export async function moveToDir(cwd, pathToDirectory) {
  // Path is required -  do nothing
  if (!pathToDirectory) {
    return cwd;
  }

  const newPath = resolvePath(cwd, pathToDirectory);

  try {
    const stats = await stat(newPath);
    if (stats.isDirectory()) {
      console.log('The new current working directory path:', newPath);
      return newPath;
    } else {
      // If path is not a directory
      console.log('Operation failed');
    }
  } catch (error) {
    // If path doesn't exist
    if (error.code === 'ENOENT') {
      console.log('Operation failed');
    }
    return cwd;
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
