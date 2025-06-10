use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[cfg(target_os = "macos")]
use mach2::traps::mach_task_self;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct MemoryUsage {
    pub rss: String,          // Resident Set Size
    pub heap_total: String,   // Total heap size
    pub heap_used: String,    // Used heap size
    pub external: String,     // External memory
    pub timestamp: String,    // Timestamp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct MemoryStats {
    pub usage: MemoryUsage,
    pub peak_usage: MemoryUsage,
    pub average_usage: MemoryUsage,
    pub total_samples: u32,
    pub monitoring_duration_ms: String,
}

static mut MEMORY_MONITOR: Option<Arc<Mutex<MemoryMonitor>>> = None;

struct MemoryMonitor {
    samples: Vec<MemoryUsage>,
    peak_usage: Option<MemoryUsage>,
    start_time: Instant,
    max_samples: usize,
}

impl MemoryMonitor {
    fn new() -> Self {
        Self {
            samples: Vec::new(),
            peak_usage: None,
            start_time: Instant::now(),
            max_samples: 1000, // 최대 1000개 샘플 유지
        }
    }

    fn add_sample(&mut self, usage: MemoryUsage) {
        // 피크 사용량 업데이트
        let current_rss = usage.rss.parse::<u64>().unwrap_or(0);
        let peak_rss = self.peak_usage.as_ref()
            .and_then(|p| p.rss.parse::<u64>().ok())
            .unwrap_or(0);
            
        if self.peak_usage.is_none() || current_rss > peak_rss {
            self.peak_usage = Some(usage.clone());
        }

        // 샘플 추가
        self.samples.push(usage);

        // 최대 샘플 수 초과시 오래된 샘플 제거
        if self.samples.len() > self.max_samples {
            self.samples.remove(0);
        }
    }

    fn get_stats(&self) -> Option<MemoryStats> {
        if self.samples.is_empty() {
            return None;
        }

        let latest = self.samples.last().unwrap().clone();
        let peak = self.peak_usage.clone().unwrap_or(latest.clone());

        // 평균 계산
        let mut total_rss = 0u64;
        let mut total_heap_total = 0u64;
        let mut total_heap_used = 0u64;
        let mut total_external = 0u64;
        
        for sample in &self.samples {
            total_rss += sample.rss.parse::<u64>().unwrap_or(0);
            total_heap_total += sample.heap_total.parse::<u64>().unwrap_or(0);
            total_heap_used += sample.heap_used.parse::<u64>().unwrap_or(0);
            total_external += sample.external.parse::<u64>().unwrap_or(0);
        }
        
        let count = self.samples.len() as u64;
        let latest_timestamp = latest.timestamp.clone();

        let average = MemoryUsage {
            rss: (total_rss / count).to_string(),
            heap_total: (total_heap_total / count).to_string(),
            heap_used: (total_heap_used / count).to_string(),
            external: (total_external / count).to_string(),
            timestamp: latest_timestamp,
        };

        let monitoring_duration = self.start_time.elapsed().as_millis().to_string();

        Some(MemoryStats {
            usage: latest,
            peak_usage: peak,
            average_usage: average,
            total_samples: self.samples.len() as u32,
            monitoring_duration_ms: monitoring_duration,
        })
    }
}

/// 메모리 시스템 초기화
pub fn initialize_memory_system() {
    unsafe {
        MEMORY_MONITOR = Some(Arc::new(Mutex::new(MemoryMonitor::new())));
    }
}

/// 메모리 시스템 정리
pub fn cleanup_memory_system() {
    unsafe {
        MEMORY_MONITOR = None;
    }
}

/// 현재 메모리 사용량 획득
#[napi]
pub fn get_memory_usage() -> Option<MemoryUsage> {
    #[cfg(target_os = "macos")]
    {
        get_memory_usage_macos()
    }
    #[cfg(target_os = "windows")]
    {
        get_memory_usage_windows()
    }
    #[cfg(target_os = "linux")]
    {
        get_memory_usage_linux()
    }
}

/// 메모리 모니터링 시작
#[napi]
pub fn start_memory_monitoring() -> bool {
    if let Some(usage) = get_memory_usage() {
        unsafe {
            if let Some(monitor) = &*std::ptr::addr_of!(MEMORY_MONITOR) {
                if let Ok(mut guard) = monitor.lock() {
                    guard.add_sample(usage);
                    return true;
                }
            }
        }
    }
    false
}

/// 메모리 통계 가져오기
#[napi]
pub fn get_memory_stats() -> Option<MemoryStats> {
    unsafe {
        if let Some(monitor) = &*std::ptr::addr_of!(MEMORY_MONITOR) {
            if let Ok(guard) = monitor.lock() {
                return guard.get_stats();
            }
        }
    }
    None
}

/// 메모리 모니터링 리셋
#[napi]
pub fn reset_memory_monitoring() -> bool {
    unsafe {
        if let Some(monitor) = &*std::ptr::addr_of!(MEMORY_MONITOR) {
            if let Ok(mut guard) = monitor.lock() {
                guard.samples.clear();
                guard.peak_usage = None;
                guard.start_time = Instant::now();
                return true;
            }
        }
    }
    false
}

#[cfg(target_os = "macos")]
fn get_memory_usage_macos() -> Option<MemoryUsage> {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    // macOS에서 메모리 정보 가져오기
    unsafe {
        let mut info: libc::mach_task_basic_info = std::mem::zeroed();
        let mut count = libc::MACH_TASK_BASIC_INFO_COUNT;

        let result = libc::task_info(
            mach_task_self(),
            libc::MACH_TASK_BASIC_INFO,
            &mut info as *mut _ as *mut _,
            &mut count,
        );

        if result == libc::KERN_SUCCESS {
            // packed field 접근 문제를 피하기 위해 지역 변수에 복사
            let resident_size = info.resident_size;
            let virtual_size = info.virtual_size;
            
            Some(MemoryUsage {
                rss: resident_size.to_string(),
                heap_total: virtual_size.to_string(),
                heap_used: resident_size.to_string(),
                external: "0".to_string(), // macOS에서는 별도 계산 필요
                timestamp: timestamp.to_string(),
            })
        } else {
            None
        }
    }
}

#[cfg(target_os = "windows")]
fn get_memory_usage_windows() -> Option<MemoryUsage> {
    use winapi::um::processthreadsapi::GetCurrentProcess;
    use winapi::um::psapi::{GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS};

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    unsafe {
        let mut counters: PROCESS_MEMORY_COUNTERS = std::mem::zeroed();
        let size = std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32;

        if GetProcessMemoryInfo(GetCurrentProcess(), &mut counters, size) != 0 {
            Some(MemoryUsage {
                rss: (counters.WorkingSetSize as u64).to_string(),
                heap_total: (counters.PagefileUsage as u64).to_string(),
                heap_used: (counters.WorkingSetSize as u64).to_string(),
                external: "0".to_string(),
                timestamp: timestamp.to_string(),
            })
        } else {
            None
        }
    }
}

#[cfg(target_os = "linux")]
fn get_memory_usage_linux() -> Option<MemoryUsage> {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    // /proc/self/status에서 메모리 정보 읽기
    if let Ok(content) = std::fs::read_to_string("/proc/self/status") {
        let mut rss = 0u64;
        let mut vm_size = 0u64;

        for line in content.lines() {
            if line.starts_with("VmRSS:") {
                if let Some(value) = line.split_whitespace().nth(1) {
                    rss = value.parse::<u64>().unwrap_or(0) * 1024; // KB to bytes
                }
            } else if line.starts_with("VmSize:") {
                if let Some(value) = line.split_whitespace().nth(1) {
                    vm_size = value.parse::<u64>().unwrap_or(0) * 1024; // KB to bytes
                }
            }
        }

        Some(MemoryUsage {
            rss: rss.to_string(),
            heap_total: vm_size.to_string(),
            heap_used: rss.to_string(),
            external: "0".to_string(),
            timestamp: timestamp.to_string(),
        })
    } else {
        None
    }
}
