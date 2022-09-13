import React from 'react';
import {Route} from 'react-router-dom';
import Home from './Home';
import useDarkMode from 'use-dark-mode';

/** A container for all routes in the app (currently only one) */
function App() {
  const darkMode = useDarkMode(false);

  return (
    <div className="App">
      <div className={darkMode.value ? 'dark' : 'light'}>
        <main>
          <Route path={process.env.PUBLIC_URL} component={Home} />
        </main>
      </div>
    </div>
  );
}

export default App;
