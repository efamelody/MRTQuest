import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';
import { getDistance } from 'geolib';
import { GoogleGenAI } from '@google/genai';

const prisma = new PrismaClient();


interface VerifyPhotoRequest {
  attractionId: string;
  base64Image: string;
  userLatitude: number;
  userLongitude: number;
}

interface GeminiResponse {
  verified: boolean;
  confidence: number;
  reason?: string;
}

const CONFIDENCE_THRESHOLD = 0.7;

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to verify a check-in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse request body
    const body: VerifyPhotoRequest = await request.json();
    const { attractionId, base64Image, userLatitude, userLongitude } = body;

    // Validation
    if (!attractionId || typeof attractionId !== 'string') {
      return NextResponse.json(
        { error: 'Attraction ID is required' },
        { status: 400 }
      );
    }

    if (!base64Image || typeof base64Image !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (typeof userLatitude !== 'number' || typeof userLongitude !== 'number') {
      return NextResponse.json(
        { error: 'User coordinates are required' },
        { status: 400 }
      );
    }

    // Fetch attraction details
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        checkInRadius: true,
        ai_prompt: true,
        has_photo_challenge: true,
      },
    });

    if (!attraction) {
      return NextResponse.json(
        { error: 'Attraction not found' },
        { status: 404 }
      );
    }

    // Check if photo challenge is enabled for this attraction
    if (!attraction.has_photo_challenge) {
      return NextResponse.json(
        { error: 'This attraction does not have photo verification enabled' },
        { status: 422 }
      );
    }

    // Validate coordinates
    if (attraction.latitude === null || attraction.longitude === null) {
      return NextResponse.json(
        { error: 'Attraction coordinates are not available' },
        { status: 422 }
      );
    }

    // Geofence validation
    const distanceInMeters = getDistance(
      { latitude: userLatitude, longitude: userLongitude },
      { latitude: attraction.latitude, longitude: attraction.longitude }
    );

    if (distanceInMeters > attraction.checkInRadius) {
      return NextResponse.json(
        {
          success: false,
          error: `You are ${distanceInMeters}m away. Must be within ${attraction.checkInRadius}m to check in.`,
        },
        { status: 422 }
      );
    }

    // Call Gemini for landmark verification
    const geminiResult = await verifyLandmarkWithGemini(
      base64Image,
      attraction.name,
      attraction.ai_prompt
    );

    // Check confidence threshold
    if (!geminiResult.verified || geminiResult.confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json(
        {
          success: false,
          error: `Photo verification failed. Confidence: ${(
            geminiResult.confidence * 100
          ).toFixed(1)}%. ${geminiResult.reason || 'Could not verify landmark in photo.'}`,
          confidence: geminiResult.confidence,
        },
        { status: 422 }
      );
    }

    // Create visit record with verified status
    const visit = await prisma.visit.create({
      data: {
        userId,
        siteId: attractionId,
        verificationType: 'photo',
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        visitId: visit.id,
        message: `Check-in verified! ${attraction.name} unlocked.`,
        pointsAwarded: 8,
        confidence: geminiResult.confidence,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Photo verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify photo. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Verifies a landmark in the provided image using Gemini 1.5 Flash
 */
/**
 * Verifies a landmark in the provided image using Gemini 2.5 Flash
 */
async function verifyLandmarkWithGemini(
  base64Image: string,
  attractionName: string,
  customPrompt?: string | null
): Promise<GeminiResponse> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-2.5-flash';

  const promptText = customPrompt
    ? customPrompt.replace('{attraction_name}', attractionName)
    : `You are a landmark verification AI. Verify if this photo contains or shows the location of "${attractionName}". 
    
    Respond ONLY with a valid JSON object:
    {
      "verified": true or false,
      "confidence": a number between 0 and 1,
      "reason": a brief explanation (max 50 chars)
    }`;

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        // Define the schema strictly:
        responseSchema: {
          type: 'object',
          properties: {
            verified: { type: 'boolean' },
            confidence: { type: 'number' },
            reason: { type: 'string' }
          },
          required: ['verified', 'confidence', 'reason']
        }
      },
    });

    // FIX: Check if text exists before using it
    const responseText = result.text;

    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    // Now TypeScript knows responseText is a string
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsedResponse: GeminiResponse = JSON.parse(jsonMatch[0]);

    if (typeof parsedResponse.verified !== 'boolean' || typeof parsedResponse.confidence !== 'number') {
      throw new Error('Invalid response structure');
    }

    return parsedResponse;

  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      verified: false,
      confidence: 0,
      reason: 'AI verification service error',
    };
  }
}