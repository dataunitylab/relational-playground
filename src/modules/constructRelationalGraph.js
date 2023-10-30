// @flow
import {original} from 'immer';
import Doctor from '../resources/Doctor.json';
import Patient from '../resources/Patient.json';
import Department from '../resources/Department.json';

export type Expression = {[key: string]: any};

export type JoinCondition = {[key: string]: any};

export type SelectionCondition = {[key: string]: any};

export type Graph = {
  [key: string]: {
    edges: {[key: string]: Array<JoinCondition>},
    selections: Array<SelectionCondition>,
  },
};

export const AvailableTables = ['Doctor', 'Patient', 'Department'];

export const ExpressionType = {
  SELECTION: 'selection',
  JOIN: 'join',
  RELATION: 'relation',
  AND: 'and',
  CMP: 'cmp',
};

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
  graph[leftTable]['edges'][rightTable].push(joinCondition);
  graph[rightTable]['edges'][leftTable].push(joinCondition);
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
        console.error('Invalid table name', table);
        throw new Error('Invalid table name');
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
  if (ExpressionType.AND in expr) {
    const conditions = expr[ExpressionType.AND].clauses;
    for (const condition of conditions) {
      parseSelectionExpression(graph, condition, tables, globalSelections);
    }
  } else if (ExpressionType.CMP in expr) {
    const selection = expr[ExpressionType.CMP];
    if (
      isValidJoinColumn(selection.lhs, tables) &&
      isValidJoinColumn(selection.rhs, tables)
    ) {
      const {lhs, rhs} = selection;
      const leftTable = getTableFromAttribute(lhs, tables);
      const rightTable = getTableFromAttribute(rhs, tables);
      addEdge(graph, leftTable, rightTable, selection);
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
  tables: Array<string>
) => {
  if (ExpressionType.AND in expr) {
    const conditions = expr[ExpressionType.AND].clauses;
    for (const condition of conditions) {
      parseJoinExpression(graph, condition, tables);
    }
  } else if (ExpressionType.CMP in expr) {
    const {lhs, rhs} = expr[ExpressionType.CMP];
    const leftTable = getTableFromAttribute(lhs, tables);
    const rightTable = getTableFromAttribute(rhs, tables);
    addEdge(graph, leftTable, rightTable, expr[ExpressionType.CMP]);
  } else {
    console.error('Invalid join expression for Join Order Optimization', expr);
  }
};

// function used to check all the tables that are involved in this query
const preParseExpression = (expr: Expression, tables: Array<string>) => {
  if (typeof expr === 'object') {
    if (ExpressionType.RELATION in expr)
      tables.push(expr[ExpressionType.RELATION]);
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
  if (ExpressionType.SELECTION in expr) {
    const selection = expr[ExpressionType.SELECTION].arguments.select;
    parseSelectionExpression(graph, selection, tables, globalSelections);
    const children = expr[ExpressionType.SELECTION].children;
    for (const child of children) {
      parseExpression(graph, child, tables, globalSelections);
    }
  } else if (ExpressionType.JOIN in expr) {
    const joinExpr = expr[ExpressionType.JOIN];
    const {left, right, condition} = joinExpr;
    parseJoinExpression(graph, condition, tables);
    parseExpression(graph, left, tables, globalSelections);
    parseExpression(graph, right, tables, globalSelections);
  } else if (ExpressionType.RELATION in expr) {
    const table = expr[ExpressionType.RELATION];
    addNode(graph, table);
  } else {
    console.error('Invalid expression type', expr);
    throw new Error('Invalid expression type');
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
}): {graph: Graph, globalSelections: Array<SelectionCondition>} => {
  const graph: Graph = {};
  const tables: Array<string> = [];
  const globalSelections: Array<SelectionCondition> = [];
  preParseExpression(expr, tables);
  // if duplicate tables found, console error and don't proceed
  const uniqueTables = new Set(tables);
  if (uniqueTables.size !== tables.length) {
    console.error('Duplicate tables found in the query');
    throw new Error('Duplicate tables found in the query');
  }
  parseExpression(graph, expr, tables, globalSelections);
  // printGraph(graph, globalSelections);
  // print the graph using original to see the actual graph
  return {graph: graph, globalSelections: globalSelections};
};

const printGraph = (
  graph: Graph,
  globalSelections: Array<SelectionCondition>
) => {
  for (const table in graph) {
    console.log('Table: ', table);
    for (const edge in graph[table]['edges']) {
      console.log('Edge: ', edge);
      for (const joinCondition of graph[table]['edges'][edge]) {
        console.log('Join Condition: ', original(joinCondition));
      }
    }
    for (const selection of graph[table]['selections']) {
      console.log('Selection: ', original(selection));
    }
  }
  for (const selection of globalSelections) {
    console.log('Global selection: ', original(selection));
  }
};
