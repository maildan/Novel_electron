'use client';

import { useState, useEffect } from 'react';

// System metrics interfaces
interface SystemMetrics {
  cpu: {
    usage: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  gpu?: {
    usage: number;
    memory?: {
      used: number;
      total: number;
    };
  };
}

interface GPUInfo {
  name: string;
  driver?: string;
  memory?: {
    total: number;
    used: number;
  };
  vendor?: string;
}

interface MemoryStats {
  used: number;
  total: number;
  free: number;
  percentage: number;
  rss?: number;
  heapUsed?: number;
  heapTotal?: number;
}

interface NativeStatus {
  loaded: boolean;
  error?: string;
  version?: string;
}

interface SystemAPI {
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => Promise<boolean>;
  getCurrentMetrics: () => Promise<SystemMetrics>;
  getMetricsHistory: (minutes?: number) => Promise<SystemMetrics[]>;
  cleanup: (force?: boolean) => Promise<boolean>;
  getUsage: () => Promise<SystemMetrics>;
  getStats: () => Promise<SystemMetrics>;
  optimizeMemory: () => Promise<boolean>;
  gpu: {
    getInfo: () => Promise<GPUInfo>;
    compute: (data: unknown) => Promise<unknown>;
    enable: () => Promise<boolean>;
    disable: () => Promise<boolean>;
  };
  native: {
    getStatus: () => Promise<NativeStatus>;
  };
}

interface MemoryAPI {
  cleanup: (force?: boolean) => Promise<boolean>;
  getUsage: () => Promise<MemoryStats>;
  getStats: () => Promise<MemoryStats>;
  getInfo: () => Promise<MemoryStats>;
  optimize: () => Promise<boolean>;
}

interface ConfigAPI {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<boolean>;
  getAll: () => Promise<Record<string, unknown>>;
  setMultiple: (config: Record<string, unknown>) => Promise<boolean>;
  reset: () => Promise<boolean>;
}

interface SettingsAPI {
  get: (key?: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<boolean>;
  getAll: () => Promise<Record<string, unknown>>;
  update: (key: string, value: unknown) => Promise<boolean>;
  updateMultiple: (settings: Record<string, unknown>) => Promise<boolean>;
  reset: () => Promise<boolean>;
  save: () => Promise<boolean>;
  load: () => Promise<Record<string, unknown>>;
}

interface ElectronAPI {
  ipcRenderer: {
    on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
    once: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
    send: (channel: string, ...args: unknown[]) => void;
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    removeListener: (channel: string, listener: (...args: unknown[]) => void) => void;
  };
  system: SystemAPI;
  memory: MemoryAPI;
  config: ConfigAPI;
  settings: SettingsAPI;
}

interface UseElectronResult {
  isElectron: boolean;
  electronAPI: ElectronAPI | null;
}

/**
 * Electron API를 안전하게 액세스하기 위한 훅
 * 
 * 브라우저와 Electron 환경을 모두 지원하며, Electron이 없는 경우 null을 반환합니다.
 */
export function useElectron(): UseElectronResult {
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Electron 환경 감지
    const checkElectron = typeof window !== 'undefined' && 
                         window && 
                         window.process && 
                         window.process.versions && 
                         Boolean(window.process.versions.electron);
    
    setIsElectron(checkElectron);
    
    if (checkElectron) {
      // window.electronAPI가 전역 객체로 정의되어 있는지 확인
      const globalWindow = window as unknown as { electronAPI?: ElectronAPI };
      const api = globalWindow.electronAPI;
      
      if (api && api.ipcRenderer) {
        setElectronAPI(api);
      } else {
        console.warn('Electron API를 찾을 수 없습니다.');
        setElectronAPI(null);
      }
    } else {
      setElectronAPI(null);
    }
  }, []);

  return { isElectron, electronAPI };
}
