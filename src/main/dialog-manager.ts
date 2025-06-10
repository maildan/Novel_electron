/**
 * Dialog Manager for Loop 6
 * Modern dialog and notification system with TypeScript
 * Features: Custom dialogs, system dialogs, notifications, prompts
 */

import { BrowserWindow, dialog, ipcMain, app, Notification } from 'electron';
import * as path from 'path';
import { debugLog } from './utils';

// Dialog Types and Interfaces
export enum DialogType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  QUESTION = 'question'
}

export interface DialogOptions {
  type: DialogType;
  title: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
  icon?: string;
  noLink?: boolean;
  normalizeAccessKeys?: boolean;
}

export interface FileDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<
    'openFile' | 'openDirectory' | 'multiSelections' | 
    'showHiddenFiles' | 'createDirectory' | 'promptToCreate' |
    'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'
  >;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  tag?: string;
  urgency?: 'normal' | 'critical' | 'low';
  timeoutType?: 'default' | 'never';
  actions?: Array<{
    type: 'button';
    text: string;
  }>;
}

export interface CustomDialogOptions {
  width?: number;
  height?: number;
  resizable?: boolean;
  modal?: boolean;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
  htmlContent?: string;
  data?: any;
}

/**
 * Dialog Manager Class
 * Handles all types of dialogs and notifications
 */
export class DialogManager {
  private static instance: DialogManager;
  
  private customDialogs = new Map<string, BrowserWindow>();
  private notificationQueue: NotificationOptions[] = [];
  private isProcessingNotifications = false;
  
  private constructor() {
    this.setupIpcHandlers();
  }
  
  public static getInstance(): DialogManager {
    if (!DialogManager.instance) {
      DialogManager.instance = new DialogManager();
    }
    return DialogManager.instance;
  }
  
  /**
   * Setup IPC handlers for renderer communication
   */
  private setupIpcHandlers(): void {
    ipcMain.handle('dialog:show-message', async (event, options: DialogOptions) => {
      return await this.showMessageDialog(options);
    });
    
    ipcMain.handle('dialog:show-open-file', async (event, options: FileDialogOptions) => {
      return await this.showOpenFileDialog(options);
    });
    
    ipcMain.handle('dialog:show-save-file', async (event, options: FileDialogOptions) => {
      return await this.showSaveFileDialog(options);
    });
    
    ipcMain.handle('dialog:show-folder', async (event, options: FileDialogOptions) => {
      return await this.showFolderDialog(options);
    });
    
    ipcMain.handle('dialog:show-notification', async (event, options: NotificationOptions) => {
      return await this.showNotification(options);
    });
    
    ipcMain.handle('dialog:show-restart-prompt', async () => {
      return await this.showRestartPrompt();
    });
    
    ipcMain.handle('dialog:show-custom', async (event, id: string, options: CustomDialogOptions) => {
      return await this.showCustomDialog(id, options);
    });
    
    ipcMain.handle('dialog:close-custom', async (event, id: string) => {
      return this.closeCustomDialog(id);
    });
  }
  
  /**
   * Show system message dialog
   */
  public async showMessageDialog(options: DialogOptions): Promise<{
    response: number;
    checkboxChecked?: boolean;
  }> {
    try {
      const parentWindow = BrowserWindow.getFocusedWindow() || 
                          BrowserWindow.getAllWindows()[0];
      
      const result = await dialog.showMessageBox(parentWindow, {
        type: options.type,
        title: options.title,
        message: options.message,
        detail: options.detail,
        buttons: options.buttons || ['OK'],
        defaultId: options.defaultId || 0,
        cancelId: options.cancelId || 0,
        icon: options.icon,
        noLink: options.noLink,
        normalizeAccessKeys: options.normalizeAccessKeys
      });
      
      return result;
    } catch (error) {
      console.error('[DialogManager] Message dialog failed:', error);
      return { response: 0 };
    }
  }
  
  /**
   * Show open file dialog
   */
  public async showOpenFileDialog(options: FileDialogOptions = {}): Promise<{
    canceled: boolean;
    filePaths: string[];
  }> {
    try {
      const parentWindow = BrowserWindow.getFocusedWindow() || 
                          BrowserWindow.getAllWindows()[0];
      
      const result = await dialog.showOpenDialog(parentWindow, {
        title: options.title || 'Select File',
        defaultPath: options.defaultPath,
        buttonLabel: options.buttonLabel,
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: options.properties || ['openFile']
      });
      
      return result;
    } catch (error) {
      console.error('[DialogManager] Open file dialog failed:', error);
      return { canceled: true, filePaths: [] };
    }
  }
  
  /**
   * Show save file dialog
   */
  public async showSaveFileDialog(options: FileDialogOptions = {}): Promise<{
    canceled: boolean;
    filePath?: string;
  }> {
    try {
      const parentWindow = BrowserWindow.getFocusedWindow() || 
                          BrowserWindow.getAllWindows()[0];
      
      const result = await dialog.showSaveDialog(parentWindow, {
        title: options.title || 'Save File',
        defaultPath: options.defaultPath,
        buttonLabel: options.buttonLabel,
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      return result;
    } catch (error) {
      console.error('[DialogManager] Save file dialog failed:', error);
      return { canceled: true };
    }
  }
  
  /**
   * Show folder selection dialog
   */
  public async showFolderDialog(options: FileDialogOptions = {}): Promise<{
    canceled: boolean;
    filePaths: string[];
  }> {
    try {
      const parentWindow = BrowserWindow.getFocusedWindow() || 
                          BrowserWindow.getAllWindows()[0];
      
      const result = await dialog.showOpenDialog(parentWindow, {
        title: options.title || 'Select Folder',
        defaultPath: options.defaultPath,
        buttonLabel: options.buttonLabel,
        properties: ['openDirectory', ...(options.properties || [])]
      });
      
      return result;
    } catch (error) {
      console.error('[DialogManager] Folder dialog failed:', error);
      return { canceled: true, filePaths: [] };
    }
  }
  
  /**
   * Show system notification
   */
  public async showNotification(options: NotificationOptions): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!Notification.isSupported()) {
        debugLog('[DialogManager] Notifications not supported on this platform');
        return false;
      }
      
      // Add to queue for rate limiting
      this.notificationQueue.push(options);
      
      if (!this.isProcessingNotifications) {
        this.processNotificationQueue();
      }
      
      return true;
    } catch (error) {
      console.error('[DialogManager] Notification failed:', error);
      return false;
    }
  }
  
  /**
   * Process notification queue to avoid spam
   */
  private async processNotificationQueue(): Promise<void> {
    this.isProcessingNotifications = true;
    
    while (this.notificationQueue.length > 0) {
      const options = this.notificationQueue.shift();
      if (!options) continue;
      
      try {
        // Notification 생성 시 지원되는 옵션만 사용
        const notificationOptions: any = {
          title: options.title,
          body: options.body
        };
        
        if (options.icon) notificationOptions.icon = options.icon;
        if (options.silent !== undefined) notificationOptions.silent = options.silent;
        
        const notification = new Notification(notificationOptions);
        
        notification.show();
        
        // Rate limiting: wait between notifications
        if (this.notificationQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error('[DialogManager] Individual notification failed:', error);
      }
    }
    
    this.isProcessingNotifications = false;
  }
  
  /**
   * Show restart prompt dialog
   */
  public async showRestartPrompt(
    message: string = 'Application needs to restart to apply changes.',
    title: string = 'Restart Required'
  ): Promise<number> {
    try {
      const options: DialogOptions = {
        type: DialogType.QUESTION,
        title,
        message,
        detail: 'Do you want to restart now or later?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      };
      
      const result = await this.showMessageDialog(options);
      
      if (result.response === 0) {
        debugLog('[DialogManager] User chose to restart now');
        // Schedule restart after a brief delay
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);
      } else {
        debugLog('[DialogManager] User chose to restart later');
      }
      
      return result.response;
    } catch (error) {
      console.error('[DialogManager] Restart prompt failed:', error);
      return 1; // Default to "Later"
    }
  }
  
  /**
   * Show error dialog with details
   */
  public async showErrorDialog(
    title: string,
    message: string,
    detail?: string
  ): Promise<void> {
    await this.showMessageDialog({
      type: DialogType.ERROR,
      title,
      message,
      detail,
      buttons: ['OK']
    });
  }
  
  /**
   * Show warning dialog
   */
  public async showWarningDialog(
    title: string,
    message: string,
    detail?: string
  ): Promise<boolean> {
    const result = await this.showMessageDialog({
      type: DialogType.WARNING,
      title,
      message,
      detail,
      buttons: ['OK', 'Cancel'],
      defaultId: 0,
      cancelId: 1
    });
    
    return result.response === 0;
  }
  
  /**
   * Show confirmation dialog
   */
  public async showConfirmationDialog(
    title: string,
    message: string,
    detail?: string
  ): Promise<boolean> {
    const result = await this.showMessageDialog({
      type: DialogType.QUESTION,
      title,
      message,
      detail,
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1
    });
    
    return result.response === 0;
  }
  
  /**
   * Show custom HTML dialog window
   */
  public async showCustomDialog(
    id: string,
    options: CustomDialogOptions
  ): Promise<BrowserWindow | null> {
    try {
      // Close existing dialog with same ID
      this.closeCustomDialog(id);
      
      const parentWindow = BrowserWindow.getFocusedWindow() || 
                          BrowserWindow.getAllWindows()[0];
      
      const dialogWindow = new BrowserWindow({
        width: options.width || 400,
        height: options.height || 300,
        resizable: options.resizable !== false,
        modal: options.modal !== false,
        parent: parentWindow,
        alwaysOnTop: options.alwaysOnTop || false,
        skipTaskbar: options.skipTaskbar !== false,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, '..', 'preload', 'index.js')
        }
      });
      
      // Load content
      if (options.htmlContent) {
        await dialogWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(options.htmlContent)}`);
      } else {
        await dialogWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dialog.html'));
      }
      
      // Pass data to dialog if provided
      if (options.data) {
        dialogWindow.webContents.send('dialog-data', options.data);
      }
      
      // Show dialog
      dialogWindow.show();
      
      // Store reference
      this.customDialogs.set(id, dialogWindow);
      
      // Cleanup on close
      dialogWindow.on('closed', () => {
        this.customDialogs.delete(id);
      });
      
      return dialogWindow;
      
    } catch (error) {
      console.error('[DialogManager] Custom dialog creation failed:', error);
      return null;
    }
  }
  
  /**
   * Close custom dialog
   */
  public closeCustomDialog(id: string): boolean {
    const dialog = this.customDialogs.get(id);
    if (dialog && !dialog.isDestroyed()) {
      dialog.close();
      this.customDialogs.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Close all custom dialogs
   */
  public closeAllCustomDialogs(): void {
    for (const [id, dialog] of this.customDialogs) {
      if (!dialog.isDestroyed()) {
        dialog.close();
      }
    }
    this.customDialogs.clear();
  }
  
  /**
   * Show about dialog
   */
  public async showAboutDialog(): Promise<void> {
    const options = {
      applicationName: app.getName(),
      applicationVersion: app.getVersion(),
      copyright: `© ${new Date().getFullYear()} Loop`,
      authors: ['Loop Team'],
      website: 'https://loop.app',
      iconPath: path.join(__dirname, '..', 'assets', 'icon.png')
    };
    
    try {
      // macOS에서는 app.showAboutPanel 사용
      if (process.platform === 'darwin') {
        app.showAboutPanel();
      } else {
        // 다른 플랫폼에서는 메시지 다이얼로그 사용
        await this.showMessageDialog({
          type: DialogType.INFO,
          title: 'About',
          message: `${options.applicationName} v${options.applicationVersion}`,
          detail: `${options.copyright}\nWebsite: ${options.website}`,
          buttons: ['OK']
        });
      }
    } catch (error) {
      console.error('[DialogManager] About dialog failed:', error);
    }
  }
  
  /**
   * Get list of active custom dialogs
   */
  public getActiveDialogs(): string[] {
    return Array.from(this.customDialogs.keys());
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.closeAllCustomDialogs();
    this.notificationQueue.length = 0;
    this.isProcessingNotifications = false;
  }
}

// Export singleton instance
export const dialogManager = DialogManager.getInstance();

// Export convenience functions
export async function showMessage(options: DialogOptions) {
  return await dialogManager.showMessageDialog(options);
}

export async function showError(title: string, message: string, detail?: string) {
  return await dialogManager.showErrorDialog(title, message, detail);
}

export async function showWarning(title: string, message: string, detail?: string) {
  return await dialogManager.showWarningDialog(title, message, detail);
}

export async function showConfirmation(title: string, message: string, detail?: string) {
  return await dialogManager.showConfirmationDialog(title, message, detail);
}

export async function showNotification(options: NotificationOptions) {
  return await dialogManager.showNotification(options);
}

export async function showRestartPrompt(message?: string, title?: string) {
  return await dialogManager.showRestartPrompt(message, title);
}
