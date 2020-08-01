// @flow
import React, {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {changeExpr} from './modules/data';
import RelExpr from './RelExpr';
import RelExprTree from './RelExprTree';

type Props = {
  ReactGA: any,
};

function CurrentRelExpr(props: Props) {
  const dispatch = useDispatch();
  const expr = useSelector((state) => state.relexp.expr);
  const [showTree, setShowTree] = useState(false);

  function handleInputChange(event) {
    props.ReactGA.event({
      category: 'Toggle Expression Display',
      action: event.target.checked ? 'tree' : 'linear',
    });
    setShowTree(event.target.checked);
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
            onChange={handleInputChange}
          />
        </label>
      </div>

      {/* Relational algebra expression display */}
      <div className="expr">{relExp}</div>
    </div>
  );
}

export default CurrentRelExpr;
