'use client';

import { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

interface ClientIconProps {
  icon: LucideIcon;
  className?: string;
  size?: number;
  [key: string]: any;
}

/**
 * 클라이언트 전용 아이콘 래퍼
 * Hydration mismatch 문제를 해결하기 위해 아이콘을 클라이언트에서만 렌더링
 */
export default function ClientIcon({ icon: Icon, className, size, ...props }: ClientIconProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 서버 사이드에서는 빈 div로 렌더링
  if (!isClient) {
    return <div className={className} style={{ width: size || 24, height: size || 24 }} />;
  }

  // 클라이언트에서는 실제 아이콘 렌더링
  return <Icon className={className} size={size} {...props} />;
}
