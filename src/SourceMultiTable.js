// @flow
import React from 'react';
import {useSelector} from 'react-redux';
import MultiTable from './MultiTable';

import type {StatelessFunctionalComponent} from 'react';

import type {State} from './modules/data';

type Props = {
  ReactGA: any,
};

const SourceMultiTable: StatelessFunctionalComponent<Props> = (props) => {
  const sources = useSelector<{data: State}, _>(
    (state) => state.data.sourceData
  );
  return <MultiTable ReactGA={props.ReactGA} tables={sources} />;
};

export default SourceMultiTable;
