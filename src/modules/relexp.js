const initialState = {
  expr: {
    rename: {
      arguments: { rename: {'firstName': 'name'}},
      children: [
        {projection: {
          arguments: { project: ['firstName', 'lastName']},
          children: [
            {selection: {
              arguments: { select: [{'salary': {'$gt': 130000}}] },
              children: [
                {relation: 'Doctor'}
              ]
            }}
          ]
        }}
      ]
    }
  }
}

export default (state = initialState, action) => {
  switch(action.type) {
    default:
      return {
        ...state
      }
  }
}
