// ============================================================
// GET /api/history   — paginated history
// DELETE /api/history — clear all
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSearchHistory, clearSearchHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  const { records, total } = await getSearchHistory({ userId, page, limit });

  return NextResponse.json({
    records,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const success = await clearSearchHistory(userId);
  return NextResponse.json({ success });
}
