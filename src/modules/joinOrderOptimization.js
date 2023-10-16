import department from '../resources/Department.json';
import doctor from '../resources/Doctor.json';
import patient from '../resources/Patient.json';

const SUPPORTED_TABLES = ['Department', 'Doctor', 'Patient'];

const RELATION_SELECTIVITY_MAP = {
  Department: {
    Department: 1,
    Doctor: 0.14285,
    Patient: 0.0,
  },
  Doctor: {
    Doctor: 1,
    Department: 0.14285,
    Patient: 0.025,
  },
  Patient: {
    Patient: 1,
    Doctor: 0.025,
    Department: 0.025,
  },
};

// jo parameters object structure in local storage
/*
jo_parameters: {
    Department: {
        rows: 7,
    }
}
*/

const saveJOParametersToLocalStorage = (joinOrderParameters) => {
  const json = JSON.stringify(joinOrderParameters);
  localStorage.setItem('jo_parameters', json);
};

const loadJOParametersFromLocalStorage = () => {
  const json = localStorage.getItem('jo_parameters');
  if (json) {
    return JSON.parse(json);
  }
  console.log('No join order parameters found in local storage');
  return {};
};

const getOriginalTableName = (tableName) => {
  return tableName.includes('_') ? tableName.split('_')[0] : tableName;
};

const getRowsFromJson = (tableName) => {
  switch (tableName) {
    case 'Department':
      return department.data.length;
    case 'Doctor':
      return doctor.data.length;
    case 'Patient':
      return patient.data.length;
    default:
      return 0;
  }
};

const getRows = (tableName) => {
  const originalTableName = getOriginalTableName(tableName);
  const joParameters = loadJOParametersFromLocalStorage();
  if (!SUPPORTED_TABLES.includes(originalTableName)) {
    console.error('Table name not supported');
    return 0;
  }
  const tableInfo =
    originalTableName in joParameters ? joParameters[originalTableName] : {};
  if ('rows' in tableInfo) {
    return joParameters[originalTableName].rows;
  } else {
    const rows = getRowsFromJson(originalTableName);
    tableInfo.rows = rows;
    joParameters[originalTableName] = tableInfo;
    saveJOParametersToLocalStorage(joParameters);
    return rows;
  }
};

const getSelectivity = (leftTableName, rightTableName) => {
  const leftOriginalTableName = getOriginalTableName(leftTableName);
  const rightOriginalTableName = getOriginalTableName(rightTableName);
  return RELATION_SELECTIVITY_MAP[leftOriginalTableName][
    rightOriginalTableName
  ];
};

const joinOrderOptimization = (graph) => {
  //   saveJOParametersToLocalStorage(RELATION_SELECTIVITY_MAP);
  const queue = new PriorityQueue();
  // initialize the queue with all the nodes
  for (const node in graph.nodes) {
    queue.enqueue(
      new JoinOrderQueueElement(graph, [node], new Set(), getRows(node), 0)
    );
  }
  // find number of edges in the graph
  const edges = [];
  for (const node in graph.nodes) {
    for (const edge of graph.nodes[node].edges) {
      edges.push(edge);
    }
  }
  let bestCost = Number.MAX_SAFE_INTEGER;
  let bestJoinOrder = [];
  const JOIN_ORDER_SIZE = edges.length / 2;
  while (queue.size() > 0) {
    const joinOrderElement = queue.dequeue();
    // condition to prune this branch
    if (joinOrderElement.getCost() >= bestCost) {
      continue;
    }
    // condition to stop this branch
    if (joinOrderElement.getSize() === JOIN_ORDER_SIZE) {
      if (joinOrderElement.getCost() < bestCost) {
        bestCost = joinOrderElement.getCost();
        bestJoinOrder = joinOrderElement.joinTables;
      }
      continue;
    }
    const children = joinOrderElement.getChildren();
    for (const child of children) {
      queue.enqueue(child);
    }
  }
  console.log('Best join order: ', bestJoinOrder, ' best cost: ', bestCost);
  return bestJoinOrder;
};

class JoinOrderQueueElement {
  constructor(graph, joinTables, edgesPicked, rows, cost) {
    this.graph = graph;
    this.joinTables = joinTables;
    this.edgesPicked = edgesPicked;
    this.rows = rows;
    this.cost = cost;
  }

  getCost = () => {
    return this.cost;
  };

  getSize = () => {
    return this.edgesPicked.size;
  };

  getChildren = () => {
    const children = [];
    for (const table of this.joinTables) {
      if (typeof table === 'object') continue;
      const node = this.graph.nodes[table];
      const edges = node.edges;
      for (const edge of edges) {
        const leftTable = edge.cmp.lhs.split('.')[0];
        const rightTable = edge.cmp.rhs.split('.')[0];
        // sort the edge representation to avoid duplicate join order
        // used to track if an edge has been picked
        const tableToJoin =
          getOriginalTableName(table) === leftTable ? rightTable : leftTable;
        const edgeRepr = [
          edge.cmp.lhs,
          edge.cmp.op,
          edge.cmp.rhs,
          table,
          tableToJoin,
        ]
          .sort()
          .join(' ');

        if (!this.edgesPicked.has(edgeRepr)) {
          const newTables = [...this.joinTables, edge, tableToJoin];
          const newRows =
            this.rows *
            getSelectivity(table, tableToJoin) *
            getRows(tableToJoin);
          const newCost = this.cost + this.rows * getRows(tableToJoin);
          const newEdgesPicked = new Set(this.edgesPicked);
          newEdgesPicked.add(edgeRepr);
          children.push(
            new JoinOrderQueueElement(
              this.graph,
              newTables,
              newEdgesPicked,
              newRows,
              newCost
            )
          );
        }
      }
    }
    return children;
  };
}

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
    this.heapifyUp(this.items.length - 1);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    if (this.items.length === 1) {
      return this.items.pop();
    }

    const root = this.items[0];
    this.items[0] = this.items.pop();
    this.heapifyDown(0);

    return root;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.items[index].getCost() < this.items[parentIndex].getCost()) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  heapifyDown(index) {
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestChildIndex = index;

      if (
        leftChildIndex < this.items.length &&
        this.items[leftChildIndex].getCost() <
          this.items[smallestChildIndex].getCost()
      ) {
        smallestChildIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this.items.length &&
        this.items[rightChildIndex].getCost() <
          this.items[smallestChildIndex].getCost()
      ) {
        smallestChildIndex = rightChildIndex;
      }

      if (smallestChildIndex !== index) {
        this.swap(index, smallestChildIndex);
        index = smallestChildIndex;
      } else {
        break;
      }
    }
  }

  swap(index1, index2) {
    const temp = this.items[index1];
    this.items[index1] = this.items[index2];
    this.items[index2] = temp;
  }
}

export {joinOrderOptimization};
