export interface GeminiFunctionCall {
  name:
    | 'open_application'
    | 'play_spotify'
    | 'search_web'
    | 'system_action'
    | 'schedule_routine'
    | 'add_todo'
    | 'get_scheduled_tasks'
    | 'find_and_point'
    | 'computer_action'
    | 'build_website';
  args: Record<string, any>;
}

export interface GeminiActionResponse {
  speech: string;
  text?: string;
  functionCall?: GeminiFunctionCall;
  action?: string;
  target?: string;
  query?: string;
  modelUsed?: string;
}

// Waterfall model pools ordered by Free-Tier Quota, Speed & Capability
export const VISION_AND_QUERY_MODELS = [
  'gemini-3.5-flash-lite',    // 15 RPM | 500 RPD (Primary workhorse ~900ms)
  'gemini-flash-lite-latest', // 15 RPM | 500 RPD (Fast ~560ms fallback)
  'gemini-3.1-flash-lite',    // 15 RPM | 500 RPD (Secondary workhorse)
  'gemini-3.6-flash',         // 5 RPM  | 20 RPD  (Fast 950ms)
  'gemini-3-flash-preview',   // 5 RPM  | 20 RPD  (Multimodal reasoning)
  'gemini-3.7-flash',         // 5 RPM  | 20 RPD
  'gemini-3.8-flash',         // 5 RPM  | 20 RPD
  'gemini-flash-latest',      // Standard Flash pool
];

export const DICTATION_TEXT_MODELS = [
  'gemini-3.5-flash-lite',    // 15 RPM | 500 RPD (~800ms clean output)
  'gemini-flash-lite-latest', // 15 RPM | 500 RPD (~780ms clean output)
  'gemini-3.1-flash-lite',    // 15 RPM | 500 RPD
  'gemma-4-31b-it',           // 30 RPM | 14,400 RPD (High-frequency text cleanup)
  'gemma-4-26b-a4b-it',       // 30 RPM | 14,400 RPD
  'gemini-3.6-flash',         // 5 RPM  | 20 RPD
  'gemini-3-flash-preview',   // 5 RPM  | 20 RPD
];

export const AUDIO_TRANSCRIBE_MODELS = [
  'gemini-3.5-flash-lite',    // 15 RPM | 500 RPD (multimodal audio ~900ms)
  'gemini-flash-lite-latest', // 15 RPM | 500 RPD (~700ms)
  'gemini-3.1-flash-lite',    // 15 RPM | 500 RPD
  'gemini-3-flash-preview',   // 5 RPM  | 20 RPD (robust audio comprehension)
  'gemini-3.6-flash',         // 5 RPM  | 20 RPD
  'gemini-3.7-flash',         // 5 RPM  | 20 RPD
  'gemini-3.8-flash',         // 5 RPM  | 20 RPD
];

export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'open_application',
        description: 'Launch any installed desktop software, game, website, or Windows utility on the user PC.',
        parameters: {
          type: 'OBJECT',
          properties: {
            appName: {
              type: 'STRING',
              description: 'Application or site name, e.g. "spotify", "discord", "gmail", "vscode", "blender", "steam", "calculator"',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'find_and_point',
        description: 'Locate, find, point to, or highlight any desktop icon, app, shortcut, button, file, or UI element on screen using the roaming spirit pointer.',
        parameters: {
          type: 'OBJECT',
          properties: {
            target: {
              type: 'STRING',
              description: 'The exact item, icon, app name, file, or button to find and point to on screen (e.g. "Fortnite", "Recycle Bin", "HoYoPlay", "Riot Client", "Mute Button")',
            },
          },
          required: ['target'],
        },
      },
      {
        name: 'play_spotify',
        description: 'Play any song, artist, album, playlist, or Liked Songs on Spotify (prioritizing the desktop Spotify app, falling back to web if not installed). Use this even if the user omits the word "play", e.g. "please Daniel Caesar on Spotify" or "play liked songs on Spotify".',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The song, artist, album, or playlist to play (e.g. "Daniel Caesar", "Best Part", "Liked Songs")',
            },
            targetType: {
              type: 'STRING',
              enum: ['track_or_artist', 'liked_songs'],
              description: 'Set to "liked_songs" if the user asked for Liked Songs, otherwise "track_or_artist"',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'computer_action',
        description: 'Click, double-click, or right-click any item, video, thumbnail, button, link, or UI element on screen, OR write/type text into any input field, editor, or active window on the PC.',
        parameters: {
          type: 'OBJECT',
          properties: {
            actionType: {
              type: 'STRING',
              enum: ['click', 'double_click', 'right_click', 'type'],
              description: 'Use "click" to click/play/select an element, "double_click" to open a desktop icon, "right_click" for context menu, or "type" to write/type text.',
            },
            target: {
              type: 'STRING',
              description: 'Visual description of what to click on screen (e.g. "first video thumbnail", "play button", "search bar", "subscribe button"). Leave empty if typing directly into the currently focused window.',
            },
            textToType: {
              type: 'STRING',
              description: 'The exact text to write or type if the user asked to write, type, or enter text.',
            },
            pressEnter: {
              type: 'BOOLEAN',
              description: 'True if Enter should be pressed after typing (e.g. submitting a search or message).',
            },
          },
          required: ['actionType'],
        },
      },
      {
        name: 'build_website',
        description: 'Build, generate, create, design, or clone a modern webpage, website, landing page, or SaaS site from a user prompt or reference.',
        parameters: {
          type: 'OBJECT',
          properties: {
            topic: {
              type: 'STRING',
              description: 'The name, brand, topic, or style of the website to build (e.g. "fortnite", "artisan coffee", "saas landing page")',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'search_web',
        description: 'Search for any query, video, song, product, or topic on a web platform.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search term or song/video/product name',
            },
            platform: {
              type: 'STRING',
              enum: ['google', 'youtube', 'amazon', 'github', 'reddit', 'wikipedia', 'spotify'],
              description: 'The target website or platform to search on',
            },
          },
          required: ['query', 'platform'],
        },
      },
      {
        name: 'system_action',
        description: 'Perform PC system adjustments such as dark mode, light mode, night light, volume, mute, lock, or sleep.',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              enum: ['dark_mode', 'light_mode', 'night_light', 'volume', 'mute', 'lock', 'sleep'],
              description: 'The system setting or power action to adjust',
            },
            value: {
              type: 'STRING',
              description: 'Target state or level, e.g. "on", "off", or a volume number "0"-"100"',
            },
          },
          required: ['action'],
        },
      },
      {
        name: 'get_scheduled_tasks',
        description: 'Check, list, view, or show the user scheduled routines, tasks, reminders, or alarms.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'schedule_routine',
        description: 'Schedule an automated routine or timed task when the user asks to schedule something, or mentions a time or recurring schedule.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: {
              type: 'STRING',
              description: 'Description of the routine or task',
            },
            timeLabel: {
              type: 'STRING',
              description: 'When it runs, e.g. "Every morning · 9:00 AM" or "Today · 6:00 PM"',
            },
          },
          required: ['title', 'timeLabel'],
        },
      },
      {
        name: 'add_todo',
        description: 'Add a task or reminder to the user Today To-Do list.',
        parameters: {
          type: 'OBJECT',
          properties: {
            task: {
              type: 'STRING',
              description: 'The task text to add',
            },
          },
          required: ['task'],
        },
      },
    ],
  },
];

const SYSTEM_INSTRUCTION = `You are Hito, a concise, loyal, fast desktop soul companion in the user's Windows Dynamic Island.
- When the user asks to play a song, artist, playlist, or music on Spotify (e.g. "play Daniel Caesar", "play liked songs on Spotify"), ALWAYS call play_spotify.
- When the user asks to click, play, select, or tap anything currently on screen (e.g. "play the first video", "click the second result", "click subscribe", "close that popup") OR asks you to write/type anything on their PC (e.g. "write hello world", "type spaghetti in the search bar"), ALWAYS call computer_action.
- When the user asks to find, locate, or point to an item without clicking it, call find_and_point.
- When the user asks to search YouTube/Google/Amazon/GitHub/Spotify, call search_web.
- When the user asks to open an app, change a system setting, view scheduled tasks, schedule a routine, or add a to-do, call the matching tool.
- Keep spoken replies under 10 words, natural and direct.`;

/**
 * Universal auto-fallback router across Free-Tier pools (500 RPD Flash-Lite, 14,400 RPD Gemma, and 20 RPD Flash).
 * Automatically cascades to the next model upon 429, 503, 500, 404, 400, or empty responses.
 */
export async function callGeminiWithFallback(
  apiKey: string,
  models: string[],
  contents: any[],
  systemInstruction?: string,
  tools?: any[],
  toolConfig?: any
): Promise<{ modelUsed: string; data: any; text: string }> {
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      const body: Record<string, any> = { contents };

      const isGemma = model.startsWith('gemma-');

      // Gemma models prefer prompt-based system instructions; skip systemInstruction body field
      if (systemInstruction && !isGemma) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      if (tools && !isGemma) {
        body.tools = tools;
        if (toolConfig) body.toolConfig = toolConfig;
      }

      // Add thinkingBudget: 0 only for gemini-3 thinking models, excluding flash-lite and transcribe
      if (
        model.includes('-3') &&
        !model.includes('flash-lite') &&
        !model.includes('transcribe') &&
        !isGemma
      ) {
        body.generationConfig = { thinkingConfig: { thinkingBudget: 0 } };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (
        res.status === 429 ||
        res.status === 503 ||
        res.status === 500 ||
        res.status === 404 ||
        res.status === 400
      ) {
        console.warn(
          `[Hito] ${model} unavailable (${res.status}), cascading to next model...`
        );
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p: any) => p.text || '').join('').trim();
      const hasFunctionCall = parts.some((p: any) => p.functionCall || p.function_call);

      // If the model produced neither text nor a function call, cascade to the next model!
      if (!text && !hasFunctionCall) {
        console.warn(`[Hito] ${model} returned empty response, cascading to next model...`);
        continue;
      }

      return { modelUsed: model, data, text };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Hito] Model ${model} failed, trying fallback:`, err?.message || err);
    }
  }

  throw lastError || new Error('All fallback models exhausted.');
}

/**
 * Voice commands and desktop action execution.
 * Routes to the 500 RPD Flash-Lite pool first, falling back to Flash reasoning models.
 */
export async function queryGemini(
  userPrompt: string,
  apiKey: string,
  base64Image?: string
): Promise<GeminiActionResponse> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('MISSING_API_KEY');
  }

  const parts: any[] = [{ text: userPrompt }];

  if (base64Image) {
    let imgMime = 'image/jpeg';
    const match = base64Image.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (match) {
      imgMime = match[1];
    }
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: imgMime,
        data: cleanBase64,
      },
    });
  }

  const { modelUsed, data } = await callGeminiWithFallback(
    apiKey,
    VISION_AND_QUERY_MODELS,
    [{ role: 'user', parts }],
    SYSTEM_INSTRUCTION,
    GEMINI_TOOLS,
    {
      functionCallingConfig: {
        mode: 'AUTO',
      },
    }
  );

  const resParts: any[] = data?.candidates?.[0]?.content?.parts || [];

  let spokenText = '';
  let detectedCall: GeminiFunctionCall | undefined;

  for (const part of resParts) {
    if (part.text) {
      spokenText += part.text.trim() + ' ';
    }
    const fc = part.functionCall || part.function_call;
    if (fc && fc.name) {
      detectedCall = {
        name: fc.name,
        args: fc.args || {},
      };
    }
  }

  const defaultSpeech = detectedCall
    ? detectedCall.name === 'open_application'
      ? `Opened ${detectedCall.args.appName || 'app'}.`
      : detectedCall.name === 'build_website'
      ? `Building website for "${detectedCall.args.topic || 'project'}" in the background.`
      : detectedCall.name === 'search_web'
      ? `Searching ${detectedCall.args.platform || 'the web'} for ${detectedCall.args.query}.`
      : detectedCall.name === 'system_action'
      ? 'Done.'
      : detectedCall.name === 'schedule_routine'
      ? "Scheduled. I'll run it on time."
      : detectedCall.name === 'get_scheduled_tasks'
      ? 'Here are your scheduled tasks.'
      : 'Added to your list.'
    : 'Done.';

  const finalSpeech = spokenText.trim() || defaultSpeech;

  return {
    modelUsed,
    speech: finalSpeech,
    text: finalSpeech,
    functionCall: detectedCall,
  };
}

/**
 * Polishes rough voice dictation ("Talk badly. Send it clean.")
 * Routes to Flash Lite (500 RPD) -> Gemma 4 (14,400 RPD) -> Flash pool.
 */
export async function cleanDictation(rawText: string, apiKey: string): Promise<string> {
  if (!apiKey || !apiKey.trim() || !rawText.trim()) return rawText.trim();

  const prompt = `Clean up this raw voice dictation. Remove filler words (uh, um), false starts, and self-corrections. Return ONLY the final clean text ready to be typed, with no quotes, commentary, or explanation:\n\n"${rawText}"`;

  try {
    const { text } = await callGeminiWithFallback(
      apiKey,
      DICTATION_TEXT_MODELS,
      [{ role: 'user', parts: [{ text: prompt }] }]
    );

    let cleaned = text.trim();
    // If a model returned chain-of-thought or bulleted scratchpad, extract the final quote or text
    if (
      cleaned.includes('\n') &&
      (cleaned.includes('Task:') || cleaned.includes('Input:') || cleaned.includes('* '))
    ) {
      const match = cleaned.match(/["']([^"'\n\r]{2,})["']\s*$/);
      if (match) {
        cleaned = match[1];
      } else {
        const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
        const last = lines[lines.length - 1].replace(/^[*#>\s"-]+|["\s]+$/g, '');
        if (last) cleaned = last;
      }
    }

    cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
    return cleaned || rawText.trim();
  } catch (err) {
    console.warn('[Hito] cleanDictation fallback exhausted, returning raw transcript:', err);
    return rawText.trim();
  }
}

/**
 * Transcribes audio recordings with auto-fallback across high-quota models.
 */
export async function transcribeAudioWithGeminiAPI(
  audioBase64: string,
  mimeType: string,
  mode: 'ASK' | 'DICTATE' | 'LASSO',
  apiKey: string,
  screenBase64?: string
): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('MISSING_API_KEY');
  }

  const promptText =
    mode === 'DICTATE'
      ? 'Transcribe the user speech in this audio and clean up any false starts, filler words (um, uh), or self-corrections. Return ONLY the final polished sentence ready to be pasted, with no quotes or extra commentary.'
      : mode === 'LASSO'
      ? 'The user circled an area on their screen and asked a question out loud. Transcribe their question and answer it concisely in 1 short sentence based on the attached screenshot.'
      : 'Transcribe the exact spoken command or question in this audio. Return ONLY the raw spoken words with no quotes.';

  const parts: any[] = [
    { text: promptText },
    {
      inlineData: {
        mimeType: (mimeType || 'audio/webm').split(';')[0],
        data: audioBase64,
      },
    },
  ];

  if (mode === 'LASSO' && screenBase64) {
    const cleanImg = screenBase64.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: cleanImg,
      },
    });
  }

  const { text } = await callGeminiWithFallback(
    apiKey,
    AUDIO_TRANSCRIBE_MODELS,
    [{ role: 'user', parts }]
  );

  return text.trim();
}

/**
 * "Circle to Ask" screen vision analysis.
 * Routes to the 500 RPD Flash-Lite multimodal pool first.
 */
export async function askLassoWithGemini(
  query: string,
  imageSrc: string,
  apiKey: string,
  audioBase64?: string,
  mimeType?: string
): Promise<string> {
  if (!apiKey || !apiKey.trim()) throw new Error('MISSING_API_KEY');

  const cleanImg = imageSrc.replace(/^data:image\/\w+;base64,/, '');

  const parts: any[] = [];
  if (cleanImg) {
    let imgMime = 'image/jpeg';
    const match = imageSrc.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (match) {
      imgMime = match[1];
    }
    parts.push({
      inlineData: {
        mimeType: imgMime,
        data: cleanImg,
      },
    });
  }

  if (audioBase64) {
    parts.push({
      inlineData: {
        mimeType: (mimeType || 'audio/webm').split(';')[0],
        data: audioBase64,
      },
    });
  }

  const promptText =
    query && query.trim()
      ? `The user circled this region on their screen and asked: "${query.trim()}". Look closely at the circled image and answer their question directly in 1-2 concise sentences.`
      : audioBase64
      ? 'The user circled this region on screen and asked a question in the audio. If they spoke in the audio, answer what was asked directly. Otherwise concisely identify what is shown in 1 short sentence.'
      : 'Concisely identify what is shown in this circled region of the user screen in 1 short sentence.';

  parts.push({ text: promptText });

  const { text } = await callGeminiWithFallback(
    apiKey,
    VISION_AND_QUERY_MODELS,
    [{ role: 'user', parts }]
  );

  return text || 'Could not analyze circled region.';
}