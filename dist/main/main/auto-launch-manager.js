"use strict";
/**
 * 시스템 자동 시작 관리 모듈
 *
 * 애플리케이션이 시스템 시작 시 자동으로 실행되도록 Setup합니다.
 * 다양한 운영체제에서 작동하는 자동 시작 기능을 제공합니다.
 */
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
exports.autoLaunch = exports.AutoLaunchManager = void 0;
exports.getAutoLaunchManager = getAutoLaunchManager;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
// 플랫폼별 레지스트리 키/경로
const PLATFORM_CONFIGS = {
    win32: {
        registryKey: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        method: 'registry'
    },
    darwin: {
        launchAgentsPath: 'Library/LaunchAgents',
        method: 'plist'
    },
    linux: {
        autostartPath: '.config/autostart',
        method: 'desktop'
    }
};
/**
 * 자동 시작 관리자 클래스
 */
class AutoLaunchManager {
    constructor() {
        this.isInitialized = false;
        this.appName = electron_1.app.getName();
        this.executablePath = this.getExecutablePath();
    }
    /**
   * 자동 시작 관리자 초기화
   */
    async initialize() {
        try {
            // 플랫폼 지원 여부 확인
            if (!this.isPlatformSupported()) {
                console.warn('[AutoLaunch] Platform ${process.platform} is not supported');
                return false;
            }
            this.isInitialized = true;
            console.log('[AutoLaunch] 매니저 초기화 Success');
            return true;
        }
        catch (error) {
            console.error('[AutoLaunch] Initialization failed:', error);
            return false;
        }
    }
    /**
   * 자동 시작 활성화
   */
    async enable(settings = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (!this.isPlatformSupported()) {
            return false;
        }
        try {
            const success = await this.enableForPlatform(settings.startMinimized || false);
            if (success) {
                console.log('[AutoLaunch] Auto launch enabled successfully');
            }
            return success;
        }
        catch (error) {
            console.error('[AutoLaunch] Failed to enable auto launch:', error);
            return false;
        }
    }
    /**
   * 자동 시작 비활성화
   */
    async disable() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (!this.isPlatformSupported()) {
            return false;
        }
        try {
            const success = await this.disableForPlatform();
            if (success) {
                console.log('[AutoLaunch] Auto launch disabled successfully');
            }
            return success;
        }
        catch (error) {
            console.error('[AutoLaunch] Failed to disable auto launch:', error);
            return false;
        }
    }
    /**
   * 자동 시작 상태 확인
   */
    async getStatus() {
        const status = {
            isEnabled: false,
            isSupported: this.isPlatformSupported(),
            path: this.executablePath
        };
        if (!status.isSupported) {
            status.error = `Platform ${process.platform} is not supported`;
            return status;
        }
        try {
            status.isEnabled = await this.checkStatusForPlatform();
        }
        catch (error) {
            status.error = error instanceof Error ? error.message : String(error);
            console.error('[AutoLaunch] Failed to check status:', error);
        }
        return status;
    }
    /**
   * 자동 시작 Setup 토글
   */
    async toggle(settings) {
        const status = await this.getStatus();
        if (status.isEnabled) {
            return await this.disable();
        }
        else {
            return await this.enable(settings);
        }
    }
    /**
   * 실행 파일 경로 가져오기
   */
    getExecutablePath() {
        if (electron_1.app.isPackaged) {
            return process.execPath;
        }
        else {
            // 개발 환경에서는 electron 실행 파일 경로
            return process.execPath;
        }
    }
    /**
   * 플랫폼 지원 여부 확인
   */
    isPlatformSupported() {
        return process.platform in PLATFORM_CONFIGS;
    }
    /**
   * 플랫폼별 자동 시작 활성화
   */
    async enableForPlatform(startMinimized) {
        switch (process.platform) {
            case 'win32':
                return this.enableWindows(startMinimized);
            case 'darwin':
                return this.enableMacOS(startMinimized);
            case 'linux':
                return this.enableLinux(startMinimized);
            default:
                return false;
        }
    }
    /**
   * 플랫폼별 자동 시작 비활성화
   */
    async disableForPlatform() {
        switch (process.platform) {
            case 'win32':
                return this.disableWindows();
            case 'darwin':
                return this.disableMacOS();
            case 'linux':
                return this.disableLinux();
            default:
                return false;
        }
    }
    /**
   * 플랫폼별 자동 시작 상태 확인
   */
    async checkStatusForPlatform() {
        switch (process.platform) {
            case 'win32':
                return this.checkStatusWindows();
            case 'darwin':
                return this.checkStatusMacOS();
            case 'linux':
                return this.checkStatusLinux();
            default:
                return false;
        }
    }
    /**
     * Windows 자동 시작 활성화
     */
    enableWindows(startMinimized) {
        try {
            const execPath = this.executablePath.replace(/\\/g, '\\\\');
            const arguments_ = startMinimized ? ' --hidden' : '';
            const regCommand = `REG ADD "${PLATFORM_CONFIGS.win32.registryKey}" /v "${this.appName}" /t REG_SZ /d "${execPath}${arguments_}" /f`;
            (0, child_process_1.execSync)(regCommand, { stdio: 'pipe' });
            return true;
        }
        catch (error) {
            console.error('[AutoLaunch] Windows enable failed:', error);
            return false;
        }
    }
    /**
     * Windows 자동 시작 비활성화
     */
    disableWindows() {
        try {
            const regCommand = `REG DELETE "${PLATFORM_CONFIGS.win32.registryKey}" /v "${this.appName}" /f`;
            (0, child_process_1.execSync)(regCommand, { stdio: 'pipe' });
            return true;
        }
        catch (error) {
            // 키가 존재하지 않는 경우도 Success으로 처리
            return true;
        }
    }
    /**
     * Windows 자동 시작 상태 확인
     */
    checkStatusWindows() {
        try {
            const regCommand = `REG QUERY "${PLATFORM_CONFIGS.win32.registryKey}" /v "${this.appName}"`;
            (0, child_process_1.execSync)(regCommand, { stdio: 'pipe' });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * macOS 자동 시작 활성화
     */
    enableMacOS(startMinimized) {
        try {
            const launchAgentsPath = path.join(electron_1.app.getPath('home'), PLATFORM_CONFIGS.darwin.launchAgentsPath);
            // 디렉토리가 없으면 생성
            if (!fs.existsSync(launchAgentsPath)) {
                fs.mkdirSync(launchAgentsPath, { recursive: true });
            }
            const plistPath = path.join(launchAgentsPath, `${this.appName}.plist`);
            const programArguments = [this.executablePath];
            if (startMinimized) {
                programArguments.push('--hidden');
            }
            const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${this.appName}</string>
  <key>ProgramArguments</key>
  <array>
    ${programArguments.map(arg => `    <string>${arg}</string>`).join('\n')}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>LSUIElement</key>
  <${startMinimized ? 'true' : 'false'}/>
</dict>
</plist>`;
            fs.writeFileSync(plistPath, plistContent);
            return true;
        }
        catch (error) {
            console.error('[AutoLaunch] macOS enable failed:', error);
            return false;
        }
    }
    /**
     * macOS 자동 시작 비활성화
     */
    disableMacOS() {
        try {
            const plistPath = path.join(electron_1.app.getPath('home'), PLATFORM_CONFIGS.darwin.launchAgentsPath, `${this.appName}.plist`);
            if (fs.existsSync(plistPath)) {
                fs.unlinkSync(plistPath);
            }
            return true;
        }
        catch (error) {
            console.error('[AutoLaunch] macOS disable failed:', error);
            return false;
        }
    }
    /**
     * macOS 자동 시작 상태 확인
     */
    checkStatusMacOS() {
        try {
            const plistPath = path.join(electron_1.app.getPath('home'), PLATFORM_CONFIGS.darwin.launchAgentsPath, `${this.appName}.plist`);
            return fs.existsSync(plistPath);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Linux 자동 시작 활성화
     */
    enableLinux(startMinimized) {
        try {
            const autostartPath = path.join(electron_1.app.getPath('home'), PLATFORM_CONFIGS.linux.autostartPath);
            // 디렉토리가 없으면 생성
            if (!fs.existsSync(autostartPath)) {
                fs.mkdirSync(autostartPath, { recursive: true });
            }
            const desktopPath = path.join(autostartPath, `${this.appName}.desktop`);
            const execCommand = startMinimized ?
                `${this.executablePath} --hidden` :
                this.executablePath;
            const desktopEntry = `[Desktop Entry]
Type=Application
Version=1.0
Name=${this.appName}
Comment=${this.appName} Application
Exec=${execCommand}
StartupNotify=false
Terminal=false
NoDisplay=${startMinimized ? 'true' : 'false'}
X-GNOME-Autostart-enabled=true
`;
            fs.writeFileSync(desktopPath, desktopEntry);
            fs.chmodSync(desktopPath, 0o755);
            return true;
        }
        catch (error) {
            console.error('[AutoLaunch] Linux enable failed:', error);
            return false;
        }
    }
    /**
     * Linux 자동 시작 비활성화
     */
    disableLinux() {
        try {
            const desktopPath = path.join(electron_1.app.getPath('home'), PLATFORM_CONFIGS.linux.autostartPath, `${this.appName}.desktop`);
            if (fs.existsSync(desktopPath)) {
                fs.unlinkSync(desktopPath);
            }
            return true;
        }
        catch (error) {
            console.error('[AutoLaunch] Linux disable failed:', error);
            return false;
        }
    }
    /**
     * Linux 자동 시작 상태 확인
     */
    checkStatusLinux() {
        try {
            const desktopPath = path.join(electron_1.app.getPath('home'), PLATFORM_CONFIGS.linux.autostartPath, `${this.appName}.desktop`);
            return fs.existsSync(desktopPath);
        }
        catch (error) {
            return false;
        }
    }
}
exports.AutoLaunchManager = AutoLaunchManager;
// 싱글톤 인스턴스
let autoLaunchManager = null;
/**
 * 자동 시작 관리자 인스턴스 가져오기
 */
function getAutoLaunchManager() {
    if (!autoLaunchManager) {
        autoLaunchManager = new AutoLaunchManager();
    }
    return autoLaunchManager;
}
/**
 * 편의 함수들
 */
exports.autoLaunch = {
    /**
   * 자동 시작 초기화
   */
    async initialize() {
        return await getAutoLaunchManager().initialize();
    },
    /**
   * 자동 시작 활성화
   */
    async enable(settings) {
        return await getAutoLaunchManager().enable(settings);
    },
    /**
   * 자동 시작 비활성화
   */
    async disable() {
        return await getAutoLaunchManager().disable();
    },
    /**
   * 자동 시작 상태 확인
   */
    async getStatus() {
        return await getAutoLaunchManager().getStatus();
    },
    /**
   * 자동 시작 토글
   */
    async toggle(settings) {
        return await getAutoLaunchManager().toggle(settings);
    }
};
exports.default = exports.autoLaunch;
//# sourceMappingURL=auto-launch-manager.js.map