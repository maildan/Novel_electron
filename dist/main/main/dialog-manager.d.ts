/**
 * Dialog Manager for Loop 6
 * Modern dialog and notification system with TypeScript
 * Features: Custom dialogs, system dialogs, notifications, prompts
 */
import { BrowserWindow } from 'electron';
export declare enum DialogType {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    QUESTION = "question"
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
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'>;
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
export declare class DialogManager {
    private static instance;
    private customDialogs;
    private notificationQueue;
    private isProcessingNotifications;
    private constructor();
    static getInstance(): DialogManager;
    /**
     * Setup IPC handlers for renderer communication
     */
    private setupIpcHandlers;
    /**
     * Show system message dialog
     */
    showMessageDialog(options: DialogOptions): Promise<{
        response: number;
        checkboxChecked?: boolean;
    }>;
    /**
     * Show open file dialog
     */
    showOpenFileDialog(options?: FileDialogOptions): Promise<{
        canceled: boolean;
        filePaths: string[];
    }>;
    /**
     * Show save file dialog
     */
    showSaveFileDialog(options?: FileDialogOptions): Promise<{
        canceled: boolean;
        filePath?: string;
    }>;
    /**
     * Show folder selection dialog
     */
    showFolderDialog(options?: FileDialogOptions): Promise<{
        canceled: boolean;
        filePaths: string[];
    }>;
    /**
     * Show system notification
     */
    showNotification(options: NotificationOptions): Promise<boolean>;
    /**
     * Process notification queue to avoid spam
     */
    private processNotificationQueue;
    /**
     * Show restart prompt dialog
     */
    showRestartPrompt(message?: string, title?: string): Promise<number>;
    /**
     * Show error dialog with details
     */
    showErrorDialog(title: string, message: string, detail?: string): Promise<void>;
    /**
     * Show warning dialog
     */
    showWarningDialog(title: string, message: string, detail?: string): Promise<boolean>;
    /**
     * Show confirmation dialog
     */
    showConfirmationDialog(title: string, message: string, detail?: string): Promise<boolean>;
    /**
     * Show custom HTML dialog window
     */
    showCustomDialog(id: string, options: CustomDialogOptions): Promise<BrowserWindow | null>;
    /**
     * Close custom dialog
     */
    closeCustomDialog(id: string): boolean;
    /**
     * Close all custom dialogs
     */
    closeAllCustomDialogs(): void;
    /**
     * Show about dialog
     */
    showAboutDialog(): Promise<void>;
    /**
     * Get list of active custom dialogs
     */
    getActiveDialogs(): string[];
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const dialogManager: DialogManager;
export declare function showMessage(options: DialogOptions): Promise<{
    response: number;
    checkboxChecked?: boolean;
}>;
export declare function showError(title: string, message: string, detail?: string): Promise<void>;
export declare function showWarning(title: string, message: string, detail?: string): Promise<boolean>;
export declare function showConfirmation(title: string, message: string, detail?: string): Promise<boolean>;
export declare function showNotification(options: NotificationOptions): Promise<boolean>;
export declare function showRestartPrompt(message?: string, title?: string): Promise<number>;
//# sourceMappingURL=dialog-manager.d.ts.map