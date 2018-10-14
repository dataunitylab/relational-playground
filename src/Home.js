import React, { Component } from 'react';
import { connect } from 'react-redux';
import RelExpr from './RelExpr';

class Home extends Component {
  render() {
    return <div><RelExpr expr={this.props.expr}/></div>
  }
}

const mapStateToProps = (state) => {
  console.log(state);
  return {'expr': state.relexp.expr};
};

export default connect(mapStateToProps)(Home);
