# Loop 6 kebab-case → camelCase 변환 매핑 테이블

## 1. 시스템 관련 IPC 채널
- `system:native:get-status` → `system:native:getStatus`
- `memory:get-info` → `memory:getInfo`
- `memory:force-gc` → `memory:forceGc`
- `memory:set-threshold` → `memory:setThreshold`

## 2. 윈도우 관련 IPC 채널  
- `set-window-mode` → `setWindowMode`
- `get-window-status` → `getWindowStatus`
- `set-window-bounds` → `setWindowBounds`
- `set-window-opacity` → `setWindowOpacity`
- `set-always-on-top` → `setAlwaysOnTop`
- `minimize-window` → `minimizeWindow`
- `maximize-window` → `maximizeWindow`
- `close-window` → `closeWindow`
- `focus-window` → `focusWindow`

## 3. 크래시 리포터 관련
- `crash-reporter:get-history` → `crashReporter:getHistory`
- `crash-reporter:get-log-paths` → `crashReporter:getLogPaths`
- `crash-reporter:report-error` → `crashReporter:reportError`

## 4. 네이티브 모듈 관련
- `native:get-status` → `native:getStatus`

## 5. 클립보드 관련
- `clipboard:copy-text` → `clipboard:copyText`
- `clipboard:copy-html` → `clipboard:copyHtml`
- `clipboard:copy-image` → `clipboard:copyImage`
- `clipboard:read-text` → `clipboard:readText`
- `clipboard:read-html` → `clipboard:readHtml`
- `clipboard:read-image` → `clipboard:readImage`
- `clipboard:start-watching` → `clipboard:startWatching`
- `clipboard:stop-watching` → `clipboard:stopWatching`
- `clipboard:get-history` → `clipboard:getHistory`
- `clipboard:clear-history` → `clipboard:clearHistory`
- `clipboard:get-stats` → `clipboard:getStats`
- `clipboard:save-to-file` → `clipboard:saveToFile`
- `clipboard:set-interval` → `clipboard:setInterval`

## 6. 키보드 관련
- `get-typing-stats` → `getTypingStats`
- `reset-typing-stats` → `resetTypingStats`
- `get-keyboard-permissions` → `getKeyboardPermissions`
- `toggle-keyboard-monitoring` → `toggleKeyboardMonitoring`
- `get-hangul-composition-state` → `getHangulCompositionState`

## 7. 스크린샷 관련
- `get-screenshot-sources` → `getScreenshotSources`
- `capture-screenshot` → `captureScreenshot`
- `capture-primary-screen` → `capturePrimaryScreen`
- `capture-active-window` → `captureActiveWindow`
- `get-screenshot-history` → `getScreenshotHistory`
- `load-screenshot` → `loadScreenshot`
- `delete-screenshot` → `deleteScreenshot`
- `clear-all-screenshots` → `clearAllScreenshots`
- `get-screenshot-directory` → `getScreenshotDirectory`

## 8. 메뉴 관련
- `menu:show-context` → `menu:showContext`
- `menu:get-recent-files` → `menu:getRecentFiles`
- `menu:get-action-history` → `menu:getActionHistory`
- `menu:add-recent-file` → `menu:addRecentFile`

## 9. 단축키 관련
- `shortcuts:register-global` → `shortcuts:registerGlobal`
- `shortcuts:unregister-global` → `shortcuts:unregisterGlobal`
- `shortcuts:toggle-global` → `shortcuts:toggleGlobal`
- `shortcuts:get-all` → `shortcuts:getAll`
- `shortcuts:get-history` → `shortcuts:getHistory`
- `shortcuts:check-conflicts` → `shortcuts:checkConflicts`

## 10. 시스템 정보 관련
- `get-system-info` → `getSystemInfo`
- `get-memory-info` → `getMemoryInfo`
- `get-cpu-info` → `getCpuInfo`
- `get-process-list` → `getProcessList`
- `check-system-permissions` → `checkSystemPermissions`
- `request-system-permissions` → `requestSystemPermissions`
- `detect-browser-info` → `detectBrowserInfo`
- `get-disk-usage` → `getDiskUsage`
- `get-network-info` → `getNetworkInfo`
- `get-debug-info` → `getDebugInfo`
- `open-system-preferences` → `openSystemPreferences`
- `show-permission-dialog` → `showPermissionDialog`

## 11. 설정 관련
- `settings:get-setting` → `settings:getSetting`
- `settings:update-multiple` → `settings:updateMultiple`
- `settings:create-backup` → `settings:createBackup`
- `settings:get-history` → `settings:getHistory`
- `settings:clear-history` → `settings:clearHistory`

## 12. 데이터 동기화 관련
- `data-sync-status` → `dataSyncStatus`
- `data-sync-manual` → `dataSyncManual`
- `data-sync-update-config` → `dataSyncUpdateConfig`
- `data-sync-retry-failed` → `dataSyncRetryFailed`

## 13. 통계 관련
- `stats-get-data` → `statsGetData`
- `stats-analyze-pattern` → `statsAnalyzePattern`
- `stats-update-settings` → `statsUpdateSettings`
- `stats-optimize-memory` → `statsOptimizeMemory`

## 14. 브라우저 관련
- `browser-get-active` → `browserGetActive`
- `browser-get-list` → `browserGetList`
- `browser-detect-google-docs` → `browserDetectGoogleDocs`
- `browser-update-settings` → `browserUpdateSettings`

## 15. 자동 실행 관련
- `auto-launch-status` → `autoLaunchStatus`
- `auto-launch-enable` → `autoLaunchEnable`
- `auto-launch-disable` → `autoLaunchDisable`
- `auto-launch-toggle` → `autoLaunchToggle`

## 16. 보안 관련
- `security-update-csp` → `securityUpdateCsp`
- `security-ime-state` → `securityImeState`
- `security-ime-reset` → `securityImeReset`
- `security-setup-window` → `securitySetupWindow`

## 17. 다이얼로그 관련
- `dialog:show-message` → `dialog:showMessage`
- `dialog:show-open-file` → `dialog:showOpenFile`
- `dialog:show-save-file` → `dialog:showSaveFile`
- `dialog:show-folder` → `dialog:showFolder`
- `dialog:show-notification` → `dialog:showNotification`
- `dialog:show-restart-prompt` → `dialog:showRestartPrompt`
- `dialog:show-custom` → `dialog:showCustom`
- `dialog:close-custom` → `dialog:closeCustom`
