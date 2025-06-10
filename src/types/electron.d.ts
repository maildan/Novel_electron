// ElectronAPI 타입 정의
interface ElectronAPI {
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<Record<string, any>>;
    reset: () => Promise<void>;
  };
  system: {
    getInfo: () => Promise<any>;
    getCurrentMetrics: () => Promise<any>;
    startMonitoring: () => Promise<void>;
    stopMonitoring: () => Promise<void>;
    getLoopProcesses: () => Promise<any>;
    native: {
      getStatus: () => Promise<any>;
    };
    gpu: {
      getInfo: () => Promise<any>;
    };
  };
  memory: {
    getInfo: () => Promise<any>;
    cleanup: () => Promise<any>;
    optimize: () => Promise<any>;
  };
  window: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
  };
  config: {
    getAll: () => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    reset: () => Promise<void>;
  };
  database: {
    saveTypingSession: (session: any) => Promise<void>;
    getRecentSessions: (limit: number) => Promise<any>;
    getStatistics: (days: number) => Promise<any>;
    exportData: (options: any) => Promise<void>;
    clearData: (options: any) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
