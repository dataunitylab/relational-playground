// @flow
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {changeExpr} from './modules/data';
import RelExpr from './RelExpr';
import RelExprTree from './RelExprTree';

import type {StatelessFunctionalComponent} from 'react';
import {disableOptimization, enableOptimization} from './modules/relexp';

type Props = {
  ReactGA: any,
};

const CurrentRelExpr: StatelessFunctionalComponent<Props> = (props) => {
  const dispatch = useDispatch();
  const expr = useSelector((state) => state.relexp.expr);
  const [showTree, setShowTree] = useState(false);
  const [optimizeQuery, setOptimizeQuery] = useState(false);

  function handleTreeInputChange(event: SyntheticInputEvent<HTMLInputElement>) {
    props.ReactGA.event({
      category: 'Toggle Expression Display',
      action: event.target.checked ? 'tree' : 'linear',
    });
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
    setOptimizeQuery(event.target.checked);
  }

  const relExp = showTree ? (
    <RelExprTree
      ReactGA={props.ReactGA}
      expr={expr}
      changeExpr={(data, element) => dispatch(changeExpr(data, element))}
    />
  ) : (
    <RelExpr
      ReactGA={props.ReactGA}
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
            checked={optimizeQuery}
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
