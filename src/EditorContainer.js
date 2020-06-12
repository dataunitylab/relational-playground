// @flow
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import fromEntries from 'fromentries';
import SqlEditor from './SqlEditor';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';

type Props = {
  history: PropTypes.object.isRequired,
  types: {[string]: Array<string>},
  ReactGA: any,

  exprFromSql: typeof exprFromSql,
  resetAction: typeof resetAction,
};

class EditorContainer extends Component<Props> {
  render() {
    return (
      <SqlEditor
        history={this.props.history}
        ReactGA={this.props.ReactGA}
        defaultText="SELECT * FROM Doctor"
        exprFromSql={this.props.exprFromSql}
        resetAction={this.props.resetAction}
        types={this.props.types}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  // Get just the column names from the source data
  const types = fromEntries(
    Object.entries(state.data.sourceData).map(([name, data]) => {
      return [
        name,
        data != null && typeof data === 'object' ? data.columns : [],
      ];
    })
  );

  return {types: types};
};

const mapDispatchToProps = (dispatch) => {
  return {
    resetAction: () => {
      dispatch(resetAction());
    },
    exprFromSql: (sql, types) => {
      dispatch(exprFromSql(sql, types));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorContainer);
