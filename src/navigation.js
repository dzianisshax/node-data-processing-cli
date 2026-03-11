import {
  isCwdAlreadyRoot,
  getCwd,
  changeCwd,
  resolvePath,
} from './utils/pathResolver.js';
import { stat, readdir } from 'node:fs/promises';

/**
 * Move up one directory level.
 */
export function moveUp() {
  // If already in the root directory, does nothing (no error)
  if (!isCwdAlreadyRoot()) {
    // Moves up one directory level from the current working directory
    changeCwd('..');

    // After successful navigation, prints the new current working directory path
    console.log('The new current working directory:', getCwd());
  }
}

/**
 * Navigates to the specified directory.
 * * @param {string} pathToDirectory - Relative or absolute path to navigate to.
 */
export async function moveToDir(pathToDirectory) {
  // Path is required -  do nothing
  if (!pathToDirectory) {
    return;
  }

  const absolutePath = resolvePath(pathToDirectory);

  try {
    const stats = await stat(absolutePath);
    if (stats.isDirectory()) {
      changeCwd(absolutePath);
      console.log('The new current working directory path:', getCwd());
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
 */
export async function listFiles() {
  try {
    // Read directory contents, including file type information
    const entries = await readdir(getCwd(), { withFileTypes: true });

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
