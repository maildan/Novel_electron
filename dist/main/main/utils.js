"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTANTS = void 0;
exports.debugLog = debugLog;
exports.errorLog = errorLog;
exports.warnLog = warnLog;
exports.formatTime = formatTime;
exports.safePath = safePath;
exports.safeRequire = safeRequire;
exports.isServerRunning = isServerRunning;
exports.waitForServer = waitForServer;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
exports.delay = delay;
exports.retry = retry;
exports.isValidEmail = isValidEmail;
exports.generateRandomString = generateRandomString;
exports.fileExists = fileExists;
exports.safeReadFile = safeReadFile;
exports.safeWriteFile = safeWriteFile;
exports.getSystemInfo = getSystemInfo;
exports.formatBytes = formatBytes;
exports.debounce = debounce;
exports.throttle = throttle;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
// Development mode detection
const isDev = process.env.NODE_ENV === 'development';
// Log directory setup
const LOG_DIR = isDev
    ? path.join(__dirname, '../../logs')
    : path.join(electron_1.app.getPath('userData'), 'logs');
// Create log directory if it doesn't exist
try {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}
catch (error) {
    console.error('Error creating log directory:', error);
}
// Log file path
const LOG_FILE = path.join(LOG_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);
/**
 * Debug logging with console output and file saving
 */
function debugLog(...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] DEBUG: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')}`;
    // Console output
    console.log(logMessage);
    // Save to log file (async)
    try {
        fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    }
    catch (error) {
        console.error('Error saving log:', error);
    }
}
/**
 * Error logging with console output and file saving
 */
function errorLog(...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')}`;
    // Console output
    console.error(logMessage);
    // Save to log file (async)
    try {
        fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    }
    catch (error) {
        console.error('Error saving log:', error);
    }
}
/**
 * Warning logging with console output and file saving
 */
function warnLog(...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')}`;
    // Console output
    console.warn(logMessage);
    // Save to log file (async)
    try {
        fs.appendFile(LOG_FILE, logMessage + '\n', (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    }
    catch (error) {
        console.error('Error saving log:', error);
    }
}
/**
 * Time formatting function (for debugging)
 */
function formatTime(seconds) {
    if (seconds < 60)
        return `${seconds}초`;
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
function safePath(basePath, ...segments) {
    try {
        // Replace undefined, null with empty string
        const safeBase = basePath || '';
        const safeSegments = segments.map(s => s || '');
        return path.join(safeBase, ...safeSegments);
    }
    catch (error) {
        console.error('Error creating path:', error);
        return '';
    }
}
/**
 * Safely require module with fallback
 */
function safeRequire(modulePath, fallback) {
    if (!modulePath) {
        console.warn('Module path not specified');
        return fallback || null;
    }
    try {
        return require(modulePath);
    }
    catch (error) {
        console.warn(`Cannot load module (${modulePath}):`, error.message);
        return fallback || null;
    }
}
/**
 * Check if local server is running
 */
function isServerRunning(host = 'localhost', port = 3000) {
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
async function waitForServer(host = 'localhost', port = 3000, timeout = 30000, interval = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await isServerRunning(host, port)) {
            return true;
        }
        debugLog(`Waiting for server... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
}
/**
 * Safely parse JSON with fallback
 */
function safeJsonParse(jsonString, fallback) {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        console.warn('Error parsing JSON:', error.message);
        return fallback || null;
    }
}
/**
 * Safely stringify JSON with fallback
 */
function safeJsonStringify(obj, fallback = '{}') {
    try {
        return JSON.stringify(obj, null, 2);
    }
    catch (error) {
        console.warn('Error stringifying JSON:', error.message);
        return fallback;
    }
}
/**
 * Delay execution for specified milliseconds
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw lastError;
            }
            const delayMs = baseDelay * Math.pow(2, attempt - 1);
            debugLog(`Retry attempt ${attempt} failed, retrying in ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
    throw lastError;
}
/**
 * Validate email address
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Generate random string
 */
function generateRandomString(length = 16) {
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
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    }
    catch (error) {
        return false;
    }
}
/**
 * Read file safely with fallback
 */
function safeReadFile(filePath, fallback = '') {
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch (error) {
        console.warn(`Error reading file ${filePath}:`, error.message);
        return fallback;
    }
}
/**
 * Write file safely
 */
function safeWriteFile(filePath, content) {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    catch (error) {
        console.error(`Error writing file ${filePath}:`, error.message);
        return false;
    }
}
/**
 * Get system information
 */
function getSystemInfo() {
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
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
// Export constants
exports.CONSTANTS = {
    LOG_DIR,
    LOG_FILE,
    isDev
};
//# sourceMappingURL=utils.js.map