import { NextRequest, NextResponse } from 'next/server';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

async function refreshTokens(tokens: TokenData): Promise<TokenData | null> {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };
  } catch {
    return null;
  }
}

async function whoopFetch(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('whoop_tokens')?.value;

  if (!tokenCookie) {
    return NextResponse.json({ error: 'Not connected' }, { status: 401 });
  }

  let tokens: TokenData;
  try {
    tokens = JSON.parse(tokenCookie);
  } catch {
    return NextResponse.json({ error: 'Invalid token data' }, { status: 401 });
  }

  // Refresh tokens if expired (with 5 min buffer)
  let tokensUpdated = false;
  if (Date.now() > tokens.expires_at - 300000) {
    const newTokens = await refreshTokens(tokens);
    if (!newTokens) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }
    tokens = newTokens;
    tokensUpdated = true;
  }

  try {
    // Fetch recovery, cycle (strain), and sleep in parallel
    const [recoveryData, cycleData, sleepData] = await Promise.all([
      whoopFetch('https://api.prod.whoop.com/developer/v1/recovery?limit=1', tokens.access_token),
      whoopFetch('https://api.prod.whoop.com/developer/v1/cycle?limit=1', tokens.access_token),
      whoopFetch('https://api.prod.whoop.com/developer/v1/activity/sleep?limit=1', tokens.access_token),
    ]);

    // Extract the most recent values
    const recovery = recoveryData?.records?.[0]?.score?.recovery_score ?? null;
    const strain = cycleData?.records?.[0]?.score?.strain ?? null;
    const sleepPerformance = sleepData?.records?.[0]?.score?.sleep_performance_percentage ?? null;

    const result = {
      recovery,
      strain,
      sleepPerformance,
      lastSynced: new Date().toISOString(),
    };

    const response = NextResponse.json(result);

    // Update cookie with refreshed tokens if needed
    if (tokensUpdated) {
      response.cookies.set('whoop_tokens', JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to fetch WHOOP data' }, { status: 500 });
  }
}
