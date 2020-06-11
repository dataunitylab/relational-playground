// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {changeExpr} from './modules/data';
import RelExpr from './RelExpr';
import RelExprTree from './RelExprTree';

type State = {
  showTree: boolean,
};

type Props = {
  expr: {[string]: any},
  ReactGA: any,

  changeExpr: typeof changeExpr,
};

class CurrentRelExpr extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {showTree: false};
    (this: any).handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    this.props.ReactGA.event({
      category: 'Toggle Expression Display',
      action: event.target.checked ? 'tree' : 'linear',
    });
    this.setState({showTree: event.target.checked});
  }

  render() {
    const relExp = this.state.showTree ? (
      <RelExprTree
        ReactGA={this.props.ReactGA}
        expr={this.props.expr}
        changeExpr={this.props.changeExpr}
      />
    ) : (
      <RelExpr
        ReactGA={this.props.ReactGA}
        expr={this.props.expr}
        changeExpr={this.props.changeExpr}
      />
    );

    return (
      <div className="relExprContainer">
        <div className="toggle">
          <label>
            Tree view
            <input
              type="checkbox"
              checked={this.state.showTree}
              onChange={this.handleInputChange}
            />
          </label>
        </div>

        {/* Relational algebra expression display */}
        <div className="expr">{relExp}</div>
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
