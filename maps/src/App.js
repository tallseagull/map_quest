import logo from './logo.svg';
import './App.css';
import MapQuest from './map_quest.js';
import { useState, useEffect } from 'react';

function App() {
  const [score, setScore] = useState(0);

  return (
    <div className="App">
      <MapQuest score={score} setScore={setScore} />
    </div>
  );
}

export default App;
