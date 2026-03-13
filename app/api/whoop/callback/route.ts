import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for errors from WHOOP
  if (error) {
    return NextResponse.redirect(new URL('/settings?whoop=error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings?whoop=error', request.url));
  }

  // Verify state matches
  const storedState = request.cookies.get('whoop_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/settings?whoop=error', request.url));
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/settings?whoop=error', request.url));
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/settings?whoop=error', request.url));
    }

    const tokens = await tokenResponse.json();

    // Store tokens in an httpOnly cookie
    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
    };

    const response = NextResponse.redirect(new URL('/settings?whoop=connected', request.url));

    response.cookies.set('whoop_tokens', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    // Clear the OAuth state cookie
    response.cookies.delete('whoop_oauth_state');

    return response;
  } catch {
    return NextResponse.redirect(new URL('/settings?whoop=error', request.url));
  }
}
