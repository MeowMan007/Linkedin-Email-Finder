import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSearchStats } from '@/lib/db';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const stats = await getSearchStats(userId);
  return NextResponse.json(stats);
}
