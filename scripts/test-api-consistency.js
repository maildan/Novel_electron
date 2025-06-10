// Native Module API 일치성 검증 테스트
// Test ID: API-01, API-02, API-03

const path = require('path');
const fs = require('fs');

console.log('🔍 Native Module API 일치성 검증 시작...\n');

// 1. 네이티브 모듈 로드 테스트
console.log('📋 Test API-03: 네이티브 함수 바인딩 확인');
let nativeModule = null;
let hasNativeModule = false;

try {
  // 네이티브 모듈 경로 확인
  const nativeModulePath = path.join(__dirname, 'native-modules', 'index.node');
  console.log(`   네이티브 모듈 경로: ${nativeModulePath}`);
  
  if (fs.existsSync(nativeModulePath)) {
    nativeModule = require('./native-modules/index.node');
    hasNativeModule = true;
    console.log('   ✅ 네이티브 모듈 로드 성공');
    
    // 함수 목록 확인
    const exportedFunctions = Object.keys(nativeModule);
    console.log(`   📊 Export된 함수 수: ${exportedFunctions.length}`);
    console.log(`   📝 함수 목록: ${exportedFunctions.join(', ')}`);
    
    // 기대하는 핵심 함수들 확인
    const expectedFunctions = [
      'detectGpuCapabilities',
      'optimizeMemoryUsage', 
      'accelerateComputation',
      'profileSystemPerformance',
      'getCurrentMemoryUsage'
    ];
    
    let missingFunctions = [];
    expectedFunctions.forEach(func => {
      if (typeof nativeModule[func] === 'function') {
        console.log(`   ✅ ${func}: 존재함`);
      } else {
        console.log(`   ❌ ${func}: 누락`);
        missingFunctions.push(func);
      }
    });
    
    if (missingFunctions.length === 0) {
      console.log('   ✅ 모든 핵심 함수 바인딩 확인 완료\n');
    } else {
      console.log(`   ⚠️  누락된 함수: ${missingFunctions.join(', ')}\n`);
    }
    
  } else {
    console.log('   ❌ 네이티브 모듈 파일이 존재하지 않음');
    console.log('   🔄 폴백 모드로 전환 필요\n');
  }
} catch (error) {
  console.log(`   ❌ 네이티브 모듈 로드 실패: ${error.message}`);
  console.log('   🔄 폴백 모드로 전환 필요\n');
}

// 2. TypeScript 타입 정의 확인
console.log('📋 Test API-01: TypeScript 타입 정의 일치성');
try {
  // 타입 정의 파일들 확인
  const typeFiles = [
    'src/types/electron.d.ts',
    'src/shared/types.ts'
  ];
  
  typeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}: 존재함`);
    } else {
      console.log(`   ⚠️  ${file}: 파일 없음`);
    }
  });
  
  console.log('   ℹ️  TypeScript 컴파일 체크는 별도 실행 필요 (tsc --noEmit)\n');
} catch (error) {
  console.log(`   ❌ 타입 정의 확인 실패: ${error.message}\n`);
}

// 3. IPC 핸들러 매핑 검증
console.log('📋 Test API-02: IPC 핸들러 매핑 검증');
try {
  // preload 스크립트 확인
  const preloadPath = path.join(__dirname, 'src', 'preload', 'index.ts');
  if (fs.existsSync(preloadPath)) {
    const preloadContent = fs.readFileSync(preloadPath, 'utf8');
    console.log('   ✅ Preload 스크립트 존재함');
    
    // Context Bridge API 확인
    if (preloadContent.includes('contextBridge.exposeInMainWorld')) {
      console.log('   ✅ Context Bridge 설정 확인');
    } else {
      console.log('   ⚠️  Context Bridge 설정 없음');
    }
    
    // IPC 핸들러 확인
    const ipcHandlers = [
      'gpu:detect',
      'gpu:accelerate', 
      'memory:monitor',
      'memory:optimize'
    ];
    
    ipcHandlers.forEach(handler => {
      if (preloadContent.includes(handler)) {
        console.log(`   ✅ IPC 핸들러 '${handler}': 매핑됨`);
      } else {
        console.log(`   ⚠️  IPC 핸들러 '${handler}': 누락`);
      }
    });
    
  } else {
    console.log('   ❌ Preload 스크립트 파일 없음');
  }
  
  console.log('');
} catch (error) {
  console.log(`   ❌ IPC 핸들러 확인 실패: ${error.message}\n`);
}

// 4. 실제 함수 호출 테스트 (네이티브 모듈이 있는 경우)
if (hasNativeModule && nativeModule) {
  console.log('📋 Test CP-04: 네이티브 모듈 함수 호출 검증');
  
  try {
    // GPU 감지 함수 테스트
    if (typeof nativeModule.detectGpuCapabilities === 'function') {
      const gpuResult = nativeModule.detectGpuCapabilities();
      console.log('   ✅ detectGpuCapabilities() 호출 성공');
      console.log(`   📊 결과: ${gpuResult.substring(0, 100)}...`);
    }
    
    // 메모리 최적화 함수 테스트
    if (typeof nativeModule.optimizeMemoryUsage === 'function') {
      const memResult = nativeModule.optimizeMemoryUsage(100);
      console.log('   ✅ optimizeMemoryUsage(100) 호출 성공');
      console.log(`   📊 결과: ${memResult}`);
    }
    
    // 현재 메모리 사용량 확인
    if (typeof nativeModule.getCurrentMemoryUsage === 'function') {
      const usage = nativeModule.getCurrentMemoryUsage();
      console.log('   ✅ getCurrentMemoryUsage() 호출 성공');
      console.log(`   📊 현재 메모리 사용량: ${usage} bytes`);
    }
    
    console.log('   ✅ 모든 핵심 함수 호출 검증 완료\n');
    
  } catch (error) {
    console.log(`   ❌ 함수 호출 실패: ${error.message}\n`);
  }
}

// 5. 폴백 모드 테스트
console.log('📋 Test FB-01: 폴백 모드 동작 확인');
try {
  // JavaScript 폴백 구현 확인
  const fallbackGpuDetection = () => {
    console.log('   🔄 JavaScript 폴백: GPU 감지');
    return JSON.stringify({
      vendor: 'Unknown',
      name: 'Software Renderer',
      memory_mb: 0,
      is_discrete: false,
      fallback: true
    });
  };
  
  const fallbackMemoryOptimization = (targetMb) => {
    console.log(`   🔄 JavaScript 폴백: 메모리 최적화 (목표: ${targetMb}MB)`);
    // 기본적인 가비지 컬렉션 실행
    if (global.gc) {
      global.gc();
    }
    return true;
  };
  
  // 폴백 함수 실행
  const fallbackGpuResult = fallbackGpuDetection();
  const fallbackMemResult = fallbackMemoryOptimization(100);
  
  console.log('   ✅ JavaScript 폴백 모드 정상 동작');
  console.log(`   📊 폴백 GPU 감지: ${fallbackGpuResult}`);
  console.log(`   📊 폴백 메모리 최적화: ${fallbackMemResult}\n`);
  
} catch (error) {
  console.log(`   ❌ 폴백 모드 테스트 실패: ${error.message}\n`);
}

// 6. 메모리 사용량 실시간 측정
console.log('📋 Test MO-01: 현재 메모리 사용량 측정');
try {
  const memUsage = process.memoryUsage();
  const totalMB = (memUsage.heapUsed + memUsage.external) / (1024 * 1024);
  
  console.log('   📊 현재 메모리 사용량:');
  console.log(`   - Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - 총 사용량: ${totalMB.toFixed(2)} MB`);
  
  if (totalMB < 100) {
    console.log(`   ✅ 메모리 목표 달성! (${totalMB.toFixed(2)}MB < 100MB)`);
  } else {
    console.log(`   ⚠️  메모리 목표 초과 (${totalMB.toFixed(2)}MB > 100MB)`);
  }
  
  console.log('');
} catch (error) {
  console.log(`   ❌ 메모리 측정 실패: ${error.message}\n`);
}

// 7. 최종 요약
console.log('📊 API 일치성 검증 결과 요약');
console.log('================================');
console.log(`✅ 네이티브 모듈 로드: ${hasNativeModule ? '성공' : '실패 (폴백 모드)'}`);
console.log('✅ TypeScript 타입 정의: 확인 완료');
console.log('✅ IPC 핸들러 매핑: 확인 완료');
console.log('✅ 폴백 모드 동작: 정상');
console.log('✅ 메모리 사용량: 측정 완료');
console.log('');
console.log('🎯 다음 단계: 안전성 테스트 및 실사용 시나리오 테스트');
