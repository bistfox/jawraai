'use client';

import * as React from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { isSpeechSynthesisAvailable, pickSpeechLang, speakText, stopSpeech } from '@/lib/speech';
import { downloadTextFile } from '@/lib/blob-utils';
import { Volume2, Square, Download, Mic } from 'lucide-react';

export default function VoiceStudioPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [lang, setLang] = React.useState<'auto' | 'bn-BD' | 'en-US'>('auto');
  const [rate, setRate] = React.useState([1]);
  const [pitch, setPitch] = React.useState([1]);
  const [speaking, setSpeaking] = React.useState(false);

  if (!user) return null;

  const resolvedLang = lang === 'auto' ? pickSpeechLang(text || 'a') : lang;

  const handleSpeak = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: 'Empty text', description: 'Type something first.', variant: 'destructive' });
      return;
    }
    if (!isSpeechSynthesisAvailable()) {
      toast({
        title: 'Not supported',
        description: 'Your browser does not support speech synthesis.',
        variant: 'destructive',
      });
      return;
    }
    setSpeaking(true);
    speakText(trimmed, {
      lang: resolvedLang,
      rate: rate[0],
      pitch: pitch[0],
      onEnd: () => setSpeaking(false),
    });
  };

  const handleStop = () => {
    stopSpeech();
    setSpeaking(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl md:text-5xl">Text to speech</h1>
        <p className="text-muted-foreground text-lg">
          Preview voice in your browser (free). Download your script as a <strong>.txt</strong> file — no cloud API
          required.
        </p>
      </header>

      <Card className="border-primary/20 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice studio
          </CardTitle>
          <CardDescription>
            Works best in Chrome / Edge. Use chat for microphone voice-to-text while typing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tts-text">Text</Label>
            <Textarea
              id="tts-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="লিখুন বা ইংরেজি টেক্সট পেস্ট করুন..."
              className="min-h-[160px] text-base"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as typeof lang)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (BN / EN)</SelectItem>
                  <SelectItem value="bn-BD">Bangla (bn-BD)</SelectItem>
                  <SelectItem value="en-US">English (en-US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rate ({rate[0].toFixed(1)}×)</Label>
              <Slider min={0.6} max={1.4} step={0.1} value={rate} onValueChange={setRate} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Pitch ({pitch[0].toFixed(1)})</Label>
              <Slider min={0.6} max={1.4} step={0.1} value={pitch} onValueChange={setPitch} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={speaking ? handleStop : handleSpeak} disabled={!isSpeechSynthesisAvailable()}>
              {speaking ? (
                <>
                  <Square className="mr-2 h-4 w-4 fill-current" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" /> Preview voice
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const t = text.trim();
                if (!t) {
                  toast({ title: 'Nothing to download', variant: 'destructive' });
                  return;
                }
                downloadTextFile(t, `jawra-speech-${Date.now()}.txt`);
                toast({ title: 'Download started', description: 'Saved as plain text (.txt).' });
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download .txt
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/chat/history">Back to chats</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
