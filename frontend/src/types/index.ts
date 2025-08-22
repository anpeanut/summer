import { GeoJsonObject } from 'geojson';

// --- API v2.0 Structures ---

// 根响应对象
export interface CountryApiResponse {
  apiVersion: string;
  success: boolean;
  timestamp: string;
  data: CountryData;
  metadata: Metadata;
}

// 元数据对象
export interface Metadata {
  source: string;
  license: string;
  dataCompleteness?: number;
}

// 国家数据对象 (data)
export interface CountryData {
  id: string;
  name: string;
  population: number;
  capital: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [Longitude, Latitude]
  };
  geoJson: GeoJsonObject;
  storySeed?: StorySeed; // 故事种子现在是可选的
}

// 故事种子对象 (storySeed)
export interface StorySeed {
  demographics?: {
    gender_ratio?: number;
    urban_ratio?: number;
    median_age?: number;
  };
  education?: {
    school_start_age?: number;
    high_school_rate?: number;
    university_rate?: number;
  };
  environment?: {
    gdp_per_capita?: number;
    internet_penetration?: number;
    main_industries?: string[];
  };
  milestones?: {
    avg_marriage_age?: number;
    avg_first_child_age?: number;
    life_expectancy?: number;
  };
  historicalEvents?: HistoricalEvent[];
}

export interface HistoricalEvent {
  name?: string;
  year?: number;
  impact?: string;
}

// --- Life Story Structures (Unchanged) ---

// The structure for each event in the generated life story
export interface LifeEvent {
  year: number;
  age: number;
  event: string;
  category: 'Education' | 'Career' | 'Relationship' | 'Milestone' | 'WorldEvent' | 'Special';
  imgPrompt?: string;
}

// --- App Configuration Structures ---

// 定义AI服务的配置信息结构
export interface ApiKeyConfig {
  apiKey: string;
 
}

// --- Deprecated v1.0 Type (for reference, can be removed later) ---
export interface CountryDataExtended_v1 {
  id: string;
  name: string;
  population: number;
  capital: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  geoJson: GeoJsonObject;
  gdpPerCapita: number;
  educationLevel: string;
  mainIndustries: string[];
  culturalKeywords: string[];
}
