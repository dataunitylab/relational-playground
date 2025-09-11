// add test cases to test the join order optimization

import {constructRelationalGraph} from './constructRelationalGraph';
import {joinOrderOptimization} from './joinOrderOptimization';

describe('join order optimization', () => {
  it('should return the correct join order for simple join queries', () => {
    const expr = {
      selection: {
        arguments: {
          select: {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
        },
        children: [
          {
            join: {
              left: {
                relation: 'Doctor',
              },
              right: {
                relation: 'Patient',
              },
              type: 'inner',
              condition: {
                cmp: {
                  lhs: 'Doctor.id',
                  op: '$eq',
                  rhs: 'Patient.primaryDoctor',
                },
              },
            },
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    const joinOrderExpr = joinOrderOptimization(graph, globalSelections);
    expect(joinOrderExpr).toEqual({
      join: {
        left: {
          selection: {
            arguments: {select: {cmp: {lhs: 'Doctor.id', op: '$eq', rhs: '1'}}},
            children: [{relation: 'Doctor'}],
          },
        },
        right: {relation: 'Patient'},
        type: 'inner',
        condition: {
          cmp: {lhs: 'Doctor.id', op: '$eq', rhs: 'Patient.primaryDoctor'},
        },
      },
    });
  });

  it('should return the correct join order for complex join queries', () => {
    const expr = {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {
                  cmp: {
                    lhs: 'Doctor.id',
                    op: '$eq',
                    rhs: '1',
                  },
                },
                {
                  cmp: {
                    lhs: 'Patient.id',
                    op: '$eq',
                    rhs: '2',
                  },
                },
              ],
            },
          },
        },
        children: [
          {
            join: {
              left: {
                join: {
                  left: {
                    relation: 'Doctor',
                  },
                  right: {
                    relation: 'Patient',
                  },
                  type: 'inner',
                  condition: {
                    cmp: {
                      lhs: 'Doctor.id',
                      op: '$eq',
                      rhs: 'Patient.primaryDoctor',
                    },
                  },
                },
              },
              right: {
                relation: 'Department',
              },
              type: 'inner',
              condition: {
                cmp: {
                  lhs: 'Doctor.departmentId',
                  op: '$eq',
                  rhs: 'Department.id',
                },
              },
            },
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    const joinOrderExpr = joinOrderOptimization(graph, globalSelections);
    expect(joinOrderExpr).toEqual({
      join: {
        left: {
          join: {
            condition: {
              cmp: {
                lhs: 'Doctor.id',
                op: '$eq',
                rhs: 'Patient.primaryDoctor',
              },
            },
            left: {
              selection: {
                arguments: {
                  select: {
                    cmp: {
                      lhs: 'Doctor.id',
                      op: '$eq',
                      rhs: '1',
                    },
                  },
                },
                children: [{relation: 'Doctor'}],
              },
            },
            right: {
              selection: {
                arguments: {
                  select: {
                    cmp: {
                      lhs: 'Patient.id',
                      op: '$eq',
                      rhs: '2',
                    },
                  },
                },
                children: [{relation: 'Patient'}],
              },
            },
            type: 'inner',
          },
        },
        right: {relation: 'Department'},
        type: 'inner',
        condition: {
          cmp: {
            lhs: 'Doctor.departmentId',
            op: '$eq',
            rhs: 'Department.id',
          },
        },
      },
    });
  });

  it('should return the correct join order for cyclic join queries', () => {
    const expr = {
      selection: {
        arguments: {
          select: {
            and: {
              clauses: [
                {
                  cmp: {
                    lhs: 'Doctor.id',
                    op: '$eq',
                    rhs: '1',
                  },
                },
                {
                  cmp: {
                    lhs: 'Patient.id',
                    op: '$eq',
                    rhs: '2',
                  },
                },
              ],
            },
          },
        },
        children: [
          {
            join: {
              left: {
                join: {
                  left: {
                    relation: 'Doctor',
                  },
                  right: {
                    relation: 'Patient',
                  },
                  type: 'inner',
                  condition: {
                    cmp: {
                      lhs: 'Doctor.id',
                      op: '$eq',
                      rhs: 'Patient.primaryDoctor',
                    },
                  },
                },
              },
              right: {
                relation: 'Department',
              },
              type: 'inner',
              condition: {
                and: {
                  clauses: [
                    {
                      cmp: {
                        lhs: 'Doctor.departmentId',
                        op: '$eq',
                        rhs: 'Department.id',
                      },
                    },
                    {
                      cmp: {
                        lhs: 'Patient.id',
                        op: '$eq',
                        rhs: 'Department.id',
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    const joinOrderExpr = joinOrderOptimization(graph, globalSelections);
    expect(joinOrderExpr).toEqual({
      join: {
        condition: {
          and: {
            clauses: [
              {
                cmp: {
                  lhs: 'Doctor.departmentId',
                  op: '$eq',
                  rhs: 'Department.id',
                },
              },
              {
                cmp: {
                  lhs: 'Doctor.id',
                  op: '$eq',
                  rhs: 'Patient.primaryDoctor',
                },
              },
            ],
          },
        },
        left: {
          join: {
            condition: {
              cmp: {
                lhs: 'Patient.id',
                op: '$eq',
                rhs: 'Department.id',
              },
            },
            left: {
              selection: {
                arguments: {
                  select: {
                    cmp: {
                      lhs: 'Patient.id',
                      op: '$eq',
                      rhs: '2',
                    },
                  },
                },
                children: [{relation: 'Patient'}],
              },
            },
            right: {
              relation: 'Department',
            },
            type: 'inner',
          },
        },
        right: {
          selection: {
            arguments: {
              select: {
                cmp: {
                  lhs: 'Doctor.id',
                  op: '$eq',
                  rhs: '1',
                },
              },
            },
            children: [{relation: 'Doctor'}],
          },
        },
        type: 'inner',
      },
    });
  });

  it('should handle disconnected graph gracefully', () => {
    // Create a manually constructed graph with two disconnected tables
    const disconnectedGraph = {
      Doctor: {
        selections: [{cmp: {lhs: 'Doctor.id', op: '$eq', rhs: '1'}}],
        edges: {},
      },
      Patient: {
        selections: [{cmp: {lhs: 'Patient.id', op: '$eq', rhs: '2'}}],
        edges: {},
      },
    };

    // This should throw an error since there's no way to join these tables
    expect(() => {
      joinOrderOptimization(disconnectedGraph, []);
    }).toThrow(
      'Join order optimization failed: disconnected graph or no valid joins'
    );
  });

  it('should handle empty graph gracefully', () => {
    // Empty graph should throw an error
    expect(() => {
      joinOrderOptimization({}, []);
    }).toThrow(
      'Join order optimization failed: disconnected graph or no valid joins'
    );
  });
});
