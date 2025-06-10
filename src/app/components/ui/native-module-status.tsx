'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { CheckCircle, XCircle, AlertCircle, Cpu, Activity, Settings } from 'lucide-react';

interface NativeModuleInfo {
  uiohook: {
    available: boolean;
    version: string;
    initialized: boolean;
    loadError?: string | null;
    fallbackMode?: boolean;
    features?: {
      keyboardHook: boolean;
      mouseHook: boolean;
      globalEvents: boolean;
    };
  };
  system: {
    platform: string;
    arch: string;
    node: string;
    electron?: string;
    chrome?: string;
    hostname?: string;
    uptime?: number;
    cpuCount?: number;
    cpuModel?: string;
    loadAverage?: {
      '1min': number;
      '5min': number;
      '15min': number;
    };
    memory?: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
  };
  permissions: {
    accessibility: boolean;
    input: boolean;
    screenRecording?: boolean | null;
    microphone?: boolean | null;
    camera?: boolean | null;
  };
  performance?: {
    processUptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    resourceUsage?: NodeJS.ResourceUsage | null;
    pid: number;
    ppid?: number | null;
  };
  environment?: {
    nodeEnv: string;
    isDev: boolean;
    userAgent: string;
    workingDirectory: string;
  };
}

export default function NativeModuleStatus() {
  const [moduleInfo, setModuleInfo] = useState<NativeModuleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setBrowserFallback = () => {
    setModuleInfo({
      uiohook: {
        available: false,
        version: '브라우저 환경',
        initialized: false,
        loadError: '브라우저 환경에서는 네이티브 모듈을 사용할 수 없습니다',
        fallbackMode: true,
        features: {
          keyboardHook: false,
          mouseHook: false,
          globalEvents: false
        }
      },
      system: {
        platform: navigator.platform,
        arch: '브라우저',
        node: '브라우저 환경',
        electron: '브라우저 환경',
        chrome: navigator.userAgent,
        hostname: 'localhost',
        uptime: 0,
        cpuCount: navigator.hardwareConcurrency || 1,
        cpuModel: '알 수 없음',
        loadAverage: { '1min': 0, '5min': 0, '15min': 0 },
        memory: { total: 0, free: 0, used: 0, percentage: 0 }
      },
      permissions: {
        accessibility: false,
        input: false,
        screenRecording: null,
        microphone: null,
        camera: null
      },
      performance: {
        processUptime: 0,
        memoryUsage: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
        resourceUsage: null,
        pid: 0,
        ppid: null
      },
      environment: {
        nodeEnv: 'browser',
        isDev: false,
        userAgent: navigator.userAgent,
        workingDirectory: '브라우저 환경'
      }
    });
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔧 Native Module Status: 상태 조회 시작');
        
        // 더 세밀한 Electron API 확인
        if (typeof window === 'undefined') {
          console.warn('❌ Window 객체가 없음 - 서버 사이드 렌더링 중일 수 있음');
          setBrowserFallback();
          return;
        }

        // Electron API가 로드될 때까지 잠깐 대기 (최대 3초)
        let electronAPI = window.electronAPI;
        let waitAttempts = 0;
        const maxWaitAttempts = 30; // 3초 (100ms * 30)
        
        while (!electronAPI && waitAttempts < maxWaitAttempts) {
          console.log(`⏳ Electron API 로드 대기 중... (${waitAttempts + 1}/${maxWaitAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          electronAPI = window.electronAPI;
          waitAttempts++;
        }

        if (!electronAPI) {
          console.warn('❌ window.electronAPI가 없음 - 브라우저 환경이거나 preload 스크립트 로드 실패');
          setBrowserFallback();
          return;
        }

        console.log('✅ Electron API 발견됨, 최상위 키들:', Object.keys(electronAPI));

        // Native API 그룹 확인 (최상위 native 모듈 확인)
        let nativeAPI: any = null;
        let nativeAPIPath = '';
        
        if (electronAPI.native) {
          nativeAPI = electronAPI.native;
          nativeAPIPath = 'window.electronAPI.native';
          console.log('✅ 최상위 Native API 발견됨');
        } else if (electronAPI.system?.native) {
          nativeAPI = electronAPI.system.native;
          nativeAPIPath = 'window.electronAPI.system.native';
          console.log('✅ System.Native API 발견됨');
        } else {
          console.warn('❌ Native API를 찾을 수 없음 - 최상위와 system 하위 모두 확인했지만 없음');
          setBrowserFallback();
          return;
        }

        console.log(`✅ Native API 사용 경로: ${nativeAPIPath}`);
        console.log('✅ Native API 함수들:', Object.keys(nativeAPI));

        // 안전한 함수 호출을 위한 헬퍼 함수
        const safeCall = async (funcName: string, ...args: any[]) => {
          try {
            if (typeof nativeAPI[funcName] === 'function') {
              return await nativeAPI[funcName](...args);
            } else {
              console.warn(`⚠️ ${funcName} 함수가 없음 - 타입:`, typeof nativeAPI[funcName]);
              return null;
            }
          } catch (error) {
            console.error(`❌ ${funcName} 호출 실패:`, error);
            return null;
          }
        };

        console.log('✅ 안전한 함수 호출 시스템 준비됨');
        
        // 네이티브 모듈 정보 조회
        let nativeInfo = null;
        try {
          console.log('🔧 네이티브 모듈 정보 조회 중...');
          
          // 네이티브 모듈 사용 가능 여부
          const availableResult = await safeCall('isNativeModuleAvailable');
          console.log('🔍 네이티브 모듈 사용 가능 여부:', availableResult);
          
          // 네이티브 모듈 버전
          const versionResult = await safeCall('getNativeModuleVersion');
          console.log('📋 네이티브 모듈 버전:', versionResult);

          // 네이티브 모듈 상세 정보
          const infoResult = await safeCall('getNativeModuleInfo');
          console.log('📄 네이티브 모듈 상세 정보:', infoResult);
          
          nativeInfo = {
            available: availableResult?.success ? Boolean(availableResult.data) : false,
            version: versionResult?.success ? String(versionResult.data || '알 수 없음') : '알 수 없음',
            info: infoResult?.success ? infoResult.data : null,
            errors: [
              availableResult?.error,
              versionResult?.error, 
              infoResult?.error
            ].filter(Boolean)
          };
          
        } catch (nativeError) {
          console.error('❌ 네이티브 모듈 정보 조회 실패:', nativeError);
          nativeInfo = {
            available: false,
            version: '오류',
            info: null,
            errors: [String(nativeError)]
          };
        }

        // 시스템 정보 조회 - 더 안전하게
        const systemInfo = {
          platform: typeof navigator !== 'undefined' ? navigator.platform : '알 수 없음',
          arch: '알 수 없음',
          node: '알 수 없음',
          electron: '알 수 없음',
          chrome: typeof navigator !== 'undefined' ? navigator.userAgent : '알 수 없음',
          hostname: 'localhost',
          uptime: 0,
          cpuCount: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 1) : 1,
          cpuModel: '알 수 없음',
          loadAverage: { '1min': 0, '5min': 0, '15min': 0 },
          memory: { total: 0, free: 0, used: 0, percentage: 0 }
        };

        // 시스템 정보 API 호출 시도 (존재하는 경우만)
        try {
          if (electronAPI?.system?.getInfo && typeof electronAPI.system.getInfo === 'function') {
            const sysInfoResult = await electronAPI.system.getInfo();
            if (sysInfoResult?.success && sysInfoResult.data) {
              console.log('✅ 시스템 정보 조회 성공:', sysInfoResult.data);
              Object.assign(systemInfo, sysInfoResult.data);
            }
          }
        } catch (sysError) {
          console.warn('⚠️ 시스템 정보 조회 실패:', sysError);
        }

        // 권한 정보 (기본값)
        const permissionInfo = {
          accessibility: false,
          input: false,
          screenRecording: null,
          microphone: null,
          camera: null
        };

        // 종합 데이터 구성
        const moduleData: NativeModuleInfo = {
          uiohook: {
            available: nativeInfo?.available || false,
            version: nativeInfo?.version || '알 수 없음',
            initialized: nativeInfo?.available || false,
            loadError: nativeInfo?.errors?.join(', ') || null,
            fallbackMode: !nativeInfo?.available,
            features: {
              keyboardHook: nativeInfo?.available || false,
              mouseHook: nativeInfo?.available || false,
              globalEvents: nativeInfo?.available || false
            }
          },
          system: systemInfo,
          permissions: permissionInfo,
          performance: {
            processUptime: 0,
            memoryUsage: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
            resourceUsage: null,
            pid: 0,
            ppid: null
          },
          environment: {
            nodeEnv: 'unknown',
            isDev: false,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '알 수 없음',
            workingDirectory: '알 수 없음'
          }
        };

        console.log('✅ 최종 모듈 정보:', moduleData);
        setModuleInfo(moduleData);
        
      } catch (err) {
        console.error('❌ 네이티브 모듈 상태 확인 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // 주기적으로 상태 업데이트 (10초마다)
    const interval = setInterval(fetchStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (available: boolean, label: string) => {
    return (
      <Badge variant={available ? "default" : "destructive"}>
        {available ? label : `${label} 비활성`}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            네이티브 모듈 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">상태 확인 중...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            네이티브 모듈 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!moduleInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-500" />
            네이티브 모듈 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              네이티브 모듈 정보를 가져올 수 없습니다
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          네이티브 모듈 상태
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* uiohook 상태 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">uiohook (키보드 후킹)</span>
            {getStatusIcon(moduleInfo?.uiohook?.available || false)}
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>버전:</span>
              <span className="text-muted-foreground">{moduleInfo?.uiohook?.version || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>초기화:</span>
              {getStatusBadge(moduleInfo?.uiohook?.initialized || false, '완료')}
            </div>
            {moduleInfo?.uiohook?.fallbackMode && (
              <div className="flex items-center justify-between text-xs">
                <span>폴백 모드:</span>
                <Badge variant="secondary">활성</Badge>
              </div>
            )}
            {moduleInfo?.uiohook?.loadError && (
              <div className="text-xs text-red-500 mt-1">
                오류: {moduleInfo.uiohook.loadError}
              </div>
            )}
            {moduleInfo?.uiohook?.features && (
              <div className="space-y-1 mt-2">
                <div className="text-xs font-medium">기능:</div>
                <div className="flex items-center justify-between text-xs">
                  <span>키보드 후킹:</span>
                  {getStatusBadge(moduleInfo.uiohook.features?.keyboardHook || false, '지원')}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>마우스 후킹:</span>
                  {getStatusBadge(moduleInfo.uiohook.features?.mouseHook || false, '지원')}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>글로벌 이벤트:</span>
                  {getStatusBadge(moduleInfo.uiohook.features?.globalEvents || false, '지원')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">시스템 정보</span>
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>플랫폼:</span>
              <span className="text-muted-foreground">{moduleInfo?.system?.platform || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>아키텍처:</span>
              <span className="text-muted-foreground">{moduleInfo?.system?.arch || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Node.js:</span>
              <span className="text-muted-foreground">{moduleInfo?.system?.node || 'N/A'}</span>
            </div>
            {moduleInfo?.system?.electron && (
              <div className="flex items-center justify-between text-xs">
                <span>Electron:</span>
                <span className="text-muted-foreground">{moduleInfo.system.electron}</span>
              </div>
            )}
            {moduleInfo?.system?.cpuCount && (
              <div className="flex items-center justify-between text-xs">
                <span>CPU 코어:</span>
                <span className="text-muted-foreground">{moduleInfo.system.cpuCount}개</span>
              </div>
            )}
            {moduleInfo?.system?.memory && (
              <div className="flex items-center justify-between text-xs">
                <span>시스템 메모리:</span>
                <span className="text-muted-foreground">
                  {Math.round(moduleInfo.system.memory.percentage)}% 사용 중
                </span>
              </div>
            )}
            {moduleInfo?.system?.uptime && (
              <div className="flex items-center justify-between text-xs">
                <span>가동 시간:</span>
                <span className="text-muted-foreground">
                  {Math.floor(moduleInfo.system.uptime / 3600)}시간
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 성능 정보 */}
        {moduleInfo?.performance && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">성능 정보</span>
            </div>
            <div className="pl-4 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>프로세스 ID:</span>
                <span className="text-muted-foreground">{moduleInfo.performance.pid}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>힙 메모리:</span>
                <span className="text-muted-foreground">
                  {Math.round(moduleInfo.performance.memoryUsage.heapUsed / 1024 / 1024)}MB
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>RSS 메모리:</span>
                <span className="text-muted-foreground">
                  {Math.round(moduleInfo.performance.memoryUsage.rss / 1024 / 1024)}MB
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>프로세스 실행 시간:</span>
                <span className="text-muted-foreground">
                  {Math.floor(moduleInfo.performance.processUptime / 60)}분
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 환경 정보 */}
        {moduleInfo?.environment && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">환경 정보</span>
            </div>
            <div className="pl-4 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>환경:</span>
                <span className="text-muted-foreground">{moduleInfo.environment.nodeEnv}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>개발 모드:</span>
                {getStatusBadge(moduleInfo.environment.isDev, '활성')}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>작업 디렉토리:</span>
                <span className="text-muted-foreground text-xs truncate max-w-32">
                  {moduleInfo.environment.workingDirectory}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 권한 상태 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">권한 상태</span>
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>접근성 권한:</span>
              {getStatusBadge(moduleInfo?.permissions?.accessibility || false, '허용됨')}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>입력 모니터링:</span>
              {getStatusBadge(moduleInfo?.permissions?.input || false, '허용됨')}
            </div>
          </div>
        </div>

        {/* 권한 요청 버튼 (macOS에서만) */}
        {moduleInfo?.system?.platform?.toLowerCase().includes('mac') && 
         (!moduleInfo?.permissions?.accessibility || !moduleInfo?.permissions?.input) && (
          <div className="pt-2 border-t">
            <button 
              className="w-full text-xs px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={() => {
                alert('시스템 환경설정 > 보안 및 개인 정보 보호 > 개인 정보 보호에서 Loop에 접근성 및 입력 모니터링 권한을 허용해주세요.');
              }}
            >
              권한 설정 안내
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
