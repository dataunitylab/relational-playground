import {combineReducers} from 'redux';
import {connectRouter} from 'connected-react-router';
import data from './data';
import relexp from './relexp';

export default (history) =>
  combineReducers({
    router: connectRouter(history),

    data,
    relexp,
  });
