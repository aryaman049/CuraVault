import { NextResponse } from 'next/server';
import { store } from '../../_store';

export async function GET() {
  return NextResponse.json({ success: true, data: { documents: store.documents } });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const category = (formData.get('category') as string) || 'other';

  const document = {
    documentId: Date.now().toString(),
    category,
    status: 'processing',
    createdAt: new Date().toISOString(),
  };

  store.documents.push(document);

  // Simulate AI processing in the background without blocking the request
  setTimeout(() => {
    const doc = store.documents.find(d => d.documentId === document.documentId);
    if (doc) {
      doc.status = 'completed';
      doc.entities = {
        provider: { name: 'City Hospital', doctor: 'Dr. Smith' },
        issuedDate: new Date().toLocaleDateString(),
        findings: [
          { test: 'Hemoglobin', value: '14.2', unit: 'g/dL' },
          { test: 'WBC', value: '6.5', unit: '10^9/L' }
        ]
      };
    }
  }, 4000);

  return NextResponse.json({ success: true, data: document });
}
