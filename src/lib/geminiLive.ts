/**
 * Gemini Live WebSocket Client (Unlimited RPM / Unlimited RPD)
 * Provides bidirectional low-latency audio/text streaming with native voices (Charon, Aoede, etc.)
 */

export interface GeminiLiveConfig {
  apiKey: string;
  voiceName?: 'Charon' | 'Aoede' | 'Puck' | 'Fenrir' | 'Kore';
  model?: string;
  systemInstruction?: string;
  tools?: any[];
  onAudioData?: (base64Audio: string) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  onToolCall?: (functionCall: { name: string; args: Record<string, any> }) => void;
  onError?: (err: any) => void;
  onClose?: () => void;
}

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private config: GeminiLiveConfig;
  private isConnected = false;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const apiKey = this.config.apiKey.trim();
      if (!apiKey) {
        return reject(new Error('MISSING_API_KEY'));
      }

      const host = 'generativelanguage.googleapis.com';
      const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
      const url = `wss://${host}${path}?key=${encodeURIComponent(apiKey)}`;

      try {
        this.ws = new WebSocket(url);
      } catch (err) {
        return reject(err);
      }

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sendSetupHandshake();
        resolve(true);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (err) => {
        if (this.config.onError) this.config.onError(err);
        if (!this.isConnected) reject(err);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.config.onClose) this.config.onClose();
      };
    });
  }

  private sendSetupHandshake() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupPayload = {
      setup: {
        model: this.config.model || 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['AUDIO', 'TEXT'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName || 'Charon',
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text:
                this.config.systemInstruction ||
                'You are Hitodama, an ultra-fast, witty desktop soul companion in the Windows Dynamic Island. Keep spoken answers concise and helpful.',
            },
          ],
        },
        tools: this.config.tools || [],
      },
    };

    this.ws.send(JSON.stringify(setupPayload));
  }

  private handleMessage(rawData: any) {
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : null;
      if (!parsed) return;

      const serverContent = parsed.serverContent;
      if (serverContent?.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          if (part.text && this.config.onTranscript) {
            this.config.onTranscript(part.text, false);
          }
          if (part.inlineData?.data && this.config.onAudioData) {
            this.config.onAudioData(part.inlineData.data);
          }
        }
      }

      if (parsed.toolCall?.functionCalls) {
        for (const fc of parsed.toolCall.functionCalls) {
          if (this.config.onToolCall) {
            this.config.onToolCall({
              name: fc.name,
              args: fc.args || {},
            });
          }
        }
      }
    } catch (err) {
      console.warn('[GeminiLive] Failed to parse incoming WebSocket frame:', err);
    }
  }

  public sendAudioChunk(base64Pcm: string, rate: number = 16000) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: `audio/pcm;rate=${rate}`,
            data: base64Pcm,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(msg));
  }

  public sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const msg = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(msg));
  }

  public close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
  }
}
