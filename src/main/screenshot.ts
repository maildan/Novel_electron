/**
 * Advanced screenshot capture and management module
 * Handles screen capture, storage, and processing with enhanced features
 */
import { desktopCapturer, ipcMain, app, BrowserWindow, nativeImage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { debugLog } from '../utils/debug';

interface ScreenshotOptions {
  quality?: number;
  format?: 'png' | 'jpeg';
  thumbnailSize?: { width: number; height: number };
  includeMetadata?: boolean;
  autoSave?: boolean;
}

interface ScreenshotMetadata {
  timestamp: number;
  displayId: string;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  filename: string;
  size: number;
  format: string;
}

interface ScreenshotSource {
  id: string;
  name: string;
  thumbnail: Electron.NativeImage;
  display_id?: string;
}

// Global state
let mainWindow: BrowserWindow | null = null;
let screenshotInitialized = false;
let screenshotHistory: ScreenshotMetadata[] = [];
const MAX_HISTORY_SIZE = 100;

// Default options
const DEFAULT_SCREENSHOT_OPTIONS: Required<ScreenshotOptions> = {
  quality: 95,
  format: 'png',
  thumbnailSize: { width: 320, height: 240 },
  includeMetadata: true,
  autoSave: true
};

/**
 * Get screenshot storage directory
 */
function getScreenshotDirectory(): string {
  const userDataPath = app.getPath('userData');
  const screenshotDir = path.join(userDataPath, 'screenshots');
  
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  return screenshotDir;
}

/**
 * Generate screenshot filename with timestamp
 */
function generateScreenshotFilename(format: string = 'png'): string {
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
async function getScreenshotSources(): Promise<ScreenshotSource[]> {
  try {
    const sources = await desktopCapturer.getSources({
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
  } catch (error) {
    console.error('Failed to get screenshot sources:', error);
    throw error;
  }
}

/**
 * Capture screenshot from specific source
 */
async function captureScreenshot(
  sourceId: string, 
  options: ScreenshotOptions = {}
): Promise<{ buffer: Buffer; metadata: ScreenshotMetadata }> {
  try {
    const opts = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };
    
    // Get screen sources
    const sources = await desktopCapturer.getSources({
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
    let buffer: Buffer;
    if (opts.format === 'jpeg') {
      buffer = image.toJPEG(opts.quality);
    } else {
      buffer = image.toPNG();
    }
    
    // Generate filename and metadata
    const filename = generateScreenshotFilename(opts.format);
    const imageSize = image.getSize();
    const metadata: ScreenshotMetadata = {
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
      debugLog(`Screenshot saved: ${filePath}`);
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
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw error;
  }
}

/**
 * Capture screenshot of primary screen
 */
async function capturePrimaryScreen(options: ScreenshotOptions = {}): Promise<{ buffer: Buffer; metadata: ScreenshotMetadata }> {
  try {
    const sources = await getScreenshotSources();
    const primaryScreen = sources.find(source => 
      source.name.includes('Entire Screen') || 
      source.name.includes('Screen 1') ||
      source.id.includes('screen:0')
    );
    
    if (!primaryScreen) {
      throw new Error('Primary screen not found');
    }
    
    return await captureScreenshot(primaryScreen.id, options);
  } catch (error) {
    console.error('Primary screen capture error:', error);
    throw error;
  }
}

/**
 * Capture screenshot of active window
 */
async function captureActiveWindow(options: ScreenshotOptions = {}): Promise<{ buffer: Buffer; metadata: ScreenshotMetadata }> {
  try {
    const activeWin = require('active-win');
    const activeWindow = await activeWin();
    
    if (!activeWindow) {
      throw new Error('No active window found');
    }
    
    const sources = await getScreenshotSources();
    const windowSource = sources.find(source => 
      source.name === activeWindow.title ||
      source.name.includes(activeWindow.title)
    );
    
    if (!windowSource) {
      throw new Error(`Active window screenshot source not found: ${activeWindow.title}`);
    }
    
    return await captureScreenshot(windowSource.id, options);
  } catch (error) {
    console.error('Active window capture error:', error);
    throw error;
  }
}

/**
 * Get screenshot history
 */
function getScreenshotHistory(): ScreenshotMetadata[] {
  return [...screenshotHistory];
}

/**
 * Load screenshot from file
 */
function loadScreenshot(filename: string): Buffer | null {
  try {
    const filePath = path.join(getScreenshotDirectory(), filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  } catch (error) {
    console.error(`Failed to load screenshot ${filename}:`, error);
    return null;
  }
}

/**
 * Delete screenshot
 */
function deleteScreenshot(filename: string): boolean {
  try {
    const filePath = path.join(getScreenshotDirectory(), filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Remove from history
      screenshotHistory = screenshotHistory.filter(item => item.filename !== filename);
      
      debugLog(`Screenshot deleted: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete screenshot ${filename}:`, error);
    return false;
  }
}

/**
 * Clear all screenshots
 */
function clearAllScreenshots(): boolean {
  try {
    const screenshotDir = getScreenshotDirectory();
    const files = fs.readdirSync(screenshotDir);
    
    for (const file of files) {
      if (file.startsWith('screenshot_') && (file.endsWith('.png') || file.endsWith('.jpeg'))) {
        fs.unlinkSync(path.join(screenshotDir, file));
      }
    }
    
    screenshotHistory = [];
    debugLog('All screenshots cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear screenshots:', error);
    return false;
  }
}

/**
 * Setup screenshot IPC handlers
 */
function setupScreenshotIpcHandlers(): void {
  // Get available sources
  ipcMain.handle('get-screenshot-sources', async () => {
    return await getScreenshotSources();
  });
  
  // Capture screenshot from specific source
  ipcMain.handle('capture-screenshot', async (event, sourceId: string, options?: ScreenshotOptions) => {
    const result = await captureScreenshot(sourceId, options);
    return {
      metadata: result.metadata,
      dataURL: nativeImage.createFromBuffer(result.buffer).toDataURL()
    };
  });
  
  // Capture primary screen
  ipcMain.handle('capture-primary-screen', async (event, options?: ScreenshotOptions) => {
    const result = await capturePrimaryScreen(options);
    return {
      metadata: result.metadata,
      dataURL: nativeImage.createFromBuffer(result.buffer).toDataURL()
    };
  });
  
  // Capture active window
  ipcMain.handle('capture-active-window', async (event, options?: ScreenshotOptions) => {
    const result = await captureActiveWindow(options);
    return {
      metadata: result.metadata,
      dataURL: nativeImage.createFromBuffer(result.buffer).toDataURL()
    };
  });
  
  // Get screenshot history
  ipcMain.handle('get-screenshot-history', async () => {
    return getScreenshotHistory();
  });
  
  // Load screenshot
  ipcMain.handle('load-screenshot', async (event, filename: string) => {
    const buffer = loadScreenshot(filename);
    if (buffer) {
      return nativeImage.createFromBuffer(buffer).toDataURL();
    }
    return null;
  });
  
  // Delete screenshot
  ipcMain.handle('delete-screenshot', async (event, filename: string) => {
    return deleteScreenshot(filename);
  });
  
  // Clear all screenshots
  ipcMain.handle('clear-all-screenshots', async () => {
    return clearAllScreenshots();
  });
  
  // Get screenshot directory path
  ipcMain.handle('get-screenshot-directory', async () => {
    return getScreenshotDirectory();
  });
  
  debugLog('Screenshot IPC handlers registered');
}

/**
 * Initialize screenshot module
 */
export function initScreenshot(window: BrowserWindow): void {
  mainWindow = window;
  
  if (screenshotInitialized) {
    debugLog('Screenshot module already initialized');
    return;
  }
  
  try {
    // Ensure screenshot directory exists
    getScreenshotDirectory();
    
    // Setup IPC handlers
    setupScreenshotIpcHandlers();
    
    screenshotInitialized = true;
    debugLog('Screenshot module initialization completed');
  } catch (error) {
    console.error('Screenshot module initialization error:', error);
  }
}

/**
 * Cleanup screenshot resources
 */
export function cleanupScreenshot(): void {
  try {
    // Clear screenshot history
    screenshotHistory = [];
    
    // Reset state
    screenshotInitialized = false;
    mainWindow = null;
    
    debugLog('Screenshot module cleanup completed');
  } catch (error) {
    console.error('Screenshot module cleanup error:', error);
  }
}

/**
 * Get screenshot module status
 */
export function getScreenshotStatus(): {
  initialized: boolean;
  historySize: number;
  directory: string;
} {
  return {
    initialized: screenshotInitialized,
    historySize: screenshotHistory.length,
    directory: getScreenshotDirectory()
  };
}
