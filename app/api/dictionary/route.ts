import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'word query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      throw new Error('dictionary fetch failed');
    }

    const data = (await response.json()) as {
      data?: Array<{
        slug: string;
        jlpt?: string[];
        japanese?: Array<{ word?: string; reading?: string }>;
        senses?: Array<{ english_definitions?: string[]; parts_of_speech?: string[] }>;
      }>;
    };

    const first = data.data?.[0];
    if (!first) {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({
      result: {
        word: first.japanese?.[0]?.word ?? first.slug,
        reading: first.japanese?.[0]?.reading ?? '—',
        meaning: first.senses?.[0]?.english_definitions?.slice(0, 3).join(', ') ?? '—',
        jlpt: first.jlpt?.[0]?.replace('jlpt-', 'N') ?? 'Unknown',
        example: `${first.japanese?.[0]?.word ?? first.slug} を使った例文を作って練習しましょう。`
      }
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
