export function extractVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1) || null;
    }

    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const parts = url.pathname.split('/');
      const embedIdx = parts.findIndex((part) => part === 'embed');
      if (embedIdx >= 0) return parts[embedIdx + 1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}
