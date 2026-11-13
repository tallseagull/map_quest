import React, { useState, useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMap from 'highcharts/modules/map';
import proj4 from 'proj4';
import worldMap from '@highcharts/map-collection/custom/world-highres.geo.json';  
import './map_quest.css';
import {countryData, topCountries} from './country_data';

// Initialize the map module
HighchartsMap(Highcharts);

// Ensure proj4 is available globally  
if (typeof window !== 'undefined') {  
    window.proj4 = window.proj4 || proj4;  
}  
  
const MapQuest = ({ score, setScore }) => {
  const [targetCountry, setTargetCountry] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [round, setRound] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('World');
  const [countryList, setCountryList] = useState([]);
  const [timer, setTimer] = useState(0);
  const [useTimer, setUseTimer] = useState(true);
  const timerRef = useRef(null);
  const roundRef = useRef(0);
  const pendingCorrectAdvanceRef = useRef(false);
  const [difficulty, setDifficulty] = useState(0);
  const [answerModal, setAnswerModal] = useState(null);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    if (useTimer && !showModal) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [useTimer, showModal]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startTimer = () => {
    if (!useTimer) {
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000);
  };

  const dismissAnswerModal = () => {
    const advanceRound = pendingCorrectAdvanceRef.current;
    pendingCorrectAdvanceRef.current = false;
    setAnswerModal(null);

    if (advanceRound) {
      const endingGame = roundRef.current >= 10;
      advanceRoundOrEndGame();
      if (!endingGame) {
        startTimer();
      }
    } else {
      startTimer();
    }
  };

  const checkAnswer = (countryCode) => {
    if (!showAnswer && !answerModal) {
      clearInterval(timerRef.current);
      if (countryCode === targetCountry) {
        const newScore = score + 3;
        setScore(newScore);
        pendingCorrectAdvanceRef.current = true;
        setAnswerModal({
          variant: 'correct',
          title: 'Correct!',
          message: `Your score: ${newScore}`,
        });
      } else {
        const clickedCountryName = countryData[countryCode]?.name || 'Unknown country';
        pendingCorrectAdvanceRef.current = false;
        if (difficulty === 2) {
          setScore(score - 1);
        }
        setAnswerModal({
          variant: 'incorrect',
          title: 'Wrong country!',
          message: `You clicked on ${clickedCountryName}. Try again.`,
        });
      }
    }
  };
  
  const advanceRoundOrEndGame = () => {
    const currentRound = roundRef.current;

    if (currentRound >= 10) {
      setShowModal(true);
      clearInterval(timerRef.current);
      return;
    }

    if (countryList.length === 0) {
      const selectedCountries = selectCountries(selectedRegion);
      setCountryList(selectedCountries);
      setTargetCountry(selectedCountries[currentRound]);
    } else {
      setTargetCountry(countryList[currentRound]);
    }
    setShowAnswer(false);
    setShowHint(false);
    setRound(currentRound + 1);
  };

  const nextQuestion = () => {
    advanceRoundOrEndGame();
  };

  const selectCountries = (region) => {
    // Flatten the dictionary into an array based on weights  
    let pool = [];  
    for (const [key, weight] of Object.entries(topCountries[region])) {  
        if ((difficulty === 0 && weight >= 9) || 
            (difficulty === 1 && weight >= 7) || 
            (difficulty === 2)) {
            for (let i = 0; i < weight; i++) {  
                pool.push(key);  
            }
        }
    } 

    const selectedCountries = [];    
    while (selectedCountries.length < 12 && pool.length > 0) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const selectedCountry = pool[randomIndex];
      if (!selectedCountries.includes(selectedCountry)) {
        selectedCountries.push(selectedCountry);
      }
    }
    return selectedCountries;
  };

  const startNewGame = () => {
    if (!selectedRegion) {
      return;
    }

    setShowModal(false);
    setAnswerModal(null);
    setShowAnswer(false);
    setShowHint(false);
    pendingCorrectAdvanceRef.current = false;
    setCountryList([]);
    setScore(0);
    setTimer(0);

    const selectedCountries = selectCountries(selectedRegion);
    setCountryList(selectedCountries);
    setTargetCountry(selectedCountries[0]);
    setRound(1);
    roundRef.current = 1;
  };

  const handleRegionSelect = (event) => {
    setSelectedRegion(event.target.value);
    setCountryList([]); // Reset country list to ensure new region is used
    selectCountries(event.target.value);
  };

  const handleDifficultySelect = (event) => {
    setDifficulty(parseInt(event.target.value, 10));
  };

  const mapOptions = {
    chart: {
      map: worldMap,
      projection: {  
        name: 'Orthographic'  
      },
      height: '90%' // Set the height of the map to 80% of the window height
    },
    title: {
      text: 'MapQuest Game'
    },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'bottom'
      }
    },
    tooltip: {
      enabled: false // Disable hover labels
    },
    series: [{
      showInLegend: false,
      mapData: worldMap,
      joinBy: 'iso-a2',
      data: worldMap.features.map(feature => ({
        'iso-a2': feature.properties['iso-a2'],
        value: showAnswer ? (feature.properties['iso-a2'] === targetCountry ? 1 : 0) : 0,
        color: showAnswer && feature.properties['iso-a2'] === targetCountry ? 'red' : '#A9A9A9'
      })),
      states: {
        hover: {
          enabled: true,
          color: 'darkblue' // Color when hovering over a country
        }
      },
      events: {
        click: function (event) {
          checkAnswer(event.point['iso-a2']);
        }
      }
    }]
  };

  return (
    <div className="map-quest-container">
      <>
        <div className="map-section">
          <HighchartsReact
            highcharts={Highcharts}
            constructorType={'mapChart'}
            options={mapOptions}
          />
          {answerModal ? (
            <div className="answer-feedback-modal" role="dialog" aria-modal="true">
              <div className={`answer-feedback-content answer-feedback-${answerModal.variant}`}>
                <h2>{answerModal.title}</h2>
                <p>{answerModal.message}</p>
                <button type="button" className="map-button answer-feedback-ok" onClick={dismissAnswerModal}>
                  Ok
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="info-section">
          <div className='label-container'>
            <span className="label region-label">Region: {selectedRegion}</span>
            <span className="label round-label">Round {round}/10</span>
            <span className="label score-label">Score: {score}</span>
            {useTimer && <span className="label timer-label">Time: {formatTime(timer)}</span>}
            <hr style={{ border: '1px solid transparent' }} />
            {!showModal && (
              <>
                <span className="label country-label">Find this country:</span>
                <span className="label country-name">{countryData[targetCountry]?.name}</span>
              </>
            )}
            {showHint && (
              <span className="label hint-label">Hint: {countryData[targetCountry]?.location}</span>
            )}
          </div>
          <div className='button-container'>
            {!showModal && (
              round > 10 ? (
                <button type="button" className="map-button" onClick={startNewGame}>
                  New Game
                </button>
              ) : showAnswer ? (
                <button type="button" className="map-button" onClick={nextQuestion}>
                  Next
                </button>
              ) : (
                <>
                  <button type="button" className="map-button" onClick={() => setShowAnswer(true)}>
                    Show Me
                  </button>
                  <button type="button" className="map-button" onClick={() => setShowHint(true)}>
                    Show Hint
                  </button>
                </>
              )
            )}
          </div>
        </div>
        {showModal ? (
          <div className="game-over-modal show" role="dialog" aria-modal="true" aria-labelledby="setup-modal-title">
            <div className="modal-content setup-modal-content">
              <h2 id="setup-modal-title">{round >= 10 ? 'Game Over!' : 'Select a Region to Start the Game'}</h2>
              {round >= 10 && <p>Your total score is: {score}</p>}
              {useTimer && <p>Total time: {formatTime(timer)}</p>}
              <select onChange={handleRegionSelect} value={selectedRegion || ''}>
                <option value="" disabled>Select a region</option>
                {Object.keys(topCountries).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <div>
                <label>
                  <input 
                    type="checkbox" 
                    checked={useTimer} 
                    onChange={() => setUseTimer(!useTimer)} 
                  />
                  Use Timer
                </label>
              </div>
              <div>
                <div className="new-game-label" style={{ marginTop: '10px' }}>
                  <div>Difficulty Level:</div>
                  <select onChange={handleDifficultySelect} value={difficulty} style={{ marginTop: '5px' }}>
                    <option value="0">Medium</option>
                    <option value="1">Hard</option>
                    <option value="2">Expert</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="map-button"
                id="play-again-btn"
                onClick={startNewGame}
                disabled={!selectedRegion}
              >
                {round >= 10 ? 'Play again' : 'Start Game'}
              </button>
            </div>
          </div>
        ) : null}
      </>
    </div>
  );
};

export default MapQuest;
