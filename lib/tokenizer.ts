import kuromoji from 'kuromoji';

export type TokenInfo = {
  surface: string;
  reading: string;
  base: string;
  pos: string;
  meaning: string;
};

let tokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;

const fallbackDict: Record<string, string> = {
  問題: 'problem',
  質問: 'question',
  聞く: 'to listen',
  ください: 'please',
  まず: 'first'
};

function toHiragana(reading: string): string {
  return reading.replace(/[ァ-ン]/g, (m) => String.fromCharCode(m.charCodeAt(0) - 0x60));
}

export async function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
        if (err || !tokenizer) {
          reject(err);
          return;
        }
        resolve(tokenizer);
      });
    });
  }

  return tokenizerPromise;
}

export async function tokenizeJapanese(text: string): Promise<TokenInfo[]> {
  const tokenizer = await getTokenizer();
  return tokenizer.tokenize(text).map((token) => {
    const base = token.basic_form === '*' ? token.surface_form : token.basic_form;
    const reading = token.reading === '*' ? token.surface_form : toHiragana(token.reading);
    return {
      surface: token.surface_form,
      reading,
      base,
      pos: token.pos,
      meaning: fallbackDict[base] ?? fallbackDict[token.surface_form] ?? '—'
    };
  });
}
