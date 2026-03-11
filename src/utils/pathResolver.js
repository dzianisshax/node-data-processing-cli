import path from 'path';

// Maintain current working directory variable.
// Using process.cwd() dynamically is avoided here per the requirements.
// Possible to initialize this with a default root or inject a starting path from the main.
let currentWorkingDirectory = '/';

/**
 * Initializes the custom current working directory.
 * Should be called once when the CLI application starts.
 * * @param {string} initialPath - The starting path for the application.
 */
export function initCwd(initialPath) {
  currentWorkingDirectory = path.resolve(initialPath);
}

/**
 * Checks if custom current working directory is already root.
 */
export function isCwdAlreadyRoot() {
  return getCwd() === path.resolve(getCwd(), '..');
}

/**
 * Updates the custom current working directory.
 * * @param {string} targetDirectory - The directory to change to.
 */
export function changeCwd(targetDirectory) {
  // Resolve the new directory relative to the current one
  currentWorkingDirectory = path.resolve(
    currentWorkingDirectory,
    targetDirectory,
  );
  return currentWorkingDirectory;
}

/**
 * Returns the custom current working directory.
 * * @returns {string} The absolute path of the current working directory.
 */
export function getCwd() {
  return currentWorkingDirectory;
}

/**
 * Resolves a given file or folder path relative to the custom current working directory.
 * Can accept both relative and absolute paths
 * * @param {string} targetPath - The path provided via CLI parameters.
 * @returns {string} The fully resolved absolute path.
 */
export function resolvePath(targetPath) {
  // Use path.resolve() to combine the custom current working directory with relative paths.
  // If targetPath is already absolute, path.resolve will just return it.
  return path.resolve(currentWorkingDirectory, targetPath);
}
