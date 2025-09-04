// @flow
import * as React from 'react';
import type {Node} from 'react';

type AutocompleteItem = {
  text: string,
  type: 'table' | 'column',
  table?: string,
};

type Props = {
  items: Array<AutocompleteItem>,
  selectedIndex: number,
  position: {top: number, left: number},
  onSelect: (item: AutocompleteItem) => void,
  onClose: () => void,
};

/**
 * Dropdown component for SQL autocomplete suggestions
 */
class SqlAutocompleteDropdown extends React.Component<Props> {
  render(): Node {
    const {items, selectedIndex, position, onSelect} = this.props;

    if (items.length === 0) {
      return null;
    }

    return (
      <div
        className="sql-autocomplete-dropdown"
        style={{
          position: 'fixed', // Changed from 'absolute' to 'fixed' to position relative to viewport
          top: position.top,
          left: position.left,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          minWidth: '150px',
        }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.type}-${item.text}`}
            className={`sql-autocomplete-item ${
              index === selectedIndex ? 'selected' : ''
            }`}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: index === selectedIndex ? '#e6f3ff' : 'white',
              borderBottom:
                index < items.length - 1 ? '1px solid #eee' : 'none',
            }}
            onClick={() => onSelect(item)}
          >
            <span
              style={{
                fontWeight: item.type === 'table' ? 'bold' : 'normal',
                color: item.type === 'table' ? '#0066cc' : '#333',
              }}
            >
              {item.text}
            </span>
            {item.type === 'column' && item.table && (
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  color: '#666',
                }}
              >
                ({item.table})
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }
}

/**
 * Parse SQL text to detect table/column references being typed
 */
export function parseForAutocomplete(
  text: string,
  cursorPosition: number
): {
  prefix: string,
  context: 'table' | 'column' | null,
  needsTablePrefix?: boolean,
} {
  // Get text up to cursor position
  const beforeCursor = text.slice(0, cursorPosition);

  // Find the current word being typed (ignoring trailing spaces)
  const wordMatch = beforeCursor.trimEnd().match(/[\w.]*$/);
  const currentWord = wordMatch ? wordMatch[0] : '';

  // If cursor is after spaces and there's no current word, look for the last word
  let actualWord = currentWord;
  if (!currentWord && beforeCursor.endsWith(' ')) {
    // Look for the word before the spaces
    const trimmed = beforeCursor.trimEnd();
    const lastWordMatch = trimmed.match(/[\w.]*$/);
    actualWord = lastWordMatch ? lastWordMatch[0] : '';
  }

  // Check if we're in a context where table/column suggestions make sense
  const upperText = beforeCursor.toUpperCase();

  // Common SQL keywords that typically precede table names
  const tableKeywords = ['FROM', 'JOIN', 'INTO', 'UPDATE'];
  // Common SQL keywords that typically precede column names
  const columnKeywords = [
    'SELECT',
    'WHERE',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'ON',
  ];

  // Check if we're currently typing a keyword (don't autocomplete keywords)
  const allKeywords = [...tableKeywords, ...columnKeywords];
  for (const keyword of allKeywords) {
    if (keyword.startsWith(actualWord.toUpperCase()) && actualWord.length > 0) {
      return {prefix: '', context: null};
    }
  }

  // Check for table context - must be right after a table keyword
  for (const keyword of tableKeywords) {
    const keywordIndex = upperText.lastIndexOf(keyword);
    if (keywordIndex >= 0) {
      const afterKeyword = beforeCursor
        .slice(keywordIndex + keyword.length)
        .trim();
      // Check if the cursor is within the first word after the keyword
      const wordsAfter = afterKeyword.split(/\s+/).filter((w) => w.length > 0);
      if (wordsAfter.length <= 1) {
        // We're in table context - return the actual word being typed
        return {prefix: actualWord, context: 'table'};
      }
    }
  }

  // Check for column context - must be after column keyword but not after table keyword
  for (const keyword of columnKeywords) {
    const keywordIndex = upperText.lastIndexOf(keyword);
    if (keywordIndex >= 0) {
      const afterKeyword = beforeCursor.slice(keywordIndex + keyword.length);

      // Check if there's a table keyword after this column keyword
      let hasTableKeywordAfter = false;
      for (const tk of tableKeywords) {
        const tableKeywordIndex = afterKeyword.toUpperCase().lastIndexOf(tk);
        if (tableKeywordIndex >= 0) {
          // Check if we're past the table keyword and its table name
          const afterTableKeyword = afterKeyword
            .slice(tableKeywordIndex + tk.length)
            .trim();
          const tableWords = afterTableKeyword
            .split(/\s+/)
            .filter((w) => w.length > 0);
          if (tableWords.length === 0) {
            // We're still naming the table
            hasTableKeywordAfter = true;
          } else if (
            tableWords.length === 1 &&
            afterTableKeyword.startsWith(actualWord)
          ) {
            // We're still typing the table name
            hasTableKeywordAfter = true;
          }
          break;
        }
      }

      if (!hasTableKeywordAfter) {
        // Check if it's a qualified column name (table.column)
        if (actualWord.includes('.')) {
          const parts = actualWord.split('.');
          return {
            prefix: parts[1] || '',
            context: 'column',
            needsTablePrefix: true,
          };
        }
        return {prefix: actualWord, context: 'column'};
      }
    }
  }

  return {prefix: '', context: null};
}

/**
 * Generate autocomplete suggestions based on available tables and columns
 */
export function generateSuggestions(
  prefix: string,
  context: 'table' | 'column' | null,
  types: {[string]: Array<string>},
  needsTablePrefix?: boolean
): Array<AutocompleteItem> {
  if (!context || !prefix) {
    return [];
  }

  const lowerPrefix = prefix.toLowerCase();
  const suggestions: Array<AutocompleteItem> = [];

  if (context === 'table') {
    // Suggest table names
    Object.keys(types).forEach((tableName) => {
      if (tableName.toLowerCase().startsWith(lowerPrefix)) {
        suggestions.push({
          text: tableName,
          type: 'table',
        });
      }
    });
  } else if (context === 'column') {
    if (needsTablePrefix) {
      // For qualified column names (table.column), suggest columns from specific table
      // Extract table name from current word before the dot
      const currentWord = prefix;
      const dotIndex = currentWord.lastIndexOf('.');
      if (dotIndex > 0) {
        const tableName = currentWord.slice(0, dotIndex);
        const columnPrefix = currentWord.slice(dotIndex + 1).toLowerCase();

        if (types[tableName]) {
          types[tableName].forEach((column) => {
            if (column.toLowerCase().startsWith(columnPrefix)) {
              suggestions.push({
                text: `${tableName}.${column}`,
                type: 'column',
                table: tableName,
              });
            }
          });
        }
      }
    } else {
      // Suggest all columns from all tables
      Object.entries(types).forEach(([tableName, columns]) => {
        columns.forEach((column) => {
          if (column.toLowerCase().startsWith(lowerPrefix)) {
            suggestions.push({
              text: column,
              type: 'column',
              table: tableName,
            });
          }
        });
      });

      // Also suggest qualified column names
      Object.entries(types).forEach(([tableName, columns]) => {
        if (tableName.toLowerCase().startsWith(lowerPrefix)) {
          columns.forEach((column) => {
            suggestions.push({
              text: `${tableName}.${column}`,
              type: 'column',
              table: tableName,
            });
          });
        }
      });
    }
  }

  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

export default SqlAutocompleteDropdown;
