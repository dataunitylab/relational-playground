// @flow
import {parseForAutocomplete, generateSuggestions} from './SqlAutocomplete';

describe('SqlAutocomplete', () => {
  const types = {
    Doctor: ['id', 'firstName', 'lastName', 'salary', 'departmentId'],
    Department: ['id', 'name', 'budget'],
    Patient: ['id', 'firstName', 'lastName', 'dateOfBirth'],
  };

  describe('parseForAutocomplete', () => {
    test('detects table context after FROM', () => {
      const result = parseForAutocomplete('SELECT * FROM Doc', 17);
      expect(result.context).toBe('table');
      expect(result.prefix).toBe('Doc');
    });

    test('detects table context after JOIN', () => {
      const result = parseForAutocomplete('SELECT * FROM Doctor JOIN Dep', 29);
      expect(result.context).toBe('table');
      expect(result.prefix).toBe('Dep');
    });

    test('detects column context after SELECT', () => {
      const result = parseForAutocomplete('SELECT first', 12);
      expect(result.context).toBe('column');
      expect(result.prefix).toBe('first');
    });

    test('detects column context after WHERE', () => {
      const result = parseForAutocomplete('SELECT * FROM Doctor WHERE sal', 30);
      expect(result.context).toBe('column');
      expect(result.prefix).toBe('sal');
    });

    test('detects qualified column context', () => {
      const result = parseForAutocomplete('SELECT Doctor.first', 19);
      expect(result.context).toBe('column');
      expect(result.prefix).toBe('first');
      expect(result.needsTablePrefix).toBe(true);
    });

    test('returns null context for non-relevant positions', () => {
      const result = parseForAutocomplete('SELECT * FROM Doctor', 10);
      expect(result.context).toBeNull();
    });
  });

  describe('generateSuggestions', () => {
    test('suggests table names', () => {
      const suggestions = generateSuggestions('Doc', 'table', types);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].text).toBe('Doctor');
      expect(suggestions[0].type).toBe('table');
    });

    test('suggests column names', () => {
      const suggestions = generateSuggestions('first', 'column', types);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.text === 'firstName')).toBe(true);
      expect(suggestions.every((s) => s.type === 'column')).toBe(true);
    });

    test('suggests qualified column names for specific table', () => {
      const suggestions = generateSuggestions(
        'Doctor.first',
        'column',
        types,
        true
      );
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.text === 'Doctor.firstName')).toBe(true);
    });

    test('limits suggestions to 10 items', () => {
      const suggestions = generateSuggestions('', 'column', types);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test('returns empty array for no matches', () => {
      const suggestions = generateSuggestions('xyz', 'table', types);
      expect(suggestions).toHaveLength(0);
    });
  });
});
