import React, { Component } from 'react';
const parser = require('js-sql-parser');

class SqlEditor extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.parseQuery = this.parseQuery.bind(this);
    this.state = {error: null, timeout: null};
  }

  parseQuery(text) {
    this.setState({timeout: null});
    try {
      const sql = parser.parse(text);
      if (sql.nodeType === 'Main' && sql.value.type === 'Select') {
        this.props.exprFromSql(sql.value);
        this.setState({error: null});
      } else {
        this.setState({error: 'Unsupported expression.'});
      }
    } catch (err) {
      this.setState({error: err.message});
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
      <textarea style={{minHeight: '4em', padding: '1em', width: '100%'}} onChange={this.handleChange}></textarea>
      {error}
    </div>;
  }
}

export default SqlEditor;
