import { GeoJsonObject } from 'geojson';
import { CountryData, CountryApiResponse, Metadata } from '../types'; // 1. 导入新的 v2.0 类型
import mockChinaGeoJson from '../data/geojson/CN.json';
import mockUsaGeoJson from '../data/geojson/US.json';

// 2. 更新模拟数据以匹配 v2.0 的 CountryData 结构
const mockChinaData: CountryData = {
  id: "CN",
  name: "中国",
  population: 1412000000,
  capital: "北京",
  location: { type: "Point", coordinates: [116.4074, 39.9042] },
  geoJson: mockChinaGeoJson as GeoJsonObject,
  storySeed: {
    demographics: {
      gender_ratio: 0.51,
      urban_ratio: 0.65,
      median_age: 38
    },
    education: {
      school_start_age: 6,
      high_school_rate: 0.9,
      university_rate: 0.59
    },
    environment: {
      gdp_per_capita: 12556,
      internet_penetration: 0.78,
      main_industries: ["电子商务", "制造业", "人工智能", "短视频"]
    },
    milestones: {
      avg_marriage_age: 28,
      avg_first_child_age: 30,
      life_expectancy: 77
    },
    historicalEvents: [
      { name: "北京奥运会", year: 2008, impact: "national" },
      { name: "智能手机普及潮", year: 2012, impact: "tech" },
      { name: "移动支付（支付宝/微信支付）爆发", year: 2015, impact: "economic" },
      { name: "COVID-19 疫情", year: 2020, impact: "global" },
      { name: "ChatGPT发布引发AI浪潮", year: 2023, impact: "tech" }
    ]
  }
};

const mockUsaData: CountryData = {
  id: "US",
  name: "美国",
  population: 331900000,
  capital: "华盛顿",
  location: { type: "Point", coordinates: [-95.7129, 37.0902] },
  geoJson: mockUsaGeoJson as GeoJsonObject,
  storySeed: {
    demographics: {
      gender_ratio: 0.49,
      urban_ratio: 0.83,
      median_age: 38
    },
    education: {
      school_start_age: 5,
      high_school_rate: 0.92,
      university_rate: 0.68
    },
    environment: {
      gdp_per_capita: 69287,
      internet_penetration: 0.91,
      main_industries: ["科技 (Silicon Valley)", "金融服务 (Wall Street)", "娱乐产业 (Hollywood)", "生物技术"]
    },
    milestones: {
      avg_marriage_age: 30,
      avg_first_child_age: 27,
      life_expectancy: 78
    },
    historicalEvents: [
      { name: "9/11恐怖袭击", year: 2001, impact: "national" },
      { name: "iPhone发布与社交媒体兴起", year: 2007, impact: "tech" },
      { name: "2008年金融危机", year: 2008, impact: "economic" },
      { name: "COVID-19 疫情", year: 2020, impact: "global" },
      { name: "SpaceX 商业航天", year: 2021, impact: "tech" }
    ]
  }
};

// 3. 定义服务返回的数据结构，包含数据和元数据
export interface CountryServiceResponse {
  data: CountryData;
  metadata: Metadata;
}

const mockMetadata: Metadata = {
  source: "Mock Data",
  license: "N/A",
  dataCompleteness: 0.95
};

/**
 * 获取一个国家的扩展数据和元数据。
 * 它会根据 .env 文件中的 REACT_APP_USE_MOCK_API 变量来决定是调用后端API还是使用本地模拟数据。
 */
export const fetchCountryData = async (): Promise<CountryServiceResponse> => {
  //const useMock = process.env.REACT_APP_USE_MOCK_API === 'true';
 const useMock =true
  if (useMock) {
    console.log("【模式】: 使用内置模拟数据 (countryService.ts)");
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = Math.random() > 0.5 ? mockChinaData : mockUsaData;
    return { data, metadata: mockMetadata };
  } else {
    console.log("【模式】: 尝试从后端API获取数据 (/api/country)");
    try {
      const response = await fetch('/api/country');
      if (!response.ok) {
        throw new Error(`后端API请求失败，状态码: ${response.status}`);
      }
      const apiResponse: CountryApiResponse = await response.json();
      if (!apiResponse.success) {
        throw new Error(`后端API返回错误: ${apiResponse.success}`);
      }
      // 4. 返回包含 data 和 metadata 的对象
      return { data: apiResponse.data, metadata: apiResponse.metadata };
    } catch (error) {
      console.error("从后端获取数据失败:", error);
      console.log("后端连接失败，降级使用模拟数据。");
      return { data: mockChinaData, metadata: mockMetadata };
    }
  }
};
