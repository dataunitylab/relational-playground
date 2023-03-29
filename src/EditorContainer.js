// @flow
import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import fromEntries from 'fromentries';
import SqlEditor from './SqlEditor';
import {exprFromSql} from './modules/relexp';
import {resetAction} from './modules/data';

import type {StatelessFunctionalComponent} from 'react';

import type {State} from './modules/data';

type Props = {
  ReactGA: any,
};

const EditorContainer: StatelessFunctionalComponent<Props> = (props) => {
  const types = useSelector<{data: State}, _>((state) =>
    fromEntries(
      Object.entries(state.data.sourceData).map(([name, data]) => [
        name,
        data != null && typeof data === 'object' ? data.columns : [],
      ])
    )
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <SqlEditor
      navigate={navigate}
      ReactGA={props.ReactGA}
      defaultText="SELECT * FROM Doctor"
      exprFromSql={(sql, types) => dispatch(exprFromSql(sql, types))}
      resetAction={() => dispatch(resetAction())}
      types={types}
    />
  );
};

export default EditorContainer;
