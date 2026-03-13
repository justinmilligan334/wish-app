import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('whoop_tokens')?.value;

  if (!tokenCookie) {
    return NextResponse.json({ connected: false });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    return NextResponse.json({
      connected: true,
      expires_at: tokens.expires_at,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
