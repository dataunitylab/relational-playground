// @flow
import React from 'react';
import PropTypes from 'prop-types';
import {useDispatch, useSelector} from 'react-redux';
import fromEntries from 'fromentries';
import SqlEditor from './SqlEditor';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';

type Props = {
  history: PropTypes.object.isRequired,
  ReactGA: any,
};

function EditorContainer(props: Props) {
  const types = useSelector((state) =>
    fromEntries(
      Object.entries(state.data.sourceData).map(([name, data]) => [
        name,
        data != null && typeof data === 'object' ? data.columns : [],
      ])
    )
  );
  const dispatch = useDispatch();

  return (
    <SqlEditor
      history={props.history}
      ReactGA={props.ReactGA}
      defaultText="SELECT * FROM Doctor"
      exprFromSql={(sql, types) => dispatch(exprFromSql(sql, types))}
      resetAction={() => dispatch(resetAction())}
      types={types}
    />
  );
}

export default EditorContainer;
