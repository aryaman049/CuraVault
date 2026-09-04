export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  const results = [
    { documentId: '1', category: 'lab_report', snippet: `Patient's ${q} results are within normal limits.`, score: 0.95 },
    { documentId: '2', category: 'prescription', snippet: `Discussed ${q} with the patient during consultation.`, score: 0.82 }
  ];
  return NextResponse.json({ success: true, data: { results } });
}
