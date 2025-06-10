import { NextRequest, NextResponse } from 'next/server';

// Static export 설정
export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      content, 
      keyCount, 
      typingTime, 
      timestamp, 
      windowTitle,
      totalChars,
      totalCharsNoSpace,
      totalWords,
      pages,
      accuracy
    } = body;

    // Call Electron's IPC to save typing logs
    const result = await fetch('/api/native/database/save-typing-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        keyCount,
        typingTime,
        windowTitle,
        timestamp,
        totalChars,
        totalCharsNoSpace,
        totalWords,
        pages,
        accuracy
      })
    });

    if (!result.ok) {
      throw new Error('Failed to save typing log');
    }

    return NextResponse.json({ 
      success: true,
      message: '타이핑 로그가 성공적으로 저장되었습니다.' 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('타이핑 로그 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
