import React, { useState } from "react";
import Output from './Output.js';

function App() {
  const [colAlignment, setColAlignment] = useState(true);
  const alignment = ['row', 'column'][+colAlignment];

  return (
    <div className="App">
      <div>
        Align columns:
        <input
          type="checkbox"
          checked={colAlignment}
          onChange={(e) => setColAlignment(e.target.checked)}
        />
      </div>
      <Output space=' ' stepSize={100}
        alignment={alignment}
      >
      </Output>
    </div>
  );
}

export default App;
