#!/bin/bash
set -e
cd /home/Aryaman/CuraVault/frontend/src/app

mkdir -p api/v1/documents/[id]
mkdir -p api/v1/search
mkdir -p api/v1/share/sessions/[id]
mkdir -p api/v1/reminders

# Documents API
cat << 'ROUTE_EOF' > api/v1/documents/route.ts
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
ROUTE_EOF

cat << 'ROUTE_EOF' > api/v1/documents/[id]/route.ts
import { NextResponse } from 'next/server';
import { store } from '../../../_store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const doc = store.documents.find(d => d.documentId === params.id);
  if (doc) {
    return NextResponse.json({ success: true, data: doc });
  }
  return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
}
ROUTE_EOF

# Search API
cat << 'ROUTE_EOF' > api/v1/search/route.ts
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
ROUTE_EOF

# Share API
cat << 'ROUTE_EOF' > api/v1/share/sessions/route.ts
import { NextResponse } from 'next/server';
import { store } from '../../../../_store';

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
ROUTE_EOF

cat << 'ROUTE_EOF' > api/v1/share/sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import { store } from '../../../../../_store';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  store.sessions = store.sessions.filter(s => s.sessionId !== params.id);
  return NextResponse.json({ success: true });
}
ROUTE_EOF

# Reminders API
cat << 'ROUTE_EOF' > api/v1/reminders/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const reminders = [
    { reminderId: '1', note: 'Schedule follow-up for blood work', type: 'follow_up', dueDate: 'Tomorrow', status: 'upcoming' },
    { reminderId: '2', note: 'Refill Metformin prescription', type: 'medication', dueDate: 'Next Week', status: 'upcoming' },
    { reminderId: '3', note: 'Annual physical examination', type: 'appointment', dueDate: 'Past Due', status: 'overdue' }
  ];
  return NextResponse.json({ success: true, data: { reminders } });
}
ROUTE_EOF

