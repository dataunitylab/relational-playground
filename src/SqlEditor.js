// @flow
import React, {Component} from 'react';
import {exprFromSql} from './modules/relexp';
import './SqlEditor.css';
import ReactGA from 'react-ga';

const parser = require('js-sql-parser');

type Props = {
  defaultText: string,
  exprFromSql: typeof exprFromSql,
};

type State = {
  error: string | null,
  timeout: any,
};

/** Editor for SQL queries */
class SqlEditor extends Component<Props, State> {
  inputRef: ?HTMLTextAreaElement;

  constructor() {
    super();
    ReactGA.initialize('UA-143847373-1', {testMode: true});
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
   * @param skipState - whether component state should be updated
   */
  parseQuery(text: string, skipState?: boolean) {
    if (!skipState) {
      this.setState({timeout: null});
    }
    try {
      const sql = parser.parse(text);
      if (sql.nodeType === 'Main' && sql.value.type === 'Select') {
        // Parse SELECT queries
        this.props.exprFromSql(sql.value);
        ReactGA.event({
          category: 'User Typing SQL Statement',
          action: text,
        });
        if (!skipState) {
          this.setState({error: null});
        }
      } else {
        // Show an error if we try to parse anything other than SELECT
        const errMsg = 'Unsupported expression';
        if (!skipState) {
          this.setState({error: errMsg});
        }
      }
    } catch (err) {
      // Display any error message generated during parsing
      if (!skipState) {
        this.setState({error: err.message});
      }
    }
  }

  handleChange(event: SyntheticInputEvent<HTMLTextAreaElement>) {
    // Cancel any pending query parsing
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }

    // Get the query to be parsed
    const text = event.target.value;

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
        <textarea
          onChange={this.handleChange}
          ref={inputRef => (this.inputRef = inputRef)}
          defaultValue={this.props.defaultText}
        />
        <div className="error">{error}</div>
      </div>
    );
  }
}

export default SqlEditor;
