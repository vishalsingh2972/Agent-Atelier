import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for Gemini API calls.
 *
 * Keeps the Gemini API key on the server — it is never sent to the browser.
 * The client sends the conversation payload; this route appends the key and
 * forwards the request to Google's generativelanguage API.
 *
 * Environment variable required: GEMINI_API_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_KEY_MISSING',
          message: 'The server does not have a Gemini API key configured. Please set GEMINI_API_KEY in your environment variables.',
        },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { contents, tools, systemInstruction, model } = body;

    if (!contents || !Array.isArray(contents)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: 'Missing or invalid contents array.' },
        { status: 400 },
      );
    }

    const geminiModel = model || 'gemini-2.0-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${apiKey}`;

    const geminiBody: Record<string, unknown> = { contents };

    if (systemInstruction) {
      geminiBody.systemInstruction = systemInstruction;
    }

    if (tools && Array.isArray(tools) && tools.length > 0) {
      geminiBody.tools = tools;
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          success: false,
          error: 'GEMINI_API_ERROR',
          message: `Gemini API returned ${geminiResponse.status}: ${errorText}`,
        },
        { status: geminiResponse.status },
      );
    }

    const data = await geminiResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[AI Chat Proxy] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'AI chat proxy failed.' },
      { status: 500 },
    );
  }
}
