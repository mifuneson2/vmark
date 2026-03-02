/**
 * Cross-platform parent process name detection.
 *
 * Uses execFileSync with argument arrays (not shell interpolation)
 * to prevent command injection via crafted ppid values.
 *
 * @coordinates-with cli.ts (detectClientIdentity)
 */

import { execFileSync } from 'child_process';

/**
 * Get the name of a process by its PID (cross-platform).
 *
 * - macOS/Linux: `ps -p <pid> -o comm=`
 * - Windows: PowerShell `Get-Process`
 *
 * Security: Uses execFileSync with argument arrays to prevent
 * command injection. The pid is passed as String(pid) in an
 * array element, never interpolated into a shell command string.
 *
 * @param pid - The process ID to look up. Defaults to process.ppid.
 * @param currentPlatform - The platform. Defaults to process.platform.
 * @returns The process name, or undefined if detection fails.
 */
export function getParentProcessName(
  pid?: number,
  currentPlatform?: string,
): string | undefined {
  try {
    const targetPid = pid ?? process.ppid;
    const plat = currentPlatform ?? process.platform;

    if (!targetPid) return undefined;

    if (plat === 'darwin' || plat === 'linux') {
      const result = execFileSync('ps', ['-p', String(targetPid), '-o', 'comm='], {
        encoding: 'utf8',
        timeout: 500,
      }).trim();
      return result || undefined;
    } else if (plat === 'win32') {
      // Use PowerShell — wmic is deprecated on Windows 11+
      // Pass PID via $args[0] to avoid string interpolation (#280)
      const result = execFileSync('powershell', [
        '-NoProfile', '-Command',
        '(Get-Process -Id $args[0]).ProcessName', '--', String(targetPid),
      ], { encoding: 'utf8', timeout: 500 }).trim();
      return result || undefined;
    }
  } catch {
    // Ignore errors — parent process detection is best-effort
  }
  return undefined;
}
