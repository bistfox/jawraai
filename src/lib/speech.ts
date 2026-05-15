/** Strip markdown links and URLs for clearer TTS output. */
export function prepareSpeechText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\*{1,2}|#{1,6}|`{1,3}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function textLooksBangla(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

export function pickSpeechLang(text: string): string {
  return textLooksBangla(text) ? 'bn-BD' : 'en-US';
}

export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

export function stopSpeech(): void {
  if (!isSpeechSynthesisAvailable()) return;
  window.speechSynthesis.cancel();
}

export function speakText(
  raw: string,
  options?: { onEnd?: () => void; lang?: string; rate?: number; pitch?: number }
): void {
  if (!isSpeechSynthesisAvailable()) {
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const cleaned = prepareSpeechText(raw);
  if (!cleaned) {
    options?.onEnd?.();
    return;
  }

  const lang = options?.lang ?? pickSpeechLang(raw);
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    const want = lang.toLowerCase().startsWith('bn') ? 'bn' : 'en';
    const v =
      voices.find((x) => x.lang.toLowerCase().includes(want)) ??
      voices.find((x) => x.default) ??
      voices[0];
    return v;
  };

  const run = () => {
    try {
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }

    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = lang;
    utter.rate = typeof options?.rate === 'number' ? Math.min(2, Math.max(0.5, options.rate)) : 1;
    utter.pitch = typeof options?.pitch === 'number' ? Math.min(2, Math.max(0.5, options.pitch)) : 1;
    const v = pickVoice();
    if (v) utter.voice = v;
    utter.onend = () => options?.onEnd?.();
    utter.onerror = () => options?.onEnd?.();
    window.speechSynthesis.speak(utter);
  };

  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  setTimeout(run, 0);
}
