// @flow
import React from 'react';
import {useSelector} from 'react-redux';
import MultiTable from './MultiTable';

type Props = {
  ReactGA: any,
};

function SourceMultiTable(props: Props) {
  const sources = useSelector((state) => state.data.sourceData);
  return <MultiTable ReactGA={props.ReactGA} tables={sources} />;
}

export default SourceMultiTable;
