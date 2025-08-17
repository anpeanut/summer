import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import CountryInfo from './components/CountryInfo';
import FetchButton from './components/FetchButton';
import LifeStoryTimeline from './components/LifeStoryTimeline';
import { fetchCountryData } from './services/countryService';
import { generateLifeStory } from './services/aiService';
import { CountryData, LifeEvent, Metadata } from './types';
import './App.css';

function App() {
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [lifeStory, setLifeStory] = useState<LifeEvent[]>([]); 
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [eventQueue, setEventQueue] = useState<LifeEvent[]>([]);
  
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamCompleteRef = useRef<boolean>(false);

  const handleReincarnate = async () => {
    setIsCountryLoading(true);
    setLifeStory([]);
    setEventQueue([]);
    streamCompleteRef.current = false;
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    try {
      const response = await fetchCountryData();
      setCountryData(response.data);
      setMetadata(response.metadata);
    } catch (error) {
      console.error("获取国家数据失败:", error);
    } finally {
      setIsCountryLoading(false);
    }
  };

  const handleGenerateStory = () => {
    if (!countryData) return;

    setLifeStory([]);
    setEventQueue([]);
    streamCompleteRef.current = false;
    setIsStoryLoading(true);

    generateLifeStory(
      countryData,
      (newEvent) => {
        setEventQueue(prevQueue => [...prevQueue, newEvent]);
      },
      (error) => {
        console.error("故事生成流式错误:", error);
        setIsStoryLoading(false);
      },
      () => {
        streamCompleteRef.current = true;
      }
    );
  };

  useEffect(() => {
    if (eventQueue.length > 0 && !animationTimerRef.current) {
      animationTimerRef.current = setInterval(() => {
        setEventQueue(prevQueue => {
          const newQueue = [...prevQueue];
          const nextEvent = newQueue.shift();
          
          if (nextEvent) {
            setLifeStory(prevStory => [...prevStory, nextEvent]);
          }
          
          if (newQueue.length === 0) {
            clearInterval(animationTimerRef.current!);
            animationTimerRef.current = null;
            if (streamCompleteRef.current) {
              setIsStoryLoading(false);
            }
          }
          return newQueue;
        });
      }, 500); 
    }

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [eventQueue]);

  return (
    <div className="root-container"> 
      <Header />
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <CountryInfo 
              data={countryData}
              metadata={metadata}
              onGenerateStory={handleGenerateStory}
              isStoryLoading={isStoryLoading}
              lifeStory={lifeStory}
            />
            <FetchButton 
              onClick={handleReincarnate} 
              isLoading={isCountryLoading}
             
              text={countryData ? "重新投胎" : "开始投胎"}
            />
          </div>
          <LifeStoryTimeline events={lifeStory} isLoading={isStoryLoading} />
        </div>
        <div className="map-area">
          <Map data={countryData} />
        </div>
      </div>
    </div>
  );
}

export default App;
