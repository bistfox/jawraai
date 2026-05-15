export type SpeechRecLang = 'bn-BD' | 'en-US';

export function getSpeechRecognitionCtor(): new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
} | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) ?? null;
}

export function isSpeechRecognitionAvailable(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function startSpeechRecognition(options: {
  lang: SpeechRecLang;
  continuous?: boolean;
  interimResults?: boolean;
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}): { stop: () => void } | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    options.onError?.('Speech recognition is not supported in this browser.');
    return null;
  }
  const rec = new Ctor();
  rec.lang = options.lang;
  rec.continuous = options.continuous ?? false;
  rec.interimResults = options.interimResults ?? true;
  rec.onresult = (ev: any) => {
    let chunk = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      chunk += ev.results[i][0].transcript;
    }
    if (chunk) {
      const last = ev.results[ev.results.length - 1];
      options.onResult(chunk.trim(), last.isFinal);
    }
  };
  rec.onerror = (ev: any) => {
    if (ev.error === 'aborted' || ev.error === 'no-speech') return;
    options.onError?.(ev.message || ev.error);
  };
  rec.onend = () => options.onEnd?.();
  try {
    rec.start();
  } catch (e: any) {
    options.onError?.(e?.message ?? 'Could not start microphone');
    return null;
  }
  return {
    stop: () => {
      try {
        rec.stop();
      } catch {
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
      }
    },
  };
}
