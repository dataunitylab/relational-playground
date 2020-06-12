// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import MultiTable from './MultiTable';

import type {Data} from './modules/data';

type Props = {
  sources: {[string]: Data},
  ReactGA: any,
};

class SourceMultiTable extends Component<Props> {
  render() {
    return (
      <MultiTable ReactGA={this.props.ReactGA} tables={this.props.sources} />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {sources: state.data.sourceData};
};

export default connect(mapStateToProps)(SourceMultiTable);
