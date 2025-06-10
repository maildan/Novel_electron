// GPU 모듈 - 크로스 플랫폼 GPU 가속화 및 메모리 최적화
// 100MB 목표 메모리 사용량 달성을 위한 고급 GPU 가속화 시스템

use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex, atomic::{AtomicBool, AtomicU64, Ordering}};
use std::collections::HashMap;
use std::thread;
use std::time::{Duration, Instant};
use once_cell::sync::Lazy;

// 서브 모듈들
pub mod detection;
pub mod memory;
pub mod optimization;

// 상수 정의
pub const MAX_APP_MEMORY_MB: u64 = 100; // 목표: 100MB 이하
pub const MEMORY_CHECK_INTERVAL_MS: u64 = 1000; // 메모리 체크 간격
pub const GPU_OFFLOAD_THRESHOLD_MB: u64 = 80; // GPU 오프로드 시작 임계값

// GPU 메모리 오프로드 데이터 구조체
#[derive(Debug)]
pub struct OffloadedData {
    pub data: Vec<u8>,
    pub size_mb: f64,
    pub created_at: Instant,
    pub access_count: AtomicU64,
    pub priority: u8, // 0-255, 높을수록 우선순위 높음
}

// Clone을 수동으로 구현 (AtomicU64는 Clone을 지원하지 않음)
impl Clone for OffloadedData {
    fn clone(&self) -> Self {
        OffloadedData {
            data: self.data.clone(),
            size_mb: self.size_mb,
            created_at: self.created_at,
            access_count: AtomicU64::new(self.access_count.load(Ordering::SeqCst)),
            priority: self.priority,
        }
    }
}

// 전역 GPU 상태 관리 (안전한 방식)
static GPU_INITIALIZED: AtomicBool = AtomicBool::new(false);
static MEMORY_MONITORING_ACTIVE: AtomicBool = AtomicBool::new(false);
static TOTAL_OFFLOADED_MEMORY: AtomicU64 = AtomicU64::new(0); // bytes
static OPTIMIZATION_COUNT: AtomicU64 = AtomicU64::new(0);

// GPU 리소스 관리 (Lazy를 사용한 안전한 초기화)
#[allow(dead_code)]
static GPU_MONITOR: Lazy<Arc<Mutex<Vec<GpuInfo>>>> = Lazy::new(|| Arc::new(Mutex::new(Vec::new())));
static OFFLOADED_DATA: Lazy<Arc<Mutex<HashMap<String, OffloadedData>>>> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
static MEMORY_MONITOR_HANDLE: Lazy<Arc<Mutex<Option<thread::JoinHandle<()>>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

// 헬퍼 함수들
pub fn get_total_offloaded_memory() -> u64 {
    TOTAL_OFFLOADED_MEMORY.load(Ordering::SeqCst)
}

pub fn add_offloaded_memory(bytes: u64) -> u64 {
    TOTAL_OFFLOADED_MEMORY.fetch_add(bytes, Ordering::SeqCst)
}

pub fn reset_offloaded_memory() {
    TOTAL_OFFLOADED_MEMORY.store(0, Ordering::SeqCst);
}

pub fn increment_optimization_count() -> u64 {
    OPTIMIZATION_COUNT.fetch_add(1, Ordering::SeqCst)
}

pub fn get_offloaded_data() -> &'static Arc<Mutex<HashMap<String, OffloadedData>>> {
    &OFFLOADED_DATA
}

// 서브 모듈에서 함수들을 가져옴
pub use detection::detect_gpu_capabilities;
pub use memory::get_current_memory_usage_mb;
pub use optimization::{perform_manual_optimization, run_acceleration_task, run_benchmark};

/// GPU 정보 구조체
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub memory_total: String,
    pub memory_used: String,
    pub memory_available: String,
    pub utilization: f64,
    pub compute_capability: String,
    pub driver_version: String,
    pub is_integrated: bool,
    pub supports_compute: bool,
    pub timestamp: String,
}

impl Default for GpuInfo {
    fn default() -> Self {
        Self {
            name: "Unknown GPU".to_string(),
            vendor: "Unknown".to_string(),
            memory_total: "0".to_string(),
            memory_used: "0".to_string(),
            memory_available: "0".to_string(),
            utilization: 0.0,
            compute_capability: "0.0".to_string(),
            driver_version: "0.0".to_string(),
            is_integrated: false,
            supports_compute: false,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/// GPU 메모리 통계 구조체
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct GpuMemoryStats {
    pub app_memory_mb: f64,
    pub gpu_memory_mb: f64,
    pub cpu_memory_mb: f64,
    pub total_offloaded_mb: f64,
    pub optimization_score: f64,
    pub last_optimization: String,
    pub active_offloads: u32,
}

/// GPU 가속화 결과 구조체
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct GpuAccelerationResult {
    pub success: bool,
    pub performance_gain: f64,
    pub execution_time_ms: f64,
    pub memory_saved_mb: f64,
    pub used_gpu: bool,
    pub error_message: Option<String>,
    pub timestamp: String,
    pub message: String,
    pub details: String,
}

/// 메모리 모니터링 시작
pub fn initialize_memory_monitoring() {
    if GPU_INITIALIZED.load(Ordering::SeqCst) {
        return;
    }

    MEMORY_MONITORING_ACTIVE.store(true, Ordering::SeqCst);
    GPU_INITIALIZED.store(true, Ordering::SeqCst);
    
    let handle = thread::spawn(move || {
        while MEMORY_MONITORING_ACTIVE.load(Ordering::SeqCst) {
            // 메모리 상태 검사 및 필요시 자동 최적화
            let memory_usage = memory::get_current_memory_usage_mb();
            
            if memory_usage > MAX_APP_MEMORY_MB as f64 {
                // 자동 최적화 수행
                memory::perform_automatic_memory_optimization();
            }
            
            // 일정 간격으로 실행 (CPU 부하 방지)
            thread::sleep(Duration::from_millis(MEMORY_CHECK_INTERVAL_MS));
        }
    });
    
    if let Ok(mut guard) = MEMORY_MONITOR_HANDLE.lock() {
        *guard = Some(handle);
    }
}

/// 메모리 모니터링 정리
pub fn cleanup_memory_monitoring() {
    if !GPU_INITIALIZED.load(Ordering::SeqCst) {
        return;
    }

    MEMORY_MONITORING_ACTIVE.store(false, Ordering::SeqCst);
    
    if let Ok(mut handle_guard) = MEMORY_MONITOR_HANDLE.lock() {
        if let Some(handle) = handle_guard.take() {
            let _ = handle.join();
        }
    }

    if let Ok(mut guard) = OFFLOADED_DATA.lock() {
        guard.clear();
    }

    TOTAL_OFFLOADED_MEMORY.store(0, Ordering::SeqCst);
    GPU_INITIALIZED.store(false, Ordering::SeqCst);
}

/// GPU 시스템 초기화
pub fn initialize_gpu_system() {
    initialize_memory_monitoring();
}

/// GPU 시스템 정리
pub fn cleanup_gpu_system() {
    cleanup_memory_monitoring();
}

// NAPI 함수들 (JavaScript에서 호출 가능)

/// GPU 정보 조회
#[napi]
pub fn get_gpu_info() -> GpuInfo {
    detection::detect_gpu_capabilities().unwrap_or_default()
}

/// GPU 메모리 상태 조회  
#[napi]
pub fn get_gpu_memory_stats() -> GpuMemoryStats {
    memory::get_memory_statistics()
}

/// 메모리 최적화 실행
#[napi]
pub fn optimize_memory() -> GpuAccelerationResult {
    perform_manual_optimization()
}

/// GPU 가속화 실행
#[napi]
pub fn run_gpu_acceleration(_data: String) -> GpuAccelerationResult {
    run_acceleration_task()
}

/// GPU 벤치마크 실행
#[napi]
pub fn run_gpu_benchmark() -> GpuAccelerationResult {
    run_benchmark()
}

/// GPU 메모리 정리
#[napi]
pub fn cleanup_memory() -> GpuAccelerationResult {
    memory::cleanup_gpu_memory()
}

/// 고급 메모리 최적화 실행
#[napi]
pub fn optimize_memory_advanced() -> GpuAccelerationResult {
    optimization::adaptive_optimization()
}