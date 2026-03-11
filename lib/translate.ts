export async function translateLine(text: string): Promise<string> {
  if (!text.trim()) return '';

  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'ja', target: 'en', format: 'text' })
    });

    if (!response.ok) {
      throw new Error('Translation unavailable');
    }

    const data = (await response.json()) as { translatedText?: string };
    return data.translatedText ?? '(translation unavailable)';
  } catch {
    return '(translation unavailable)';
  }
}
