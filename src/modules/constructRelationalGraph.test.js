// add test cases for constructRelationalGraph

import {constructRelationalGraph} from './constructRelationalGraph';

describe('constructRelationalGraph', () => {
  /** @test {constructRelationalGraph} */
  it('should return the correct graph for a simple expression', () => {
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
            relation: 'Doctor',
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    expect(graph).toEqual({
      Doctor: {
        selections: [
          {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
        ],
        edges: {},
      },
    });
    expect(globalSelections).toEqual([]);
  });

  /** @test {constructRelationalGraph} */
  it('should return the correct global selections for simple expression', () => {
    const expr = {
      selection: {
        arguments: {
          select: {
            cmp: {
              lhs: '2',
              op: '$eq',
              rhs: '1',
            },
          },
        },
        children: [
          {
            relation: 'Doctor',
          },
        ],
      },
    };
    const {globalSelections} = constructRelationalGraph(expr);
    expect(globalSelections).toEqual([{cmp: {lhs: '2', op: '$eq', rhs: '1'}}]);
  });

  /** @test {constructRelationalGraph} */
  it('should correctly parse multiple selections with and operator', () => {
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
                    lhs: 'Doctor.firstName',
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
            relation: 'Doctor',
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    expect(graph).toEqual({
      Doctor: {
        selections: [
          {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
          {
            cmp: {
              lhs: 'Doctor.firstName',
              op: '$eq',
              rhs: '2',
            },
          },
        ],
        edges: {},
      },
    });
    expect(globalSelections).toEqual([]);
  });

  it('should correctly parse multiple selections with and operator and global selections', () => {
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
                    lhs: 'Doctor.firstName',
                    op: '$eq',
                    rhs: '2',
                  },
                },
                {
                  cmp: {
                    lhs: '2',
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
            relation: 'Doctor',
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    expect(graph).toEqual({
      Doctor: {
        selections: [
          {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
          {
            cmp: {
              lhs: 'Doctor.firstName',
              op: '$eq',
              rhs: '2',
            },
          },
        ],
        edges: {},
      },
    });
    expect(globalSelections).toEqual([{cmp: {lhs: '2', op: '$eq', rhs: '2'}}]);
  });

  it('should handle invalid selection operator types like "or"', () => {
    const expr = {
      selection: {
        arguments: {
          select: {
            or: {
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
                    lhs: 'Doctor.firstName',
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
            relation: 'Doctor',
          },
        ],
      },
    };
    const {graph, globalSelections} = constructRelationalGraph(expr);
    expect(graph).toEqual({
      Doctor: {
        selections: [],
        edges: {},
      },
    });
    expect(globalSelections).toEqual([]);
  });

  it('should handle simple join expressions with selection clauses', () => {
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
    expect(graph).toEqual({
      Doctor: {
        selections: [
          {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
        ],
        edges: {
          Patient: [
            {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: 'Patient.primaryDoctor',
            },
          ],
        },
      },
      Patient: {
        selections: [],
        edges: {
          Doctor: [
            {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: 'Patient.primaryDoctor',
            },
          ],
        },
      },
    });
    expect(globalSelections).toEqual([]);
  });

  it('should handle complex join expressions with selection clauses', () => {
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
    expect(graph).toEqual({
      Doctor: {
        selections: [
          {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
        ],
        edges: {
          Patient: [
            {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: 'Patient.primaryDoctor',
            },
          ],
          Department: [
            {
              lhs: 'Doctor.departmentId',
              op: '$eq',
              rhs: 'Department.id',
            },
          ],
        },
      },
      Patient: {
        selections: [
          {
            cmp: {
              lhs: 'Patient.id',
              op: '$eq',
              rhs: '2',
            },
          },
        ],
        edges: {
          Doctor: [
            {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: 'Patient.primaryDoctor',
            },
          ],
        },
      },
      Department: {
        selections: [],
        edges: {
          Doctor: [
            {
              lhs: 'Doctor.departmentId',
              op: '$eq',
              rhs: 'Department.id',
            },
          ],
        },
      },
    });
    expect(globalSelections).toEqual([]);
  });

  it('should handle cyclic join expressions with selection clauses', () => {
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
    expect(graph).toEqual({
      Doctor: {
        selections: [
          {
            cmp: {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: '1',
            },
          },
        ],
        edges: {
          Patient: [
            {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: 'Patient.primaryDoctor',
            },
          ],
          Department: [
            {
              lhs: 'Doctor.departmentId',
              op: '$eq',
              rhs: 'Department.id',
            },
          ],
        },
      },
      Patient: {
        selections: [
          {
            cmp: {
              lhs: 'Patient.id',
              op: '$eq',
              rhs: '2',
            },
          },
        ],
        edges: {
          Doctor: [
            {
              lhs: 'Doctor.id',
              op: '$eq',
              rhs: 'Patient.primaryDoctor',
            },
          ],
          Department: [
            {
              lhs: 'Patient.id',
              op: '$eq',
              rhs: 'Department.id',
            },
          ],
        },
      },
      Department: {
        selections: [],
        edges: {
          Doctor: [
            {
              lhs: 'Doctor.departmentId',
              op: '$eq',
              rhs: 'Department.id',
            },
          ],
          Patient: [
            {
              lhs: 'Patient.id',
              op: '$eq',
              rhs: 'Department.id',
            },
          ],
        },
      },
    });
    expect(globalSelections).toEqual([]);
  });

  it('should throw error for edge case join conditions', () => {
    const expr1 = {
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
                  lhs: '1',
                  op: '$eq',
                  rhs: '1',
                },
              },
            },
          },
        ],
      },
    };

    const expr2 = {
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
              condition: '1',
            },
          },
        ],
      },
    };
    // expect error to be thrown
    expect(() => constructRelationalGraph(expr1)).toThrow(Error);
    expect(() => constructRelationalGraph(expr2)).toThrow(Error);
  });

  it('should throw error for multi-table join query', () => {
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
          {
            join: {
              left: {
                relation: 'Patient',
              },
              right: {
                relation: 'Visit',
              },
              type: 'inner',
              condition: {
                cmp: {
                  lhs: 'Patient.id',
                  op: '$eq',
                  rhs: 'Visit.patient',
                },
              },
            },
          },
        ],
      },
    };
    expect(() => constructRelationalGraph(expr)).toThrow(Error);
  });
});
