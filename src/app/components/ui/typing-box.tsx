'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Save, BarChart3, Timer, Target, FileText, Type } from 'lucide-react';

interface TypingBoxProps {
  onComplete: (record: {
    content: string;
    keyCount: number;
    typingTime: number;
    timestamp: string;
  }) => void;
}

const IDLE_TIMEOUT = 3000; // 3초

export function TypingBox({ onComplete }: TypingBoxProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [typingTime, setTypingTime] = useState<number>(0);
  const [keyCount, setKeyCount] = useState<number>(0);
  const [stats, setStats] = useState({
    pages: 0,
    words: 0,
    charCount: 0,
    charCountNoSpace: 0,
    accuracy: 100,
  });
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const compositionHandledRef = useRef<boolean>(false);
  const totalKeystrokesRef = useRef<number>(0);

  // 구글 문서 방식으로 통계 업데이트
  const updateStats = useCallback(() => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.textContent ?? '';
    
    // 구글 문서 방식의 단어 수(공백 기준 어절 분리)
    const words = content.trim().length > 0
      ? content.trim().split(/\s+/).length
      : 0;
    
    // 글자 수(공백 포함) - 모든 글자 1개씩 카운트
    const charCount = content.length;
    
    // 글자 수(공백 제외)
    const charCountNoSpace = content.replace(/\s/g, '').length;
    
    // 페이지 수 계산(600자 기준)
    const pages = Math.max(1, Math.ceil(charCount / 600));
    
    // 정확도 계산
    const accuracy = totalKeystrokesRef.current > 0 
      ? Math.round((keyCount / totalKeystrokesRef.current) * 100)
      : 100;

    setStats({
      pages,
      words,
      charCount,
      charCountNoSpace,
      accuracy,
    });
  }, [keyCount]);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const startTyping = useCallback(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    typingTimerRef.current = setInterval(() => {
      setTypingTime(prev => prev + 1);
    }, 1000);

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, IDLE_TIMEOUT);
  }, [stopTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // e.key가 한 글자이거나 스페이스/엔터일 때만 카운트
    if (e.key.length === 1 || e.key === ' ' || e.key === 'Enter') {
      // 한글 완성형은 2타, 나머지는 1타로 계산
      const isKorean = /[가-힣]/.test(e.key);
      const keystrokeCount = isKorean ? 2 : 1;
      
      setKeyCount(prev => prev + keystrokeCount);
      totalKeystrokesRef.current += keystrokeCount;
      
      startTyping();
      updateStats();
    }
  }, [startTyping, updateStats]);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLDivElement>) => {
    compositionHandledRef.current = true;
    let typeCount = 0;
    
    // 한글 완성형은 2타, 자음/모음은 1타, 다른 문자도 1타로 계산
    for (const char of e.data) {
      if (/[가-힣]/.test(char)) {
        typeCount += 2; // 한글 완성형은 2타
      } else if (/[ㄱ-ㅎ|ㅏ-ㅣ]/.test(char)) {
        typeCount += 1; // 한글 자음/모음은 1타
      } else {
        typeCount += 1; // 그 외 문자는 1타
      }
    }
    
    setKeyCount(prev => prev + typeCount);
    totalKeystrokesRef.current += typeCount;
    
    startTyping();
    updateStats();
  }, [startTyping, updateStats]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement> & { data?: string }) => {
    if (compositionHandledRef.current) {
      compositionHandledRef.current = false;
      return;
    }
    
    if (e.data) {
      // 각 문자별로 타수 계산
      let inputTypeCount = 0;
      for (const char of e.data) {
        if (/[가-힣]/.test(char)) {
          inputTypeCount += 2; // 한글 완성형은 2타
        } else {
          inputTypeCount += 1; // 그 외 문자는 1타
        }
      }
      
      setKeyCount(prev => prev + inputTypeCount);
      totalKeystrokesRef.current += inputTypeCount;
      
      startTyping();
      updateStats();
    }
  }, [startTyping, updateStats]);

  const handleSave = async () => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.textContent ?? '';
    const logData = {
      content,
      keyCount,
      typingTime,
      timestamp: new Date().toISOString(),
    };
    
    onComplete(logData);
    
    // 저장 후 초기화
    if (editorRef.current) editorRef.current.textContent = '';
    setKeyCount(0);
    setTypingTime(0);
    totalKeystrokesRef.current = 0;
    updateStats();
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-300">
              글자: {stats.charCount}({stats.charCountNoSpace})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-300">
              단어: {stats.words}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600 dark:text-gray-300">
              페이지: {stats.pages}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600 dark:text-gray-300">
              타자: {keyCount}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-300">
              시간: {typingTime}초
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="text-gray-600 dark:text-gray-300">
              타수: {typingTime > 0 ? Math.round((keyCount / typingTime) * 60) : 0}타/분
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-500" />
            <span className="text-gray-600 dark:text-gray-300">
              정확도: {stats.accuracy}%
            </span>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 shadow-sm"
        >
          <Save className="w-4 h-4" />
          저장
        </button>
      </div>
      
      {/* Editor */}        <div
          ref={editorRef}
          className="flex-1 p-6 outline-none resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 leading-relaxed text-base overflow-auto"
          contentEditable
          onKeyDown={handleKeyDown}
          onCompositionEnd={handleCompositionEnd}
          onInput={handleInput}
          data-placeholder="여기에 타이핑을 시작하세요..."
          style={{
            minHeight: '300px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            lineHeight: '1.6',
        }}
      />
    </div>
  );
}
