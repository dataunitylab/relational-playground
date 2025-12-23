import '@testing-library/jest-dom';

if (window.document) {
  window.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    cloneRange: () => ({
      setStart: () => {},
      setEnd: () => {},
      getBoundingClientRect: () => ({top: 0, right: 0, bottom: 0, left: 0}),
      getClientRects: () => [],
    }),
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
    getBoundingClientRect: () => ({top: 0, right: 0, bottom: 0, left: 0}),
    getClientRects: () => [],
  });
}

jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
}));
