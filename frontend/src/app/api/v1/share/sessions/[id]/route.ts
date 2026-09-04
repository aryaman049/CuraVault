export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { store } from '../../../../_store';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  store.sessions = store.sessions.filter(s => s.sessionId !== resolvedParams.id);
  return NextResponse.json({ success: true });
}
