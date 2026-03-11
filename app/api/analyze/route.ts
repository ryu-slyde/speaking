import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { extractVideoId } from '@/lib/youtube';
import { tokenizeJapanese } from '@/lib/tokenizer';
import { translateLine } from '@/lib/translate';

type TranscriptRow = {
  text: string;
  offset: number;
  duration: number;
};

export async function POST(request: Request) {
  const { url } = (await request.json()) as { url?: string };

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  try {
    const transcript = (await YoutubeTranscript.fetchTranscript(videoId)) as TranscriptRow[];

    const lines = await Promise.all(
      transcript.map(async (line) => ({
        text: line.text,
        start: line.offset / 1000,
        end: (line.offset + line.duration) / 1000,
        tokens: await tokenizeJapanese(line.text),
        translation: await translateLine(line.text)
      }))
    );

    return NextResponse.json({ videoId, lines });
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not load transcript for this video. Try a video with public Japanese captions.'
      },
      { status: 500 }
    );
  }
}
