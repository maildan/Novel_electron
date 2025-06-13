/**
 * 시스템 정보 IPC 핸들러
 * CPU, 프로세스, 시스템 상태 등을 제공합니다.
 */

import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import * as os from 'os';

// CPU 정보 인터페이스
export interface CPUInfo {
  usage: number;
  temperature?: number;
  model: string;
  cores: number;
  threads: number;
  speed: number;
}

// 프로세스 정보 인터페이스
export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryPercent: number;
  status: string;
  ppid?: number;
  user?: string;
}

// 시스템 정보 인터페이스
export interface SystemInfo {
  cpu: CPUInfo;
  processes: ProcessInfo[];
  uptime: number;
  loadAverage: number[];
  platform: string;
  arch: string;
  hostname: string;
  timestamp: number;
}

// CPU 사용률 계산을 위한 이전 데이터 저장
let previousCPUInfo: os.CpuInfo[] | null = null;
let previousTime = Date.now();

/**
 * CPU 사용률 계산
 */
function calculateCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    
    if (!previousCPUInfo) {
      previousCPUInfo = cpus;
      previousTime = Date.now();
      setTimeout(() => {
        resolve(calculateCPUUsage());
      }, 100);
      return;
    }

    let totalIdle = 0;
    let totalTick = 0;

    for (let i = 0; i < cpus.length; i++) {
      const cpu = cpus[i];
      const prevCpu = previousCPUInfo[i];

      const idle = cpu.times.idle - prevCpu.times.idle;
      const total = Object.values(cpu.times).reduce((acc, time, idx) => 
        acc + (time - Object.values(prevCpu.times)[idx]), 0);

      totalIdle += idle;
      totalTick += total;
    }

    const usage = 100 - (100 * totalIdle / totalTick);
    
    previousCPUInfo = cpus;
    previousTime = Date.now();
    
    resolve(Math.round(usage * 100) / 100);
  });
}

/**
 * macOS에서 프로세스 정보 가져오기
 */
function getProcessInfo(): Promise<ProcessInfo[]> {
  return new Promise((resolve, reject) => {
    // ps 명령어로 프로세스 정보 가져오기
    const ps = spawn('ps', ['-axo', 'pid,ppid,pcpu,pmem,comm,stat', '-r']);
    
    let output = '';
    
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ps.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ps command failed with code ${code}`));
        return;
      }
      
      try {
        const lines = output.trim().split('\n');
        const processes: ProcessInfo[] = [];
        
        // 헤더 라인 건너뛰기
        for (let i = 1; i < Math.min(lines.length, 101); i++) { // 상위 100개 프로세스만
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(/\s+/);
          if (parts.length >= 6) {
            const pid = parseInt(parts[0]);
            const ppid = parseInt(parts[1]);
            const cpuUsage = parseFloat(parts[2]);
            const memoryPercent = parseFloat(parts[3]);
            const name = parts[4];
            const status = parts[5];
            
            // 메모리 사용량 MB 계산 (시스템 메모리 기준)
            const totalMemoryMB = os.totalmem() / (1024 * 1024);
            const memoryUsage = (memoryPercent / 100) * totalMemoryMB;
            
            processes.push({
              pid,
              ppid,
              name,
              cpuUsage,
              memoryUsage,
              memoryPercent,
              status
            });
          }
        }
        
        // CPU 사용률 기준으로 정렬
        processes.sort((a, b) => b.cpuUsage - a.cpuUsage);
        
        resolve(processes);
      } catch (error) {
        reject(error);
      }
    });
    
    ps.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 시스템 정보 수집
 */
async function getSystemInfo(): Promise<SystemInfo> {
  try {
    const cpus = os.cpus();
    const cpuUsage = await calculateCPUUsage();
    
    const cpuInfo: CPUInfo = {
      usage: cpuUsage,
      model: cpus[0].model,
      cores: cpus.length,
      threads: cpus.length, // macOS에서는 보통 코어 = 스레드
      speed: cpus[0].speed
    };
    
    const processes = await getProcessInfo();
    
    return {
      cpu: cpuInfo,
      processes,
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('시스템 정보 수집 오류:', error);
    throw error;
  }
}

/**
 * Loop 관련 프로세스 필터링
 */
function getLoopProcesses(allProcesses: ProcessInfo[]): ProcessInfo[] {
  return allProcesses.filter(process => 
    process.name.toLowerCase().includes('electron') ||
    process.name.toLowerCase().includes('loop') ||
    process.name.toLowerCase().includes('node')
  );
}

/**
 * 시스템 정보 IPC 핸들러 등록
 */
export function registerSystemInfoIpcHandlers(): void {
  // 전체 시스템 정보 가져오기
  ipcMain.handle('system:getInfo', async () => {
    try {
      const systemInfo = await getSystemInfo();
      return {
        success: true,
        data: systemInfo
      };
    } catch (error) {
      console.error('시스템 정보 가져오기 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  });

  // CPU 정보만 가져오기
  ipcMain.handle('system:getCpuInfo', async () => {
    try {
      const cpus = os.cpus();
      const usage = await calculateCPUUsage();
      
      const cpuInfo: CPUInfo = {
        usage,
        model: cpus[0].model,
        cores: cpus.length,
        threads: cpus.length,
        speed: cpus[0].speed
      };
      
      return {
        success: true,
        data: cpuInfo
      };
    } catch (error) {
      console.error('CPU 정보 가져오기 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  });

  // 프로세스 정보 가져오기
  ipcMain.handle('system:getProcesses', async () => {
    try {
      const processes = await getProcessInfo();
      return {
        success: true,
        data: processes
      };
    } catch (error) {
      console.error('프로세스 정보 가져오기 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  });

  // Loop 프로세스만 가져오기
  ipcMain.handle('system:getLoopProcesses', async () => {
    try {
      const allProcesses = await getProcessInfo();
      const loopProcesses = getLoopProcesses(allProcesses);
      
      return {
        success: true,
        data: loopProcesses
      };
    } catch (error) {
      console.error('Loop 프로세스 정보 가져오기 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  });

  console.log('[SystemInfo] 시스템 정보 IPC 핸들러 등록 완료');
}
