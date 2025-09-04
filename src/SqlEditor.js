// @flow
import * as React from 'react';
import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';
import SqlAutocompleteDropdown, {
  parseForAutocomplete,
  generateSuggestions,
} from './SqlAutocomplete';
import './SqlEditor.css';

import 'prismjs/themes/prism.css';

import type {Node} from 'react';

const parser = require('@michaelmior/js-sql-parser');

type Props = {
  navigate: any,
  defaultText: string,
  exprFromSql: typeof exprFromSql,
  resetAction: typeof resetAction,
  ReactGA: any,
  types: {[string]: Array<string>},
};

type State = {
  error: string | null,
  timeout: any,
  query: string,
  showAutocomplete: boolean,
  autocompleteItems: Array<any>,
  selectedIndex: number,
  autocompletePosition: {top: number, left: number},
  cursorPosition: number,
};

/** Editor for SQL queries */
class SqlEditor extends React.Component<Props, State> {
  editorRef: {current: null | HTMLElement};
  isAutocompleting: boolean;

  constructor() {
    super();
    // $FlowFixMe[method-unbinding]
    (this: any).handleChange = this.handleChange.bind(this);
    // $FlowFixMe[method-unbinding]
    (this: any).parseQuery = this.parseQuery.bind(this);
    // $FlowFixMe[method-unbinding]
    (this: any).handleKeyDown = this.handleKeyDown.bind(this);
    // $FlowFixMe[method-unbinding]
    (this: any).handleAutocompleteSelect =
      this.handleAutocompleteSelect.bind(this);
    // $FlowFixMe[method-unbinding]
    (this: any).hideAutocomplete = this.hideAutocomplete.bind(this);

    this.editorRef = React.createRef();
    this.isAutocompleting = false;
    this.state = {
      error: null,
      timeout: null,
      query: '',
      showAutocomplete: false,
      autocompleteItems: [],
      selectedIndex: 0,
      autocompletePosition: {top: 0, left: 0},
      cursorPosition: 0,
    };
  }

  componentDidMount() {
    // Parse the initial query when we start
    const values = new URL(window.location.toString()).searchParams;
    const query = values.get('query');

    if (query) {
      this.parseQuery(query, false);
      this.setState({query: query});
    } else {
      this.parseQuery(this.props.defaultText, true);
      this.setState({query: this.props.defaultText});
    }
  }

  /**
   * @param text - the query to parse (optional - if not provided, uses current state)
   * @param firstLoad - whether this is the first call when mounted
   */
  parseQuery(text?: string, firstLoad?: boolean): void {
    // Always use the current state query unless explicitly overridden
    const queryToParse = text !== undefined ? text : this.state.query;

    if (!firstLoad) {
      if (this.props.resetAction) {
        this.props.resetAction();
      }
      this.setState({timeout: null});
    }
    try {
      const sql = parser.parse(queryToParse);
      if (
        sql.nodeType === 'Main' &&
        ['Except', 'Intersect', 'Select', 'Union'].includes(sql.value.type)
      ) {
        // Record the typed SQL statement
        if (!firstLoad) {
          this.props.ReactGA.event({
            category: 'User Typing SQL Statement',
            action: queryToParse,
          });
        }

        // Parse the query
        this.props.exprFromSql(sql.value, this.props.types);
        this.props.navigate('/?query=' + queryToParse);

        if (!firstLoad) {
          this.setState({error: null});
        }
      } else {
        // Show an error if we try to parse any unsupported query type
        const errMsg = 'Unsupported expression';
        if (!firstLoad) {
          this.setState({error: errMsg});
        }
      }
    } catch (err) {
      // Display any error message generated during parsing
      if (!firstLoad) {
        this.setState({error: err.message});
      }
    }
  }

  handleChange(text: string): void {
    // If we're in the middle of autocomplete, don't trigger parsing or autocomplete - just update the state
    if (this.isAutocompleting) {
      this.setState({query: text});
      return;
    }

    // Cancel any pending query parsing
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }

    // Only parse the query once per second
    let handle = setTimeout(() => {
      // Use current state instead of captured closure variable
      this.parseQuery();
    }, 1000);

    this.setState({timeout: handle, query: text}, () => {
      // Update autocomplete after state is set with a small delay to ensure cursor position is updated
      setTimeout(() => {
        this.updateAutocomplete(text);
      }, 50);
    });
  }

  updateAutocomplete(text: string): void {
    // Check if we're still in autocompleting mode
    if (this.isAutocompleting) {
      return;
    }

    // Get cursor position from the textarea
    const textarea = document.getElementById('sqlInput');
    if (
      !textarea ||
      !(
        textarea instanceof HTMLInputElement ||
        textarea instanceof HTMLTextAreaElement
      ) ||
      typeof textarea.selectionStart !== 'number'
    ) {
      this.hideAutocomplete();
      return;
    }

    const cursorPosition = textarea.selectionStart;
    const parseResult = parseForAutocomplete(text, cursorPosition);

    if (!parseResult.context || !parseResult.prefix) {
      this.hideAutocomplete();
      return;
    }

    const suggestions = generateSuggestions(
      parseResult.prefix,
      parseResult.context,
      this.props.types,
      parseResult.needsTablePrefix
    );

    if (suggestions.length === 0) {
      this.hideAutocomplete();
      return;
    }

    // Scenario 1: Check if the user has typed exactly one of the suggestions
    if (
      suggestions.length === 1 &&
      suggestions[0].text === parseResult.prefix
    ) {
      this.hideAutocomplete();
      return;
    }

    // Also hide if the prefix exactly matches any suggestion (case-insensitive)
    const exactMatch = suggestions.find(
      (suggestion) =>
        suggestion.text.toLowerCase() === parseResult.prefix.toLowerCase()
    );
    if (exactMatch) {
      this.hideAutocomplete();
      return;
    }

    // Calculate position for dropdown using the actual textarea element
    const rect = textarea.getBoundingClientRect();
    const position = this.calculateDropdownPosition(
      textarea,
      cursorPosition,
      rect
    );

    this.setState({
      showAutocomplete: true,
      autocompleteItems: suggestions,
      selectedIndex: 0,
      autocompletePosition: position,
      cursorPosition: cursorPosition, // Update the stored cursor position
    });
  }

  calculateDropdownPosition(
    textarea: any,
    cursorPosition: number,
    rect: ClientRect
  ): {top: number, left: number} {
    // Get text up to cursor position
    const textBeforeCursor = textarea.value.slice(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentLineText = lines[currentLine] || '';

    // Get the computed style of the textarea
    const computedStyle = getComputedStyle(textarea);
    const fontSize = parseFloat(computedStyle.fontSize) || 14;
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.4;

    // Measure actual character width using a temporary element
    let actualCharWidth = fontSize * 0.6; // fallback
    const body = document.body;
    if (body) {
      const measurer = document.createElement('span');
      measurer.style.fontFamily = computedStyle.fontFamily;
      measurer.style.fontSize = computedStyle.fontSize;
      measurer.style.fontWeight = computedStyle.fontWeight;
      measurer.style.letterSpacing = computedStyle.letterSpacing;
      measurer.style.visibility = 'hidden';
      measurer.style.position = 'absolute';
      measurer.style.whiteSpace = 'pre';
      measurer.textContent = currentLineText;

      body.appendChild(measurer);
      const actualTextWidth = measurer.offsetWidth;
      body.removeChild(measurer);

      if (currentLineText.length > 0) {
        actualCharWidth = actualTextWidth / currentLineText.length;
      }
    }

    // Get padding and border values
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;

    // Calculate the cursor position, then move dropdown below the current line
    const cursorTop =
      rect.top +
      paddingTop +
      borderTop +
      currentLine * lineHeight +
      lineHeight +
      window.scrollY;
    const cursorLeft =
      rect.left +
      paddingLeft +
      borderLeft +
      currentLineText.length * actualCharWidth +
      window.scrollX;

    return {
      top: cursorTop,
      left: cursorLeft,
    };
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.state.showAutocomplete) {
      return false;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.setState((prevState) => ({
          selectedIndex:
            (prevState.selectedIndex + 1) % prevState.autocompleteItems.length,
        }));
        return true;

      case 'ArrowUp':
        event.preventDefault();
        this.setState((prevState) => ({
          selectedIndex:
            prevState.selectedIndex === 0
              ? prevState.autocompleteItems.length - 1
              : prevState.selectedIndex - 1,
        }));
        return true;

      case 'Tab':
      case 'Enter':
        event.preventDefault();
        this.handleAutocompleteSelect(
          this.state.autocompleteItems[this.state.selectedIndex]
        );
        return true;

      case 'Escape':
        this.hideAutocomplete();
        return true;

      default:
        return false;
    }
  }

  handleAutocompleteSelect(item: any): void {
    const {query, cursorPosition: storedCursorPosition} = this.state;

    // Set the class property to prevent handleChange from interfering
    this.isAutocompleting = true;

    // Cancel any pending query parsing from handleChange
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }

    // Get the current cursor position from the actual textarea element
    const textarea = document.getElementById('sqlInput');
    if (
      !textarea ||
      !(
        textarea instanceof HTMLInputElement ||
        textarea instanceof HTMLTextAreaElement
      ) ||
      typeof textarea.selectionStart !== 'number'
    ) {
      this.hideAutocomplete();
      return;
    }

    // Use the stored cursor position from when autocomplete was triggered, not the current position
    // This is important because the text might have changed since autocomplete was shown
    const originalCursorPosition = storedCursorPosition;

    // Parse using the original cursor position to get the original prefix that was typed
    const parseResult = parseForAutocomplete(query, originalCursorPosition);
    const prefixLength = parseResult.prefix.length;

    // Replace the original prefix with the selected item
    const beforePrefix = query.slice(0, originalCursorPosition - prefixLength);
    const afterPrefix = query.slice(originalCursorPosition);
    const newQuery = beforePrefix + item.text + afterPrefix;

    // Calculate new cursor position (after the inserted text)
    const newCursorPosition = beforePrefix.length + item.text.length;

    this.setState(
      {
        query: newQuery,
        showAutocomplete: false, // Always hide autocomplete after selection
        cursorPosition: newCursorPosition, // Update stored cursor position for next autocomplete
        timeout: null, // Clear the timeout from state as well
      },
      () => {
        // Set the cursor position after the state update
        setTimeout(() => {
          // $FlowIssue[method-unbinding]
          if (textarea.setSelectionRange) {
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          }

          // Trigger parsing immediately with the current state query
          this.parseQuery();

          // Clear the autocompleting flag after a delay to prevent immediate re-trigger
          setTimeout(() => {
            this.isAutocompleting = false;
          }, 300); // Longer delay to ensure all handleChange events are processed
        }, 10);
      }
    );
  }

  hideAutocomplete(): void {
    this.setState({
      showAutocomplete: false,
      autocompleteItems: [],
      selectedIndex: 0,
    });
  }

  render(): Node {
    // Include any error message if needed
    let error: React.Node = <React.Fragment />;
    if (this.state.error) {
      error = <div style={{color: 'red'}}>{this.state.error}</div>;
    }

    return (
      <div className={'SqlEditor'}>
        <label htmlFor="sqlInput">
          <h4>SQL Query</h4>
        </label>
        <div
          className="editor"
          style={{position: 'relative'}}
          onKeyDown={(event) => this.handleKeyDown(event)}
        >
          <Editor
            ref={this.editorRef}
            value={this.state.query}
            // $FlowFixMe[method-unbinding]
            onValueChange={this.handleChange}
            highlight={(code) => highlight(code, languages.sql)}
            padding={10}
            style={{
              fontDisplay: 'swap',
              fontFamily: '"Fira Code", monospace',
            }}
            textareaId="sqlInput"
          />
          {this.state.showAutocomplete && (
            <SqlAutocompleteDropdown
              items={this.state.autocompleteItems}
              selectedIndex={this.state.selectedIndex}
              position={this.state.autocompletePosition}
              onSelect={(item) => this.handleAutocompleteSelect(item)}
              onClose={() => this.hideAutocomplete()}
            />
          )}
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }
}

export default SqlEditor;
