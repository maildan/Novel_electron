use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct SystemInfo {
    pub platform: String,
    pub arch: String,
    pub cpu_count: u32,
    pub total_memory: String,
    pub hostname: String,
    pub uptime: String,
    pub load_average: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct FileHash {
    pub file_path: String,
    pub md5: String,
    pub sha256: String,
    pub size: String,
    pub modified_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PerformanceMetrics {
    pub operation: String,
    pub duration_ms: f64,
    pub memory_before: String,
    pub memory_after: String,
    pub timestamp: String,
}

/// 시스템 정보 가져오기
#[napi]
pub fn get_system_info() -> Option<SystemInfo> {
    let platform = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    let cpu_count = num_cpus::get() as u32;
    
    // 시스템 메모리 정보
    let total_memory = get_total_memory().to_string();
    
    // 호스트명
    let hostname = get_hostname();
    
    // 시스템 업타임
    let uptime = get_system_uptime().to_string();
    
    // 로드 평균 (Unix 시스템에서만)
    let load_average = get_load_average();
    
    Some(SystemInfo {
        platform,
        arch,
        cpu_count,
        total_memory,
        hostname,
        uptime,
        load_average,
    })
}

/// 파일 해시 계산
#[napi]
pub fn calculate_file_hash(file_path: String) -> Option<FileHash> {
    use std::fs;
    use std::io::Read;
    use sha2::{Sha256, Digest as Sha2Digest};

    if let Ok(mut file) = fs::File::open(&file_path) {
        let mut buffer = Vec::new();
        if file.read_to_end(&mut buffer).is_ok() {
            // MD5 해시
            let md5_result = md5::compute(&buffer);
            let md5 = format!("{:x}", md5_result);

            // SHA256 해시
            let mut hasher_sha256 = Sha256::new();
            hasher_sha256.update(&buffer);
            let sha256_result = hasher_sha256.finalize();
            let sha256 = format!("{:x}", sha256_result);

            // 파일 메타데이터
            if let Ok(metadata) = fs::metadata(&file_path) {
                let size = metadata.len().to_string();
                let modified_time = metadata
                    .modified()
                    .unwrap_or(SystemTime::UNIX_EPOCH)
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs()
                    .to_string();

                return Some(FileHash {
                    file_path,
                    md5,
                    sha256,
                    size,
                    modified_time,
                });
            }
        }
    }
    None
}

/// 성능 측정 시작
#[napi]
pub fn start_performance_measurement(operation: String) -> String {
    let measurement_id = format!("{}_{}", operation, get_timestamp_string());
    // 실제로는 글로벌 스토리지에 측정 시작 정보 저장
    measurement_id
}

/// 성능 측정 종료
#[napi]
pub fn end_performance_measurement(measurement_id: String) -> Option<PerformanceMetrics> {
    // 실제 구현에서는 저장된 시작 정보를 조회하여 계산
    // 여기서는 예시 데이터 반환
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .to_string();

    Some(PerformanceMetrics {
        operation: measurement_id,
        duration_ms: 100.0, // 예시 값
        memory_before: (1024 * 1024).to_string(), // 예시 값
        memory_after: (1024 * 1024 + 512).to_string(), // 예시 값
        timestamp,
    })
}

/// 디렉토리 크기 계산
#[napi]
pub fn calculate_directory_size(dir_path: String) -> String {
    use std::fs;
    
    fn get_size(path: &std::path::Path) -> u64 {
        let mut size = 0;
        
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Ok(metadata) = fs::metadata(&path) {
                        size += metadata.len();
                    }
                } else if path.is_dir() {
                    size += get_size(&path);
                }
            }
        }
        
        size
    }
    
    let path = std::path::Path::new(&dir_path);
    get_size(path).to_string()
}

/// 문자열 유사도 계산 (Levenshtein distance)
#[napi]
pub fn calculate_string_similarity(str1: String, str2: String) -> f64 {
    let len1 = str1.chars().count();
    let len2 = str2.chars().count();
    
    if len1 == 0 && len2 == 0 {
        return 1.0;
    }
    
    if len1 == 0 || len2 == 0 {
        return 0.0;
    }
    
    let chars1: Vec<char> = str1.chars().collect();
    let chars2: Vec<char> = str2.chars().collect();
    
    let mut matrix = vec![vec![0; len2 + 1]; len1 + 1];
    
    // 초기화
    for i in 0..=len1 {
        matrix[i][0] = i;
    }
    for j in 0..=len2 {
        matrix[0][j] = j;
    }
    
    // 거리 계산
    for i in 1..=len1 {
        for j in 1..=len2 {
            let cost = if chars1[i - 1] == chars2[j - 1] { 0 } else { 1 };
            matrix[i][j] = std::cmp::min(
                std::cmp::min(
                    matrix[i - 1][j] + 1,      // 삭제
                    matrix[i][j - 1] + 1       // 삽입
                ),
                matrix[i - 1][j - 1] + cost    // 교체
            );
        }
    }
    
    let distance = matrix[len1][len2];
    let max_len = std::cmp::max(len1, len2);
    1.0 - (distance as f64 / max_len as f64)
}

/// JSON 유효성 검사
#[napi]
pub fn validate_json(json_string: String) -> bool {
    serde_json::from_str::<serde_json::Value>(&json_string).is_ok()
}

/// Base64 인코딩
#[napi]
pub fn encode_base64(data: String) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(data.as_bytes())
}

/// Base64 디코딩
#[napi]
pub fn decode_base64(encoded: String) -> Option<String> {
    use base64::{Engine as _, engine::general_purpose};
    
    if let Ok(decoded_bytes) = general_purpose::STANDARD.decode(encoded) {
        if let Ok(decoded_string) = String::from_utf8(decoded_bytes) {
            return Some(decoded_string);
        }
    }
    None
}

/// 랜덤 UUID 생성
#[napi]
pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// 타임스탬프 문자열 생성
#[napi]
pub fn get_timestamp_string() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .to_string()
}

/// 환경 변수 가져오기
#[napi]
pub fn get_env_var(key: String) -> Option<String> {
    std::env::var(key).ok()
}

/// 프로세스 ID 가져오기
#[napi]
pub fn get_process_id() -> u32 {
    std::process::id()
}

// 내부 헬퍼 함수들

fn get_total_memory() -> u64 {
    #[cfg(target_os = "macos")]
    {
        use std::mem;
        use std::ptr;
        
        unsafe {
            let mut size = mem::size_of::<u64>();
            let mut memory: u64 = 0;
            let result = libc::sysctlbyname(
                b"hw.memsize\0".as_ptr() as *const i8,
                &mut memory as *mut _ as *mut libc::c_void,
                &mut size,
                ptr::null_mut(),
                0,
            );
            
            if result == 0 {
                memory
            } else {
                0
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::fs;
        
        if let Ok(content) = fs::read_to_string("/proc/meminfo") {
            for line in content.lines() {
                if line.starts_with("MemTotal:") {
                    if let Some(value) = line.split_whitespace().nth(1) {
                        if let Ok(kb) = value.parse::<u64>() {
                            return kb * 1024; // KB to bytes
                        }
                    }
                }
            }
        }
        0
    }
    
    #[cfg(target_os = "windows")]
    {
        use winapi::um::sysinfoapi::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
        use std::mem;
        
        unsafe {
            let mut status: MEMORYSTATUSEX = mem::zeroed();
            status.dwLength = mem::size_of::<MEMORYSTATUSEX>() as u32;
            
            if GlobalMemoryStatusEx(&mut status) != 0 {
                status.ullTotalPhys
            } else {
                0
            }
        }
    }
}

fn get_hostname() -> String {
    hostname::get()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string()
}

fn get_system_uptime() -> u64 {
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        #[cfg(target_os = "linux")]
        {
            if let Ok(content) = std::fs::read_to_string("/proc/uptime") {
                if let Some(uptime_str) = content.split_whitespace().next() {
                    if let Ok(uptime_f64) = uptime_str.parse::<f64>() {
                        return (uptime_f64 * 1000.0) as u64; // 초를 밀리초로 변환
                    }
                }
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            use std::mem;
            use std::ptr;
            
            unsafe {
                let mut boottime: libc::timeval = mem::zeroed();
                let mut size = mem::size_of::<libc::timeval>();
                
                let result = libc::sysctlbyname(
                    b"kern.boottime\0".as_ptr() as *const i8,
                    &mut boottime as *mut _ as *mut libc::c_void,
                    &mut size,
                    ptr::null_mut(),
                    0,
                );
                
                if result == 0 {
                    let now = libc::time(ptr::null_mut());
                    let uptime_seconds = now - boottime.tv_sec;
                    return (uptime_seconds * 1000) as u64; // 초를 밀리초로 변환
                }
            }
        }
    }
    
    0
}

fn get_load_average() -> Vec<f64> {
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        unsafe {
            let mut loadavg: [f64; 3] = std::mem::zeroed();
            let result = libc::getloadavg(loadavg.as_mut_ptr(), 3);
            
            if result > 0 {
                return loadavg[..result as usize].to_vec();
            }
        }
    }
    
    vec![]
}
