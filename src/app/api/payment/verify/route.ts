import { NextResponse } from 'next/server';

// This API route is deprecated and no longer in use.
// Manual payment system is now in place.
export async function POST(request: Request) {
    return NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 404 });
}
