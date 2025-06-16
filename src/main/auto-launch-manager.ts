/**
 * 시스템 자동 시작 관리 모듈
 * 
 * 애플리케이션이 시스템 시작 시 자동으로 실행되도록 Setup합니다.
 * 다양한 운영체제에서 작동하는 자동 시작 기능을 제공합니다.
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

// 자동 시작 Setup 인터페이스
export interface AutoLaunchSettings {
  enabled: boolean;
  startMinimized: boolean;
  path?: string;
}

// 자동 시작 상태 인터페이스
export interface AutoLaunchStatus {
  isEnabled: boolean;
  isSupported: boolean;
  path: string | null;
  error?: string;
}

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
} as const;

/**
 * 자동 시작 관리자 클래스
 */
export class AutoLaunchManager {
  private appName: string;
  private executablePath: string;
  private isInitialized: boolean = false;

  constructor() {
    this.appName = app.getName();
    this.executablePath = this.getExecutablePath();
  }

  /**
 * 자동 시작 관리자 초기화
 */
  async initialize(): Promise<boolean> {
    try {
      // 플랫폼 지원 여부 확인
      if (!this.isPlatformSupported()) {
        console.warn('[AutoLaunch] Platform ${process.platform} is not supported');
        return false;
      }

      this.isInitialized = true;
      console.log('[AutoLaunch] 매니저 초기화 Success');
      return true;
    } catch (error) {
      console.error('[AutoLaunch] Initialization failed:', error);
      return false;
    }
  }

  /**
 * 자동 시작 활성화
 */
  async enable(settings: Partial<AutoLaunchSettings> = {}): Promise<boolean> {
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
    } catch (error) {
      console.error('[AutoLaunch] Failed to enable auto launch:', error);
      return false;
    }
  }

  /**
 * 자동 시작 비활성화
 */
  async disable(): Promise<boolean> {
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
    } catch (error) {
      console.error('[AutoLaunch] Failed to disable auto launch:', error);
      return false;
    }
  }

  /**
 * 자동 시작 상태 확인
 */
  async getStatus(): Promise<AutoLaunchStatus> {
    const status: AutoLaunchStatus = {
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
    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error);
      console.error('[AutoLaunch] Failed to check status:', error);
    }

    return status;
  }

  /**
 * 자동 시작 Setup 토글
 */
  async toggle(settings?: Partial<AutoLaunchSettings>): Promise<boolean> {
    const status = await this.getStatus();
    
    if (status.isEnabled) {
      return await this.disable();
    } else {
      return await this.enable(settings);
    }
  }

  /**
 * 실행 파일 경로 가져오기
 */
  private getExecutablePath(): string {
    if (app.isPackaged) {
      return process.execPath;
    } else {
      // 개발 환경에서는 electron 실행 파일 경로
      return process.execPath;
    }
  }

  /**
 * 플랫폼 지원 여부 확인
 */
  private isPlatformSupported(): boolean {
    return process.platform in PLATFORM_CONFIGS;
  }

  /**
 * 플랫폼별 자동 시작 활성화
 */
  private async enableForPlatform(startMinimized: boolean): Promise<boolean> {
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
  private async disableForPlatform(): Promise<boolean> {
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
  private async checkStatusForPlatform(): Promise<boolean> {
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
  private enableWindows(startMinimized: boolean): boolean {
    try {
      const execPath = this.executablePath.replace(/\\/g, '\\\\');
      const arguments_ = startMinimized ? ' --hidden' : '';
      const regCommand = `REG ADD "${PLATFORM_CONFIGS.win32.registryKey}" /v "${this.appName}" /t REG_SZ /d "${execPath}${arguments_}" /f`;
      
      execSync(regCommand, { stdio: 'pipe' });
      return true;
    } catch (error) {
      console.error('[AutoLaunch] Windows enable failed:', error);
      return false;
    }
  }

  /**
   * Windows 자동 시작 비활성화
   */
  private disableWindows(): boolean {
    try {
      const regCommand = `REG DELETE "${PLATFORM_CONFIGS.win32.registryKey}" /v "${this.appName}" /f`;
      execSync(regCommand, { stdio: 'pipe' });
      return true;
    } catch (error) {
      // 키가 존재하지 않는 경우도 Success으로 처리
      return true;
    }
  }

  /**
   * Windows 자동 시작 상태 확인
   */
  private checkStatusWindows(): boolean {
    try {
      const regCommand = `REG QUERY "${PLATFORM_CONFIGS.win32.registryKey}" /v "${this.appName}"`;
      execSync(regCommand, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * macOS 자동 시작 활성화
   */
  private enableMacOS(startMinimized: boolean): boolean {
    try {
      const launchAgentsPath = path.join(
        app.getPath('home'),
        PLATFORM_CONFIGS.darwin.launchAgentsPath
      );
      
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
    } catch (error) {
      console.error('[AutoLaunch] macOS enable failed:', error);
      return false;
    }
  }

  /**
   * macOS 자동 시작 비활성화
   */
  private disableMacOS(): boolean {
    try {
      const plistPath = path.join(
        app.getPath('home'),
        PLATFORM_CONFIGS.darwin.launchAgentsPath,
        `${this.appName}.plist`
      );
      
      if (fs.existsSync(plistPath)) {
        fs.unlinkSync(plistPath);
      }
      return true;
    } catch (error) {
      console.error('[AutoLaunch] macOS disable failed:', error);
      return false;
    }
  }

  /**
   * macOS 자동 시작 상태 확인
   */
  private checkStatusMacOS(): boolean {
    try {
      const plistPath = path.join(
        app.getPath('home'),
        PLATFORM_CONFIGS.darwin.launchAgentsPath,
        `${this.appName}.plist`
      );
      return fs.existsSync(plistPath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Linux 자동 시작 활성화
   */
  private enableLinux(startMinimized: boolean): boolean {
    try {
      const autostartPath = path.join(
        app.getPath('home'),
        PLATFORM_CONFIGS.linux.autostartPath
      );
      
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
    } catch (error) {
      console.error('[AutoLaunch] Linux enable failed:', error);
      return false;
    }
  }

  /**
   * Linux 자동 시작 비활성화
   */
  private disableLinux(): boolean {
    try {
      const desktopPath = path.join(
        app.getPath('home'),
        PLATFORM_CONFIGS.linux.autostartPath,
        `${this.appName}.desktop`
      );
      
      if (fs.existsSync(desktopPath)) {
        fs.unlinkSync(desktopPath);
      }
      return true;
    } catch (error) {
      console.error('[AutoLaunch] Linux disable failed:', error);
      return false;
    }
  }

  /**
   * Linux 자동 시작 상태 확인
   */
  private checkStatusLinux(): boolean {
    try {
      const desktopPath = path.join(
        app.getPath('home'),
        PLATFORM_CONFIGS.linux.autostartPath,
        `${this.appName}.desktop`
      );
      return fs.existsSync(desktopPath);
    } catch (error) {
      return false;
    }
  }
}

// 싱글톤 인스턴스
let autoLaunchManager: AutoLaunchManager | null = null;

/**
 * 자동 시작 관리자 인스턴스 가져오기
 */
export function getAutoLaunchManager(): AutoLaunchManager {
  if (!autoLaunchManager) {
    autoLaunchManager = new AutoLaunchManager();
  }
  return autoLaunchManager;
}

/**
 * 편의 함수들
 */
export const autoLaunch = {
  /**
 * 자동 시작 초기화
 */
  async initialize(): Promise<boolean> {
    return await getAutoLaunchManager().initialize();
  },

  /**
 * 자동 시작 활성화
 */
  async enable(settings?: Partial<AutoLaunchSettings>): Promise<boolean> {
    return await getAutoLaunchManager().enable(settings);
  },

  /**
 * 자동 시작 비활성화
 */
  async disable(): Promise<boolean> {
    return await getAutoLaunchManager().disable();
  },

  /**
 * 자동 시작 상태 확인
 */
  async getStatus(): Promise<AutoLaunchStatus> {
    return await getAutoLaunchManager().getStatus();
  },

  /**
 * 자동 시작 토글
 */
  async toggle(settings?: Partial<AutoLaunchSettings>): Promise<boolean> {
    return await getAutoLaunchManager().toggle(settings);
  }
};

export default autoLaunch;
