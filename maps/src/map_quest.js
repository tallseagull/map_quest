import React, { useState, useEffect } from 'react';
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

  const checkAnswer = (countryCode) => {
    if (!showAnswer) {
      if (countryCode === targetCountry) {
        setScore(score + 1);
        alert('Correct! Your score: ' + (score + 1));
        nextQuestion();
      } else {
        const clickedCountryName = countryData[countryCode]['name'] || 'Unknown country';
        alert(`Wrong country! You clicked on ${clickedCountryName}. Try again.`);
      }
    }
  };
  
  const nextQuestion = () => {
    if (round < 10) {
      if (countryList.length === 0) {
        const selectedCountries = selectCountries(selectedRegion);
        setCountryList(selectedCountries);
        setTargetCountry(selectedCountries[round]);
      } else {
        setTargetCountry(countryList[round]);
      }
      setShowAnswer(false);
      setShowHint(false);
      setRound(round + 1);
    } else {
      setShowModal(true);
    }
  };
  const selectCountries = (region) => {
    // Flatten the dictionary into an array based on weights  
    let pool = [];  
    for (const [key, weight] of Object.entries(topCountries[region])) {  
        for (let i = 0; i < weight; i++) {  
            pool.push(key);  
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
    setShowModal(false);
    setCountryList([]);
    setScore(0);
    setRound(0);
    nextQuestion();
  };

  const handleRegionSelect = (event) => {
    setSelectedRegion(event.target.value);
    setCountryList([]); // Reset country list to ensure new region is used
    selectCountries(event.target.value);
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
        <div className="map-section" style={{ width: '80%' }}>
          <HighchartsReact
            highcharts={Highcharts}
            constructorType={'mapChart'}
            options={mapOptions}
          />
        </div>
        <div className="info-section">
          <div className='label-container'>
            <span className="label region-label">Region: {selectedRegion}</span>
            <span className="label round-label">Round {round}/10</span>
            <span className="label score-label">Score: {score}</span>
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
            {round > 10 ? (
              <button className="map-button" onClick={startNewGame}>
                New Game
              </button>
            ) : showAnswer ? (
                <button className="map-button" onClick={nextQuestion}>
                  Next
                </button>
            ) : (
              <>
                <button className="map-button" onClick={() => setShowAnswer(true)}>
                  Show Me
                </button>
                <button className="map-button" onClick={() => setShowHint(true)}>
                  Show Hint
                </button>
              </>
            )}
          </div>
        </div>
        {showModal ? (
          <div className="game-over-modal show">
            <div className="modal-content">
              <h2>{!selectedRegion ? 'Select a Region to Start the Game' : 'Game Over!'}</h2>
              <p>Your total score is: {!selectedRegion ? 0 : score}</p>
              <select onChange={handleRegionSelect} value={selectedRegion || ''}>
                <option value="" disabled>Select a region</option>
                {Object.keys(topCountries).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <button className="map-button" id="play-again-btn" onClick={startNewGame}>
                {!selectedRegion ? 'Start Game' : 'Play again'}
              </button>
            </div>
          </div>
        ) : null}
      </>
    </div>
  );
};

export default MapQuest;
