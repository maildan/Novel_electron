#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

async function testMemoryOptimization() {
    console.log('🔍 Loop 6 메모리 최적화 테스트 시작...\n');
    
    let iteration = 0;
    const maxIterations = 10;
    const results = [];
    
    const interval = setInterval(async () => {
        iteration++;
        
        try {
            // Electron 프로세스 메모리 사용량 확인
            exec('ps -o pid,ppid,rss,vsz,comm -p $(pgrep -f "electron.*loop")', (error, stdout, stderr) => {
                if (!error && stdout) {
                    const lines = stdout.split('\n').filter(line => line.trim());
                    if (lines.length > 1) {
                        console.log(`📊 반복 ${iteration}/${maxIterations} - Electron 프로세스 메모리:`);
                        console.log(stdout);
                        
                        // RSS 합계 계산
                        let totalRss = 0;
                        for (let i = 1; i < lines.length; i++) {
                            const parts = lines[i].trim().split(/\s+/);
                            if (parts.length >= 3) {
                                totalRss += parseInt(parts[2]) || 0;
                            }
                        }
                        
                        const totalMB = Math.round(totalRss / 1024);
                        console.log(`📈 총 RSS 메모리: ${totalMB}MB\n`);
                        
                        results.push({
                            iteration,
                            totalRss: totalRss,
                            totalMB: totalMB,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
            
            // 메모리 최적화 트리거 (3번째, 6번째, 9번째 반복에서)
            if (iteration === 3 || iteration === 6 || iteration === 9) {
                console.log(`🧹 메모리 최적화 실행 중... (반복 ${iteration})`);
                
                // Node.js 가비지 컬렉션 강제 실행
                if (global.gc) {
                    global.gc();
                    console.log('✅ Node.js GC 실행됨');
                }
            }
            
        } catch (err) {
            console.error('❌ 메모리 확인 중 오류:', err.message);
        }
        
        if (iteration >= maxIterations) {
            clearInterval(interval);
            
            console.log('\n📋 메모리 최적화 테스트 결과 요약:');
            results.forEach(result => {
                console.log(`  반복 ${result.iteration}: ${result.totalMB}MB`);
            });
            
            if (results.length > 0) {
                const avgMemory = results.reduce((sum, r) => sum + r.totalMB, 0) / results.length;
                const minMemory = Math.min(...results.map(r => r.totalMB));
                const maxMemory = Math.max(...results.map(r => r.totalMB));
                
                console.log(`\n📊 통계:`);
                console.log(`  평균 메모리: ${Math.round(avgMemory)}MB`);
                console.log(`  최소 메모리: ${minMemory}MB`);
                console.log(`  최대 메모리: ${maxMemory}MB`);
                console.log(`  메모리 변동: ${maxMemory - minMemory}MB`);
            }
            
            // 결과를 파일로 저장
            const reportPath = '/Users/user/loop/loop_6/memory-optimization-report.json';
            fs.writeFileSync(reportPath, JSON.stringify({
                testDate: new Date().toISOString(),
                iterations: maxIterations,
                results: results,
                summary: results.length > 0 ? {
                    avgMemory: Math.round(results.reduce((sum, r) => sum + r.totalMB, 0) / results.length),
                    minMemory: Math.min(...results.map(r => r.totalMB)),
                    maxMemory: Math.max(...results.map(r => r.totalMB)),
                    memoryVariation: Math.max(...results.map(r => r.totalMB)) - Math.min(...results.map(r => r.totalMB))
                } : null
            }, null, 2));
            
            console.log(`\n💾 보고서 저장됨: ${reportPath}`);
            console.log('✅ 메모리 최적화 테스트 완료!');
        }
        
    }, 3000); // 3초마다 확인
}

// GC 플래그 확인
if (!global.gc) {
    console.log('⚠️  가비지 컬렉션을 사용하려면 --expose-gc 플래그로 실행하세요');
}

testMemoryOptimization().catch(err => {
    console.error('❌ 테스트 실행 중 오류:', err);
    process.exit(1);
});
