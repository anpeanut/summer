import { GeoJsonObject } from 'geojson';
import { CountryDataExtended } from '../types'; // 1. 导入新的类型
import mockChinaGeoJson from '../data/geojson/CN.json';
import mockUsaGeoJson from '../data/geojson/US.json';

// 2. 定义包含扩展信息的模拟数据
const mockChinaExtended: CountryDataExtended = {
  id: "CN",
  name: "中国",
  population: 1412000000,
  capital: "北京",
  location: { type: "Point", coordinates: [116.4074, 39.9042] },
  geoJson: mockChinaGeoJson as GeoJsonObject,
  gdpPerCapita: 12556,
  educationLevel: "九年义务教育",
  mainIndustries: ["制造业", "电子商务", "农业"],
  culturalKeywords: ["集体主义", "美食文化", "家庭观念"]
};

const mockUsaExtended: CountryDataExtended = {
  id: "US",
  name: "美国",
  population: 331900000,
  capital: "华盛顿",
  location: { type: "Point", coordinates: [-95.7129, 37.0902] },
  geoJson: mockUsaGeoJson as GeoJsonObject,
  gdpPerCapita: 69287,
  educationLevel: "高等教育普及",
  mainIndustries: ["科技", "金融服务", "娱乐产业"],
  culturalKeywords: ["个人主义", "创新精神", "多元文化"]
};


/**
 * 获取一个国家的扩展数据。
 * 它会根据 .env 文件中的 REACT_APP_USE_MOCK_API 变量来决定是调用后端API还是使用本地模拟数据。
 */
export const fetchCountryData = async (): Promise<CountryDataExtended> => {
  // 检查环境变量，决定是否使用模拟数据。'true'是字符串形式。
  const useMock = process.env.REACT_APP_USE_MOCK_API === 'true';

  if (useMock) {
    console.log("【模式】: 使用内置模拟数据 (countryService.ts)");
    await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟
    // 随机返回一个模拟国家的数据
    return Math.random() > 0.5 ? mockChinaExtended : mockUsaExtended;
  } else {
    // --- 这是连接真实后端的代码路径 ---
    console.log("【模式】: 尝试从后端API获取数据 (/api/country)");
    try {
      console.log("USE_MOCK =", process.env.REACT_APP_USE_MOCK_API);

      const response = await fetch('/api/country'); // 假设这是你的后端API地址
      if (!response.ok) {
        throw new Error(`后端API请求失败，状态码: ${response.status}`);
      }
      const data: CountryDataExtended = await response.json();
      return data;
    } catch (error) {
      console.error("从后端获取数据失败:", error);
      // 在真实API调用失败时，也可以选择降级到模拟数据，以增强应用的健壮性
      console.log("后端连接失败，降级使用模拟数据。");
      return mockChinaExtended; // 返回一个默认的模拟数据
    }
  }
};

// 保留旧的类型定义，以防其他地方还在使用。
// Omit<> 是一个TypeScript工具类型，它会基于CountryDataExtended创建一个新类型，但移除了指定的字段。
export type CountryData = Omit<CountryDataExtended, 'gdpPerCapita' | 'educationLevel' | 'mainIndustries' | 'culturalKeywords'>;
