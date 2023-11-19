// @flow
import type {JoinCondition, SelectionCondition, Graph} from './types';

import TinyQueue from 'tinyqueue';

import {initialState, applyExpr} from './data';

/**
 * Formats into selection condition format for a given table
 * @param tableExpr - a relational algebra expression object to render
 * @param selections - an array where all created paths should be saved
 * @return a tree structure representing the exppression
 */
const getSelectionExpression = (
  tableExpr: string | {[key: string]: any},
  selections: Array<SelectionCondition>
) => {
  let relation =
    typeof tableExpr === 'string' ? {relation: tableExpr} : tableExpr;
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
 * Formats into join condition format for a given table
 * @param joinConditions - a relational algebra expression object to render
 * @return a tree structure representing the exppression
 */
const formatJoinConditions = (joinConditions: Array<JoinCondition>) => {
  if (joinConditions.length === 0) {
    return {cmp: {}};
  }
  if (joinConditions.length === 1) {
    return {cmp: joinConditions[0].condition};
  } else {
    const processedJoinConditions = joinConditions.map((joinCondition) => {
      return {cmp: joinCondition.condition};
    });
    return {and: {clauses: processedJoinConditions}};
  }
};

/**
 * Formats into relational expression format for a given table
 * @param tableName - a relational algebra expression object to render
 * @param tablesWithSelections - all tables with selections
 */
const getRelationExpression = (
  tableName: string,
  tablesWithSelections: {[key: string]: any}
) => {
  if (tableName in tablesWithSelections) {
    return tablesWithSelections[tableName];
  }
  return {relation: tableName};
};

/**
 * Parses the join order expression
 * @param tablesWithSelections - all tables with selections
 * @param joinOrder - the join order
 */
const parseJoinOrderExpression = (
  tablesWithSelections: {[key: string]: any},
  joinOrder: Array<string | Array<JoinCondition>>
) => {
  let leftJoinExpr: {[key: string]: any} = getRelationExpression(
    (joinOrder[0]: any),
    tablesWithSelections
  );
  for (let i = 2; i < joinOrder.length; i += 2) {
    const rightTable: any = joinOrder[i];
    const joinConditions: any = joinOrder[i - 1];
    const rightJoinExpr = getRelationExpression(
      rightTable,
      tablesWithSelections
    );
    leftJoinExpr = {
      join: {
        left: leftJoinExpr,
        right: rightJoinExpr,
        type: joinConditions[0].type ?? 'inner',
        condition: formatJoinConditions(joinConditions),
      },
    };
  }
  return leftJoinExpr;
};

/**
 * Gets the relational expression for the given join order
 * @param graph - the relational graph
 * @param bestJoinOrder - the best join order
 * @param globalSelections - the global selections
 */
const getRelationalExpression = (
  graph: Graph,
  bestJoinOrder: Array<string | Array<JoinCondition>>,
  globalSelections: Array<SelectionCondition>
): {[key: string]: any} => {
  const tablesWithSelections: {[key: string]: any} = {};
  for (const tableName in graph) {
    const selections = graph[tableName]?.selections ?? [];
    if (selections.length > 0) {
      tablesWithSelections[tableName] = getSelectionExpression(
        tableName,
        selections
      );
    }
  }

  const joinExpr = parseJoinOrderExpression(
    tablesWithSelections,
    bestJoinOrder
  );
  return getSelectionExpression(joinExpr, globalSelections);
};

/**
 * Performs join order optimization
 * @param graph - the relational graph
 * @param globalSelections - the global selections
 * @return the relational expression
 */
const joinOrderOptimization = (
  graph: Graph,
  globalSelections: Array<SelectionCondition>
): {[key: string]: any} => {
  const queue = new TinyQueue([], function (a, b) {
    return a.getCost() - b.getCost();
  });
  // initialize the queue with all the nodes
  for (const node in graph) {
    queue.push(
      new JoinOrderQueueElement(graph, [node], getTableData(node), 0, [node], {
        relation: node,
      })
    );
  }

  let bestCost = Number.MAX_SAFE_INTEGER;
  let bestJoinOrder: Array<string | Array<JoinCondition>> = [];
  const JOIN_ORDER_SIZE = Object.keys(graph).length;
  while (queue.length > 0) {
    const joinOrderElement = queue.pop();
    // condition to prune this branch
    if (joinOrderElement && joinOrderElement.getCost() >= bestCost) {
      continue;
    }
    // condition to stop this branch
    if (joinOrderElement && joinOrderElement.getSize() === JOIN_ORDER_SIZE) {
      if (joinOrderElement.getCost() < bestCost) {
        bestCost = joinOrderElement.getCost();
        bestJoinOrder = joinOrderElement.joinOrder;
      }
      continue;
    }
    const children = joinOrderElement ? joinOrderElement.getChildren() : [];
    for (const child of children) {
      queue.push(child);
    }
  }
  console.log('best join order', bestJoinOrder);
  console.log('best cost', bestCost);
  return getRelationalExpression(graph, bestJoinOrder, globalSelections);
};

/**
 * Gets the rows and cost for the given join conditions
 * @param rows - the rows
 * @param cost - the cost
 * @param joinConditions - the join conditions
 * @param leftTables - the left tables
 * @param rightTable - the right table
 */
const getRowsAndCost = (
  rows: number,
  cost: number,
  joinExpr: {[key: string]: any},
  joinConditions: Array<JoinCondition>,
  leftTables: Array<string>,
  rightTable: string
) => {
  // trying to see if we can use applyExpr from data.js
  const joinConditionsExpr = formatJoinConditions(joinConditions);
  const combinedJoinExpr = {
    join: {
      left: joinExpr,
      right: {
        relation: rightTable,
      },
      type: joinConditions[0].type ?? 'inner',
      condition: joinConditionsExpr,
    },
  };
  const joinResult = applyExpr(combinedJoinExpr, initialState.sourceData);
  const newRows = joinResult.data?.length ?? 0;
  const newCost = cost + rows * getTableData(rightTable);
  return {rows: newRows, cost: newCost, expr: combinedJoinExpr};
};

/**
 * Gets the data for the given table
 * @param tableName - the table name
 */
const getTableData = (tableName: string) => {
  return tableName in initialState.sourceData
    ? initialState.sourceData[tableName].data.length
    : 0;
};

class JoinOrderQueueElement {
  graph: Graph;
  joinTables: Array<string>;
  rows: number;
  cost: number;
  joinOrder: Array<string | Array<JoinCondition>>;
  joinExpr: {[key: string]: any};

  constructor(
    graph: Graph,
    joinTables: Array<string>,
    rows: number,
    cost: number,
    joinOrder: Array<string | Array<JoinCondition>>,
    joinExpr: {[key: string]: any}
  ) {
    this.graph = graph;
    this.joinTables = joinTables;
    this.rows = rows;
    this.cost = cost;
    this.joinOrder = joinOrder;
    this.joinExpr = joinExpr;
  }

  getCost = (): number => {
    return this.cost;
  };

  getSize = (): number => {
    return this.joinTables.length;
  };

  /**
   * Gets the children of the current join order
   * Iterates through all the tables in the current join order
   * For each table, iterates through all its neighbors
   * If the neighbor is not in the current join order, evaluate the cost of adding it
   * and add it to the queue
   * Add the join conditions between the tables in the join order so far and the new neighbor
   * @return the children
   */
  // eslint-disable-next-line no-use-before-define
  getChildren(): Array<JoinOrderQueueElement> {
    const children = [];
    // iterate through all the tables in the current join order
    for (const table of this.joinTables) {
      const edges = this.graph[table].edges;
      const neighbors = Object.keys(edges);
      // iterate through all the neighbors of the current table
      for (const neighbor of neighbors) {
        if (this.joinTables.includes(neighbor)) continue;
        let joinConditions: Array<JoinCondition> = [];
        for (const currentTable in this.graph[neighbor].edges) {
          if (this.joinTables.includes(currentTable)) {
            joinConditions = [
              ...joinConditions,
              ...this.graph[neighbor].edges[currentTable],
            ];
          }
        }
        const newJoinOrder = [...this.joinOrder, joinConditions, neighbor];
        // evaluate the cost of adding the neighbor
        const {rows, cost, expr} = getRowsAndCost(
          this.rows,
          this.cost,
          this.joinExpr,
          joinConditions,
          this.joinTables,
          neighbor
        );
        // add it to the list of children
        children.push(
          new JoinOrderQueueElement(
            this.graph,
            [...this.joinTables, neighbor],
            rows,
            cost,
            newJoinOrder,
            expr
          )
        );
      }
    }
    return children;
  }
}

export {joinOrderOptimization};
