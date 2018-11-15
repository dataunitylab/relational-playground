import React, { Component } from 'react';
const parser = require('js-sql-parser');

class SqlEditor extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.parseQuery = this.parseQuery.bind(this);
    this.state = {error: null, timeout: null};
    this.parseQuery(this.props.text, true);
  }

  parseQuery(text, skipState) {
    if (!skipState) { this.setState({timeout: null}); }
    try {
      const sql = parser.parse(text);
      if (sql.nodeType === 'Main' && sql.value.type === 'Select') {
        this.props.exprFromSql(sql.value);
        if (!skipState) { this.setState({error: null}); }
      } else {
        const errMsg = 'Unsupported expression';
        if (!skipState) { this.setState({error: errMsg}); }
      }
    } catch (err) {
      if (!skipState) { this.setState({error: err.message}); }
    }
  }

  handleChange(event) {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    const text = event.target.value;
    let handle = setTimeout(() => { this.parseQuery(text) }, 1000);
    this.setState({timeout: handle});
  }

  render() {
    let error = '';
    if (this.state.error) {
      error = <div style={{color: 'red'}}>{this.state.error}</div>;
    }
    return <div>
      <textarea style={{minHeight: '4em', padding: '1em', width: '100%'}} onChange={this.handleChange} ref={this.inputRef} defaultValue={this.props.text}></textarea>
      {error}
    </div>;
  }
}

export default SqlEditor;
