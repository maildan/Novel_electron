#[macro_use]
extern crate napi_derive;

pub mod memory;
pub mod gpu;
pub mod worker;
pub mod utils;

use std::sync::atomic::AtomicBool;

// 초기화 상태 추적
#[allow(dead_code)]
static INITIALIZED: AtomicBool = AtomicBool::new(false);

// 타임스탬프 반환 (String으로 변환하여 안전하게)
#[napi]
pub fn get_timestamp() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;
    
    timestamp.to_string()
}

/// 네이티브 모듈 버전 정보 반환
#[napi]
pub fn get_native_module_version() -> String {
    format!("typing_stats_native v{}", env!("CARGO_PKG_VERSION"))
}

/// 시스템 정보 반환
#[napi]
pub fn get_system_info() -> napi::Result<String> {
    let info = serde_json::json!({
        "version": env!("CARGO_PKG_VERSION"),
        "target": std::env::var("TARGET").unwrap_or_else(|_| "unknown".to_string()),
        "arch": std::env::consts::ARCH,
        "os": std::env::consts::OS,
        "cpu_count": num_cpus::get(),
    });
    Ok(info.to_string())
}

/// 네이티브 모듈 초기화
#[napi]
pub fn initialize_native_modules() -> bool {
    // 메모리, GPU, 워커 풀 초기화
    memory::initialize_memory_system();
    gpu::initialize_gpu_system();
    worker::initialize_worker_pool();
    
    INITIALIZED.store(true, std::sync::atomic::Ordering::SeqCst);
    true
}

/// 네이티브 모듈 정리
#[napi]
pub fn cleanup_native_modules() -> bool {
    // 정리 작업 수행
    worker::cleanup_worker_pool();
    gpu::cleanup_gpu_system();
    memory::cleanup_memory_system();
    
    INITIALIZED.store(false, std::sync::atomic::Ordering::SeqCst);
    true
}

/// GPU 정보 조회
#[napi]
pub fn get_gpu_info() -> gpu::GpuInfo {
    gpu::get_gpu_info()
}

/// GPU 메모리 통계 조회
#[napi]
pub fn get_gpu_memory_stats() -> gpu::GpuMemoryStats {
    gpu::get_gpu_memory_stats()
}

/// GPU 가속화 실행
#[napi]
pub fn run_gpu_acceleration(data: String) -> gpu::GpuAccelerationResult {
    gpu::run_gpu_acceleration(data)
}

/// GPU 벤치마크 실행
#[napi]
pub fn run_gpu_benchmark() -> gpu::GpuAccelerationResult {
    gpu::run_gpu_benchmark()
}

/// GPU 메모리 정리
#[napi]
pub fn cleanup_memory() -> gpu::GpuAccelerationResult {
    gpu::cleanup_memory()
}

/// 고급 메모리 최적화 실행
#[napi]
pub fn optimize_memory_advanced() -> gpu::GpuAccelerationResult {
    gpu::optimize_memory_advanced()
}

/// 네이티브 모듈 정보 반환
#[napi]
pub fn get_native_module_info() -> String {
    let info = serde_json::json!({
        "name": env!("CARGO_PKG_NAME"),
        "version": env!("CARGO_PKG_VERSION"),
        "description": env!("CARGO_PKG_DESCRIPTION"),
        "features": {
            "gpu_compute": cfg!(feature = "gpu-compute"),
            "memory_optimization": cfg!(feature = "memory-optimization"),
            "worker_threads": cfg!(feature = "worker-threads"),
            "advanced_analytics": cfg!(feature = "advanced-analytics")
        },
        "platform": {
            "os": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
            "family": std::env::consts::FAMILY
        },
        "build_info": {
            "rustc_version": rustc_version_runtime::version().to_string(),
            "target": std::env::var("TARGET").unwrap_or_else(|_| "unknown".to_string()),
            "profile": if cfg!(debug_assertions) { "debug" } else { "release" }
        }
    });
    
    info.to_string()
}

/// 네이티브 모듈 사용 가능 여부 확인
#[napi]
pub fn is_native_module_available() -> bool {
    INITIALIZED.load(std::sync::atomic::Ordering::SeqCst)
}
