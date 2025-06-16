import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

// Development mode detection
const isDev = process.env.NODE_ENV === 'development';

// Log directory setup
const LOG_DIR = isDev
  ? path.join(__dirname, '../../logs')
  : path.join(app.getPath('userData'), 'logs');

// Create log directory if it doesn't exist
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Error creating log directory:', error);
}

// Log file path
const LOG_FILE = path.join(LOG_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);

/**
 * Debug logging with console output and file saving
 */
export function debugLog(...args: any[]): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] DEBUG: ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ')}`;
  
  // Console output
  console.log(logMessage);
  
  // Save to log file (async)
  try {
    fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  } catch (error) {
    console.error('Error saving log:', error);
  }
}

/**
 * Error logging with console output and file saving
 */
export function errorLog(...args: any[]): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ')}`;
  
  // Console output
  console.error(logMessage);
  
  // Save to log file (async)
  try {
    fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  } catch (error) {
    console.error('Error saving log:', error);
  }
}

/**
 * Warning logging with console output and file saving
 */
export function warnLog(...args: any[]): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] WARN: ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ')}`;
  
  // Console output
  console.warn(logMessage);
  
  // Save to log file (async)
  try {
    fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
  } catch (error) {
    console.error('Error saving log:', error);
  }
}

/**
 * Time formatting function (for debugging)
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}분 ${remainingSeconds}초`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}시간 ${remainingMinutes}분 ${remainingSeconds}초`;
}

/**
 * Safely create file path
 */
export function safePath(basePath: string, ...segments: string[]): string {
  try {
    // Replace undefined, null with empty string
    const safeBase = basePath || '';
    const safeSegments = segments.map(s => s || '');
    
    return path.join(safeBase, ...safeSegments);
  } catch (error) {
    console.error('Error creating path:', error);
    return '';
  }
}

/**
 * Safely require module with fallback
 */
export function safeRequire<T = any>(modulePath: string, fallback?: T): T | null {
  if (!modulePath) {
    console.warn('Module path not specified');
    return fallback || null;
  }
  
  try {
    return require(modulePath);
  } catch (error) {
    console.warn('Cannot load module (${modulePath}):', (error as Error).message);
    return fallback || null;
  }
}

/**
 * Check if local server is running
 */
export function isServerRunning(host: string = 'localhost', port: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}`, { timeout: 1000 }, (res) => {
      resolve(res.statusCode === 200);
      res.resume(); // Resource cleanup
    }).on('error', () => {
      resolve(false);
    }).on('timeout', () => {
      req.abort();
      resolve(false);
    });
  });
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(
  host: string = 'localhost', 
  port: number = 3000, 
  timeout: number = 30000, 
  interval: number = 1000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await isServerRunning(host, port)) {
      return true;
    }
    debugLog('Waiting for server... (${Math.round((Date.now() - startTime) / 1000)}s)');
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T = any>(jsonString: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Error parsing JSON:', (error as Error).message);
    return fallback || null;
  }
}

/**
 * Safely stringify JSON with fallback
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    console.warn('Error stringifying JSON:', (error as Error).message);
    return fallback;
  }
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      debugLog('Retry attempt ${attempt} failed, retrying in ${delayMs}ms...');
      await delay(delayMs);
    }
  }
  
  throw lastError!;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 16): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Check if file exists safely
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read file safely with fallback
 */
export function safeReadFile(filePath: string, fallback: string = ''): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn('Error reading file ${filePath}:', (error as Error).message);
    return fallback;
  }
}

/**
 * Write file safely
 */
export function safeWriteFile(filePath: string, content: string): boolean {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing file ${filePath}:', (error as Error).message);
    return false;
  }
}

/**
 * Get system information
 */
export function getSystemInfo(): {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  isDev: boolean;
} {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron || 'unknown',
    isDev
  };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Export constants
export const CONSTANTS = {
  LOG_DIR,
  LOG_FILE,
  isDev
} as const;

// Export types
export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  isDev: boolean;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  exponentialBackoff?: boolean;
}
