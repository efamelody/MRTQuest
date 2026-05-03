import { prisma } from '@/utils/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stations = await prisma.station.findMany({
      select: {
        id: true,
        name: true,
        line: true,
        active: true,
        sequenceOrder: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ stations });
  } catch (error) {
    console.error('[/api/stations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}
