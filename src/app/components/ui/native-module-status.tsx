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

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        
        // Electron API를 통해 네이티브 모듈 상태 조회
        if (typeof window !== 'undefined' && window.electronAPI) {
          const status = await window.electronAPI.system.native.getStatus();
          
          // 추가로 네이티브 모듈 API 직접 호출해서 실제 동작 확인
          try {
            const nativeVersionResult = await window.electronAPI.native.getNativeModuleVersion();
            const nativeInfoResult = await window.electronAPI.native.getNativeModuleInfo();
            const isAvailableResult = await window.electronAPI.native.isNativeModuleAvailable();
            
            console.log('🔧 Direct native module test:', {
              version: nativeVersionResult,
              info: nativeInfoResult,
              available: isAvailableResult
            });

            // 각 API 응답의 상세 내용 로깅
            console.log('📊 상세 API 응답 분석:', {
              systemStatus: status,
              versionData: nativeVersionResult?.data,
              infoData: nativeInfoResult?.data,
              availableData: isAvailableResult?.data
            });
            
            // 직접 호출한 결과로 상태 업데이트
            if (nativeVersionResult.success || nativeInfoResult.success || isAvailableResult.success) {
              const isAvailable = isAvailableResult.success ? isAvailableResult.data : false;
              const version = nativeVersionResult.success ? nativeVersionResult.data : 'unknown';
              const hasError = nativeVersionResult.error || nativeInfoResult.error || null;
              
              const moduleData: NativeModuleInfo = {
                uiohook: {
                  available: Boolean(isAvailable),
                  version: String(version),
                  initialized: Boolean(isAvailable),
                  loadError: hasError,
                  fallbackMode: !Boolean(isAvailable),
                  features: {
                    keyboardHook: Boolean(isAvailable),
                    mouseHook: Boolean(isAvailable),
                    globalEvents: Boolean(isAvailable)
                  }
                },
                // 기존 system 정보는 유지하되 네이티브 모듈 정보로 보강
                system: status.data?.system || {
                  platform: navigator.platform,
                  arch: 'unknown',
                  node: 'N/A',
                  electron: 'N/A',
                  chrome: navigator.userAgent
                },
                permissions: status.data?.permissions || {
                  accessibility: false,
                  input: false
                }
              };
              setModuleInfo(moduleData);
            } else if (status.success) {
              setModuleInfo(status.data);
            } else {
              setError(status.error || '네이티브 모듈 상태 조회 실패');
            }
          } catch (nativeError) {
            console.warn('Direct native module call failed:', nativeError);
            // 폴백으로 기존 상태 사용
            if (status.success) {
              setModuleInfo(status.data);
            } else {
              setError(status.error || '네이티브 모듈 상태 조회 실패');
            }
          }
        } else {
          // 브라우저 환경에서는 폴백 데이터 사용
          setModuleInfo({
            uiohook: {
              available: false,
              version: '0.0.0',
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
              arch: 'unknown',
              node: 'N/A',
              electron: 'N/A',
              chrome: navigator.userAgent,
              hostname: 'localhost',
              uptime: 0,
              cpuCount: navigator.hardwareConcurrency || 1,
              cpuModel: 'Unknown',
              loadAverage: {
                '1min': 0,
                '5min': 0,
                '15min': 0
              },
              memory: {
                total: 0,
                free: 0,
                used: 0,
                percentage: 0
              }
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
              memoryUsage: {
                rss: 0,
                heapTotal: 0,
                heapUsed: 0,
                external: 0,
                arrayBuffers: 0
              },
              resourceUsage: null,
              pid: 0,
              ppid: null
            },
            environment: {
              nodeEnv: 'browser',
              isDev: false,
              userAgent: navigator.userAgent,
              workingDirectory: 'N/A'
            }
          });
        }
      } catch (err) {
        console.error('네이티브 모듈 상태 확인 오류:', err);
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
