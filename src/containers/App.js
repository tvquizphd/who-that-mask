import React, { useState } from "react";
import Output from './Output.js';

function App() {
  const [stepSize, setStepSize] = useState(100);

  return (
    <div className="App">
      <div>
        Speed:
        <input 
          id="typeinp" 
          type="range" 
          min="1" max="100" 
          value={stepSize} 
          onChange={(event) =>{
            setStepSize(parseInt(event.target.value));
          }}
          step="1"/>
        {stepSize}
      </div>
      <Output stepSize={stepSize}>
      </Output>
    </div>
  );
}

export default App;
