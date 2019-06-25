// @flow
import React, {Component} from 'react';
import {exprFromSql} from './modules/relexp';
import './SqlEditor.css';

const parser = require('js-sql-parser');

type Props = {
  defaultText: string,
  exprFromSql: typeof exprFromSql,
};

type State = {
  error: string | null,
  timeout: any,
};

class SqlEditor extends Component<Props, State> {
  inputRef: ?HTMLTextAreaElement;

  constructor() {
    super();
    (this: any).handleChange = this.handleChange.bind(this);
    (this: any).parseQuery = this.parseQuery.bind(this);
    this.state = {error: null, timeout: null};
  }

  componentDidMount() {
    this.parseQuery(this.props.defaultText, true);
  }

  parseQuery(text: string, skipState?: boolean) {
    if (!skipState) {
      this.setState({timeout: null});
    }
    try {
      const sql = parser.parse(text);
      if (sql.nodeType === 'Main' && sql.value.type === 'Select') {
        this.props.exprFromSql(sql.value);
        if (!skipState) {
          this.setState({error: null});
        }
      } else {
        const errMsg = 'Unsupported expression';
        if (!skipState) {
          this.setState({error: errMsg});
        }
      }
    } catch (err) {
      if (!skipState) {
        this.setState({error: err.message});
      }
    }
  }

  handleChange(event: SyntheticInputEvent<HTMLTextAreaElement>) {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    const text = event.target.value;
    let handle = setTimeout(() => {
      this.parseQuery(text);
    }, 1000);
    this.setState({timeout: handle});
  }

  render() {
    let error = '';
    if (this.state.error) {
      error = <div style={{color: 'red'}}>{this.state.error}</div>;
    }
    return (
      <div className="SqlEditor">
        <h4>Enter SQL Query Here: </h4>
        <textarea
          onChange={this.handleChange}
          ref={inputRef => (this.inputRef = inputRef)}
          defaultValue={this.props.defaultText}
        />
        <div className="error">
          {error}
        </div>
      </div>
    );
  }
}

export default SqlEditor;
