import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';
import { getDistance } from 'geolib';
import { GoogleGenAI } from '@google/genai';


interface VerifyPhotoRequest {
  attractionId: string;
  base64Image: string;
  userLatitude: number;
  userLongitude: number;
  capturedAt?: string | null;
  imageDateTaken?: string | null;
  captureSource?: 'camera' | 'upload';
}

interface GeminiResponse {
  verified: boolean;
  confidence: number;
  reason?: string;
}

const CONFIDENCE_THRESHOLD = 0.7;
const NEAR_THRESHOLD = 0.6;
const METADATA_MAX_AGE_HOURS = 24;

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
    const {
      attractionId,
      base64Image,
      userLatitude,
      userLongitude,
      capturedAt,
      imageDateTaken,
      captureSource,
    } = body;

    // Validation
    if (!attractionId || typeof attractionId !== 'string') {
      return NextResponse.json(
        { error: 'Attraction ID is required' },
        { status: 400 }
      );
    }

    // Require a geofence check-in before photo verification
    const geofenceVisit = await prisma.visit.findFirst({
      where: { userId, siteId: attractionId, verificationType: 'geofence' },
      select: { id: true },
    });

    if (!geofenceVisit) {
      return NextResponse.json(
        { error: 'You must check in at this location before verifying a photo.' },
        { status: 403 }
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

    const metadataWarning = buildMetadataWarning({
      capturedAt,
      imageDateTaken,
    });

    // Call Gemini for landmark verification
    const geminiResult = await verifyLandmarkWithGemini(
      base64Image,
      attraction.name,
      attraction.ai_prompt
    );

    const nearThreshold =
      geminiResult.confidence >= NEAR_THRESHOLD && geminiResult.confidence < CONFIDENCE_THRESHOLD;

    const hintText = nearThreshold
      ? buildHintText({
          attractionName: attraction.name,
          aiPrompt: attraction.ai_prompt,
          reason: geminiResult.reason,
        })
      : undefined;

    // Check confidence threshold
    if (!geminiResult.verified || geminiResult.confidence < CONFIDENCE_THRESHOLD) {
      return NextResponse.json(
        {
          success: false,
          error: `Photo verification failed. Confidence: ${(
            geminiResult.confidence * 100
          ).toFixed(1)}%. ${geminiResult.reason || 'Could not verify landmark in photo.'}`,
          confidence: geminiResult.confidence,
          reason: geminiResult.reason || 'Could not verify landmark in photo.',
          nearThreshold,
          hints: hintText,
          metadataWarning,
          captureSource: captureSource || 'upload',
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
        reason: geminiResult.reason,
        nearThreshold: false,
        metadataWarning,
        captureSource: captureSource || 'upload',
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
 * Verifies a landmark in the provided image using Gemini 3 Flash Preview
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
  const modelId = 'gemini-3-flash-preview';

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

function buildMetadataWarning({
  capturedAt,
  imageDateTaken,
}: {
  capturedAt?: string | null;
  imageDateTaken?: string | null;
}): string | null {
  const reference = imageDateTaken || capturedAt;

  if (!reference) {
    return null;
  }

  const parsedDate = new Date(reference);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const now = Date.now();
  const ageHours = (now - parsedDate.getTime()) / (1000 * 60 * 60);

  if (ageHours > METADATA_MAX_AGE_HOURS) {
    return 'Photo metadata suggests this image may be old. For best results, capture a new photo now.';
  }

  if (ageHours < -1) {
    return 'Photo metadata time appears ahead of current time. Check your device clock and retry.';
  }

  return null;
}

function buildHintText({
  attractionName,
  aiPrompt,
  reason,
}: {
  attractionName: string;
  aiPrompt?: string | null;
  reason?: string;
}): string {
  const promptSummary = aiPrompt
    ? aiPrompt.replace('{attraction_name}', attractionName).replace(/\s+/g, ' ').trim().slice(0, 180)
    : `frame the most recognizable parts of ${attractionName}`;

  const reasonText = reason ? ` Last result: ${reason}.` : '';

  return `AI is looking for clear landmark features. Try to ${promptSummary}.${reasonText}`;
}