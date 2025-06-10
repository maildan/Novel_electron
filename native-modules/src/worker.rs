use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkerTask {
    pub id: String,
    pub task_type: String,
    pub payload: String,
    pub priority: u8,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub status: String, // "pending", "running", "completed", "failed"
    pub result: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct WorkerStats {
    pub total_workers: u32,
    pub active_workers: u32,
    pub idle_workers: u32,
    pub pending_tasks: u32,
    pub completed_tasks: u32,
    pub failed_tasks: u32,
    pub total_processed: u32,
    pub average_task_duration_ms: f64,
    pub queue_size: u32,
    pub uptime_ms: String,
}

static mut WORKER_POOL: Option<Arc<Mutex<WorkerPool>>> = None;

struct WorkerPool {
    workers: Vec<Worker>,
    task_queue: VecDeque<WorkerTask>,
    completed_tasks: Vec<WorkerTask>,
    #[allow(dead_code)]
    max_workers: usize,
    start_time: Instant,
}

struct Worker {
    #[allow(dead_code)]
    id: usize,
    is_active: bool,
    current_task: Option<WorkerTask>,
    tasks_completed: u32,
}

impl WorkerPool {
    fn new(max_workers: usize) -> Self {
        let mut workers = Vec::new();
        for i in 0..max_workers {
            workers.push(Worker {
                id: i,
                is_active: false,
                current_task: None,
                tasks_completed: 0,
            });
        }

        Self {
            workers,
            task_queue: VecDeque::new(),
            completed_tasks: Vec::new(),
            max_workers,
            start_time: Instant::now(),
        }
    }

    fn add_task(&mut self, task: WorkerTask) {
        self.task_queue.push_back(task);
        self.process_queue();
    }

    fn process_queue(&mut self) {
        // 처리할 작업들을 먼저 수집
        let mut tasks_to_process = Vec::new();
        let mut worker_ids = Vec::new();
        
        // 유휴 워커와 작업 쌍 찾기
        for (i, worker) in self.workers.iter().enumerate() {
            if !worker.is_active && !self.task_queue.is_empty() {
                if let Some(mut task) = self.task_queue.pop_front() {
                    task.status = "running".to_string();
                    task.started_at = Some(
                        std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_millis()
                            .to_string(),
                    );
                    
                    tasks_to_process.push(task);
                    worker_ids.push(i);
                }
            }
        }
        
        // 수집된 작업들을 처리
        for (task, worker_id) in tasks_to_process.into_iter().zip(worker_ids.into_iter()) {
            let mut completed_task = task.clone();
            self.simulate_task_completion(&mut completed_task);
            
            // 워커 상태 업데이트
            if let Some(worker) = self.workers.get_mut(worker_id) {
                worker.is_active = true;
                worker.current_task = Some(task.clone());
            }
            
            // 작업 완료 처리
            self.complete_task_internal(worker_id, completed_task);
        }
    }

    fn simulate_task_completion(&self, task: &mut WorkerTask) {
        // 실제 구현에서는 작업 유형에 따라 다른 처리 로직 사용
        match task.task_type.as_str() {
            "cpu_intensive" => {
                task.result = Some("CPU intensive task completed".to_string());
            }
            "io_operation" => {
                task.result = Some("IO operation completed".to_string());
            }
            "data_processing" => {
                task.result = Some("Data processing completed".to_string());
            }
            _ => {
                task.result = Some("Generic task completed".to_string());
            }
        }
        
        task.status = "completed".to_string();
        task.completed_at = Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
                .to_string(),
        );
    }

    fn complete_task_internal(&mut self, worker_id: usize, task: WorkerTask) {
        if let Some(worker) = self.workers.get_mut(worker_id) {
            worker.is_active = false;
            worker.current_task = None;
            worker.tasks_completed += 1;
        }
        
        self.completed_tasks.push(task);
    }

    #[allow(dead_code)]
    fn complete_task(&mut self, worker_id: usize, task: WorkerTask) {
        if let Some(worker) = self.workers.get_mut(worker_id) {
            worker.is_active = false;
            worker.current_task = None;
            worker.tasks_completed += 1;
        }
        
        self.completed_tasks.push(task);
        
        // 오래된 완료된 작업 정리 (최대 1000개 유지)
        if self.completed_tasks.len() > 1000 {
            self.completed_tasks.remove(0);
        }
        
        // 큐에 대기 중인 작업이 있으면 계속 처리
        if !self.task_queue.is_empty() {
            self.process_queue();
        }
    }

    fn get_stats(&self) -> WorkerStats {
        let active_workers = self.workers.iter().filter(|w| w.is_active).count() as u32;
        let idle_workers = (self.workers.len() as u32) - active_workers;
        let pending_tasks = self.task_queue.len() as u32;
        let completed_tasks = self.completed_tasks.len() as u32;
        let failed_tasks = self.completed_tasks.iter()
            .filter(|t| t.status == "failed")
            .count() as u32;
        let total_processed = self.workers.iter()
            .map(|w| w.tasks_completed)
            .sum::<u32>();

        // 평균 작업 시간 계산
        let mut total_duration = 0f64;
        let mut duration_count = 0;
        for task in &self.completed_tasks {
            if let (Some(started), Some(completed)) = (&task.started_at, &task.completed_at) {
                if let (Ok(started_ms), Ok(completed_ms)) = (started.parse::<u64>(), completed.parse::<u64>()) {
                    total_duration += (completed_ms - started_ms) as f64;
                    duration_count += 1;
                }
            }
        }
        
        let average_duration = if duration_count > 0 {
            total_duration / duration_count as f64
        } else {
            0.0
        };

        let uptime = self.start_time.elapsed().as_millis().to_string();

        WorkerStats {
            total_workers: self.workers.len() as u32,
            active_workers,
            idle_workers,
            pending_tasks,
            completed_tasks,
            failed_tasks,
            total_processed,
            average_task_duration_ms: average_duration,
            queue_size: self.task_queue.len() as u32,
            uptime_ms: uptime,
        }
    }

    fn get_task_by_id(&self, task_id: &str) -> Option<WorkerTask> {
        // 실행 중인 작업 확인
        for worker in &self.workers {
            if let Some(ref task) = worker.current_task {
                if task.id == task_id {
                    return Some(task.clone());
                }
            }
        }

        // 대기 중인 작업 확인
        for task in &self.task_queue {
            if task.id == task_id {
                return Some(task.clone());
            }
        }

        // 완료된 작업 확인
        for task in &self.completed_tasks {
            if task.id == task_id {
                return Some(task.clone());
            }
        }

        None
    }
}

/// 워커 풀 초기화
pub fn initialize_worker_pool() {
    let cpu_count = num_cpus::get();
    let max_workers = (cpu_count * 2).max(4); // 최소 4개 워커

    unsafe {
        WORKER_POOL = Some(Arc::new(Mutex::new(WorkerPool::new(max_workers))));
    }
}

/// 워커 풀 정리
pub fn cleanup_worker_pool() {
    unsafe {
        WORKER_POOL = None;
    }
}

/// 작업 추가
#[napi]
pub fn add_worker_task(
    id: String,
    task_type: String,
    payload: String,
    priority: Option<u8>,
) -> bool {
    let priority = priority.unwrap_or(5); // 기본 우선순위
    let created_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .to_string();

    let task = WorkerTask {
        id,
        task_type,
        payload,
        priority,
        created_at,
        started_at: None,
        completed_at: None,
        status: "pending".to_string(),
        result: None,
        error: None,
    };

    unsafe {
        if let Some(pool) = &*std::ptr::addr_of!(WORKER_POOL) {
            if let Ok(mut guard) = pool.lock() {
                guard.add_task(task);
                return true;
            }
        }
    }
    false
}

/// 작업 상태 조회
#[napi]
pub fn get_worker_task_status(task_id: String) -> Option<WorkerTask> {
    unsafe {
        if let Some(pool) = &*std::ptr::addr_of!(WORKER_POOL) {
            if let Ok(guard) = pool.lock() {
                return guard.get_task_by_id(&task_id);
            }
        }
    }
    None
}

/// 워커 풀 통계
#[napi]
pub fn get_worker_stats() -> Option<WorkerStats> {
    unsafe {
        if let Some(pool) = &*std::ptr::addr_of!(WORKER_POOL) {
            if let Ok(guard) = pool.lock() {
                return Some(guard.get_stats());
            }
        }
    }
    None
}

/// 대기 중인 작업 수
#[napi]
pub fn get_pending_task_count() -> u32 {
    unsafe {
        if let Some(pool) = &*std::ptr::addr_of!(WORKER_POOL) {
            if let Ok(guard) = pool.lock() {
                return guard.task_queue.len() as u32;
            }
        }
    }
    0
}

/// 워커 풀 상태 리셋
#[napi]
pub fn reset_worker_pool() -> bool {
    unsafe {
        if let Some(pool) = &*std::ptr::addr_of!(WORKER_POOL) {
            if let Ok(mut guard) = pool.lock() {
                guard.task_queue.clear();
                guard.completed_tasks.clear();
                guard.start_time = Instant::now();
                
                // 모든 워커를 유휴 상태로 변경
                for worker in &mut guard.workers {
                    worker.is_active = false;
                    worker.current_task = None;
                    worker.tasks_completed = 0;
                }
                return true;
            }
        }
    }
    false
}

/// CPU 집약적 작업 실행
#[napi]
pub fn execute_cpu_task(data: String) -> String {
    // 간단한 CPU 집약적 작업 시뮬레이션
    let mut result = 0u64;
    for i in 0..1000000 {
        result = result.wrapping_add(i * i);
    }
    
    format!("CPU task completed with data: {} (result: {})", data, result)
}

/// 병렬 데이터 처리
#[napi]
pub fn process_data_parallel(data_chunks: Vec<String>) -> Vec<String> {
    // 간단한 병렬 처리 시뮬레이션
    data_chunks
        .into_iter()
        .map(|chunk| format!("Processed: {}", chunk.to_uppercase()))
        .collect()
}
