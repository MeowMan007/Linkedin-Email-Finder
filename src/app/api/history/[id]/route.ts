// ============================================================
// GET /api/history/[id]    — single record
// DELETE /api/history/[id] — delete record
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSearchRecordById, deleteSearchRecord } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { id } = await params;

  const record = await getSearchRecordById(id, userId);
  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const { id } = await params;

  const success = await deleteSearchRecord(id, userId);
  return NextResponse.json({ success });
}
