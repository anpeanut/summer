import React, { useState } from 'react';
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
  const [lifeStory, setLifeStory] = useState<LifeEvent[] | null>(null);
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  const handleReincarnate = async () => {
    setIsCountryLoading(true);
    setLifeStory(null); // 清空上一次的人生故事
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

  const handleGenerateStory = async () => {
    if (!countryData) return;

    setIsStoryLoading(true);
    try {
      // @ts-ignore
      const events = await generateLifeStory(countryData);
      setLifeStory(events);
    } catch (error) {
      console.error("生成人生故事失败:", error);
    } finally {
      setIsStoryLoading(false);
    }
  };

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
              lifeStory={lifeStory} // 1. 将 lifeStory 状态传递给 CountryInfo
            />
            <FetchButton 
              onClick={handleReincarnate} 
              isLoading={isCountryLoading}
              // 2. 根据 countryData 是否存在，动态改变按钮文本
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
