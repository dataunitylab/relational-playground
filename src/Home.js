import React, { Component } from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import RelExpr from './RelExpr';

import './Home.css';

class Home extends Component {
  render() {
    return (
      <SplitPane split="horizontal">
        <div><RelExpr expr={this.props.expr}/></div>
        <div></div>
      </SplitPane>
    )
  }
}

const mapStateToProps = (state) => {
  return {'expr': state.relexp.expr};
};

export default connect(mapStateToProps)(Home);
