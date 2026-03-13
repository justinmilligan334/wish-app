import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete('whoop_tokens');
  return response;
}
