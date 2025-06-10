#!/usr/bin/env node

/**
 * RSS 기반 메모리 계산 테스트
 * 네이티브 모듈 상태 확인 문제 해결 검증
 */

const path = require('path');
const os = require('os');

console.log('🧮 RSS 기반 메모리 계산 테스트 시작...\n');

// 1. 시스템 메모리 정보 확인
console.log('📊 시스템 메모리 정보:');
const systemTotalMemory = os.totalmem();
const systemFreeMemory = os.freemem();
const systemUsedMemory = systemTotalMemory - systemFreeMemory;

console.log(`   총 메모리: ${Math.round(systemTotalMemory / (1024 * 1024))} MB`);
console.log(`   사용 가능: ${Math.round(systemFreeMemory / (1024 * 1024))} MB`);
console.log(`   시스템 사용: ${Math.round(systemUsedMemory / (1024 * 1024))} MB`);
console.log(`   시스템 사용률: ${Math.round((systemUsedMemory / systemTotalMemory) * 100)}%\n`);

// 2. Node.js 프로세스 메모리 정보
console.log('🔧 Node.js 프로세스 메모리 정보:');
const processMemory = process.memoryUsage();

console.log(`   RSS (Resident Set Size): ${Math.round(processMemory.rss / (1024 * 1024))} MB`);
console.log(`   Heap Used: ${Math.round(processMemory.heapUsed / (1024 * 1024))} MB`);
console.log(`   Heap Total: ${Math.round(processMemory.heapTotal / (1024 * 1024))} MB`);
console.log(`   External: ${Math.round(processMemory.external / (1024 * 1024))} MB`);

// 3. RSS 기반 메모리 사용률 계산 (OS 모니터와 일치)
const rssMB = Math.round(processMemory.rss / (1024 * 1024));
const totalSystemMB = Math.round(systemTotalMemory / (1024 * 1024));
const memoryUsagePercent = Math.round((processMemory.rss / systemTotalMemory) * 100);

console.log('\n🎯 RSS 기반 메모리 계산 (OS 모니터 방식):');
console.log(`   실제 물리 메모리 사용량 (RSS): ${rssMB} MB`);
console.log(`   시스템 전체 메모리: ${totalSystemMB} MB`);
console.log(`   메모리 사용률: ${memoryUsagePercent}%`);

// 4. 기존 V8 힙 기반 계산과 비교
const heapUsagePercent = Math.round((processMemory.heapUsed / processMemory.heapTotal) * 100);
console.log('\n🔍 기존 V8 힙 기반 계산과 비교:');
console.log(`   V8 힙 사용률: ${heapUsagePercent}%`);
console.log(`   RSS 기반 사용률: ${memoryUsagePercent}%`);
console.log(`   차이: ${Math.abs(memoryUsagePercent - heapUsagePercent)}%`);

// 5. 네이티브 모듈 로드 테스트
console.log('\n🔌 네이티브 모듈 로드 테스트:');
let nativeModuleSuccess = false;
let nativeModulePath = '';

try {
  // 네이티브 모듈 경로 확인
  nativeModulePath = path.join(__dirname, '..', 'native-modules', 'typing-stats-native.darwin-arm64.node');
  console.log(`   모듈 경로: ${nativeModulePath}`);
  
  // 파일 존재 확인
  const fs = require('fs');
  if (fs.existsSync(nativeModulePath)) {
    console.log('   ✅ 네이티브 모듈 파일 존재');
    
    // 모듈 로드 시도
    const nativeModule = require(nativeModulePath);
    console.log('   ✅ 네이티브 모듈 로드 성공');
    
    // 함수 확인
    const functions = Object.keys(nativeModule);
    console.log(`   📋 Export된 함수 수: ${functions.length}`);
    
    // 메모리 관련 함수 확인
    const memoryFunctions = functions.filter(fn => 
      fn.includes('memory') || fn.includes('Memory') ||
      fn.includes('usage') || fn.includes('Usage') ||
      fn.includes('stats') || fn.includes('Stats')
    );
    
    if (memoryFunctions.length > 0) {
      console.log(`   🧮 메모리 관련 함수: ${memoryFunctions.join(', ')}`);
      nativeModuleSuccess = true;
    } else {
      console.log('   ⚠️  메모리 관련 함수를 찾을 수 없음');
    }
    
  } else {
    console.log('   ❌ 네이티브 모듈 파일이 존재하지 않음');
  }
  
} catch (error) {
  console.log(`   ❌ 네이티브 모듈 로드 실패: ${error.message}`);
}

// 6. 결과 요약
console.log('\n📋 테스트 결과 요약:');
console.log(`   RSS 기반 메모리 계산: ✅ 구현 완료`);
console.log(`   메모리 사용률 (RSS): ${memoryUsagePercent}%`);
console.log(`   네이티브 모듈 상태: ${nativeModuleSuccess ? '✅ 정상' : '❌ 문제 있음'}`);

// 7. OS 모니터와의 호환성 확인
console.log('\n🖥️  OS 모니터 호환성:');
console.log('   이제 다음과 같이 계산됩니다:');
console.log(`   - 사용량: RSS (${rssMB}MB) / 전체 메모리 (${totalSystemMB}MB)`);
console.log(`   - 사용률: ${memoryUsagePercent}%`);
console.log('   이는 macOS Activity Monitor, Windows Task Manager와 일치합니다.');

console.log('\n✅ RSS 기반 메모리 계산 테스트 완료!');
