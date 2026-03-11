import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // This feature has been removed.
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
