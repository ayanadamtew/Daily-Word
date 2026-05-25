// Daily passage suggestions - rotates through well-known and meaningful passages
// Uses date as seed so all users see the same suggestions on the same day

const suggestions = [
  { book: 'Psalms', chapter: '23', verse: '', label: 'The Lord is My Shepherd' },
  { book: 'John', chapter: '3', verse: '16-21', label: 'For God So Loved the World' },
  { book: 'Romans', chapter: '8', verse: '28-39', label: 'More Than Conquerors' },
  { book: 'Philippians', chapter: '4', verse: '4-9', label: 'Rejoice in the Lord' },
  { book: 'Proverbs', chapter: '3', verse: '1-8', label: 'Trust in the Lord' },
  { book: 'Isaiah', chapter: '40', verse: '28-31', label: 'They Shall Mount Up' },
  { book: 'Matthew', chapter: '5', verse: '1-16', label: 'The Beatitudes' },
  { book: 'Genesis', chapter: '1', verse: '', label: 'In the Beginning' },
  { book: 'Ephesians', chapter: '6', verse: '10-18', label: 'Armor of God' },
  { book: '1 Corinthians', chapter: '13', verse: '', label: 'Love is Patient' },
  { book: 'Hebrews', chapter: '11', verse: '1-6', label: 'Faith is the Substance' },
  { book: 'James', chapter: '1', verse: '2-8', label: 'Count it All Joy' },
  { book: 'Psalms', chapter: '91', verse: '', label: 'Under His Wings' },
  { book: 'Jeremiah', chapter: '29', verse: '11-13', label: 'Plans to Prosper You' },
  { book: 'Romans', chapter: '12', verse: '1-2', label: 'Living Sacrifice' },
  { book: 'Matthew', chapter: '6', verse: '25-34', label: 'Do Not Worry' },
  { book: 'Psalms', chapter: '119', verse: '105-112', label: 'Lamp to My Feet' },
  { book: 'Galatians', chapter: '5', verse: '22-26', label: 'Fruit of the Spirit' },
  { book: 'Joshua', chapter: '1', verse: '1-9', label: 'Be Strong and Courageous' },
  { book: 'Colossians', chapter: '3', verse: '1-17', label: 'Set Your Minds Above' },
  { book: '2 Timothy', chapter: '3', verse: '16-17', label: 'All Scripture' },
  { book: 'Psalms', chapter: '46', verse: '', label: 'God is Our Refuge' },
  { book: 'Matthew', chapter: '28', verse: '16-20', label: 'The Great Commission' },
  { book: 'Isaiah', chapter: '53', verse: '', label: 'The Suffering Servant' },
  { book: 'Psalms', chapter: '139', verse: '1-18', label: 'You Know Me' },
  { book: 'John', chapter: '14', verse: '1-7', label: 'The Way, Truth, Life' },
  { book: 'Romans', chapter: '5', verse: '1-11', label: 'Peace with God' },
  { book: 'Psalm', chapter: '1', verse: '', label: 'Blessed is the One' },
  { book: 'Micah', chapter: '6', verse: '8', label: 'Do Justice, Love Mercy' },
  { book: '1 Peter', chapter: '5', verse: '6-11', label: 'Cast Your Anxiety' },
  { book: 'Deuteronomy', chapter: '6', verse: '4-9', label: 'The Shema' },
  { book: 'Luke', chapter: '15', verse: '11-32', label: 'The Prodigal Son' },
  { book: 'Ephesians', chapter: '2', verse: '1-10', label: 'Saved by Grace' },
  { book: 'Psalms', chapter: '27', verse: '', label: 'The Lord is My Light' },
  { book: 'Mark', chapter: '10', verse: '42-45', label: 'Servant of All' },
  { book: 'Revelation', chapter: '21', verse: '1-7', label: 'A New Heaven' },
  { book: 'Lamentations', chapter: '3', verse: '22-26', label: 'Great is Thy Faithfulness' },
  { book: 'Habakkuk', chapter: '3', verse: '17-19', label: 'Yet I Will Rejoice' },
  { book: 'John', chapter: '15', verse: '1-11', label: 'I Am the Vine' },
  { book: 'Psalms', chapter: '51', verse: '1-12', label: 'Create in Me' },
  { book: 'Matthew', chapter: '11', verse: '28-30', label: 'Come to Me' },
  { book: 'Acts', chapter: '2', verse: '1-13', label: 'Day of Pentecost' },
];

// Simple seeded random using date
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Get daily passage suggestions based on the current date.
 * Returns 4 suggestions that rotate daily.
 */
export function getDailySuggestions(date = new Date()) {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const seed = date.getFullYear() * 1000 + dayOfYear;

  // Pick 4 suggestions using seeded shuffle
  const indices = [];
  const used = new Set();

  for (let i = 0; i < 4; i++) {
    let idx;
    let attempt = 0;
    do {
      idx = Math.floor(seededRandom(seed + i + attempt * 100) * suggestions.length);
      attempt++;
    } while (used.has(idx) && attempt < 50);
    used.add(idx);
    indices.push(idx);
  }

  return indices.map((idx) => suggestions[idx % suggestions.length]);
}

export { suggestions };
