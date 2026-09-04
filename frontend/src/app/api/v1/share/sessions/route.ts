export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { store } from '../../../_store';

export async function GET() {
  return NextResponse.json({ success: true, data: { sessions: store.sessions } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = Math.random().toString(36).substring(2, 15);
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const session = {
    sessionId: Date.now().toString(),
    shareUrl: `${baseUrl}/shared/${token}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    allowedCategories: body.allowedCategories || [],
    status: 'active'
  };
  store.sessions.push(session);
  return NextResponse.json({ success: true, data: session });
}
