import '@testing-library/jest-dom';
import 'jest-enzyme';
import {configure} from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';

configure({adapter: new Adapter()});

if (window.document) {
  window.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
    getBoundingClientRect: () => ({top: 0, right: 0, bottom: 0, left: 0}),
    getClientRects: () => [],
  });
}
