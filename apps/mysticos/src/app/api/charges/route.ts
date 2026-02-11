import { NextRequest, NextResponse } from 'next/server';
import { chargeDb } from '@/lib/db/charge.db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const user = searchParams.get('user') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const charges = await chargeDb.getCharges(limit, offset, user);
    const total = await chargeDb.getChargesCount(user);

    return NextResponse.json({
      success: true,
      data: charges,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + charges.length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
