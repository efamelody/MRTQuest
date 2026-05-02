import { createServiceClient } from '@/utils/supabase/server';
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

    const supabase = createServiceClient();

    // Insert into attractions table
    const { data, error } = await supabase
      .from("attractions")
      .insert({
        name: name.trim(),
        description: description.trim(),
        station_id: stationId,
        is_verified: false,
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit suggestion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Suggestion submitted successfully',
      data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
