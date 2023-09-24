const RELATION_SIZE_MAP = {
  Department: 7,
  Doctor: 40,
  Patient: 40,
};

const RELATION_SELECTIVITY_MAP = {
  Department: {
    Doctor: 0.14285,
  },
  Doctor: {
    Department: 0.14285,
    Patient: 0.025,
  },
  Patient: {
    Doctor: 0.025,
  },
};

const joinOrderOptimization = (graph) => {
  const queue = new PriorityQueue();
  // initialize the queue with all the nodes
  for (const node in graph.nodes) {
    const rows = RELATION_SIZE_MAP[node];
    queue.enqueue(new JoinOrderQueueElement(graph, [node], rows, 0));
  }
  let bestCost = Number.MAX_SAFE_INTEGER;
  let bestJoinOrder = [];
  const JOIN_ORDER_SIZE = Object.keys(graph.nodes).length;
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
  constructor(graph, joinTables, rows, cost) {
    this.graph = graph;
    this.joinTables = joinTables;
    this.rows = rows;
    this.cost = cost;
  }

  getCost = () => {
    return this.cost;
  };

  getSize = () => {
    return this.joinTables.length;
  };

  getChildren = () => {
    const children = [];
    const currentTablesSet = new Set(this.joinTables);
    for (const table of this.joinTables) {
      const node = this.graph.nodes[table];
      const edges = node.edges;
      for (const edge of edges) {
        const leftTable = edge.cmp.lhs.split('.')[0];
        const rightTable = edge.cmp.rhs.split('.')[0];
        const tableToJoin = table === leftTable ? rightTable : leftTable;
        if (!currentTablesSet.has(tableToJoin)) {
          const newTables = [...this.joinTables, tableToJoin];
          const newRows =
            this.rows *
            RELATION_SELECTIVITY_MAP[table][tableToJoin] *
            RELATION_SIZE_MAP[tableToJoin];
          const newCost =
            this.cost + this.rows * RELATION_SIZE_MAP[tableToJoin];
          children.push(
            new JoinOrderQueueElement(this.graph, newTables, newRows, newCost)
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
