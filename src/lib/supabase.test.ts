import { describe, it, expect } from 'vitest';
import { normalizeDirection, getDirectionDisplay } from './supabase';

describe('supabase direction helpers', () => {
  describe('normalizeDirection', () => {
    it('normalizes English directions correctly', () => {
      expect(normalizeDirection('north')).toBe('north');
      expect(normalizeDirection('south')).toBe('south');
      expect(normalizeDirection('east')).toBe('east');
      expect(normalizeDirection('west')).toBe('west');
      expect(normalizeDirection('center')).toBe('center');
    });

    it('normalizes Arabic directions correctly', () => {
      expect(normalizeDirection('شمال')).toBe('north');
      expect(normalizeDirection('جنوب')).toBe('south');
      expect(normalizeDirection('شرق')).toBe('east');
      expect(normalizeDirection('غرب')).toBe('west');
      expect(normalizeDirection('وسط')).toBe('center');
    });

    it('handles mixed or padded strings correctly', () => {
      expect(normalizeDirection(' شمال الرياض ')).toBe('north');
      expect(normalizeDirection('الشرق')).toBe('east');
    });

    it('handles null, undefined, or empty values', () => {
      expect(normalizeDirection(null)).toBe('');
      expect(normalizeDirection(undefined)).toBe('');
      expect(normalizeDirection('')).toBe('');
    });
  });

  describe('getDirectionDisplay', () => {
    it('returns the correct Arabic label for recognized directions', () => {
      expect(getDirectionDisplay('north')).toBe('شمال');
      expect(getDirectionDisplay('شمال')).toBe('شمال');
      expect(getDirectionDisplay('east')).toBe('شرق');
    });

    it('returns the trimmed original string if direction is not recognized', () => {
      expect(getDirectionDisplay('مكان آخر')).toBe('مكان آخر');
    });

    it('returns null for null or undefined input', () => {
      expect(getDirectionDisplay(null)).toBeNull();
      expect(getDirectionDisplay(undefined)).toBeNull();
    });
  });
});
