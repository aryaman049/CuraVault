import { NextResponse } from 'next/server';

export async function GET() {
  const reminders = [
    { reminderId: '1', note: 'Schedule follow-up for blood work', type: 'follow_up', dueDate: 'Tomorrow', status: 'upcoming' },
    { reminderId: '2', note: 'Refill Metformin prescription', type: 'medication', dueDate: 'Next Week', status: 'upcoming' },
    { reminderId: '3', note: 'Annual physical examination', type: 'appointment', dueDate: 'Past Due', status: 'overdue' }
  ];
  return NextResponse.json({ success: true, data: { reminders } });
}
