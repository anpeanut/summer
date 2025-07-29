import React, { useState } from 'react';
import Map from './components/Map';
import CountryInfo from './components/CountryInfo';
import FetchButton from './components/FetchButton';
import { fetchCountryData, CountryData } from './services/countryService'; // 1. 导入
import './App.css';

function App() {
  // 当前展示的国家数据，初始为 null
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  // API 请求的加载状态
  const [isLoading, setIsLoading] = useState(false);

  // 点击按钮时触发的数据获取逻辑
  const handleFetchCountry = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCountryData();
      setCountryData(data);
    } catch (error) {

      console.error("Failed to fetch country data:", error);
    } finally {
      // 确保无论成功或失败，都结束加载状态
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <CountryInfo data={countryData} />
        <FetchButton onClick={handleFetchCountry} isLoading={isLoading} />
      </div>
      <div className="map-area">
        <Map data={countryData} />
      </div>

    </div>
  );
}

export default App;
