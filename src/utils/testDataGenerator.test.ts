import { describe, it, expect } from 'vitest';
import { generateMockData } from './testDataGenerator';

describe('testDataGenerator', () => {
  describe('generateMockData', () => {
    it('should generate specified number of rows', () => {
      const data = generateMockData(5);
      expect(data).toHaveLength(5);
    });

    it('should generate default 10 rows when count not specified', () => {
      const data = generateMockData();
      expect(data).toHaveLength(10);
    });

    it('should generate rows with all required fields', () => {
      const data = generateMockData(1);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('category');
      expect(data[0]).toHaveProperty('date');
    });

    it('should generate unique IDs', () => {
      const data = generateMockData(10);
      const ids = data.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate numeric values', () => {
      const data = generateMockData(5);
      data.forEach((item) => {
        expect(typeof item.value).toBe('number');
        expect(item.value).toBeGreaterThanOrEqual(0);
        expect(item.value).toBeLessThanOrEqual(10000);
      });
    });

    it('should generate valid date strings', () => {
      const data = generateMockData(5);
      data.forEach((item) => {
        expect(typeof item.date).toBe('string');
        expect(new Date(item.date).toString()).not.toBe('Invalid Date');
      });
    });

    it('should generate categories from predefined list', () => {
      const data = generateMockData(20);
      const categories = ['Sales', 'Marketing', 'Support', 'Engineering', 'HR'];
      data.forEach((item) => {
        expect(categories).toContain(item.category);
      });
    });

    it('should handle zero rows', () => {
      const data = generateMockData(0);
      expect(data).toHaveLength(0);
      expect(data).toEqual([]);
    });

    it('should handle large number of rows', () => {
      const data = generateMockData(1000);
      expect(data).toHaveLength(1000);
      expect(data[0]).toHaveProperty('id');
      expect(data[999]).toHaveProperty('id');
    });

    it('should generate consistent structure for all rows', () => {
      const data = generateMockData(10);
      const firstKeys = Object.keys(data[0]).sort();
      
      data.forEach((item) => {
        const keys = Object.keys(item).sort();
        expect(keys).toEqual(firstKeys);
      });
    });
  });
});
