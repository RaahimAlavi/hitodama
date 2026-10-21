// src/lib/multitaskAgent.ts
import { queryGemini } from './gemini';
import { soundFX } from './soundFX';
import { searchTavily } from './tavily';

export type TaskStatus = 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED';
export type TaskKind =
  | 'CLONE_PAGE'
  | 'BUILD_PAGE'
  | 'SAVE_INSPO'
  | 'NOTION_DATABASE'
  | 'DATA_FETCH'
  | 'APP_WORKFLOW'
  | 'GENERAL';

export interface AgentTask {
  id: string;
  prompt: string;
  kind: TaskKind;
  appId?: string;
  status: TaskStatus;
  progress: number;
  stepText: string;
  resultText?: string;
  generatedHtml?: string;
  artifactFile?: string;
  createdAt: number;
}

export interface InspirationItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  archetype: string;
  colors: string[];
  summary: string;
  screenshot?: string;
  notionUrl?: string;
  createdAt: number;
}

export interface DetectedAppConfig {
  id: 'github' | 'notion' | 'vscode' | 'figma' | 'gmail';
  name: string;
  tagline: string;
  accentColor: string;
  secondaryColor: string;
  bgGradient: string;
  pillBorder: string;
  suggestions: string[];
}

export const APP_INTEGRATIONS: Record<DetectedAppConfig['id'], DetectedAppConfig> = {
  notion: {
    id: 'notion',
    name: 'Notion',
    tagline: 'Workspace Soul Link',
    accentColor: '#F59E0B',
    secondaryColor: '#E7E5E4',
    bgGradient:
      'radial-gradient(120% 140% at 88% 100%, rgba(245, 158, 11, 0.24) 0%, rgba(214, 211, 209, 0.10) 42%, rgba(13, 14, 18, 0.96) 85%), linear-gradient(90deg, #0B0C10 0%, #171615 100%)',
    pillBorder: 'rgba(245, 158, 11, 0.35)',
    suggestions: [
      'Create a database of award-winning websites',
      'Summarize this page into bullets',
      'Extract action items to Today',
      'Draft weekly sprint notes',
      'Organize messy meeting notes',
    ],
  },
  github: {
    id: 'github',
    name: 'GitHub',
    tagline: 'Repository Soul Link',
    accentColor: '#A855F7',
    secondaryColor: '#38BDF8',
    bgGradient:
      'radial-gradient(120% 140% at 88% 100%, rgba(168, 85, 247, 0.28) 0%, rgba(56, 189, 248, 0.14) 45%, rgba(10, 11, 16, 0.96) 85%), linear-gradient(90deg, #090A10 0%, #12101B 100%)',
    pillBorder: 'rgba(168, 85, 247, 0.38)',
    suggestions: [
      'Summarize open PRs',
      'Find issues about this bug',
      'Draft a release checklist',
      'Review recent CI failures',
      'Generate changelog from commits',
    ],
  },
  vscode: {
    id: 'vscode',
    name: 'VS Code',
    tagline: 'Codebase Soul Link',
    accentColor: '#38BDF8',
    secondaryColor: '#0284C7',
    bgGradient:
      'radial-gradient(120% 140% at 88% 100%, rgba(56, 189, 248, 0.28) 0%, rgba(2, 132, 199, 0.16) 45%, rgba(9, 12, 18, 0.96) 85%), linear-gradient(90deg, #080B11 0%, #0C1524 100%)',
    pillBorder: 'rgba(56, 189, 248, 0.38)',
    suggestions: [
      'Explain active file architecture',
      'Find performance bottlenecks',
      'Generate unit tests for module',
      'Refactor selected component',
    ],
  },
  figma: {
    id: 'figma',
    name: 'Figma',
    tagline: 'Design Canvas Soul Link',
    accentColor: '#F43F5E',
    secondaryColor: '#A855F7',
    bgGradient:
      'radial-gradient(120% 140% at 88% 100%, rgba(244, 63, 94, 0.26) 0%, rgba(168, 85, 247, 0.18) 45%, rgba(12, 10, 16, 0.96) 85%), linear-gradient(90deg, #0B0910 0%, #1A1018 100%)',
    pillBorder: 'rgba(244, 63, 94, 0.38)',
    suggestions: [
      'Convert selected frame to React + CSS',
      'Audit contrast & typography hierarchy',
      'Save frame to Inspiration Database',
      'Export design tokens to CSS variables',
    ],
  },
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    tagline: 'Inbox Soul Link',
    accentColor: '#FB7185',
    secondaryColor: '#FBBF24',
    bgGradient:
      'radial-gradient(120% 140% at 88% 100%, rgba(234, 67, 53, 0.26) 0%, rgba(251, 191, 36, 0.14) 45%, rgba(14, 10, 12, 0.96) 85%), linear-gradient(90deg, #0D090B 0%, #1B1012 100%)',
    pillBorder: 'rgba(251, 113, 133, 0.38)',
    suggestions: [
      'Summarize unread threads',
      'Draft a concise executive reply',
      'Extract deadlines to To-Do list',
      'Find attachments from this week',
    ],
  },
};

const HTML_BUILDER_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3-flash',
  'gemini-3.1-flash-lite',
];

/**
 * Dedicated High-Token Vision + HTML Generator (8192 output tokens, no tool-call restrictions)
 * Ensures every cloned or generated website matches the actual screenshot or prompt uniquely!
 */
async function generateCustomHtmlWithGemini(
  promptText: string,
  apiKey: string,
  screenshotDataUrl?: string
): Promise<string> {
  if (!apiKey || !apiKey.trim()) return '';

  const parts: any[] = [{ text: promptText }];
  if (screenshotDataUrl && screenshotDataUrl.includes('base64,')) {
    const [header, base64Data] = screenshotDataUrl.split('base64,');
    const mimeMatch = header.match(/data:(.*?);/);
    parts.push({
      inlineData: {
        mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg',
        data: base64Data,
      },
    });
  }

  for (const model of HTML_BUILDER_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || '')
          .join('\n') || '';

      const htmlMatch =
        rawText.match(/<!DOCTYPE html>[\s\S]*<\/html>/i) ||
        rawText.match(/<html[\s\S]*<\/html>/i);
      if (htmlMatch) return htmlMatch[0];

      const stripped = rawText.replace(/```html|```/gi, '').trim();
      if (stripped.includes('<body') || stripped.includes('<div')) {
        return stripped.startsWith('<!DOCTYPE') ? stripped : `<!DOCTYPE html>\n<html>\n${stripped}\n</html>`;
      }
    } catch (_) {}
  }

  return '';
}

class MultitaskAgentManager {
  private tasks: AgentTask[] = [];
  private inspirations: InspirationItem[] = [];
  private listeners: Set<(tasks: AgentTask[]) => void> = new Set();
  private inspoListeners: Set<(items: InspirationItem[]) => void> = new Set();
  private connectedApps: Set<string> = new Set();
  private dismissedApps: Map<string, number> = new Map();
  private progressIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedApps = JSON.parse(localStorage.getItem('hitodama_connected_apps') || '[]');
        if (Array.isArray(savedApps)) {
          savedApps.forEach((id: string) => this.connectedApps.add(id));
        }
      } catch (_) {}

      try {
        const savedTasks = JSON.parse(localStorage.getItem('hitodama_agent_tasks') || '[]');
        if (Array.isArray(savedTasks)) {
          const realTasks = savedTasks.filter(
            (t: any) =>
              t &&
              t.id &&
              !String(t.id).startsWith('seed-') &&
              !String(t.id).startsWith('seed_') &&
              t.status === 'COMPLETED'
          );
          this.tasks = realTasks.slice(0, 8);
          localStorage.setItem('hitodama_agent_tasks', JSON.stringify(this.tasks));
        }
      } catch (_) {
        this.tasks = [];
      }

      try {
        const savedInspo = JSON.parse(localStorage.getItem('hitodama_inspirations') || '[]');
        if (Array.isArray(savedInspo)) {
          this.inspirations = savedInspo;
        }
      } catch (_) {}
    }
  }

  public subscribe(cb: (tasks: AgentTask[]) => void): () => void {
    this.listeners.add(cb);
    cb([...this.tasks]);
    return () => this.listeners.delete(cb);
  }

  public subscribeInspirations(cb: (items: InspirationItem[]) => void): () => void {
    this.inspoListeners.add(cb);
    cb([...this.inspirations]);
    return () => this.inspoListeners.delete(cb);
  }

  private notify() {
    const snapshot = [...this.tasks];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hitodama_agent_tasks', JSON.stringify(snapshot.slice(0, 10)));
      } catch (_) {}
    }
    this.listeners.forEach((cb) => cb(snapshot));
  }

  private notifyInspo() {
    const snapshot = [...this.inspirations];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hitodama_inspirations', JSON.stringify(snapshot.slice(0, 30)));
      } catch (_) {}
    }
    this.inspoListeners.forEach((cb) => cb(snapshot));
  }

  public getInspirations(): InspirationItem[] {
    return [...this.inspirations];
  }

  public deleteInspiration(id: string) {
    this.inspirations = this.inspirations.filter((i) => i.id !== id);
    this.notifyInspo();
  }

  public isAppConnected(appId: string): boolean {
    return this.connectedApps.has(appId);
  }

  public getConnectedApps(): string[] {
    return Array.from(this.connectedApps);
  }

  public connectApp(appId: string) {
    this.connectedApps.add(appId);
    this.dismissedApps.delete(appId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'hitodama_connected_apps',
        JSON.stringify(Array.from(this.connectedApps))
      );
    }
    soundFX.playSuccessChime();
    this.notify();
  }

  public unlinkApp(appId: string) {
    this.connectedApps.delete(appId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'hitodama_connected_apps',
        JSON.stringify(Array.from(this.connectedApps))
      );
    }
    soundFX.playToggle(false);
    this.notify();
  }

  public dismissApp(appId: string, mode: 'NO' | 'NOT_NOW') {
    const duration = mode === 'NO' ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
    this.dismissedApps.set(appId, Date.now() + duration);
    soundFX.playCollapse();
  }

  public shouldPromptForApp(appId: string): boolean {
    const snoozeUntil = this.dismissedApps.get(appId);
    if (snoozeUntil && Date.now() < snoozeUntil) return false;
    return true;
  }

  /**
   * Accurate Intent Classifier:
   * Distinguishes Notion databases / research Lists from actual Website Building or Screen Cloning!
   */
  public detectTaskKind(prompt: string): TaskKind {
    const lower = prompt.toLowerCase();

    // 1. Notion Database / Workspace Table / Award Website Collection in Notion
    if (
      lower.includes('notion') ||
      lower.includes('database') ||
      (lower.includes('list of') && lower.includes('website')) ||
      lower.includes('from awards') ||
      lower.includes('awwwards')
    ) {
      if (
        lower.includes('database') ||
        lower.includes('notion') ||
        lower.includes('table') ||
        lower.includes('list') ||
        lower.includes('awards')
      ) {
        return 'NOTION_DATABASE';
      }
    }

    // 2. Save current screen page to Inspiration DB
    if (
      (lower.includes('save') || lower.includes('bookmark') || lower.includes('add')) &&
      (lower.includes('inspo') || lower.includes('inspiration') || lower.includes('reference') || lower.includes('for later'))
    ) {
      return 'SAVE_INSPO';
    }

    // 3. Clone / Replicate the exact website currently visible on screen
    if (
      lower.includes('exact same') ||
      lower.includes('like this') ||
      lower.includes('clone') ||
      lower.includes('replicate') ||
      lower.includes('copy this') ||
      lower.includes('same website') ||
      lower.includes('same landing page') ||
      (lower.includes('like the') && (lower.includes('website') || lower.includes('page')))
    ) {
      return 'CLONE_PAGE';
    }

    // 4. Build a standalone new website/landing page (ONLY when not asking for a Notion database)
    if (
      (lower.includes('create') || lower.includes('build') || lower.includes('make') || lower.includes('design') || lower.includes('generate')) &&
      (lower.includes('landing page') || lower.includes('website') || lower.includes('webpage') || lower.includes('ui') || lower.includes('portfolio')) &&
      !lower.includes('database') &&
      !lower.includes('in notion') &&
      !lower.includes('in my notion')
    ) {
      return 'BUILD_PAGE';
    }

    return 'DATA_FETCH';
  }

  private updateTask(id: string, patch: Partial<AgentTask>) {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    this.notify();
  }

  // Smooth continuous progress bar ticker so the loading bar is NEVER static while working!
  private startSmoothProgress(id: string, maxCap = 92) {
    this.stopSmoothProgress(id);
    const interval = setInterval(() => {
      const target = this.tasks.find((t) => t.id === id);
      if (!target || target.status === 'COMPLETED' || target.status === 'FAILED') {
        this.stopSmoothProgress(id);
        return;
      }
      if (target.progress < maxCap) {
        const remaining = maxCap - target.progress;
        const step = Math.max(0.6, Math.min(2.4, remaining * 0.08));
        this.updateTask(id, {
          progress: Math.min(maxCap, Math.round((target.progress + step) * 10) / 10),
        });
      }
    }, 180);
    this.progressIntervals.set(id, interval);
  }

  private stopSmoothProgress(id: string) {
    const existing = this.progressIntervals.get(id);
    if (existing) {
      clearInterval(existing);
      this.progressIntervals.delete(id);
    }
  }

  public removeTask(id: string) {
    this.stopSmoothProgress(id);
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.notify();
  }

  public spawnTask(
    prompt: string,
    appId?: string,
    options?: { kind?: TaskKind; screenshot?: string }
  ): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const kind = options?.kind || this.detectTaskKind(prompt);

    const initialStep =
      kind === 'CLONE_PAGE'
        ? 'Capturing live website on screen for visual cloning...'
        : kind === 'NOTION_DATABASE'
        ? 'Researching entries & structuring Notion database...'
        : kind === 'SAVE_INSPO'
        ? 'Capturing page design tokens & saving to Inspo DB...'
        : kind === 'BUILD_PAGE'
        ? 'Architecting custom layout, palette & components...'
        : 'Initializing background agent worker...';

    const newTask: AgentTask = {
      id,
      prompt: prompt.trim(),
      kind,
      appId: appId || (kind === 'NOTION_DATABASE' ? 'notion' : undefined),
      status: 'RUNNING',
      progress: 8,
      stepText: initialStep,
      createdAt: Date.now(),
    };

    this.tasks = [newTask, ...this.tasks].slice(0, 8);
    this.notify();
    soundFX.playToggle(true);
    this.startSmoothProgress(id, 92);

    this.runWorkerFiber(newTask, options?.screenshot);
    return id;
  }

  private async runWorkerFiber(task: AgentTask, preCapturedScreenshot?: string) {
    const apiKey = localStorage.getItem('hitodama_gemini_key') || '';
    const api = (window as any).hitodamaAPI;

    try {
      // ======================================================================
      // WORKFLOW 1: NOTION DATABASE / AWARD WEBSITES CURATION & BACKEND SYNC
      // ======================================================================
      if (task.kind === 'NOTION_DATABASE') {
        this.connectApp('notion');
        this.updateTask(task.id, {
          status: 'RUNNING',
          progress: 22,
          stepText: 'Searching live web for award-winning websites & design references...',
        });

        const tavilyRes = await searchTavily(
          task.prompt.includes('website') || task.prompt.includes('award')
            ? 'best award winning websites Awwwards Godly siteinspire 2025 2026 design examples'
            : task.prompt,
          { depth: 'advanced', maxResults: 6 }
        );

        this.updateTask(task.id, {
          status: 'WAITING',
          progress: 54,
          stepText: 'Extracting website URLs, design archetypes & palettes for Notion...',
        });

        const curatePrompt = `The user asked: "${task.prompt}"
${tavilyRes ? `Live Web Research:\n${tavilyRes.results.map((r) => `- ${r.title} (${r.url}): ${r.content.slice(0, 200)}`).join('\n')}` : ''}

Generate a structured JSON array of 5 real, standout award-winning websites (or items matching the user's request) to populate their Notion Database and Inspiration Library.
Return ONLY valid JSON in this exact format:
{
  "databaseTitle": "Award-Winning Websites Directory",
  "entries": [
    {
      "title": "Linear",
      "url": "https://linear.app",
      "archetype": "Precision Dark Mode SaaS",
      "colors": ["#08090A", "#5E6AD2", "#F7F8F8"],
      "summary": "Sub-pixel borders, keyboard-first UI, and atmospheric radial lighting."
    }
  ]
}`;

        let parsedEntries: Array<{
          title: string;
          url: string;
          archetype: string;
          colors: string[];
          summary: string;
        }> = [];
        let dbTitle = 'Notion Inspiration Database';

        if (apiKey) {
          const res = await queryGemini(curatePrompt, apiKey);
          const rawText = res.text || res.speech || '';
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              if (parsed.databaseTitle) dbTitle = parsed.databaseTitle;
              if (Array.isArray(parsed.entries)) parsedEntries = parsed.entries;
            } catch (_) {}
          }
        }

        if (parsedEntries.length === 0) {
          parsedEntries = [
            {
              title: 'Linear',
              url: 'https://linear.app',
              archetype: 'Precision Dark Mode SaaS',
              colors: ['#08090A', '#5E6AD2', '#F7F8F8'],
              summary: 'Craft-driven issue tracking with 1px specular borders and command menus.',
            },
            {
              title: 'Raycast',
              url: 'https://raycast.com',
              archetype: 'Tactile Glassmorphic Launcher',
              colors: ['#07080A', '#FF6363', '#EDEFF2'],
              summary: 'High-contrast typography with glowing red-orange shader accents.',
            },
            {
              title: 'Stripe Press',
              url: 'https://press.stripe.com',
              archetype: '3D Editorial Book Showcase',
              colors: ['#111318', '#F59E0B', '#F8FAFC'],
              summary: 'Interactive WebGL book spines paired with classic editorial serif type.',
            },
            {
              title: 'Vercel',
              url: 'https://vercel.com',
              archetype: 'Minimalist Swiss Grid',
              colors: ['#000000', '#0070F3', '#FFFFFF'],
              summary: 'Exposed hairlines, monochrome contrast, and technical mono badges.',
            },
          ];
        }

        this.updateTask(task.id, {
          status: 'RUNNING',
          progress: 78,
          stepText: `Saving ${parsedEntries.length} curated websites to Inspiration DB & Notion...`,
        });

        // 1. Add all curated entries into Hitodama's Inspiration Database (`Inspo DB`)
        const newInspoItems: InspirationItem[] = parsedEntries.map((entry, idx) => ({
          id: `inspo_${Date.now()}_${idx}`,
          title: entry.title,
          url: entry.url,
          archetype: entry.archetype,
          colors: Array.isArray(entry.colors) ? entry.colors : ['#0B0D12', '#5CB8FF', '#FFFFFF'],
          summary: entry.summary,
          createdAt: Date.now() - idx * 1000,
        }));

        this.inspirations = [...newInspoItems, ...this.inspirations].slice(0, 30);
        this.notifyInspo();

        // 2. Sync to Notion API if credentials are set
        const notionKey = localStorage.getItem('hitodama_notion_key') || '';
        const notionDb = localStorage.getItem('hitodama_notion_db') || '';
        let syncedCount = 0;

        if (notionKey && notionDb && api?.syncToNotion) {
          for (const item of newInspoItems) {
            const syncRes = await api.syncToNotion({
              apiKey: notionKey,
              databaseId: notionDb,
              pageData: item,
            });
            if (syncRes?.success) syncedCount++;
          }
        }

        // 3. Also format a clean Notion Markdown Table and copy/paste it if Notion is open!
        const mdTable = [
          `# ${dbTitle}`,
          '',
          '| Website | URL | Design Archetype | Color Palette | Key Takeaway |',
          '| :--- | :--- | :--- | :--- | :--- |',
          ...newInspoItems.map(
            (i) =>
              `| **${i.title}** | ${i.url} | ${i.archetype} | \`${i.colors.join(', ')}\` | ${i.summary} |`
          ),
        ].join('\n');

        try {
          api?.writeClipboardText?.(mdTable);
          const fg = await api?.getActivePageContext?.();
          if (fg?.title?.toLowerCase().includes('notion') || fg?.process?.toLowerCase() === 'notion') {
            await api?.typeText?.(mdTable);
          }
        } catch (_) {}

        this.stopSmoothProgress(task.id);
        this.updateTask(task.id, {
          status: 'COMPLETED',
          progress: 100,
          stepText: 'Notion database ready',
          resultText:
            syncedCount > 0
              ? `Synced ${syncedCount} websites to Notion & saved to your Inspo DB.`
              : `Added ${newInspoItems.length} websites to your Inspo DB (and copied Notion table to clipboard).`,
        });
        soundFX.playSuccessChime();
        return;
      }

      // ======================================================================
      // WORKFLOW 2: CLONE THE EXACT WEBSITE CURRENTLY ON SCREEN (OR BUILD CUSTOM)
      // ======================================================================
      if (task.kind === 'CLONE_PAGE' || task.kind === 'BUILD_PAGE') {
        let screenshot = preCapturedScreenshot || '';
        let pageTitle = '';

        // Always capture the live screen if cloning or if user references "this website/page"
        const shouldCaptureScreen =
          task.kind === 'CLONE_PAGE' ||
          /\b(this|same|like|current|screen)\b/i.test(task.prompt);

        if (!screenshot && shouldCaptureScreen && api?.captureScreen) {
          this.updateTask(task.id, {
            status: 'RUNNING',
            progress: 20,
            stepText: 'Capturing live screenshot of the website on your screen...',
          });
          const [cap, ctxInfo] = await Promise.all([
            api.captureScreen(),
            api.getActivePageContext ? api.getActivePageContext() : Promise.resolve({ title: '' }),
          ]);
          if (cap?.success && cap.image) {
            screenshot = cap.image;
          }
          if (ctxInfo?.title) {
            pageTitle = ctxInfo.title;
          }
        }

        this.updateTask(task.id, {
          status: 'WAITING',
          progress: 45,
          stepText: screenshot
            ? `Reverse-engineering layout, colors & typography from ${pageTitle || 'screen'}...`
            : 'Designing custom layout, color system & interactive components...',
        });

        const visionClonePrompt = screenshot
          ? `You are an elite frontend engineer. Look closely at the attached screenshot of the website currently on the user's screen${pageTitle ? ` ("${pageTitle}")` : ''}.
User instruction: "${task.prompt}"

CRITICAL INSTRUCTIONS — DO NOT USE A GENERIC TEMPLATE:
1. Extract the EXACT background color (whether it is stark white #FFFFFF, warm cream, pastel, brutalist, or dark), text colors, primary/secondary brand accent colors, and border styles directly from the attached screenshot.
2. Replicate the exact navigation bar layout (logo placement, links, CTA button shape/color), hero section alignment (left-aligned split hero, centered editorial, bento grid, 3D showcase, etc.), font pairing (serif, geometric sans, or monospace), and card grid structure shown in the screenshot.
3. Incorporate any specific changes or ideas the user asked for in "${task.prompt}".
4. Output a complete, self-contained single-file HTML5 document using <script src="https://cdn.tailwindcss.com"></script> and Google Fonts.
5. Return ONLY raw <!DOCTYPE html>...</html> code with no markdown backticks.`
          : `You are an elite frontend engineer. Build a unique, custom single-file HTML5 + Tailwind CSS website for: "${task.prompt}".
CRITICAL INSTRUCTIONS — DO NOT USE A REPEATED GENERIC TEMPLATE:
1. Choose a bespoke color palette, typography pairing (Google Fonts), and layout architecture specifically tailored to "${task.prompt}" (e.g., warm editorial cream & serif for coffee/fashion/art; crisp light-mode Swiss grid for productivity/finance; vibrant neon brutalist for gaming/agency; etc.).
2. Build a complete multi-section page: custom navbar, distinctive hero section with interactive preview mockup, feature showcase, testimonials/metrics, and footer.
3. Include <script src="https://cdn.tailwindcss.com"></script>.
4. Return ONLY raw <!DOCTYPE html>...</html> code with no markdown backticks.`;

        const htmlCode = await generateCustomHtmlWithGemini(
          visionClonePrompt,
          apiKey,
          screenshot || undefined
        );

        if (!htmlCode) {
          throw new Error('Could not generate HTML. Check your Gemini API key.');
        }

        this.updateTask(task.id, {
          status: 'RUNNING',
          progress: 88,
          stepText: 'Launching live website in your browser...',
        });

        if (api?.openGeneratedPage) {
          await api.openGeneratedPage(htmlCode);
        }

        this.stopSmoothProgress(task.id);
        this.updateTask(task.id, {
          status: 'COMPLETED',
          progress: 100,
          stepText: 'Live in browser',
          resultText: screenshot
            ? `Cloned visual layout & palette from ${pageTitle || 'active screen'}.`
            : `Built custom website for "${task.prompt}".`,
          generatedHtml: htmlCode,
        });
        soundFX.playSuccessChime();
        return;
      }

      // ======================================================================
      // WORKFLOW 3: SAVE CURRENT SCREEN WEBSITE TO INSPIRATION DB (& NOTION)
      // ======================================================================
      if (task.kind === 'SAVE_INSPO') {
        this.updateTask(task.id, {
          status: 'RUNNING',
          progress: 26,
          stepText: 'Capturing active website & extracting design tokens...',
        });

        const [cap, ctxInfo] = await Promise.all([
          api?.captureScreen ? api.captureScreen() : Promise.resolve({ success: false, image: '' }),
          api?.getActivePageContext ? api.getActivePageContext() : Promise.resolve({ title: '' }),
        ]);

        const screenshot = cap?.image || '';
        let meta = {
          title: ctxInfo?.title || 'Saved Website Reference',
          url: '',
          archetype: 'Modern Web Layout',
          colors: ['#0F172A', '#38BDF8', '#F8FAFC'],
          summary: 'Captured from active screen for future landing page inspiration.',
        };

        if (apiKey && screenshot) {
          const analyzePrompt = `Analyze this website screenshot (Window title: "${ctxInfo?.title || ''}") and extract its design metadata.
Return ONLY valid JSON:
{
  "title": "Website Name",
  "archetype": "2-4 word layout & style archetype",
  "colors": ["#hexBg", "#hexPrimary", "#hexAccent", "#hexText"],
  "summary": "1 sentence explaining the layout structure and typography"
}`;
          const res = await queryGemini(analyzePrompt, apiKey, screenshot);
          const raw = res.text || res.speech || '';
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              meta = {
                ...meta,
                title: parsed.title || meta.title,
                archetype: parsed.archetype || meta.archetype,
                colors: Array.isArray(parsed.colors) ? parsed.colors.slice(0, 4) : meta.colors,
                summary: parsed.summary || meta.summary,
              };
            } catch (_) {}
          }
        }

        const item: InspirationItem = {
          id: `inspo_${Date.now()}`,
          title: meta.title,
          url: meta.url,
          archetype: meta.archetype,
          colors: meta.colors,
          summary: meta.summary,
          screenshot,
          createdAt: Date.now(),
        };

        this.inspirations = [item, ...this.inspirations].slice(0, 30);
        this.notifyInspo();

        this.stopSmoothProgress(task.id);
        this.updateTask(task.id, {
          status: 'COMPLETED',
          progress: 100,
          stepText: 'Saved to Inspiration DB',
          resultText: `${item.title} (${item.archetype}) saved to your Inspo DB.`,
        });
        soundFX.playSuccessChime();
        return;
      }

      // ======================================================================
      // WORKFLOW 4: LIVE WEB RESEARCH / GENERAL AGENT TASK
      // ======================================================================
      this.updateTask(task.id, {
        status: 'RUNNING',
        progress: 30,
        stepText: 'Searching live sources & analyzing context...',
      });

      const tavilyData = await searchTavily(task.prompt, { depth: 'advanced', maxResults: 5 });

      this.updateTask(task.id, {
        status: 'WAITING',
        progress: 65,
        stepText: 'Synthesizing findings...',
      });

      let summary = '';
      if (apiKey) {
        const contextStr = tavilyData
          ? `Live Web Results:\n${tavilyData.results.map((r) => `- ${r.title}:${r.content.slice(0, 220)}`).join('\n')}`
          : '';
        const res = await queryGemini(
          `Task: "${task.prompt}"\n${contextStr}\nProvide a direct, helpful 2-sentence answer.`,
          apiKey
        );
        summary = res.text || res.speech || '';
      } else if (tavilyData?.answer) {
        summary = tavilyData.answer;
      } else {
        summary = `Completed task: "${task.prompt}".`;
      }

      this.stopSmoothProgress(task.id);
      this.updateTask(task.id, {
        status: 'COMPLETED',
        progress: 100,
        stepText: 'Task complete',
        resultText: summary,
      });
      soundFX.playSuccessChime();
    } catch (err: any) {
      this.stopSmoothProgress(task.id);
      this.updateTask(task.id, {
        status: 'FAILED',
        progress: 100,
        stepText: 'Task interrupted',
        resultText: err?.message || 'Could not complete background task.',
      });
    }
  }
}

export const multitaskAgent = new MultitaskAgentManager();
