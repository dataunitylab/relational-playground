import React, {Component} from 'react';
import {Route} from 'react-router-dom';
import Home from './Home';

class App extends Component {
  render() {
    return (
      <div className="App">
        <main>
          <Route path={process.env.PUBLIC_URL} component={Home} />
        </main>
      </div>
    );
  }
}

export default App;
