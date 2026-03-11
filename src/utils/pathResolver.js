import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Returns the current working directory.
 * * @param {string} absoluteFileUrl - The absolute file: URL of the module.
 * * @returns {string} The absolute path of the current working directory.
 */
export function getCwd(absoluteFileUrl) {
  return path.resolve(fileURLToPath(absoluteFileUrl));
}

/**
 * Resolves a given file or folder path relative to the current working directory.
 * Can accept both relative and absolute paths
 * * @param {string} cwd - Current working directory.
 * * @param {string} targetPath - The path provided via CLI parameters.
 * @returns {string} The fully resolved absolute path.
 */
export function resolvePath(cwd, targetPath) {
  // Use path.resolve() to combine the current working directory with relative path.
  // If targetPath is already absolute, path.resolve will just return it.
  return path.resolve(cwd, targetPath);
}
