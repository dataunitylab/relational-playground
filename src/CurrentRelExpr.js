// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {changeExpr} from './modules/data';
import RelExpr from './RelExpr';

type Props = {
  expr: {[string]: any},
  ReactGA: any,

  changeExpr: typeof changeExpr,
};

class CurrentRelExpr extends Component<Props> {
  render() {
    return (
      <div className="relExprContainer">
        {/* Relational algebra expression display */}
        <RelExpr
          ReactGA={this.props.ReactGA}
          expr={this.props.expr}
          changeExpr={this.props.changeExpr}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {expr: state.relexp.expr};
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeExpr: (data, element) => {
      dispatch(changeExpr(data, element));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CurrentRelExpr);
