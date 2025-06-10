#!/usr/bin/env node

// GPU 가속화 네이티브 모듈 테스트
// 100MB 메모리 목표 달성을 위한 고급 GPU 가속화 시스템 테스트

const path = require('path');

async function testGpuAcceleration() {
    console.log('🚀 GPU 가속화 테스트 시작...\n');
    
    try {
        // 네이티브 모듈 로드
        console.log('📦 네이티브 모듈 로드 중...');
        const nativeModule = require('./native-modules/typing-stats-native.darwin-arm64.node');
        console.log('✅ 네이티브 모듈 로드 성공\n');
        
        // 사용 가능한 함수 목록 확인
        console.log('🔧 사용 가능한 함수들:');
        console.log(Object.keys(nativeModule));
        console.log('');
        
        // GPU 정보 확인
        console.log('🔍 GPU 정보 확인 중...');
        const gpuInfo = nativeModule.getGpuInfo();
        console.log('GPU 정보:', JSON.stringify(gpuInfo, null, 2));
        console.log('');
        
        // 메모리 상태 확인
        console.log('💾 메모리 상태 확인 중...');
        const memoryStats = nativeModule.getGpuMemoryStats();
        console.log('메모리 상태:', JSON.stringify(memoryStats, null, 2));
        console.log('');
        
        // GPU 가속화 실행
        console.log('⚡ GPU 가속화 실행 중...');
        const accelerationResult = nativeModule.runGpuAcceleration("test-data");
        console.log('가속화 결과:', JSON.stringify(accelerationResult, null, 2));
        console.log('');
        
        // 고급 메모리 최적화 실행
        console.log('🧠 고급 메모리 최적화 실행 중...');
        const optimizationResult = nativeModule.optimizeMemoryAdvanced();
        console.log('최적화 결과:', JSON.stringify(optimizationResult, null, 2));
        console.log('');
        
        // 벤치마크 실행
        console.log('📊 GPU 벤치마크 실행 중...');
        const benchmarkResult = nativeModule.runGpuBenchmark();
        console.log('벤치마크 결과:', JSON.stringify(benchmarkResult, null, 2));
        console.log('');
        
        // 메모리 정리
        console.log('🧹 메모리 정리 실행 중...');
        const cleanupResult = nativeModule.cleanupMemory();
        console.log('정리 결과:', JSON.stringify(cleanupResult, null, 2));
        console.log('');
        
        // 최종 메모리 상태 확인
        console.log('📈 최종 메모리 상태 확인 중...');
        const finalMemoryStats = nativeModule.getGpuMemoryStats();
        console.log('최종 메모리 상태:', JSON.stringify(finalMemoryStats, null, 2));
        
        console.log('\n✅ 모든 테스트 완료!');
        
        // 100MB 목표 달성 여부 확인
        const currentMemoryMB = finalMemoryStats.appMemoryMb;
        if (currentMemoryMB <= 100) {
            console.log(`🎯 목표 달성! 현재 메모리 사용량: ${currentMemoryMB.toFixed(2)}MB (목표: 100MB)`);
        } else {
            console.log(`⚠️  목표 미달성. 현재 메모리 사용량: ${currentMemoryMB.toFixed(2)}MB (목표: 100MB)`);
        }
        
    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error);
        console.error('스택 트레이스:', error.stack);
        
        // 더 자세한 오류 정보
        if (error.code) {
            console.error('오류 코드:', error.code);
        }
        if (error.path) {
            console.error('오류 경로:', error.path);
        }
    }
}

// 메인 실행
if (require.main === module) {
    testGpuAcceleration();
}

module.exports = { testGpuAcceleration };
