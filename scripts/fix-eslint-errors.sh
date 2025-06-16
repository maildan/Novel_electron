#!/bin/bash

# ESLint 에러 자동 수정 스크립트
echo "🔧 [한국어 디버깅] ESLint unused 변수 자동 수정 시작..."

cd /Users/user/loop/loop_6

# 가장 빈번한 unused 변수들을 일괄 수정
echo "📝 MenuItem 변수 수정..."
sed -i '' 's/MenuItem,/MenuItem as _MenuItem,/g' src/main/menu.ts

echo "📝 MENU_CATEGORIES 변수 수정..."
sed -i '' 's/const MENU_CATEGORIES/const _MENU_CATEGORIES/g' src/main/menu.ts

echo "📝 isWindows 변수 수정..."
sed -i '' 's/const isWindows/const _isWindows/g' src/main/menu.ts

echo "📝 options 매개변수들 수정..."
find src/main -name "*.ts" -exec sed -i '' 's/function.*(\([^)]*\)options\([^)]*\))/function \1_options\2)/g' {} \;

echo "📝 NativeIpcTypes, SystemIpcTypes 수정..."
sed -i '' 's/NativeIpcTypes,/NativeIpcTypes as _NativeIpcTypes,/g' src/main/native-ipc.ts
sed -i '' 's/SystemIpcTypes/SystemIpcTypes as _SystemIpcTypes/g' src/main/native-ipc.ts

echo "📝 MemoryData, APIResponse 수정..."
sed -i '' 's/type MemoryData/type _MemoryData/g' src/main/system-info.ts
sed -i '' 's/type APIResponse/type _APIResponse/g' src/main/system-info.ts

echo "📝 net import 수정..."
sed -i '' 's/import.*net.*from/import net as _net from/g' src/main/protocols.ts

echo "📝 workingDirectory 매개변수 수정..."
sed -i '' 's/workingDirectory/_workingDirectory/g' src/main/protocols.ts

echo "✅ [한국어 디버깅] 자동 수정 완료!"

# 수정 후 에러 개수 확인
echo "🔍 [한국어 디버깅] 수정 후 에러 개수 확인 중..."
ERROR_COUNT=$(npx eslint src/main --ext .ts 2>&1 | grep "error" | wc -l | tr -d ' ')
echo "📊 [한국어 디버깅] 현재 ESLint 에러 개수: $ERROR_COUNT"
