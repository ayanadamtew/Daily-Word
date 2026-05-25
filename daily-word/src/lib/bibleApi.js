// Bible API integration using bible-api.com (free, no key required)
const VERSION_MAP = { KJV: 'kjv', NIV: 'web', ESV: 'web', NLT: 'web', WEB: 'web', ASV: 'asv' };
const BASE_URL = 'https://bible-api.com';

export async function fetchPassage(reference, version = 'KJV') {
  const translation = VERSION_MAP[version] || 'kjv';
  try {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(reference)}?translation=${translation}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return {
      reference: data.reference || reference,
      text: data.text || '',
      verses: (data.verses || []).map((v) => ({ book: v.book_name, chapter: v.chapter, verse: v.verse, text: v.text })),
      translation: translation.toUpperCase(),
    };
  } catch (error) {
    console.error('Bible API fetch failed:', error);
    return { reference, text: 'Unable to load passage.', verses: [], translation: translation.toUpperCase(), error: true };
  }
}

export function buildReference(book, chapter, verse) {
  let ref = `${book} ${chapter}`;
  if (verse) ref += `:${verse}`;
  return ref;
}

export async function fetchVerseOfTheDay(version = 'KJV') {
  const refs = ['John 3:16','Psalm 23:1','Romans 8:28','Philippians 4:13','Jeremiah 29:11','Proverbs 3:5-6','Isaiah 40:31','Psalm 46:10','Matthew 11:28','Galatians 5:22-23','Hebrews 11:1','Joshua 1:9','Psalm 119:105','Romans 12:2','2 Timothy 1:7','Ephesians 2:8-9','Psalm 37:4','Matthew 6:33','1 Peter 5:7','James 1:5','Psalm 91:1-2','Isaiah 41:10','Colossians 3:23','Micah 6:8','Romans 15:13','Psalm 27:1','2 Corinthians 5:17','Lamentations 3:22-23','Habakkuk 3:18','Psalm 139:14','John 14:6'];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return fetchPassage(refs[dayOfYear % refs.length], version);
}
