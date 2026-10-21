// src/lib/fastComputerUse.ts
import { findTargetOnScreen } from './screenPointerFinder';
import { callGeminiWithFallback, VISION_AND_QUERY_MODELS } from './gemini';

export interface UIElementNode {
  id: number;
  label: string;
  role: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AgentStepDecision {
  choiceId: number | 'VISION_FALLBACK' | 'DONE' | 'STUCK';
  probability: number;
  actionType: 'click' | 'double_click' | 'right_click' | 'type' | 'done';
  targetDescription?: string;
  textToType?: string;
  pressEnter?: boolean;
  latencyMs: number;
}

const FAST_CLASSIFIER_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemma-4-31b-it',
  'gemini-3.1-flash-lite',
];

async function classifyNextElement(
  goal: string,
  elements: UIElementNode[],
  history: string[],
  geminiKey: string,
  typesafeKey?: string
): Promise<AgentStepDecision> {
  const t0 = performance.now();

  // If the goal is positional/visual (e.g. "first video", "second thumbnail", "top right icon"),
  // prefer the multimodal vision grounding path so it sees the actual screen layout.
  const isPositionalVisual =
    /\b(first|second|third|fourth|1st|2nd|3rd|top|bottom|left|right|thumbnail|video|picture|image|avatar|icon|card)\b/i.test(
      goal
    );

  if (isPositionalVisual || elements.length === 0) {
    return {
      choiceId: 'VISION_FALLBACK',
      probability: 0.95,
      actionType: 'click',
      targetDescription: goal,
      latencyMs: Math.round(performance.now() - t0),
    };
  }

  const compactState = elements
    .slice(0, 90)
    .map((el) => `[${el.id}] ${el.role} "${el.label}" @(${el.x},${el.y})`)
    .join('\n');

  const historyStr = history.length > 0 ? `Completed steps: ${history.join(' -> ')}` : 'Step 1';

  // 1. Optional TypeSafe AI (Jev) Backend
  if (typesafeKey) {
    try {
      const res = await fetch('https://api.typesafe.ai/v1/jev/decide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typesafeKey}`,
        },
        body: JSON.stringify({
          model: 'jev-1.13.0',
          state: `Goal: ${goal}\n${historyStr}\n\nVisible Screen Elements:\n${compactState}`,
          questions: [
            {
              type: 'Choice',
              id: 'next_element',
              prompt: 'Which element ID should be clicked next, VISION if not in list, or DONE if finished?',
              options: [...elements.map((e) => String(e.id)), 'VISION', 'DONE'],
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const topChoice = data?.answers?.next_element;
        if (topChoice?.value === 'VISION' || (topChoice?.probability ?? 0) < 0.72) {
          return {
            choiceId: 'VISION_FALLBACK',
            probability: 0.9,
            actionType: 'click',
            targetDescription: goal,
            latencyMs: Math.round(performance.now() - t0),
          };
        }
        return {
          choiceId: topChoice?.value === 'DONE' ? 'DONE' : Number(topChoice?.value),
          probability: topChoice?.probability ?? 0.9,
          actionType: topChoice?.value === 'DONE' ? 'done' : 'click',
          latencyMs: Math.round(performance.now() - t0),
        };
      }
    } catch (_) {}
  }

  // 2. Fast Classifier with Vision Fallback Option
  const prompt = `Goal: "${goal}"
${historyStr}

Accessible UI Elements (ID, Role, Label, Coords):
${compactState}

Rules:
- If the exact target element is clearly in the list above, return its numeric "id" and "p" >= 0.75.
- If the target is not in the list or requires looking at visual layout (like video thumbnails or web cards), return "id": "VISION".
- If the goal is already complete, return "id": "DONE".
- If the user wants to type text into the element, include "action": "type" and "text": "<text to type>".

Output ONLY valid JSON:
{"id": 0, "p": 0.95, "action": "click", "text": "", "pressEnter": false}`;

  for (const model of FAST_CLASSIFIER_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 60,
            },
          }),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.id === 'DONE' || parsed.action === 'done') {
          return {
            choiceId: 'DONE',
            probability: 1,
            actionType: 'done',
            latencyMs: Math.round(performance.now() - t0),
          };
        }
        if (parsed.id === 'VISION' || Number(parsed.p ?? 0) < 0.72) {
          return {
            choiceId: 'VISION_FALLBACK',
            probability: 0.9,
            actionType: parsed.text ? 'type' : 'click',
            targetDescription: goal,
            textToType: parsed.text || undefined,
            pressEnter: Boolean(parsed.pressEnter),
            latencyMs: Math.round(performance.now() - t0),
          };
        }
        return {
          choiceId: Number(parsed.id),
          probability: Number(parsed.p ?? 0.88),
          actionType: parsed.text ? 'type' : 'click',
          textToType: parsed.text || undefined,
          pressEnter: Boolean(parsed.pressEnter),
          latencyMs: Math.round(performance.now() - t0),
        };
      }
    } catch (_) {}
  }

  return {
    choiceId: 'VISION_FALLBACK',
    probability: 0.85,
    actionType: 'click',
    targetDescription: goal,
    latencyMs: Math.round(performance.now() - t0),
  };
}

/**
 * Executes a single direct click, double-click, right-click, or typing task
 * using the Hybrid Jev UIAutomation + Multimodal Vision (`findTargetOnScreen`) detector.
 */
export async function executeDirectComputerAction(
  params: {
    actionType: 'click' | 'double_click' | 'right_click' | 'type';
    target?: string;
    textToType?: string;
    pressEnter?: boolean;
  },
  apiKey: string,
  onStatusUpdate?: (status: string) => void,
  onHighlightTarget?: (rect: { x: number; y: number; width: number; height: number; label: string }) => void
): Promise<{ success: boolean; summary: string }> {
  const api = (window as any).hitodamaAPI;
  if (!api) return { success: false, summary: 'Desktop bridge unavailable.' };

  const targetDesc = (params.target || '').trim();
  const textToType = (params.textToType || '').trim();

  // Case 1: Pure typing into the currently focused field/editor (no target click needed)
  if (params.actionType === 'type' && !targetDesc && textToType) {
    onStatusUpdate?.('Typing text...');
    if (api.executeUIAction) {
      await api.executeUIAction({
        action: 'type_direct',
        text: textToType,
        pressEnter: Boolean(params.pressEnter),
      });
    } else {
      await api.typeText?.(textToType);
    }
    return { success: true, summary: `Typed "${textToType.slice(0, 32)}".` };
  }

  // Case 2: Locate the target on screen via Hybrid Jev UIAutomation + Vision Grounding
  onStatusUpdate?.(`Locating ${targetDesc || 'target'}...`);

  // Step 2A: Try Jev Classifier over UIAutomation tree first if non-visual/non-positional
  let targetCoords: { x: number; y: number; width: number; height: number; label: string } | null = null;
  const isPositional =
    /\b(first|second|third|fourth|1st|2nd|3rd|top|bottom|left|right|video|thumbnail|image|picture|card)\b/i.test(
      targetDesc
    );

  if (!isPositional && api.scanUIElements) {
    try {
      const scanRes = await api.scanUIElements();
      const elements: UIElementNode[] = scanRes?.elements || [];
      if (elements.length > 0) {
        const decision = await classifyNextElement(targetDesc, elements, [], apiKey);
        if (typeof decision.choiceId === 'number') {
          const matched = elements.find((e) => e.id === decision.choiceId);
          if (matched) {
            targetCoords = {
              x: matched.x,
              y: matched.y,
              width: matched.w,
              height: matched.h,
              label: matched.label,
            };
          }
        }
      }
    } catch (_) {}
  }

  // Step 2B: Multimodal Vision Grounding (same `box_2d` engine as Lasso / Point-Out)
  if (!targetCoords && targetDesc) {
    const found = await findTargetOnScreen(targetDesc, apiKey);
    if (found) {
      targetCoords = {
        x: found.x,
        y: found.y,
        width: found.width,
        height: found.height,
        label: found.label,
      };
    }
  }

  if (!targetCoords) {
    return { success: false, summary: `Could not find "${targetDesc}" on screen.` };
  }

  onHighlightTarget?.(targetCoords);
  onStatusUpdate?.(
    params.actionType === 'type'
      ? `Typing into ${targetCoords.label}...`
      : `Clicking ${targetCoords.label}...`
  );

  const execRes = await api.executeUIAction?.({
    action: params.actionType,
    x: targetCoords.x,
    y: targetCoords.y,
    text: textToType || undefined,
    pressEnter: Boolean(params.pressEnter),
  });

  if (execRes?.aborted) {
    return { success: false, summary: 'Aborted.' };
  }

  return {
    success: true,
    summary:
      params.actionType === 'type'
        ? `Typed into ${targetCoords.label}.`
        : `Clicked ${targetCoords.label}.`,
  };
}

/**
 * Multi-step Closed-Loop Runner (Hybrid Jev UIAutomation + Vision Fallback)
 */
export async function runFastComputerUseLoop(
  goal: string,
  apiKey: string,
  onStatusUpdate: (status: string) => void,
  maxSteps = 5,
  onHighlightTarget?: (rect: { x: number; y: number; width: number; height: number; label: string }) => void
): Promise<{ success: boolean; summary: string }> {
  const api = (window as any).hitodamaAPI;
  if (!api?.executeUIAction) {
    return { success: false, summary: 'Native UI worker not connected.' };
  }

  // For single-target commands (e.g. "play the first video", "click subscribe", "type hello in search"),
  // execute directly with Hybrid Jev + Vision so it completes in one fast pass.
  const singleStepRes = await executeDirectComputerAction(
    {
      actionType: 'click',
      target: goal,
    },
    apiKey,
    onStatusUpdate,
    onHighlightTarget
  );

  if (singleStepRes.success) {
    return singleStepRes;
  }

  return { success: false, summary: singleStepRes.summary };
}
