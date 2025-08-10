import React, { useState } from 'react';
import Map from './components/Map';
import CountryInfo from './components/CountryInfo';
import FetchButton from './components/FetchButton';
import LifeStoryTimeline from './components/LifeStoryTimeline';
import { fetchCountryData } from './services/countryService';
import { generateLifeStory } from './services/aiService';
import { CountryDataExtended, LifeEvent } from './types';
import './App.css';

function App() {
  // 当前“投胎”到的国家数据
  const [countryData, setCountryData] = useState<CountryDataExtended | null>(null);
  // AI生成的人生故事事件
  const [lifeStory, setLifeStory] = useState<LifeEvent[] | null>(null);
  // “投胎”按钮的加载状态
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  // “开启人生故事”按钮的加载状态
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  // 处理“投胎”按钮点击事件
  const handleReincarnate = async () => {
    setIsCountryLoading(true);
    setLifeStory(null); // 清空上一次的人生故事
    try {
      const data = await fetchCountryData();
      setCountryData(data);
    } catch (error) {
      console.error("获取国家数据失败:", error);
    } finally {
      setIsCountryLoading(false);
    }
  };

  // 处理“开启人生故事”按钮点击事件
  const handleGenerateStory = async () => {
    if (!countryData) return;

    setIsStoryLoading(true);
    try {
      // 调用真实AI接口。如果AI服务或密钥配置有问题，该函数内部会降级到模拟数据。
      const events = await generateLifeStory(countryData);
      setLifeStory(events);
    } catch (error) {
      console.error("生成人生故事失败:", error);
    } finally {
      setIsStoryLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <FetchButton 
          onClick={handleReincarnate} 
          isLoading={isCountryLoading} 
          text="开始投胎"
        />
        <CountryInfo 
          data={countryData} 
          onGenerateStory={handleGenerateStory}
          isStoryLoading={isStoryLoading}
        />
        <LifeStoryTimeline events={lifeStory} isLoading={isStoryLoading} />
      </div>
      <div className="map-area">
        <Map data={countryData} />
      </div>
    </div>
  );
}

export default App;
