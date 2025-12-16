import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', { conditional: true, hidden: false })).toBe('base conditional');
    });

    it('should handle undefined and null', () => {
      expect(cn('base', undefined, null, 'other')).toBe('base other');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should deduplicate classes', () => {
      expect(cn('class1', 'class1', 'class2')).toBe('class1 class2');
    });
  });
});
