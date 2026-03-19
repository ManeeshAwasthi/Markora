import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
