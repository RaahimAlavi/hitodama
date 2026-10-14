// Google Gemini API Client for Hitodama Companion

export interface HitodamaResponse {
  speech: string;
  thought?: string;
  action?: {
    type: 'open_app' | 'open_url' | 'dictate' | 'schedule';
    target?: string;
    details?: any;
  };
}

const SYSTEM_PROMPT = `
You are Hitodama (人魂), an ethereal, intelligent desktop AI soul companion living on the user's Windows computer.
Your personality is calm, charming, helpful, and perceptive.
Your responses should be concise, articulate, and natural to speak out loud.

When the user asks you to interact with their computer (e.g. open apps, websites, search, play music), respond in this exact JSON format:
{
  "thought": "brief internal thought",
  "speech": "what you will speak aloud to the user (keep it short and friendly, 1-2 sentences)",
  "action": {
    "type": "open_app" | "open_url" | "dictate" | "schedule",
    "target": "app name, url, or query"
  }
}

Common app targets: spotify, code, chrome, notepad, calc, youtube, amazon.

If the user is just conversing, researching, or asking about their screen, return:
{
  "thought": "thinking...",
  "speech": "your conversational or analytical answer"
}

Always return valid JSON. No backticks, no markdown wrapping.
`;

export async function queryGemini(
  prompt: string,
  apiKey: string,
  imageBase64?: string
): Promise<HitodamaResponse> {
  if (!apiKey) {
    return {
      speech: "Please add your Google Gemini API key in Settings to give me my voice.",
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const parts: any[] = [];

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: cleanBase64,
      },
    });
  }

  parts.push({ text: prompt });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        speech: `Gemini API connection notice: ${response.statusText}`,
        thought: errText,
      };
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON
    try {
      const cleanJson = candidateText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return {
        speech: candidateText || "I'm listening.",
      };
    }
  } catch (err: any) {
    return {
      speech: "I had trouble connecting to the network.",
      thought: err.message,
    };
  }
}

// Clean Dictation Engine: "Talk badly, send it clean"
export async function cleanDictation(
  rawTranscript: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) return rawTranscript;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
Clean this raw spoken voice transcript into a crisp, polished, grammatically clean sentence or paragraph.
Remove conversational fillers (um, uh, ah, like, you know), stuttered starts, and self-corrections (e.g. "at 6am... no wait 9am" -> "at 9:00 a.m.").
Maintain the original intent and tone. Return ONLY the cleaned text with no explanations or quotes.

Raw text: "${rawTranscript}"
`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) return rawTranscript;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || rawTranscript;
  } catch {
    return rawTranscript;
  }
}
