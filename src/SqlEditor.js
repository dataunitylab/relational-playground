// @flow
import React, {Component} from 'react';
import CodeMirror from 'react-codemirror';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';
import './SqlEditor.css';

import 'codemirror/lib/codemirror.css';
require('codemirror/mode/sql/sql');

const parser = require('@michaelmior/js-sql-parser');

type Props = {
  defaultText: string,
  exprFromSql: typeof exprFromSql,
  resetAction: typeof resetAction,
  ReactGA: any,
  types: {[string]: Array<string>},
};

type State = {
  error: string | null,
  timeout: any,
};

/** Editor for SQL queries */
class SqlEditor extends Component<Props, State> {
  constructor() {
    super();
    (this: any).handleChange = this.handleChange.bind(this);
    (this: any).parseQuery = this.parseQuery.bind(this);
    this.state = {error: null, timeout: null};
  }

  componentDidMount() {
    // Parse the initial query when we start
    this.parseQuery(this.props.defaultText, true);
  }

  /**
   * @param text - the query to parse
   * @param firstLoad - whether this is the first call when mounted
   */
  parseQuery(text: string, firstLoad?: boolean) {
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

  handleChange(text: string) {
    // Cancel any pending query parsing
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }

    // Only parse the query once per second
    let handle = setTimeout(() => {
      this.parseQuery(text);
    }, 1000);
    this.setState({timeout: handle});
  }

  render() {
    // Include any error messaage if needed
    let error = '';
    if (this.state.error) {
      error = <div style={{color: 'red'}}>{this.state.error}</div>;
    }

    return (
      <div className="SqlEditor">
        <h4>SQL Query</h4>
        <CodeMirror
          onChange={this.handleChange}
          defaultValue={this.props.defaultText}
          options={{
            mode: 'sql',
            viewportMargin: Infinity,
          }}
        />
        <div className="error">{error}</div>
      </div>
    );
  }
}

export default SqlEditor;
