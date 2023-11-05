// @flow

export type Expression = {[key: string]: any};

export type JoinCondition = {[key: string]: any};

export type SelectionCondition = {[key: string]: any};

export type Graph = {
  [key: string]: {
    edges: {[key: string]: Array<JoinCondition>},
    selections: Array<SelectionCondition>,
  },
};
