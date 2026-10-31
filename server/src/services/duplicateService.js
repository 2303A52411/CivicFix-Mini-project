import Issue from '../models/Issue.js';

const STOP_WORDS = new Set([
  'the', 'is', 'are', 'was', 'were', 'at', 'by', 'for', 'from', 'in', 'into',
  'of', 'on', 'to', 'with', 'and', 'or', 'not', 'near', 'beside', 'behind',
  'front', 'area', 'this', 'that', 'there', 'please', 'help', 'need', 'needs',
  'some', 'very', 'been', 'have', 'has', 'had', 'our', 'out', 'all', 'any'
]);

export const extractKeywords = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word));
};

const calculateWordOverlap = (wordsA, wordsB) => {
  if (!wordsA.length || !wordsB.length) return 0;
  const setB = new Set(wordsB);
  let matches = 0;
  for (const w of wordsA) {
    if (setB.has(w)) matches++;
  }
  return matches;
};

export const findPotentialDuplicates = async ({ title, category, locationText, excludeId = null }) => {
  if (!title || title.trim().length < 3) return [];

  const titleWords = extractKeywords(title);
  const locationWords = extractKeywords(locationText);

  // Only search active, unresolved issues (exclude 'Resolved' and 'Rejected')
  const filter = {
    status: { $in: ['Submitted', 'Under Review', 'In Progress'] }
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  // Find candidate issues in same category or matching keywords
  const candidates = await Issue.find(filter)
    .populate('reporterId', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

  const scored = [];

  for (const candidate of candidates) {
    const candTitleWords = extractKeywords(candidate.title);
    const candLocationWords = extractKeywords(candidate.locationText);

    const titleOverlap = calculateWordOverlap(titleWords, candTitleWords);
    const locationOverlap = calculateWordOverlap(locationWords, candLocationWords);
    const sameCategory = candidate.category === category;

    // Check exact normalized title
    const normInputTitle = title.trim().toLowerCase();
    const normCandTitle = candidate.title.trim().toLowerCase();
    const isExactTitle = normInputTitle === normCandTitle;

    let score = 0;
    const reasons = [];

    if (isExactTitle) {
      score += 65;
      reasons.push('Identical title');
    } else if (titleOverlap >= 2) {
      score += Math.min(titleOverlap * 20, 50);
      reasons.push(`Shared title keywords (${titleOverlap} matches)`);
    } else if (titleOverlap === 1 && candTitleWords.length <= 3) {
      score += 25;
      reasons.push('Key title match');
    }

    if (sameCategory) {
      score += 25;
      reasons.push(`Same category (${category})`);
    }

    if (locationOverlap >= 1) {
      score += Math.min(locationOverlap * 20, 30);
      reasons.push(`Matching location keywords (${candidate.locationText})`);
    }

    // Active status penalty/bonus: Active issues are much more likely duplicates than resolved ones
    if (['Submitted', 'Under Review', 'In Progress'].includes(candidate.status)) {
      score += 10;
      reasons.push(`Currently ${candidate.status}`);
    }

    // If score crosses confidence threshold (>= 45%), consider it a potential duplicate
    if (score >= 45) {
      scored.push({
        _id: candidate._id,
        title: candidate.title,
        category: candidate.category,
        locationText: candidate.locationText,
        priority: candidate.priority,
        status: candidate.status,
        imageUrl: candidate.imageUrl,
        createdAt: candidate.createdAt,
        reporterName: candidate.reporterId?.name || 'Reporter',
        similarityScore: Math.min(score, 100),
        matchReason: reasons.join(' • ')
      });
    }
  }

  // Sort by highest similarity first, then newest
  scored.sort((a, b) => b.similarityScore - a.similarityScore || new Date(b.createdAt) - new Date(a.createdAt));

  return scored.slice(0, 5);
};

