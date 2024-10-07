export const ITEMS_PER_API = 25;

export const citationCache: {
  [doi: string]: { count: number; timestamp: number };
} = {};

export const getCachedCitationCount = (doi: string): number | null => {
  const cached = citationCache[doi];
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.count;
  }
  return null;
};

export const setCachedCitationCount = (doi: string, count: number) => {
  citationCache[doi] = { count, timestamp: Date.now() };
};
