import { prisma } from '@/utils/prisma';
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, stationId } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Attraction name is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (!stationId || typeof stationId !== 'string') {
      return NextResponse.json(
        { error: 'Station ID is required' },
        { status: 400 }
      );
    }

    // Create attraction using Prisma (not verified by default)
    const attraction = await prisma.attraction.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        stationId,
        isVerified: false,  // Community suggestions start unverified
        verificationType: 'quiz',  // Default verification type
      },
    });

    return NextResponse.json({
      message: 'Suggestion submitted successfully',
      data: attraction,
    });
  } catch (error) {
    console.error('[/api/suggestions] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

