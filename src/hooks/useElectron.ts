'use client';

import { useState, useEffect } from 'react';

interface SystemAPI {
  startMonitoring: () => Promise<any>;
  stopMonitoring: () => Promise<any>;
  getCurrentMetrics: () => Promise<any>;
  getMetricsHistory: (minutes?: number) => Promise<any>;
  cleanup: (force?: boolean) => Promise<any>;
  getUsage: () => Promise<any>;
  getStats: () => Promise<any>;
  optimizeMemory: () => Promise<any>;
  gpu: {
    getInfo: () => Promise<any>;
    compute: (data: any) => Promise<any>;
    enable: () => Promise<any>;
    disable: () => Promise<any>;
  };
  native: {
    getStatus: () => Promise<any>;
  };
}

interface MemoryAPI {
  cleanup: (force?: boolean) => Promise<any>;
  getUsage: () => Promise<any>;
  getStats: () => Promise<any>;
  getInfo: () => Promise<any>;
  optimize: () => Promise<any>;
}

interface ConfigAPI {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<any>;
  getAll: () => Promise<any>;
  setMultiple: (config: Record<string, any>) => Promise<any>;
  reset: () => Promise<any>;
}

interface ElectronAPI {
  ipcRenderer: {
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  };
  system: SystemAPI;
  memory: MemoryAPI;
  config: ConfigAPI;
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
      const api = (window as any).electronAPI;
      
      if (api && api.ipcRenderer) {
        setElectronAPI(api as ElectronAPI);
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
