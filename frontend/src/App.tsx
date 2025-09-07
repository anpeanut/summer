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
  // --- 状态管理 (State) ---
  // 用于管理所有会触发UI重新渲染的数据。
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [lifeStory, setLifeStory] = useState<LifeEvent[]>([]); 
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [isStoryLoading, setIsStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  
  // --- 引用 (Ref) ---
  // 用于管理不触发UI渲染的“幕后”数据。这是实现稳定动画的关键。
  const eventQueueRef = useRef<LifeEvent[]>([]);
  const streamCompletedRef = useRef<boolean>(false);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 核心功能函数 ---

  /**
   * 处理“重新投胎”按钮点击事件。
   */
  const handleReincarnate = async () => {
    setIsCountryLoading(true);
    setStoryError(null);
    setLifeStory([]);
    eventQueueRef.current = [];
    streamCompletedRef.current = false;
    
    try {
      const response = await fetchCountryData();
      setCountryData(response.data);
      setMetadata(response.metadata);
    } catch (error) {
      console.error("获取国家数据失败:", error);
      setStoryError("获取国家数据失败，请检查网络或后端服务。");
    } finally {
      setIsCountryLoading(false);
    }
  };

  /**
   * 处理“生成故事”按钮点击事件。
   */
  const handleGenerateStory = () => {
    if (!countryData) return;

    // 重置状态和引用
    setLifeStory([]);
    eventQueueRef.current = [];
    streamCompletedRef.current = false;
    setStoryError(null);
    setIsStoryLoading(true); // 启动加载状态，会触发useEffect启动计时器

    generateLifeStory(
      countryData,
      (newEvent) => {
        // 新事件到达时，推入队列
        eventQueueRef.current.push(newEvent);
      },
      (error) => {
        console.error("故事生成流式错误:", error);
        setStoryError(`故事生成失败: ${error.message}`);
        setIsStoryLoading(false);
      },
      () => {
        // 数据流结束时，设置标志位
        streamCompletedRef.current = true;
      }
    );
  };

  // --- 副作用 (Effect) ---

  /**
   * 动画循环 Effect
   * 这是驱动故事时间线动画的核心。
   * - 依赖于 `isStoryLoading` 状态，仅在故事加载时启动计时器。
   * - 计时器启动后，会以固定频率处理队列，直到队列为空且数据流结束。
   */
  useEffect(() => {
    // 仅在 isStoryLoading 状态为 true 时才运行动画循环
    if (isStoryLoading) {
      animationTimerRef.current = setInterval(() => {
        // 优先处理队列中的事件
        if (eventQueueRef.current.length > 0) {
          const nextEvent = eventQueueRef.current.shift();
          if (nextEvent) {
            // 更新 state 以触发UI渲染
            setLifeStory(prevStory => [...prevStory, nextEvent]);
          }
        } else if (streamCompletedRef.current) {
          // 如果队列为空，并且数据流已结束，则停止加载并清除计时器
          setIsStoryLoading(false);
        }
      }, 10); // 动画间隔（毫秒）
    }

    // 清理函数：当 isStoryLoading 变为 false 或组件卸载时，确保计时器被清除
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [isStoryLoading]); // Effect 的生命周期严格绑定到 isStoryLoading 状态

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
          {storyError && <div className="error-message">{storyError}</div>}
          <LifeStoryTimeline events={lifeStory} isLoading={isStoryLoading && !storyError} />
        </div>
        <div className="map-area">
          <Map data={countryData} />
        </div>
      </div>
    </div>
  );
}

export default App;
