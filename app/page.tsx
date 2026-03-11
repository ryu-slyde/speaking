'use client';

import { useEffect, useMemo, useState } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';

type Token = {
  surface: string;
  reading: string;
  base: string;
  meaning: string;
};

type SubtitleLine = {
  text: string;
  start: number;
  end: number;
  translation: string;
  tokens: Token[];
};

type DictionaryResult = {
  word: string;
  reading: string;
  meaning: string;
  jlpt: string;
  example: string;
};

export default function Page() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWord, setSelectedWord] = useState('');
  const [wordInfo, setWordInfo] = useState<DictionaryResult | null>(null);

  useEffect(() => {
    if (!player) return;

    const timer = setInterval(() => {
      setCurrentTime(player.getCurrentTime?.() ?? 0);
    }, 200);

    return () => clearInterval(timer);
  }, [player]);

  const activeIndex = useMemo(
    () => lines.findIndex((line) => currentTime >= line.start && currentTime < line.end),
    [currentTime, lines]
  );

  const activeLine = activeIndex >= 0 ? lines[activeIndex] : null;

  const analyzeVideo = async () => {
    setLoading(true);
    setError('');
    setWordInfo(null);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Unable to analyze video');
      setLoading(false);
      return;
    }

    setVideoId(data.videoId);
    setLines(data.lines);
    setLoading(false);
  };

  const loadWordInfo = async (word: string) => {
    setSelectedWord(word);
    const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
    const data = await response.json();
    setWordInfo(data.result);
  };

  return (
    <main className="min-h-screen bg-base text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 md:p-8">
        <h1 className="text-3xl font-bold">🎧 Japanese Listening Trainer (JLPT style)</h1>
        <p className="text-sm text-slate-300">Paste a YouTube URL to get synced captions, translation, and vocabulary insights.</p>

        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="rounded-lg bg-accent px-4 py-3 font-semibold text-slate-900 disabled:opacity-50"
            onClick={analyzeVideo}
            disabled={loading || !url}
          >
            {loading ? 'Analyzing...' : 'Load'}
          </button>
        </div>

        {error && <p className="rounded-lg bg-red-900/40 p-3 text-red-200">{error}</p>}

        {videoId && (
          <div className="grid gap-4">
            <section className="overflow-hidden rounded-xl border border-slate-700">
              <YouTube
                videoId={videoId}
                className="aspect-video w-full"
                iframeClassName="h-full w-full"
                onReady={(event: YouTubeEvent) => setPlayer(event.target)}
                opts={{ playerVars: { autoplay: 0 } }}
              />
            </section>

            <section className="rounded-xl bg-card p-4">
              <h2 className="text-sm uppercase tracking-wide text-slate-400">Current subtitle</h2>
              <p className="mt-2 text-3xl font-semibold text-white">{activeLine?.text ?? 'Play the video to start subtitle sync.'}</p>
            </section>

            <section className="rounded-xl bg-card p-4">
              <h2 className="text-sm uppercase tracking-wide text-slate-400">Word-by-word breakdown</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(activeLine?.tokens ?? []).map((token, idx) => (
                  <button
                    key={`${token.surface}-${idx}`}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-left hover:border-accent"
                    onClick={() => loadWordInfo(token.base)}
                  >
                    <p className="text-xl font-bold">{token.surface}</p>
                    <p className="text-xs text-slate-300">{token.reading}</p>
                    <p className="text-xs text-accent">{token.meaning}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-card p-4">
              <h2 className="text-sm uppercase tracking-wide text-slate-400">Translation</h2>
              <p className="mt-2 text-xl">{activeLine?.translation ?? 'Translation will appear here.'}</p>
            </section>

            <section className="rounded-xl bg-card p-4">
              <h2 className="text-sm uppercase tracking-wide text-slate-400">Subtitles timeline (karaoke highlight)</h2>
              <div className="mt-2 max-h-60 space-y-2 overflow-y-auto pr-1">
                {lines.map((line, idx) => (
                  <p
                    key={`${line.start}-${idx}`}
                    className={`rounded px-2 py-1 ${
                      idx === activeIndex ? 'bg-accent/25 text-accent' : 'text-slate-300'
                    }`}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {selectedWord && wordInfo && (
        <aside className="fixed bottom-4 right-4 w-80 rounded-xl border border-slate-600 bg-slate-950 p-4 shadow-lg">
          <h3 className="text-lg font-semibold text-accent">{wordInfo.word}</h3>
          <p className="text-sm text-slate-300">Reading: {wordInfo.reading}</p>
          <p className="text-sm text-slate-300">Meaning: {wordInfo.meaning}</p>
          <p className="text-sm text-slate-300">JLPT: {wordInfo.jlpt}</p>
          <p className="mt-2 text-xs text-slate-400">Example: {wordInfo.example}</p>
        </aside>
      )}
    </main>
  );
}
