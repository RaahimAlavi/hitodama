// src/lib/screenPointerFinder.ts
// Hybrid Screen Target Locator (Windows UIAutomation + Gemini Multimodal Vision with Auto-Fallback)

import { callGeminiWithFallback, VISION_AND_QUERY_MODELS } from './gemini';

export interface PointedTarget {
  x: number;          // center X in screen px
  y: number;          // center Y in screen px
  width: number;      // target width in screen px
  height: number;     // target height in screen px
  label: string;      // short name of what it found (e.g. "Mute Button")
  spokenHint: string; // short witty comment (e.g. "Here it is! Click the speaker icon right here.")
  confidence: number;
}

function parseJsonFromText(rawText: string): any {
  if (!rawText) return null;
  const clean = rawText
    .replace(/^```(?:json)?/im, '')
    .replace(/```$/im, '')
    .trim();

  // 1. Try direct parse
  try {
    return JSON.parse(clean);
  } catch (_) {}

  // 2. Try finding outermost matching braces
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  return null;
}

export async function findTargetOnScreen(
  userQuery: string,
  apiKey: string,
  screenshotBase64?: string
): Promise<PointedTarget | null> {
  const cleanQ = (userQuery || '').trim();
  if (!cleanQ) return null;

  // 1. FAST-PATH: Native Windows UIAutomation Hierarchy (<100ms)
  if (typeof window !== 'undefined' && (window as any).hitodamaAPI?.scanUIElements) {
    try {
      const scanRes = await (window as any).hitodamaAPI.scanUIElements();
      const elements = scanRes?.elements || (Array.isArray(scanRes) ? scanRes : []);
      if (Array.isArray(elements) && elements.length > 0) {
        const qLower = cleanQ.toLowerCase();
        const stopWords = new Set(['find', 'where', 'is', 'the', 'show', 'me', 'point', 'at', 'to', 'button', 'icon', 'item', 'click', 'look', 'for']);
        const keywords = qLower
          .split(/[^a-z0-9]+/i)
          .filter((w) => w.length >= 2 && !stopWords.has(w));

        let bestEl: any = null;
        let highestScore = 0;

        for (const el of elements) {
          if (!el || el.w < 8 || el.h < 8) continue;
          const label = String(el.label || '').toLowerCase();
          const role = String(el.role || '').toLowerCase();

          let score = 0;
          if (label === qLower) score += 20;
          else if (label.includes(qLower) && Math.abs(label.length - qLower.length) <= 4) score += 12;

          for (const kw of keywords) {
            if (label === kw) score += 8;
            else if (label.includes(kw)) score += 3;
            if (role.includes(kw)) score += 1;
          }

          if (score > highestScore) {
            highestScore = score;
            bestEl = el;
          }
        }

        // Only accept UIAutomation if confidence is high (exact or tight match)
        if (bestEl && highestScore >= 12) {
          return {
            x: Math.round(bestEl.x), // bestEl.x is already the center coordinate
            y: Math.round(bestEl.y), // bestEl.y is already the center coordinate
            width: Math.max(34, bestEl.w),
            height: Math.max(28, bestEl.h),
            label: bestEl.label || cleanQ,
            spokenHint: `Found ${bestEl.label || cleanQ} right here! Click it to proceed.`,
            confidence: 0.96,
          };
        }
      }
    } catch (e) {
      console.warn('UIAutomation scan fast-path skipped:', e);
    }
  }

  // 2. MULTIMODAL VISION PATH (Identical backend as Lasso Circle-to-Ask)
  if (!apiKey || !apiKey.trim()) return null;

  let base64Img = screenshotBase64;
  if (!base64Img && typeof window !== 'undefined' && (window as any).hitodamaAPI?.captureScreen) {
    try {
      const cap = await (window as any).hitodamaAPI.captureScreen();
      if (cap?.success && cap.image) {
        base64Img = cap.image;
      }
    } catch (e) {
      console.error('Failed to capture screen for vision pointer:', e);
    }
  }

  if (!base64Img) return null;

  const rawCleanImg = base64Img.replace(/^data:image\/\w+;base64,/, '');
  let imgMime = 'image/jpeg';
  const match = base64Img.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
  if (match) imgMime = match[1];

  const screenW = typeof window !== 'undefined' ? window.innerWidth || window.screen.width : 1920;
  const screenH = typeof window !== 'undefined' ? window.innerHeight || window.screen.height : 1080;

  const promptText = `You are Hitodama, an ultra-precise Windows spatial screen locator.
The user wants to locate or point to: "${cleanQ}".

INSTRUCTIONS:
1. Scan this full-screen desktop capture carefully to find the item, icon, button, window, link, or control that matches "${cleanQ}".
2. CRITICAL FOR DESKTOP SHORTCUTS & APP ICONS:
   - On Windows, each desktop shortcut consists of an icon with a text label positioned directly BELOW it.
   - You MUST read the exact text label beneath each icon to confirm its identity.
   - For "${cleanQ}", find the desktop shortcut whose text label directly matches "${cleanQ}".
   - Do NOT select adjacent or neighboring icons (e.g. if the user asked for "Fortnite", locate the icon labeled "Fortnite", NOT neighboring icons like "HoYoPlay", "Muck", or "FallGuys").
   - Include both the icon and its text label in the bounding box.
3. CRITICAL FOR APPLICATION / SYSTEM CONTROLS:
   - If it is a button in an open app, taskbar icon, or tray icon, locate the exact clickable control.
4. COORDINATES:
   - Return "box_2d": [ymin, xmin, ymax, xmax] as normalized integers from 0 to 1000 representing the exact bounding box of the item on screen.
   - Return "found": true if located.
   - If it is truly nowhere on the screen, return: {"found": false, "label": "Not Found", "spokenHint": "I scanned your screen, but couldn't spot that anywhere."}

Respond with a JSON object:
{
  "found": true,
  "box_2d": [ymin, xmin, ymax, xmax],
  "label": "Accurate Name of the Target",
  "spokenHint": "Found ${cleanQ} right here! Click it to proceed."
}`;

  const parts: any[] = [
    {
      inlineData: {
        mimeType: imgMime,
        data: rawCleanImg,
      },
    },
    { text: promptText },
  ];

  try {
    const { text } = await callGeminiWithFallback(
      apiKey,
      VISION_AND_QUERY_MODELS,
      [{ role: 'user', parts }]
    );

    const parsed = parseJsonFromText(text);
    if (parsed && parsed.found !== false) {
      const box = parsed.box_2d || parsed.box || parsed.bbox || parsed.coordinates;

      if (Array.isArray(box) && box.length === 4) {
        const [ymin1000, xmin1000, ymax1000, xmax1000] = box;
        const xminPx = (xmin1000 <= 1 ? xmin1000 * screenW : (xmin1000 / 1000) * screenW);
        const xmaxPx = (xmax1000 <= 1 ? xmax1000 * screenW : (xmax1000 / 1000) * screenW);
        const yminPx = (ymin1000 <= 1 ? ymin1000 * screenH : (ymin1000 / 1000) * screenH);
        const ymaxPx = (ymax1000 <= 1 ? ymax1000 * screenH : (ymax1000 / 1000) * screenH);

        const w = Math.max(34, Math.round(Math.abs(xmaxPx - xminPx)));
        const h = Math.max(28, Math.round(Math.abs(ymaxPx - yminPx)));
        const cx = Math.round(Math.min(xminPx, xmaxPx) + w / 2);
        const cy = Math.round(Math.min(yminPx, ymaxPx) + h / 2);

        return {
          x: Math.max(20, Math.min(screenW - 20, cx)),
          y: Math.max(20, Math.min(screenH - 20, cy)),
          width: w,
          height: h,
          label: parsed.label || cleanQ,
          spokenHint: parsed.spokenHint || `Found it right here! Click ${parsed.label || cleanQ} to proceed.`,
          confidence: 0.94,
        };
      } else if (parsed.x !== undefined && parsed.y !== undefined) {
        const rawX = Number(parsed.x);
        const rawY = Number(parsed.y);
        const cx = rawX <= 1 ? rawX * screenW : (rawX <= 1000 ? (rawX / 1000) * screenW : rawX);
        const cy = rawY <= 1 ? rawY * screenH : (rawY <= 1000 ? (rawY / 1000) * screenH : rawY);
        return {
          x: Math.round(cx),
          y: Math.round(cy),
          width: 54,
          height: 38,
          label: parsed.label || cleanQ,
          spokenHint: parsed.spokenHint || `Found it right here!`,
          confidence: 0.88,
        };
      }
    }
  } catch (err) {
    console.warn('[Hitodama] Vision target locator fallback error:', err);
  }

  return null;
}
