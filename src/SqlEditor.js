// @flow
import queryString from 'query-string';
import React, {Component} from 'react';
import Editor from 'react-simple-code-editor';
import {highlight, languages} from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';
import './SqlEditor.css';

import 'prismjs/themes/prism.css';

import type {Node} from 'react';

const parser = require('@michaelmior/js-sql-parser');

type Props = {
  history: any,
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
};

/** Editor for SQL queries */
class SqlEditor extends Component<Props, State> {
  constructor() {
    super();
    (this: any).handleChange = this.handleChange.bind(this);
    (this: any).parseQuery = this.parseQuery.bind(this);
    this.state = {error: null, timeout: null, query: ''};
  }

  componentDidMount() {
    // Parse the initial query when we start
    const values = queryString.parse(window.location.search);

    if (values.query === undefined) {
      this.parseQuery(this.props.defaultText, true);
      this.setState({query: this.props.defaultText});
    } else {
      this.parseQuery(values.query, false);
      this.setState({query: values.query});
    }
  }

  /**
   * @param text - the query to parse
   * @param firstLoad - whether this is the first call when mounted
   */
  parseQuery(text: string, firstLoad?: boolean): void {
    if (!firstLoad) {
      if (this.props.resetAction) {
        this.props.resetAction();
      }
      this.setState({timeout: null});
    }
    try {
      const sql = parser.parse(text);
      if (
        sql.nodeType === 'Main' &&
        ['Except', 'Intersect', 'Select', 'Union'].includes(sql.value.type)
      ) {
        // Record the typed SQL statement
        if (!firstLoad) {
          this.props.ReactGA.event({
            category: 'User Typing SQL Statement',
            action: text,
          });
        }

        // Parse the query
        this.props.exprFromSql(sql.value, this.props.types);
        this.props.history.push('/?query=' + text);

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
    // Cancel any pending query parsing
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }

    // Only parse the query once per second
    let handle = setTimeout(() => {
      this.parseQuery(text);
    }, 1000);

    this.setState({timeout: handle, query: text});
  }

  render(): Node {
    // Include any error messaage if needed
    let error = '';
    if (this.state.error) {
      error = <div style={{color: 'red'}}>{this.state.error}</div>;
    }

    return (
      <div className={'SqlEditor'}>
        <h4>SQL Query</h4>
        <div className="editor">
          <Editor
            value={this.state.query}
            onValueChange={this.handleChange}
            highlight={(code) => highlight(code, languages.sql)}
            padding={10}
            style={{
              fontDisplay: 'swap',
              fontFamily: '"Fira Code", "Fira Mono", monospace',
            }}
          />
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }
}

export default SqlEditor;
