import React from 'react';
import {Route} from 'react-router-dom';
import Home from './Home';

/** A container for all routes in the app (currently only one) */
function App() {
  return (
    <div className="App">
      <main>
        <Route path={process.env.PUBLIC_URL} component={Home} />
      </main>
    </div>
  );
}

export default App;
