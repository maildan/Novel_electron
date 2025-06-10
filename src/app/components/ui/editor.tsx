'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  KeyboardEvent,
} from 'react';

interface Stats {
  pages: number;
  words: number;
  charCount: number;
  charCountNoSpace: number;
  keyCount: number;
  typingTime: number;
}

interface EditorProps {
  onStatsUpdate: (stats: Stats) => void;
  onSaveLog: () => void;
  className?: string;
}

const IDLE_TIMEOUT = 3000; // 3초

const Editor: React.FC<EditorProps> = ({ onStatsUpdate, onSaveLog, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const [typingTime, setTypingTime] = useState<number>(0);
  const [keyCount, setKeyCount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const compositionHandledRef = useRef<boolean>(false);

  const updateStats = useCallback(() => {
    const content = editorRef.current?.textContent ?? '';
    const pages = Math.max(1, Math.ceil(content.length / 600));
    const words =
      content.trim().length > 0
        ? content.trim().split(/\s+/).filter((w) => w.length > 0).length
        : 0;
    const charCount = content.length;
    const charCountNoSpace = content.replace(/\s/g, '').length;

    onStatsUpdate({
      pages,
      words,
      charCount,
      charCountNoSpace,
      keyCount,
      typingTime,
    });
  }, [keyCount, typingTime, onStatsUpdate]);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsTyping(false);
  }, []);

  const startTyping = useCallback(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    
    setIsTyping(true);
    typingTimerRef.current = setInterval(() => {
      setTypingTime((prev) => prev + 1);
    }, 1000);

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, IDLE_TIMEOUT);
  }, [stopTyping]);

  // 일반 키보드 입력
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // e.key가 한 글자이거나 스페이스/엔터일 때만 카운트
      if (e.key.length === 1 || e.key === ' ' || e.key === 'Enter') {
        const isKorean = /[가-힣]/.test(e.key);
        setKeyCount((prev) => prev + (isKorean ? 2 : 1));
        startTyping();
        updateStats();
      }
    },
    [startTyping, updateStats]
  );

  // 한글 입력 완료
  const handleCompositionEnd = useCallback(
    (e: CompositionEvent) => {
      compositionHandledRef.current = true;
      let typeCount = 0;
      for (const char of e.data) {
        if (/[가-힣]/.test(char)) {
          typeCount += 2;
        } else if (/[ㄱ-ㅎ|ㅏ-ㅣ]/.test(char)) {
          typeCount += 1;
        } else {
          typeCount += 1;
        }
      }
      setKeyCount((prev) => prev + typeCount);
      startTyping();
      updateStats();
    },
    [startTyping, updateStats]
  );

  // input 이벤트 (compositionEnd 후에도 발생)
  const handleInput = useCallback(
    (e: InputEvent) => {
      if (compositionHandledRef.current) {
        compositionHandledRef.current = false;
        return;
      }
      if (e.data) {
        const inputLen = e.data.length;
        setKeyCount((prev) => prev + inputLen);
        startTyping();
        updateStats();
      }
    },
    [startTyping, updateStats]
  );

  // 저장
  const handleSave = async () => {
    const content = editorRef.current?.textContent ?? '';
    const logData = {
      content,
      keyCount,
      typingTime,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/logs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });
      const data = await res.json();
      if (data.success) {
        onSaveLog();
      }
    } catch (error: unknown) {
      console.error('저장 오류:', error);
    }
  };

  // 이벤트 등록
  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;

    const keyDownHandler = (e: Event) =>
      handleKeyDown(e as unknown as KeyboardEvent<HTMLDivElement>);
    const compositionEndHandler = (e: Event) =>
      handleCompositionEnd(e as unknown as CompositionEvent);
    const inputHandler = (e: Event) => handleInput(e as unknown as InputEvent);

    editorEl.addEventListener('keydown', keyDownHandler);
    editorEl.addEventListener('compositionend', compositionEndHandler);
    editorEl.addEventListener('input', inputHandler);

    return () => {
      editorEl.removeEventListener('keydown', keyDownHandler);
      editorEl.removeEventListener('compositionend', compositionEndHandler);
      editorEl.removeEventListener('input', inputHandler);

      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handleKeyDown, handleCompositionEnd, handleInput]);

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          className={`
            w-full min-h-[400px] p-4 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${isTyping ? 'ring-2 ring-green-300' : 'border-gray-300'}
            bg-white text-gray-900 resize-none
          `}
          style={{
            lineHeight: '1.6',
            fontSize: '16px',
          }}
        />
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">타이핑 중</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span>키 입력: {keyCount}</span>
          <span className="ml-4">타이핑 시간: {Math.floor(typingTime / 60)}분 {typingTime % 60}초</span>
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default Editor;
