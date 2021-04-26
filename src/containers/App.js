import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

import Output from './Output.js';

function RenderOutput({alignment}) {
  return (
    <Output space=' ' stepSize={100}
      alignment={alignment}
    >
    </Output>
  );
}

function App() {

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/row">
            {RenderOutput({alignment:'row'})}
          </Route>
          <Route path="/">
            {RenderOutput({alignment:'column'})}
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App;
