import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai'; 

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const client = new GoogleGenAI({ apiKey });

    const modelList = [];

    // 💡 A 'Pager' is an Async Iterable. You must loop through it:
    const pager = await client.models.list();

    for await (const model of pager) {
      modelList.push({
        name: model.name,
        displayName: model.displayName
      });
    }

    return NextResponse.json({ 
      count: modelList.length,
      models: modelList 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}