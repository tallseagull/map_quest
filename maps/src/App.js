import logo from './logo.svg';
import './App.css';
import MapQuest from './map_quest.js';
import { useState, useEffect } from 'react';

function App() {
  const [score, setScore] = useState(0);

  useEffect(() => {
    // This effect could be used to fetch or update the score if needed
    // For now, it just logs the current score
    console.log('Score updated:', score);
  }, [score]);

  return (
    <div className="App">
      <MapQuest score={score} setScore={setScore} />
    </div>
  );
}

export default App;
