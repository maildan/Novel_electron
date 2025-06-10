const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 명령행 옵션 파싱
const isDebug = process.argv.includes('--debug');
const buildMode = isDebug ? 'debug' : 'release';
const forceRebuild = process.argv.includes('--rebuild');
const skipBuild = process.argv.includes('--skip-build');
const testOnly = process.argv.includes('--test');
const cleanOnly = process.argv.includes('--clean');
const statusOnly = process.argv.includes('--status');
const fixPermissionsFlag = process.argv.includes('--fix-permissions');
const verbose = process.argv.includes('--verbose');

// 메모리 최적화 설정
const MEMORY_OPTIMIZED = true;
const MAX_MEMORY_MB = 256;

console.log(`🔧 네이티브 모듈 통합 관리 시작 (${buildMode} 모드)`);

const projectRoot = path.resolve(__dirname, '..');
const nativeModulesPath = path.join(projectRoot, 'native-modules');
const targetPath = path.join(nativeModulesPath, 'target', buildMode);
const distPath = path.join(projectRoot, 'dist', 'native-modules');

// 플랫폼별 파일 이름 확인
const platform = process.platform;
const arch = process.arch;
let sourceFile, destFile, distDestFile;

if (platform === 'darwin') {
  // macOS
  sourceFile = path.join(targetPath, 'libtyping_stats_native.dylib');
  destFile = path.join(nativeModulesPath, 'typing-stats-native.darwin-arm64.node');
  distDestFile = path.join(distPath, 'typing-stats-native.darwin-arm64.node');
} else if (platform === 'win32') {
  // Windows
  sourceFile = path.join(targetPath, 'typing_stats_native.dll');
  destFile = path.join(nativeModulesPath, 'typing-stats-native.win32-x64-msvc.node');
  distDestFile = path.join(distPath, 'typing-stats-native.win32-x64-msvc.node');
} else {
  // Linux
  sourceFile = path.join(targetPath, 'libtyping_stats_native.so');
  destFile = path.join(nativeModulesPath, 'typing-stats-native.linux-x64-gnu.node');
  distDestFile = path.join(distPath, 'typing-stats-native.linux-x64-gnu.node');
}

console.log(`📋 플랫폼: ${platform}-${arch}`);
console.log(`📁 소스: ${path.relative(projectRoot, sourceFile)}`);
console.log(`📁 대상: ${path.relative(projectRoot, destFile)}`);
console.log(`📁 배포: ${path.relative(projectRoot, distDestFile)}`);

// 로깅 및 색상 출력 헬퍼
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(level, message, ...args) {
  const timestamp = new Date().toISOString().slice(11, 23);
  const levelColors = {
    'INFO': colors.green,
    'WARN': colors.yellow,
    'ERROR': colors.red,
    'DEBUG': colors.cyan,
    'SUCCESS': colors.bright + colors.green
  };
  const color = levelColors[level] || colors.white;
  const prefix = `${colors.blue}[${timestamp}]${colors.reset} ${color}${level}${colors.reset}`;
  console.log(`${prefix} ${message}`, ...args);
}

function info(message, ...args) { log('INFO', message, ...args); }
function warn(message, ...args) { log('WARN', message, ...args); }
function error(message, ...args) { log('ERROR', message, ...args); }
function debug(message, ...args) { if (verbose) log('DEBUG', message, ...args); }
function success(message, ...args) { log('SUCCESS', message, ...args); }

// 시스템 정보 수집
function getSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024),
    freeMemory: Math.round(os.freemem() / 1024 / 1024),
    uptime: Math.round(os.uptime()),
    hostname: os.hostname(),
    userInfo: os.userInfo()
  };
}

// 의존성 확인
function checkDependencies() {
  info('🔍 의존성 확인 중...');
  const required = [];
  
  try {
    execSync('rustc --version', { stdio: 'pipe' });
    success('✅ Rust 컴파일러 확인됨');
  } catch (e) {
    error('❌ Rust 컴파일러 없음');
    required.push({
      name: 'Rust',
      install: 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh',
      url: 'https://rustup.rs/'
    });
  }
  
  try {
    execSync('cargo --version', { stdio: 'pipe' });
    success('✅ Cargo 패키지 매니저 확인됨');
  } catch (e) {
    error('❌ Cargo 없음');
    required.push({
      name: 'Cargo',
      install: 'Rust와 함께 설치됨',
      url: 'https://rustup.rs/'
    });
  }

  try {
    execSync('node --version', { stdio: 'pipe' });
    success('✅ Node.js 확인됨');
  } catch (e) {
    error('❌ Node.js 없음');
    required.push({
      name: 'Node.js',
      install: 'brew install node (macOS) 또는 https://nodejs.org/',
      url: 'https://nodejs.org/'
    });
  }

  if (required.length > 0) {
    error('❌ 필수 의존성이 누락되었습니다:');
    required.forEach(dep => {
      error(`   - ${dep.name}: ${dep.install}`);
      error(`     URL: ${dep.url}`);
    });
    return false;
  }
  
  success('✅ 모든 의존성 확인 완료');
  return true;
}

// 환경 상태 진단
function diagnoseEnvironment() {
  info('🔍 환경 진단 시작...');
  
  const sysInfo = getSystemInfo();
  info(`📋 시스템 정보:`);
  info(`   - 플랫폼: ${sysInfo.platform}-${sysInfo.arch}`);
  info(`   - Node.js: ${sysInfo.nodeVersion}`);
  info(`   - CPU 코어: ${sysInfo.cpus}개`);
  info(`   - 메모리: ${sysInfo.freeMemory}MB/${sysInfo.totalMemory}MB`);
  info(`   - 호스트: ${sysInfo.hostname}`);
  info(`   - 사용자: ${sysInfo.userInfo.username}`);
  
  // 디스크 공간 확인
  try {
    const stats = fs.statSync(projectRoot);
    info(`✅ 프로젝트 디렉토리 액세스 가능`);
  } catch (e) {
    error(`❌ 프로젝트 디렉토리 액세스 실패: ${e.message}`);
    return false;
  }
  
  // 네이티브 모듈 디렉토리 확인
  if (!fs.existsSync(nativeModulesPath)) {
    error(`❌ 네이티브 모듈 디렉토리 없음: ${nativeModulesPath}`);
    return false;
  }
  
  // Cargo.toml 확인
  const cargoTomlPath = path.join(nativeModulesPath, 'Cargo.toml');
  if (!fs.existsSync(cargoTomlPath)) {
    error(`❌ Cargo.toml 없음: ${cargoTomlPath}`);
    return false;
  }
  
  success('✅ 환경 진단 완료');
  return true;
}

// 네이티브 모듈 정리
function cleanNativeModules() {
  info('🧹 네이티브 모듈 정리 중...');
  
  const cleanTargets = [
    path.join(nativeModulesPath, 'target'),
    path.join(nativeModulesPath, 'Cargo.lock'),
    destFile,
    distDestFile
  ];
  
  cleanTargets.forEach(target => {
    if (fs.existsSync(target)) {
      try {
        if (fs.lstatSync(target).isDirectory()) {
          fs.rmSync(target, { recursive: true, force: true });
        } else {
          fs.unlinkSync(target);
        }
        success(`✅ 삭제됨: ${path.relative(projectRoot, target)}`);
      } catch (e) {
        warn(`⚠️  삭제 실패: ${path.relative(projectRoot, target)} - ${e.message}`);
      }
    }
  });
  
  success('✅ 네이티브 모듈 정리 완료');
}

// 상세한 상태 확인
function checkDetailedStatus() {
  info('📊 상세 상태 확인 중...');
  
  const checks = [
    { 
      name: '소스 라이브러리', 
      path: sourceFile, 
      required: true,
      description: 'Rust로 빌드된 네이티브 라이브러리'
    },
    { 
      name: '개발용 모듈', 
      path: destFile, 
      required: true,
      description: 'Node.js에서 로드 가능한 네이티브 모듈'
    },
    { 
      name: '배포용 모듈', 
      path: distDestFile, 
      required: false,
      description: '프로덕션 배포용 네이티브 모듈'
    },
    { 
      name: 'Cargo.toml', 
      path: path.join(nativeModulesPath, 'Cargo.toml'), 
      required: true,
      description: 'Rust 프로젝트 설정 파일'
    },
    { 
      name: 'index.js', 
      path: path.join(nativeModulesPath, 'index.js'), 
      required: false,
      description: '네이티브 모듈 JavaScript 래퍼'
    }
  ];
  
  let allGood = true;
  
  checks.forEach(check => {
    if (fs.existsSync(check.path)) {
      const stats = fs.statSync(check.path);
      const size = stats.isFile() ? `${Math.round(stats.size / 1024)}KB` : 'DIR';
      const age = Math.round((Date.now() - stats.mtime.getTime()) / 1000 / 60);
      success(`✅ ${check.name}: ${size} (${age}분 전)`);
      debug(`   경로: ${check.path}`);
      debug(`   설명: ${check.description}`);
    } else {
      if (check.required) {
        error(`❌ ${check.name}: 필수 파일 없음`);
        allGood = false;
      } else {
        warn(`⚠️  ${check.name}: 선택적 파일 없음`);
      }
      debug(`   경로: ${check.path}`);
      debug(`   설명: ${check.description}`);
    }
  });
  
  return allGood;
}

// 함수들
function runCommand(command, description) {
  console.log(`⚡ ${description}...`);
  try {
    const output = execSync(command, { 
      cwd: nativeModulesPath, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} 완료`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 실패:`, error.message);
    return false;
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${description}: ${Math.round(stats.size / 1024)} KB`);
    return true;
  } else {
    console.log(`❌ ${description}: 파일 없음`);
    return false;
  }
}

function copyWithBackup(source, dest, description) {
  try {
    // 기존 파일이 있으면 백업
    if (fs.existsSync(dest)) {
      const backupFile = dest + `.backup.${Date.now()}`;
      fs.copyFileSync(dest, backupFile);
      console.log(`📄 기존 파일 백업: ${path.basename(backupFile)}`);
    }

    // 파일 복사
    fs.copyFileSync(source, dest);
    console.log(`✅ ${description} 복사 완료`);

    // 파일 권한 설정 (Unix 계열)
    if (platform !== 'win32') {
      fs.chmodSync(dest, 0o755);
      console.log(`🔒 ${description} 권한 설정 완료`);
    }

    return true;
  } catch (error) {
    console.error(`❌ ${description} 복사 실패:`, error.message);
    return false;
  }
}

function testNativeModule(modulePath) {
  console.log(`🧪 네이티브 모듈 테스트: ${path.relative(projectRoot, modulePath)}`);
  
  try {
    // 파일 타입 확인
    const { execSync } = require('child_process');
    const fileType = execSync(`file "${modulePath}"`, { encoding: 'utf8' }).trim();
    console.log(`📊 파일 타입: ${fileType}`);

    // Node.js 로드 테스트
    const testScript = `
      try {
        const mod = require('${modulePath}');
        const functions = Object.keys(mod);
        console.log('✅ 로드 성공, 함수 개수:', functions.length);
        console.log('🔧 주요 함수들:', functions.slice(0, 5).join(', '));
        
        // 간단한 함수 테스트
        if (mod.getNativeModuleVersion) {
          console.log('📦 모듈 버전:', mod.getNativeModuleVersion());
        }
        if (mod.isNativeModuleAvailable) {
          console.log('🟢 모듈 사용 가능:', mod.isNativeModuleAvailable());
        }
        
        process.exit(0);
      } catch(e) {
        console.log('❌ 로드 실패:', e.message);
        process.exit(1);
      }
    `;
    
    execSync(`node -e "${testScript}"`, { stdio: 'inherit' });
    console.log(`✅ 네이티브 모듈 테스트 통과`);
    return true;
    
  } catch (error) {
    console.error(`❌ 네이티브 모듈 테스트 실패:`, error.message);
    return false;
  }
}

// 플랫폼별 빌드 최적화
function getOptimizedBuildCommand() {
  const baseCommand = buildMode === 'release' ? 'cargo build --release' : 'cargo build';
  
  // 메모리 제한 최적화
  if (MEMORY_OPTIMIZED) {
    process.env.CARGO_BUILD_JOBS = '1'; // 단일 스레드 빌드로 메모리 절약
    process.env.RUSTFLAGS = '--codegen opt-level=s --codegen lto=thin'; // 크기 최적화
  }
  
  return baseCommand;
}

// 권한 수정 및 문제 해결
function fixPermissions() {
  info('🔒 권한 수정 시작...');
  
  const filesToFix = [destFile, distDestFile].filter(fs.existsSync);
  
  filesToFix.forEach(file => {
    try {
      if (platform !== 'win32') {
        fs.chmodSync(file, 0o755);
        success(`✅ 권한 수정: ${path.relative(projectRoot, file)}`);
      }
    } catch (e) {
      warn(`⚠️  권한 수정 실패: ${path.relative(projectRoot, file)} - ${e.message}`);
    }
  });
}

// 통합 빌드 프로세스
function buildNativeModule() {
  info('🔨 네이티브 모듈 빌드 시작...');
  
  // 빌드 전 환경 설정
  const originalEnv = { ...process.env };
  
  if (MEMORY_OPTIMIZED) {
    process.env.CARGO_BUILD_JOBS = '1';
    process.env.RUSTFLAGS = [
      '--codegen', 'opt-level=s',
      '--codegen', 'lto=thin',
      '--codegen', 'panic=abort'
    ].join(' ');
    info('📊 메모리 최적화 빌드 설정 적용');
  }
  
  try {
    const buildCommand = getOptimizedBuildCommand();
    info(`⚡ 빌드 명령: ${buildCommand}`);
    
    const startTime = Date.now();
    execSync(buildCommand, { 
      cwd: nativeModulesPath, 
      stdio: verbose ? 'inherit' : 'pipe',
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 // 10MB 버퍼
    });
    
    const buildTime = Math.round((Date.now() - startTime) / 1000);
    success(`✅ 빌드 완료 (${buildTime}초)`);
    
    return true;
  } catch (e) {
    error(`❌ 빌드 실패: ${e.message}`);
    return false;
  } finally {
    // 환경 변수 복원
    process.env = originalEnv;
  }
}

// 고급 네이티브 모듈 테스트
function performAdvancedTests(modulePath) {
  info('🧪 고급 테스트 시작...');
  
  const tests = [
    {
      name: '모듈 로드 테스트',
      code: `
        try {
          const mod = require('${modulePath}');
          console.log('SUCCESS: 모듈 로드됨');
          console.log('INFO: 내보낸 함수 개수:', Object.keys(mod).length);
          process.exit(0);
        } catch(e) {
          console.log('ERROR: 모듈 로드 실패 -', e.message);
          process.exit(1);
        }
      `
    },
    {
      name: '함수 호출 테스트',
      code: `
        try {
          const mod = require('${modulePath}');
          
          // 사용 가능한 함수들 확인
          const functions = Object.keys(mod);
          console.log('INFO: 사용 가능한 함수들:', functions.join(', '));
          
          // 기본 함수들 테스트
          if (mod.getNativeModuleVersion) {
            const version = mod.getNativeModuleVersion();
            console.log('SUCCESS: 버전 조회:', version);
          }
          
          if (mod.isNativeModuleAvailable) {
            const available = mod.isNativeModuleAvailable();
            console.log('SUCCESS: 모듈 사용 가능성:', available);
          }
          
          console.log('SUCCESS: 함수 호출 테스트 통과');
          process.exit(0);
        } catch(e) {
          console.log('ERROR: 함수 호출 테스트 실패 -', e.message);
          process.exit(1);
        }
      `
    },
    {
      name: '메모리 누수 테스트',
      code: `
        try {
          const mod = require('${modulePath}');
          const startMemory = process.memoryUsage().heapUsed;
          
          // 반복 호출로 메모리 누수 확인
          for (let i = 0; i < 100; i++) {
            if (mod.isNativeModuleAvailable) {
              mod.isNativeModuleAvailable();
            }
          }
          
          const endMemory = process.memoryUsage().heapUsed;
          const memoryDiff = (endMemory - startMemory) / 1024 / 1024;
          
          console.log('INFO: 메모리 사용량 변화:', memoryDiff.toFixed(2), 'MB');
          
          if (memoryDiff < 10) {
            console.log('SUCCESS: 메모리 누수 테스트 통과');
          } else {
            console.log('WARNING: 메모리 사용량 증가 감지');
          }
          
          process.exit(0);
        } catch(e) {
          console.log('ERROR: 메모리 테스트 실패 -', e.message);
          process.exit(1);
        }
      `
    }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    info(`🔧 ${test.name} 실행 중...`);
    
    try {
      const result = execSync(`node -e "${test.code}"`, { 
        encoding: 'utf8',
        timeout: 30000, // 30초 타임아웃
        maxBuffer: 1024 * 1024 // 1MB 버퍼
      });
      
      result.split('\n').forEach(line => {
        if (line.trim()) {
          if (line.startsWith('SUCCESS:')) {
            success(`✅ ${line.replace('SUCCESS: ', '')}`);
          } else if (line.startsWith('ERROR:')) {
            error(`❌ ${line.replace('ERROR: ', '')}`);
            allPassed = false;
          } else if (line.startsWith('WARNING:')) {
            warn(`⚠️  ${line.replace('WARNING: ', '')}`);
          } else if (line.startsWith('INFO:')) {
            info(`ℹ️  ${line.replace('INFO: ', '')}`);
          }
        }
      });
      
    } catch (e) {
      error(`❌ ${test.name} 실패: ${e.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// 메인 실행 로직
async function main() {
  try {
    info('🚀 네이티브 모듈 통합 관리 시작');
    
    const startTime = Date.now();
    
    // 명령행 옵션 표시
    if (verbose) {
      info('📋 실행 옵션:');
      info(`   - 빌드 모드: ${buildMode}`);
      info(`   - 강제 리빌드: ${forceRebuild}`);
      info(`   - 빌드 스킵: ${skipBuild}`);
      info(`   - 테스트만: ${testOnly}`);
      info(`   - 정리만: ${cleanOnly}`);
      info(`   - 상태만: ${statusOnly}`);
      info(`   - 권한 수정: ${fixPermissionsFlag}`);
      info(`   - 메모리 최적화: ${MEMORY_OPTIMIZED}`);
    }

    // 1. 환경 진단
    if (!diagnoseEnvironment()) {
      error('❌ 환경 진단 실패');
      process.exit(1);
    }

    // 2. 의존성 확인
    if (!checkDependencies()) {
      error('❌ 의존성 확인 실패');
      process.exit(1);
    }

    // 3. 정리 전용 모드
    if (cleanOnly) {
      cleanNativeModules();
      success('✅ 정리 완료');
      return;
    }

    // 4. 상태 확인 전용 모드
    if (statusOnly) {
      const status = checkDetailedStatus();
      if (status) {
        success('✅ 모든 파일 정상');
      } else {
        error('❌ 일부 파일 누락');
        process.exit(1);
      }
      return;
    }

    // 5. 권한 수정 전용 모드
    if (fixPermissionsFlag) {
      fixPermissions();
      success('✅ 권한 수정 완료');
      return;
    }

    // 6. 테스트 전용 모드
    if (testOnly) {
      info('🧪 테스트 전용 모드');
      if (fs.existsSync(destFile)) {
        const testResult = performAdvancedTests(destFile);
        if (testResult) {
          success('✅ 모든 테스트 통과');
        } else {
          error('❌ 일부 테스트 실패');
          process.exit(1);
        }
      } else {
        error('❌ 테스트할 네이티브 모듈이 없습니다.');
        process.exit(1);
      }
      return;
    }

    // 7. 빌드 프로세스
    const needsBuild = forceRebuild || !fs.existsSync(sourceFile);
    if (!skipBuild && needsBuild) {
      info('🔨 빌드 프로세스 시작');
      
      if (!buildNativeModule()) {
        error('❌ 빌드 실패');
        process.exit(1);
      }
    }

    // 8. 빌드 결과 확인
    if (!fs.existsSync(sourceFile)) {
      error(`❌ 빌드된 라이브러리를 찾을 수 없습니다: ${sourceFile}`);
      info('💡 다음 명령을 시도해보세요:');
      info(`   cd ${nativeModulesPath}`);
      info(`   ${getOptimizedBuildCommand()}`);
      process.exit(1);
    }

    // 9. 디렉토리 생성
    [path.dirname(destFile), distPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        info(`📁 디렉토리 생성: ${path.relative(projectRoot, dir)}`);
      }
    });

    // 10. 파일 복사
    info('📋 네이티브 모듈 복사 시작');
    
    if (!copyWithBackup(sourceFile, destFile, '개발용 네이티브 모듈')) {
      process.exit(1);
    }

    if (!copyWithBackup(sourceFile, distDestFile, '배포용 네이티브 모듈')) {
      process.exit(1);
    }

    // 11. 권한 설정
    fixPermissions();

    // 12. 고급 테스트
    info('🧪 고급 테스트 시작');
    if (!performAdvancedTests(destFile)) {
      error('❌ 고급 테스트 실패');
      process.exit(1);
    }

    // 13. 최종 상태 확인
    info('📊 최종 상태 확인');
    const finalStatus = checkDetailedStatus();
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    if (finalStatus) {
      success(`🎉 네이티브 모듈 통합 관리 완료 (${totalTime}초)`);
      info('💡 사용법:');
      info('  - yarn native --test           # 테스트만 실행');
      info('  - yarn native --rebuild        # 강제 리빌드');
      info('  - yarn native --debug          # 디버그 빌드');
      info('  - yarn native --skip-build     # 빌드 스킵');
      info('  - yarn native --clean          # 정리만');
      info('  - yarn native --status         # 상태 확인만');
      info('  - yarn native --fix-permissions # 권한 수정만');
      info('  - yarn native --verbose        # 상세 로그');
    } else {
      error('❌ 일부 파일이 누락되었습니다.');
      process.exit(1);
    }

  } catch (error) {
    error('❌ 네이티브 모듈 관리 실패');
    error(`오류: ${error.message}`);
    if (verbose) {
      error(`스택: ${error.stack}`);
    }
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}
