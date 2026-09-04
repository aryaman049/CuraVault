import { NextResponse } from 'next/server';
import { store } from '../../../_store';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const doc = store.documents.find(d => d.documentId === resolvedParams.id);
  if (doc) {
    return NextResponse.json({ success: true, data: doc });
  }
  return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
}
