// API 返回的国家数据结构
export type CountryData = {
  id: string;
  name: string;
  population: number;
  capital: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [经度, 纬度]
  };
};

// 本地开发时使用的模拟数据
const mockCountryData: CountryData = {
  id: "CN",
  name: "中国",
  population: 1412000000,
  capital: "北京",
  location: {
    type: "Point",
    coordinates: [116.4074, 39.9042]
  }
};

const mockUSAData: CountryData = {
  id: "US",
  name: "美国",
  population: 331900000,
  capital: "华盛顿哥伦比亚特区",
  location: {
    type: "Point",
    coordinates: [-95.7129, 37.0902]
  }
};

/**
 * 获取国家数据。
 * 根据环境变量决定是从真实 API 获取还是返回本地模拟数据。
 */
export const fetchCountryData = async (): Promise<CountryData> => {
  // 通过 .env 文件中的开关，决定是否启用 mock 模式
  if (process.env.REACT_APP_USE_MOCK_API === 'true') {
    console.log("Using MOCK API");
    await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
    return Math.random() > 0.5 ? mockCountryData : mockUSAData;
  }

  // --- Real API Logic with Fallback ---
  try {
    console.log("Using REAL API");

    // 生产环境 (在Azure上) 使用相对路径/api进行代理
    // 开发环境使用 .env 中定义的全路径
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction ? '/api' : process.env.REACT_APP_API_BASE_URL;

    // TODO: 需要和小陈确认后端的实际路由
    const response = await fetch(`${baseUrl}/country`);

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`API returned an error: ${result.error.message}`);
    }


    return result.data;
  } catch (error) {
    // 如果真实 API 请求的任何环节失败，则降级到返回一个默认的模拟数据
    console.warn("REAL API failed, falling back to MOCK data. Error:", error);
    return Math.random() > 0.5 ? mockCountryData : mockUSAData;
  }
};
