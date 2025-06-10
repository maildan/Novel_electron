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
exports.initScreenshot = initScreenshot;
exports.cleanupScreenshot = cleanupScreenshot;
exports.getScreenshotStatus = getScreenshotStatus;
/**
 * Advanced screenshot capture and management module
 * Handles screen capture, storage, and processing with enhanced features
 */
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const debug_1 = require("../utils/debug");
// Global state
let mainWindow = null;
let screenshotInitialized = false;
let screenshotHistory = [];
const MAX_HISTORY_SIZE = 100;
// Default options
const DEFAULT_SCREENSHOT_OPTIONS = {
    quality: 95,
    format: 'png',
    thumbnailSize: { width: 320, height: 240 },
    includeMetadata: true,
    autoSave: true
};
/**
 * Get screenshot storage directory
 */
function getScreenshotDirectory() {
    const userDataPath = electron_1.app.getPath('userData');
    const screenshotDir = path.join(userDataPath, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    return screenshotDir;
}
/**
 * Generate screenshot filename with timestamp
 */
function generateScreenshotFilename(format = 'png') {
    const date = new Date();
    const formatted = date.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
    return `screenshot_${formatted}.${format}`;
}
/**
 * Get available screenshot sources (screens and windows)
 */
async function getScreenshotSources() {
    try {
        const sources = await electron_1.desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 320, height: 240 },
            fetchWindowIcons: true
        });
        return sources.map(source => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail,
            display_id: source.display_id
        }));
    }
    catch (error) {
        console.error('Failed to get screenshot sources:', error);
        throw error;
    }
}
/**
 * Capture screenshot from specific source
 */
async function captureScreenshot(sourceId, options = {}) {
    try {
        const opts = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };
        // Get screen sources
        const sources = await electron_1.desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 0, height: 0 } // Full resolution
        });
        const source = sources.find(s => s.id === sourceId);
        if (!source) {
            throw new Error(`Screenshot source not found: ${sourceId}`);
        }
        // Capture the screen
        const image = source.thumbnail;
        if (image.isEmpty()) {
            throw new Error('Failed to capture screenshot - empty image');
        }
        // Convert to desired format
        let buffer;
        if (opts.format === 'jpeg') {
            buffer = image.toJPEG(opts.quality);
        }
        else {
            buffer = image.toPNG();
        }
        // Generate filename and metadata
        const filename = generateScreenshotFilename(opts.format);
        const imageSize = image.getSize();
        const metadata = {
            timestamp: Date.now(),
            displayId: source.display_id || sourceId,
            bounds: { x: 0, y: 0, width: imageSize.width, height: imageSize.height },
            scaleFactor: 1, // Will be updated if available
            filename,
            size: buffer.length,
            format: opts.format
        };
        // Auto-save if enabled
        if (opts.autoSave) {
            const filePath = path.join(getScreenshotDirectory(), filename);
            fs.writeFileSync(filePath, buffer);
            (0, debug_1.debugLog)(`Screenshot saved: ${filePath}`);
        }
        // Add to history
        screenshotHistory.unshift(metadata);
        if (screenshotHistory.length > MAX_HISTORY_SIZE) {
            screenshotHistory = screenshotHistory.slice(0, MAX_HISTORY_SIZE);
        }
        // Notify renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('screenshot-captured', {
                metadata,
                thumbnailDataURL: image.resize(opts.thumbnailSize).toDataURL()
            });
        }
        return { buffer, metadata };
    }
    catch (error) {
        console.error('Screenshot capture error:', error);
        throw error;
    }
}
/**
 * Capture screenshot of primary screen
 */
async function capturePrimaryScreen(options = {}) {
    try {
        const sources = await getScreenshotSources();
        const primaryScreen = sources.find(source => source.name.includes('Entire Screen') ||
            source.name.includes('Screen 1') ||
            source.id.includes('screen:0'));
        if (!primaryScreen) {
            throw new Error('Primary screen not found');
        }
        return await captureScreenshot(primaryScreen.id, options);
    }
    catch (error) {
        console.error('Primary screen capture error:', error);
        throw error;
    }
}
/**
 * Capture screenshot of active window
 */
async function captureActiveWindow(options = {}) {
    try {
        const activeWin = require('active-win');
        const activeWindow = await activeWin();
        if (!activeWindow) {
            throw new Error('No active window found');
        }
        const sources = await getScreenshotSources();
        const windowSource = sources.find(source => source.name === activeWindow.title ||
            source.name.includes(activeWindow.title));
        if (!windowSource) {
            throw new Error(`Active window screenshot source not found: ${activeWindow.title}`);
        }
        return await captureScreenshot(windowSource.id, options);
    }
    catch (error) {
        console.error('Active window capture error:', error);
        throw error;
    }
}
/**
 * Get screenshot history
 */
function getScreenshotHistory() {
    return [...screenshotHistory];
}
/**
 * Load screenshot from file
 */
function loadScreenshot(filename) {
    try {
        const filePath = path.join(getScreenshotDirectory(), filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
        }
        return null;
    }
    catch (error) {
        console.error(`Failed to load screenshot ${filename}:`, error);
        return null;
    }
}
/**
 * Delete screenshot
 */
function deleteScreenshot(filename) {
    try {
        const filePath = path.join(getScreenshotDirectory(), filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            // Remove from history
            screenshotHistory = screenshotHistory.filter(item => item.filename !== filename);
            (0, debug_1.debugLog)(`Screenshot deleted: ${filename}`);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error(`Failed to delete screenshot ${filename}:`, error);
        return false;
    }
}
/**
 * Clear all screenshots
 */
function clearAllScreenshots() {
    try {
        const screenshotDir = getScreenshotDirectory();
        const files = fs.readdirSync(screenshotDir);
        for (const file of files) {
            if (file.startsWith('screenshot_') && (file.endsWith('.png') || file.endsWith('.jpeg'))) {
                fs.unlinkSync(path.join(screenshotDir, file));
            }
        }
        screenshotHistory = [];
        (0, debug_1.debugLog)('All screenshots cleared');
        return true;
    }
    catch (error) {
        console.error('Failed to clear screenshots:', error);
        return false;
    }
}
/**
 * Setup screenshot IPC handlers
 */
function setupScreenshotIpcHandlers() {
    // Get available sources
    electron_1.ipcMain.handle('get-screenshot-sources', async () => {
        return await getScreenshotSources();
    });
    // Capture screenshot from specific source
    electron_1.ipcMain.handle('capture-screenshot', async (event, sourceId, options) => {
        const result = await captureScreenshot(sourceId, options);
        return {
            metadata: result.metadata,
            dataURL: electron_1.nativeImage.createFromBuffer(result.buffer).toDataURL()
        };
    });
    // Capture primary screen
    electron_1.ipcMain.handle('capture-primary-screen', async (event, options) => {
        const result = await capturePrimaryScreen(options);
        return {
            metadata: result.metadata,
            dataURL: electron_1.nativeImage.createFromBuffer(result.buffer).toDataURL()
        };
    });
    // Capture active window
    electron_1.ipcMain.handle('capture-active-window', async (event, options) => {
        const result = await captureActiveWindow(options);
        return {
            metadata: result.metadata,
            dataURL: electron_1.nativeImage.createFromBuffer(result.buffer).toDataURL()
        };
    });
    // Get screenshot history
    electron_1.ipcMain.handle('get-screenshot-history', async () => {
        return getScreenshotHistory();
    });
    // Load screenshot
    electron_1.ipcMain.handle('load-screenshot', async (event, filename) => {
        const buffer = loadScreenshot(filename);
        if (buffer) {
            return electron_1.nativeImage.createFromBuffer(buffer).toDataURL();
        }
        return null;
    });
    // Delete screenshot
    electron_1.ipcMain.handle('delete-screenshot', async (event, filename) => {
        return deleteScreenshot(filename);
    });
    // Clear all screenshots
    electron_1.ipcMain.handle('clear-all-screenshots', async () => {
        return clearAllScreenshots();
    });
    // Get screenshot directory path
    electron_1.ipcMain.handle('get-screenshot-directory', async () => {
        return getScreenshotDirectory();
    });
    (0, debug_1.debugLog)('Screenshot IPC handlers registered');
}
/**
 * Initialize screenshot module
 */
function initScreenshot(window) {
    mainWindow = window;
    if (screenshotInitialized) {
        (0, debug_1.debugLog)('Screenshot module already initialized');
        return;
    }
    try {
        // Ensure screenshot directory exists
        getScreenshotDirectory();
        // Setup IPC handlers
        setupScreenshotIpcHandlers();
        screenshotInitialized = true;
        (0, debug_1.debugLog)('Screenshot module initialization completed');
    }
    catch (error) {
        console.error('Screenshot module initialization error:', error);
    }
}
/**
 * Cleanup screenshot resources
 */
function cleanupScreenshot() {
    try {
        // Clear screenshot history
        screenshotHistory = [];
        // Reset state
        screenshotInitialized = false;
        mainWindow = null;
        (0, debug_1.debugLog)('Screenshot module cleanup completed');
    }
    catch (error) {
        console.error('Screenshot module cleanup error:', error);
    }
}
/**
 * Get screenshot module status
 */
function getScreenshotStatus() {
    return {
        initialized: screenshotInitialized,
        historySize: screenshotHistory.length,
        directory: getScreenshotDirectory()
    };
}
//# sourceMappingURL=screenshot.js.map