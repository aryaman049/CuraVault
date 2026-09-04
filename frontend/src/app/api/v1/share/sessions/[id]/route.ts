import { NextResponse } from 'next/server';
import { store } from '../../../../../_store';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  store.sessions = store.sessions.filter(s => s.sessionId !== params.id);
  return NextResponse.json({ success: true });
}
