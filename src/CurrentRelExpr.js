// @flow
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {changeExpr} from './modules/data';
import RelExpr from './RelExpr';
import RelExprTree from './RelExprTree';
import {useReactGA} from './contexts/ReactGAContext';

import type {StatelessFunctionalComponent} from 'react';
import {disableOptimization, enableOptimization} from './modules/relexp';

import type {State} from './modules/relexp';

type Props = {
  ReactGA?: any, // For backwards compatibility with tests
};

const CurrentRelExpr: StatelessFunctionalComponent<Props> = (props) => {
  const dispatch = useDispatch();
  const expr = useSelector<{relexp: State}, _>((state) => state.relexp.expr);
  const [showTree, setShowTree] = useState(false);
  const optimized = useSelector<{relexp: State}, _>(
    (state) => state.relexp.optimized
  );
  const contextReactGA = useReactGA();
  const ReactGA = props.ReactGA || contextReactGA;

  function handleTreeInputChange(event: SyntheticInputEvent<HTMLInputElement>) {
    if (ReactGA) {
      ReactGA.event({
        category: 'Toggle Expression Display',
        action: event.target.checked ? 'tree' : 'linear',
      });
    }
    setShowTree(event.target.checked);
  }

  function handleOptimizeInputChange(
    event: SyntheticInputEvent<HTMLInputElement>
  ) {
    if (event.target.checked) {
      dispatch(enableOptimization('join'));
    } else {
      dispatch(disableOptimization());
    }
  }

  const relExp = showTree ? (
    <RelExprTree
      expr={expr}
      changeExpr={(data, element) => dispatch(changeExpr(data, element))}
    />
  ) : (
    <RelExpr
      expr={expr}
      changeExpr={(data, element) => dispatch(changeExpr(data, element))}
    />
  );

  return (
    <div className="relExprContainer">
      <div className="toggle">
        <label>
          Tree view
          <input
            type="checkbox"
            checked={showTree}
            onChange={handleTreeInputChange}
          />
        </label>
      </div>
      <div className="toggle">
        <label>
          Query Optimization
          <input
            type="checkbox"
            checked={Boolean(optimized)}
            onChange={handleOptimizeInputChange}
          />
        </label>
      </div>

      {/* Relational algebra expression display */}
      <div className="expr">{relExp}</div>
    </div>
  );
};

export default CurrentRelExpr;
