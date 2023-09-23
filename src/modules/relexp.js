// @flow
import fromEntries from 'fromentries';
import {produce, original} from 'immer';

export const EXPR_FROM_SQL = 'EXPR_FROM_SQL';
export const ENABLE_OPTIMIZATION = 'ENABLE_OPTIMIZATION';
export const DISABLE_OPTIMIZATION = 'DISABLE_OPTIMIZATION';

type ExprFromSqlAction = {
  type: 'EXPR_FROM_SQL',
  sql: {[string]: any},
  types: {[string]: Array<string>},
};

type EnableOptimizationAction = {
  type: 'ENABLE_OPTIMIZATION',
  optimization: string,
};

type DisableOptimizationAction = {
  type: 'DISABLE_OPTIMIZATION',
};

export type OrderByColumn = {
  column_name: string,
  ascending: boolean,
};

/**
 * @param sql - a parsed SQL query
 * @param types - an object mapping table names to lists of columns
 * @return a new EXPR_FROM_SQL action
 */
export function exprFromSql(
  sql: {[string]: any},
  types: {[string]: Array<string>}
): ExprFromSqlAction {
  return {type: EXPR_FROM_SQL, sql, types};
}

/**
 * @param optimization - a string denoting the type of optimization performed
 * @return a new ENABLE_OPTIMIZATION action
 */
export function enableOptimization(
  optimization: string
): EnableOptimizationAction {
  return {type: ENABLE_OPTIMIZATION, optimization};
}

/**
 * @return a new DISABLE_OPTIMIZATION action
 */
export function disableOptimization(): DisableOptimizationAction {
  return {type: DISABLE_OPTIMIZATION};
}

export type State = {
  expr: {[string]: any},
  unoptimizedExpr?: {[string]: any},
  optimized?: true,
};

const initialState = {
  expr: {},
};

const opMap = {
  '=': '$eq',
  '!=': '$ne',
  '>': '$gt',
  '>=': '$gte',
  '<': '$lt',
  '<=': '$lte',
};

/**
 * @param exprList - the current expression list
 * @param expr - a new expression to append to the list
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 */
function addToExpr(
  exprList: Array<any>,
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
) {
  const converted = convertExpr(expr, types, tables);
  if (Array.isArray(converted)) {
    exprList.push(...converted);
  } else {
    exprList.push(converted);
  }
}

/**
 * @param expr - a parsed expression from a SQL query
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 * @return a relational algebra expression object
 */
function convertExpr(
  expr: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): {[string]: any} {
  switch (expr.type) {
    case 'BetweenPredicate':
      const lhs = convertExpr(expr.left, types, tables);
      return {
        and: {
          clauses: [
            {
              cmp: {
                lhs,
                op: '$gte',
                rhs: convertExpr(expr.right.left, types, tables),
              },
            },
            {
              cmp: {
                lhs,
                op: '$lte',
                rhs: convertExpr(expr.right.right, types, tables),
              },
            },
          ],
        },
      };

    case 'AndExpression':
      // Collect all expressions on either side of the AND
      let and: Array<any> = [];
      let exprLeft = Object.assign({}, expr);
      let exprRight: Array<any> = [];
      while (exprLeft.type === 'AndExpression') {
        exprRight.unshift(exprLeft.right);
        exprLeft = exprLeft.left;
      }
      addToExpr(and, exprLeft, types, tables);
      exprRight.forEach((element) => addToExpr(and, element, types, tables));

      return {and: {clauses: and}};

    case 'OrExpression':
      // Collect all expressions on either side of the AND
      let or: Array<any> = [];
      addToExpr(or, expr.left, types, tables);
      addToExpr(or, expr.right, types, tables);

      return {or: {clauses: or}};

    case 'NotExpression':
      return {not: {clause: convertExpr(expr.value, types, tables)}};

    case 'SimpleExprParentheses':
      if (
        expr.value.type === 'ExpressionList' &&
        expr.value.value.length === 1
      ) {
        return convertExpr(expr.value.value[0], types, tables);
      } else {
        throw new Error(
          'Parenthesized expressions can only contain a single value'
        );
      }

    case 'ComparisonBooleanPrimary':
      return {
        cmp: {
          lhs: convertExpr(expr.left, types, tables),
          op: opMap[expr.operator],
          rhs: convertExpr(expr.right, types, tables),
        },
      };

    case 'OrderBy':
      const values = [];
      for (const value of expr.value) {
        values.push(convertExpr(value, types, tables));
      }
      return {
        order_by: values,
      };

    case 'GroupByOrderByItem':
      return {
        column_name: convertExpr(expr.value, types, tables),
        ascending: (expr.sortOpt || 'ASC').toUpperCase() === 'ASC',
      };

    case 'Identifier':
      // Splt into table, column parts
      let [table, column] = expr.value.split('.');
      if (!column) {
        column = table;
        table = undefined;
      }

      if (table) {
        // Ensure the given table exists
        if (!types[table]) {
          throw new Error('Table ' + table + ' not found');
        }

        // Make sure the column of the table exists
        if (!types[table].includes(column)) {
          throw new Error('Column ' + column + ' not found in ' + table);
        }

        if (!tables.includes(table)) {
          throw new Error('Table ' + table + ' is not referenced in query');
        }

        return expr.value;
      } else {
        // Find all tables which contain the column
        const columnTables = [];
        for (const table of tables) {
          if (types[table].includes(column)) {
            columnTables.push(table);
          }
        }

        // Check if the column was found in any table
        if (!columnTables.length) {
          throw new Error('Column  ' + column + ' not found');
        }

        // Ensure the column was found in only one table
        if (columnTables.length > 1) {
          throw new Error('Column ' + column + ' is ambiguous');
        }

        return column;
      }

    case 'Number':
      // For literals, just return the value object as-is
      return expr.value;

    case 'String':
      // If needed, strip quotes
      if (
        expr.value &&
        typeof expr.value === 'string' &&
        expr.value.length > 1 &&
        (expr.value[0] === "'" || expr.value[0] === '"') &&
        expr.value.charAt(expr.value.length - 1) === expr.value[0]
      ) {
        return expr.value.slice(1, -1);
      } else {
        return expr.value;
      }

    case 'InExpressionListPredicate':
      if (expr.right.type !== 'ExpressionList') {
        // Currently IN expressions are only supported with lists of values
        throw new Error('Query not supported');
      }

      let orIn: Array<any> = [];
      for (const inSetElem of expr.right.value) {
        const inExpr = {
          type: 'ComparisonBooleanPrimary',
          left: expr.left,
          operator: '=',
          right: inSetElem,
        };
        addToExpr(orIn, inExpr, types, tables);
      }
      const inOrExpr = {or: {clauses: orIn}};

      if (expr.hasNot === 'NOT') {
        return {not: {clause: inOrExpr}};
      } else {
        return inOrExpr;
      }

    default:
      console.log(expr);
      // Produce an error if the expression is unsupported
      throw new Error('Invalid expression.');
  }
}

/**
 * @param sql - a parsed SQL query
 * @param types - an object mapping table names to lists of columns
 * @param tables - all tables used in the expression
 * @return a relational algebra expression object representing the query
 */
function buildRelExp(
  sql: {[string]: any},
  types: {[string]: Array<string>},
  tables: Array<string>
): {[string]: any} {
  switch (sql.type) {
    case 'Except':
    case 'Intersect':
    case 'Union':
      const distinct = (sql.distinctOpt || '').toUpperCase();
      if (distinct && distinct !== 'ALL') {
        throw new Error('Invalid distinct option');
      }

      const setType = sql.type.toLowerCase();

      // Ensure we use a different set of tables for each side
      const setTablesBackup = tables.slice();
      const leftSetExp = buildRelExp(sql.left, types, tables);
      const rightSetExp = buildRelExp(sql.right, types, setTablesBackup);

      return {
        [setType]: {
          left: leftSetExp,
          right: rightSetExp,
          distinct: !distinct,
        },
      };

    case 'Select':
      // Ensure we have a FROM clause
      if (!sql.from) {
        throw new Error('A FROM clause must be specified.');
      }

      // Build an expression for everything in the FROM clause
      let from = sql.from.value.map((v) => buildRelExp(v, types, tables));
      if (from.length !== 1) {
        throw new Error('Only single table queries currently supported.');
      }

      // Wrap the table in a selection operator if there are any conditions
      if (sql.where) {
        from = [
          {
            selection: {
              arguments: {select: convertExpr(sql.where, types, tables)},
              children: from,
            },
          },
        ];
      }

      if (sql.orderBy) {
        from = [
          {
            order_by: {
              arguments: convertExpr(sql.orderBy, types, tables),
              children: from,
            },
          },
        ];
      }

      // Add projections as needed for the SELECT clause
      const select = sql.selectItems.value;
      if (select.length === 1 && select[0].value === '*') {
        // Don't project anything if SELECT * is used
        return from[0];
      } else {
        const project = select.map((field) =>
          convertExpr(field, types, tables)
        );
        const projection = {
          projection: {
            arguments: {project},
            children: from,
          },
        };

        // Check for any aliased columns (e.g. SELECT foo AS bar...)
        const rename = select
          .filter((field) => field.hasAs)
          .map((field) => [field.value, field.alias]);
        if (rename.length === 0) {
          // Don't add a rename if not needed
          return projection;
        } else {
          // Perform any necessary renames
          return {
            rename: {
              arguments: {rename: fromEntries(rename)},
              children: [projection],
            },
          };
        }
      }

    case 'SubQuery':
    case 'TableReference':
      return buildRelExp(sql.value, types, tables);

    case 'TableFactor':
      // Store this table as one referenced by the query
      tables.push(sql.value.value);

      return {relation: sql.value.value};

    case 'InnerCrossJoinTable':
      // Add the condition if it exists
      if (sql.condition) {
        return {
          join: {
            left: buildRelExp(sql.left, types, tables),
            right: buildRelExp(sql.right, types, tables),
            type: 'inner',
            condition: convertExpr(sql.condition.value, types, tables),
          },
        };
      } else {
        return {
          product: {
            left: buildRelExp(sql.left, types, tables),
            right: buildRelExp(sql.right, types, tables),
          },
        };
      }

    case 'LeftRightJoinTable':
      // Add the condition if it exists
      if (sql.condition) {
        return {
          join: {
            left: buildRelExp(sql.left, types, tables),
            right: buildRelExp(sql.right, types, tables),
            type: sql.leftRight.toLowerCase(),
            condition: convertExpr(sql.condition.value, types, tables),
          },
        };
      } else {
        throw new Error('Condition-less ' + sql.leftRight + ' Join');
      }

    default:
      throw new Error('Unsupported statement ' + sql.type + '.');
  }
}

type CONDITION_TYPE = {
  cmp: {
    lhs: any,
    op: string,
    rhs: any,
  },
};

type GRAPH = {
  nodes: {
    [key: string]: {
      tableName: string,
      selections: Array<{[key: string]: any}>,
      edges: Array<{[key: string]: any}>,
    },
  },
};

const joinExpression = (
  left: {[key: string]: any},
  right: {[key: string]: any},
  type: string,
  condition: CONDITION_TYPE
) => {
  return {
    join: {
      left: left,
      right: right,
      type: type,
      condition: {
        cmp: {
          lhs: condition.cmp.lhs,
          op: condition.cmp.op,
          rhs: condition.cmp.rhs,
        },
      },
    },
  };
};

const getSelectionExpression = (
  tableName: string,
  selections: Array<{[key: string]: any}>
) => {
  let relation = {relation: tableName};
  if (selections.length === 0) {
    return relation;
  }
  let select: {[key: string]: any} = {};
  if (selections.length === 1) {
    select = selections[0];
  } else {
    select = {
      and: {
        clauses: selections,
      },
    };
  }
  return {
    selection: {
      arguments: {
        select: select,
      },
      children: [relation],
    },
  };
};

/**
 * Optimizes a given relational algebra expression, if possible
 * @param type string denoting the type of optimization
 * @param expr object denoting the expression to optimize
 * @returns {{join: {condition: {cmp: {op, lhs, rhs}}, left: {[p: string]: *}, right: {[p: string]: *}, type: *}}|{[p: string]: *}}
 */
function optimize(type: string, expr: {[key: string]: any}) {
  switch (type) {
    case 'join':
      const graph = constructRelationalGraph(expr);
      const optimizedExpr = optimizeJoinOrder(graph);
      return optimizedExpr;
    default:
      return expr;
  }
}

/**
 * Optimize the join order of a given relational graph
 * Currently optimizes join order by
 * @param {*} graph
 */
const optimizeJoinOrder = (graph: GRAPH): {[key: string]: any} => {
  const nodes = graph.nodes;
  const edges = Object.entries(nodes).map(([tableName, node]) => {
    return {tableName, edges: node.edges};
  });
  // create a set for the edges to remove duplicates
  const edgeSet: Set<any> = new Set();
  for (const edge of edges) {
    for (const e of edge.edges) {
      edgeSet.add(e);
    }
  }
  // cast the set back to an array
  const edgeArray = Array.from(edgeSet);
  // Dummy join order logic
  // sort the edgeArray so that the tables with ascending table names are joined first
  edgeArray.sort((a, b) => {
    const aleftTable = a.cmp.lhs.split('.')[0];
    const arightTable = a.cmp.rhs.split('.')[0];
    const bleftTable = b.cmp.lhs.split('.')[0];
    const brightTable = b.cmp.rhs.split('.')[0];
    return (
      aleftTable.localeCompare(bleftTable) +
      aleftTable.localeCompare(brightTable) +
      arightTable.localeCompare(bleftTable) +
      arightTable.localeCompare(brightTable)
    );
  });

  // this function should return the best edge to join based on selectivity in the future
  // at the moment it just returns the first edge because the array is sorted
  const getBestEdgeToJoin = (edgeArray: Array<CONDITION_TYPE>) => {
    // get the first edge from the edgeArray and remove it from the array
    const bestEdge = edgeArray.shift();
    return bestEdge;
  };

  // recursively construct the join expression using joinexpr function from edgeArray
  const constructJoinExpr = (
    edgeArray: Array<CONDITION_TYPE>,
    joinMap: {[key: string]: any},
    joinExpr: {[key: string]: any}
  ): {[key: string]: any} => {
    if (edgeArray.length === 0) {
      return joinExpr;
    }
    const bestEdge = getBestEdgeToJoin(edgeArray);
    const leftTable = bestEdge.cmp.lhs.split('.')[0];
    const leftRelation =
      leftTable in joinMap
        ? joinMap[leftTable]
        : getSelectionExpression(leftTable, nodes[leftTable].selections);
    const rightTable = bestEdge.cmp.rhs.split('.')[0];
    const rightRelation =
      rightTable in joinMap
        ? joinMap[rightTable]
        : getSelectionExpression(rightTable, nodes[rightTable].selections);
    const type: string = 'inner';
    joinExpr = joinExpression(leftRelation, rightRelation, type, bestEdge);
    joinMap[leftTable] = joinExpr;
    joinMap[rightTable] = joinExpr;
    return constructJoinExpr(edgeArray, joinMap, joinExpr);
  };
  // default joinExpr is the first node in the graph
  const firstTable = Object.keys(nodes)[0];
  const selectExpr = getSelectionExpression(
    firstTable,
    nodes[firstTable].selections
  );
  return constructJoinExpr(edgeArray, {}, selectExpr);
};

/**
 * Constructs a relational graph from the expr
 * Nodes will have (tableName and selection criteria if any on that table)
 * Edges are the join relations
 * @param {*} expr
 */
const constructRelationalGraph = (expr: {[key: string]: any}): GRAPH => {
  // enums for selection and join
  const SELECTION_TYPE = 'selection';
  const JOIN_TYPE = 'join';
  const RELATION_TYPE = 'relation';

  const graph: GRAPH = {
    nodes: {},
  };

  // Create a node of the table name with relevant fields
  const addNode = (
    tableName: string,
    selection?: {[key: string]: any} | null = null
  ) => {
    if (!(tableName in graph.nodes)) {
      graph.nodes[tableName] = {
        tableName: tableName,
        selections: [],
        edges: [],
      };
    }
    if (selection) {
      graph.nodes[tableName]['selections'].push(selection);
    }
  };

  // Add an edge for two tables if there's a valid join relation between them
  const addEdge = (
    leftTable: string,
    rightTable: string,
    joinCondition: {[key: string]: any},
    leftSelection: {[key: string]: any} | null = null,
    rightSelection: {[key: string]: any} | null = null
  ) => {
    addNode(leftTable, leftSelection);
    addNode(rightTable, rightSelection);
    graph.nodes[leftTable]['edges'].push(joinCondition);
    graph.nodes[rightTable]['edges'].push(joinCondition);
  };

  const parseExpression = (expr: {[key: string]: any}) => {
    if (SELECTION_TYPE in expr) {
      const selection = expr[SELECTION_TYPE].arguments.select;
      // conditions = [{cmp: {lhs: 'Doctor.id', op: '$eq', rhs: '1'}}, ...]
      const conditions = selection?.and?.clauses || [selection];
      for (const condition of conditions) {
        const table = condition.cmp.lhs.split('.')[0];
        addNode(table, condition);
      }
      // these should be the 'join' type or 'relation' type
      const children = expr[SELECTION_TYPE].children;
      for (const child of children) {
        parseExpression(child);
      }
    } else if (JOIN_TYPE in expr) {
      const joinExpr = expr[JOIN_TYPE];
      const {left, right, condition} = joinExpr;
      parseExpression(left);
      parseExpression(right);
      const leftTable = condition.cmp.lhs.split('.')[0];
      const rightTable = condition.cmp.rhs.split('.')[0];
      addEdge(leftTable, rightTable, condition);
    } else if (RELATION_TYPE in expr) {
      const table = expr[RELATION_TYPE];
      addNode(table);
    } else {
      console.error('Invalid expression type', expr);
    }
  };
  parseExpression(expr);
  return graph;
};

const reducer: (
  State,
  ExprFromSqlAction | EnableOptimizationAction | DisableOptimizationAction
) => State = produce<
  State,
  ExprFromSqlAction | EnableOptimizationAction | DisableOptimizationAction,
>(
  (
    draft: State,
    action:
      | ExprFromSqlAction
      | EnableOptimizationAction
      | DisableOptimizationAction
  ) => {
    // eslint-disable-next-line default-case
    switch (action.type) {
      case EXPR_FROM_SQL:
        draft.expr = buildRelExp(action.sql, action.types, []);
        console.log('Building relational expression', original(draft));
        delete draft.unoptimizedExpr;
        delete draft.optimized;
        break;
      case ENABLE_OPTIMIZATION:
        draft.unoptimizedExpr = draft.expr;
        console.log('Optimizing now', original(draft));
        draft.expr = optimize(action.optimization, draft.expr);
        draft.optimized = true;
        break;
      case DISABLE_OPTIMIZATION:
        if (draft.unoptimizedExpr) {
          draft.expr = draft.unoptimizedExpr;
          delete draft.unoptimizedExpr;
        }
        delete draft.optimized;
    }
  },
  initialState
);

export default reducer;

/**
 * Expected Object should look like this:
 * 
 * {
    "expr": {
        "join": {
            "left": {
                "selection": {
                    "arguments": {
                        "select": {
                            "cmp": {
                                "lhs": "Doctor.id",
                                "op": "$eq",
                                "rhs": "1"
                            }
                        }
                    },
                    "children": [
                        {
                            "relation": "Doctor"
                        }
                    ]
                }
            },
            "right": {
                "relation": "Department"
            },
            "type": "inner",
            "condition": {
                "cmp": {
                    "lhs": "Doctor.departmentId",
                    "op": "$eq",
                    "rhs": "Department.id"
                }
            }
        }
    }
}
 * 
 */
