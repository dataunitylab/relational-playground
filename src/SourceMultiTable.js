// @flow
import React from 'react';
import {useSelector} from 'react-redux';
import MultiTable from './MultiTable';

import type {StatelessFunctionalComponent} from 'react';

type Props = {
  ReactGA: any,
};

const SourceMultiTable: StatelessFunctionalComponent<Props> = (props) => {
  const sources = useSelector((state) => state.data.sourceData);
  return <MultiTable ReactGA={props.ReactGA} tables={sources} />;
};

export default SourceMultiTable;
