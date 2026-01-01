import React from 'react';
import {Route, Routes} from 'react-router';
import Home from './Home';

/** A container for all routes in the app (currently only one) */
function App() {
  return (
    <div className="App">
      <main>
        <Routes>
          <Route path={process.env.PUBLIC_URL} element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
