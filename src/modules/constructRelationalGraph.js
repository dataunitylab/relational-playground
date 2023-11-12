// @flow
import Doctor from '../resources/Doctor.json';
import Patient from '../resources/Patient.json';
import Department from '../resources/Department.json';

import type {
  JoinCondition,
  SelectionCondition,
  Expression,
  Graph,
} from './types';

let canOptimize = true;

// Create a node of the table name with relevant fields
const addNode = (
  graph: Graph,
  tableName: string,
  selection?: ?SelectionCondition
) => {
  if (!(tableName in graph)) {
    graph[tableName] = {
      selections: [],
      edges: {},
    };
  }
  if (selection) {
    graph[tableName]['selections'].push(selection);
  }
  return tableName;
};

// Add an edge for two tables if there's a valid join relation between them
const addEdge = (
  graph: Graph,
  leftTable: string,
  rightTable: string,
  joinCondition: JoinCondition,
  joinType: string,
  leftSelection?: ?SelectionCondition,
  rightSelection?: ?SelectionCondition
) => {
  addNode(graph, leftTable, leftSelection);
  addNode(graph, rightTable, rightSelection);
  if (!(rightTable in graph[leftTable]['edges'])) {
    graph[leftTable]['edges'][rightTable] = [];
  }
  if (!(leftTable in graph[rightTable]['edges'])) {
    graph[rightTable]['edges'][leftTable] = [];
  }
  const edge = {condition: joinCondition, type: joinType};
  graph[leftTable]['edges'][rightTable].push(edge);
  graph[rightTable]['edges'][leftTable].push(edge);
};

const conditionIsOnValidAttributes = (
  attribute: string,
  tables: Array<string>
) => {
  const columns: Array<string> = [];
  for (const table of tables) {
    switch (table) {
      case 'Doctor':
        columns.push(...Doctor.columns);
        break;
      case 'Patient':
        columns.push(...Patient.columns);
        break;
      case 'Department':
        columns.push(...Department.columns);
        break;
      default:
        // pass
        break;
    }
  }
  return columns.includes(attribute);
};

// function to check if a selection condition is a join condition
// assuming that the selection condition is on a single table and join condition is between two tables
const isValidJoinColumn = (attribute: string, tables: Array<string>) => {
  if (attribute.includes('.')) {
    const table = attribute.split('.')[0];
    if (!tables.includes(table)) return false;
  } else if (!conditionIsOnValidAttributes(attribute, tables)) {
    return false;
  }
  return true;
};

export const getTableFromAttribute = (
  attribute: string,
  tables: Array<string>
): string => {
  if (attribute.includes('.')) {
    return attribute.split('.')[0];
  }
  for (const table of tables) {
    if (conditionIsOnValidAttributes(attribute, [table])) {
      return table;
    }
  }
  // this should never happen except for edge cases
  return '';
};

const parseSelectionExpression = (
  graph: Graph,
  expr: Expression,
  tables: Array<string>,
  globalSelections: Array<SelectionCondition>
) => {
  if ('and' in expr) {
    const conditions = expr['and'].clauses;
    for (const condition of conditions) {
      parseSelectionExpression(graph, condition, tables, globalSelections);
    }
  } else if ('cmp' in expr) {
    const selection = expr['cmp'];
    if (
      isValidJoinColumn(selection.lhs, tables) &&
      isValidJoinColumn(selection.rhs, tables)
    ) {
      globalSelections.push(expr);
    } else {
      const {lhs, rhs} = selection;
      const leftTable = getTableFromAttribute(lhs, tables);
      const rightTable = getTableFromAttribute(rhs, tables);
      const table = leftTable || rightTable;
      if (table !== '') addNode(graph, table, expr);
      else globalSelections.push(expr);
    }
  } else {
    console.error(
      'Invalid selection expression for Join Order Optimization',
      expr
    );
  }
};

const parseJoinExpression = (
  graph: Graph,
  expr: Expression,
  joinType: string,
  tables: Array<string>
): void => {
  if (typeof expr === 'string') {
    console.error(
      'Invalid join expression for Join Order Optimization. This type of join condition is not supported currently'
    );
    canOptimize = false;
    return;
  } else if ('and' in expr) {
    const conditions = expr['and'].clauses;
    for (const condition of conditions) {
      parseJoinExpression(graph, condition, joinType, tables);
    }
  } else if ('cmp' in expr) {
    const {lhs, rhs} = expr['cmp'];
    const leftTable = getTableFromAttribute(lhs, tables);
    const rightTable = getTableFromAttribute(rhs, tables);
    if (leftTable === '' || rightTable === '') {
      console.error(
        'Invalid join expression for Join Order Optimization. This type of join condition is not supported currently'
      );
      canOptimize = false;
      return;
    }
    addEdge(graph, leftTable, rightTable, expr['cmp'], joinType);
  } else {
    console.error('Invalid join expression for Join Order Optimization');
    canOptimize = false;
    return;
  }
};

// function used to check all the tables that are involved in this query
const preParseExpression = (expr: Expression, tables: Array<string>) => {
  if (typeof expr === 'object') {
    if ('relation' in expr) tables.push(expr['relation']);
    for (const key in expr) {
      preParseExpression(expr[key], tables);
    }
  } else if (Array.isArray(expr)) {
    for (const item of expr) {
      preParseExpression(item, tables);
    }
  }
};

const parseExpression = (
  graph: Graph,
  expr: Expression,
  tables: Array<string>,
  globalSelections: Array<SelectionCondition>
): void => {
  if ('selection' in expr) {
    const selection = expr['selection'].arguments.select;
    parseSelectionExpression(graph, selection, tables, globalSelections);
    const children = expr['selection'].children;
    for (const child of children) {
      parseExpression(graph, child, tables, globalSelections);
    }
  } else if ('join' in expr) {
    const joinExpr = expr['join'];
    const {left, right, type, condition} = joinExpr;
    parseJoinExpression(graph, condition, type, tables);
    parseExpression(graph, left, tables, globalSelections);
    parseExpression(graph, right, tables, globalSelections);
  } else if ('relation' in expr) {
    const table = expr['relation'];
    addNode(graph, table);
  } else {
    console.error('Invalid expression type for join order optimization');
    canOptimize = false;
    return;
  }
};

/**
 * Constructs a relational graph from the expr
 * Nodes will have (tableName and selection criteria if any on that table)
 * Edges are the join relations
 * @param {*} expr
 */
export const constructRelationalGraph = (expr: {
  [key: string]: any,
}): {
  graph: Graph,
  globalSelections: Array<SelectionCondition>,
  canOptimize: boolean,
} => {
  canOptimize = true;
  const graph: Graph = {};
  const tables: Array<string> = [];
  const globalSelections: Array<SelectionCondition> = [];
  preParseExpression(expr, tables);
  // if duplicate tables found, console error and don't proceed
  const uniqueTables = new Set(tables);
  if (uniqueTables.size !== tables.length) {
    console.error('Duplicate tables found in the query');
    canOptimize = false;
    return {
      graph: graph,
      globalSelections: globalSelections,
      canOptimize,
    };
  }
  parseExpression(graph, expr, tables, globalSelections);
  return {graph: graph, globalSelections: globalSelections, canOptimize};
};
