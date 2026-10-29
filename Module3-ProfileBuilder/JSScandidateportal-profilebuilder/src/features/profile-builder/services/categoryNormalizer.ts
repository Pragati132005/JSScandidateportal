import type { RadixCategoryCode, SkillConfidence } from '../types';
import { RADIX_CATEGORY_CODES } from '../types';

/**
 * Normalizes category hint strings to one of the 13 canonical RADIX codes.
 * Uncertain or unsupported categories are assigned to the canonical 'OTHER' category
 * without guessing.
 */
export const normalizeRadixCategory = (hint?: string): RadixCategoryCode => {
  if (!hint) return 'OTHER';
  const clean = hint.trim().toUpperCase();
  if (RADIX_CATEGORY_CODES.includes(clean as RadixCategoryCode)) {
    return clean as RadixCategoryCode;
  }
  // Do NOT guess uncertain categories into arbitrary RADIX codes; assign strictly to canonical 'OTHER'
  return 'OTHER';
};

/**
 * Normalizes skill confidence level.
 * Unsupported or uncertain confidence values are set to 'low' (unverified)
 * rather than guessing or defaulting to high/medium.
 */
export const normalizeSkillConfidence = (conf?: string): SkillConfidence => {
  if (conf === 'high' || conf === 'medium' || conf === 'low') {
    return conf;
  }
  return 'low';
};
