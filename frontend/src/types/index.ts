import { GeoJsonObject } from 'geojson';

// The basic country data structure, extended for our needs
export interface CountryDataExtended {
  id: string;
  name: string;
  population: number;
  capital: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [Longitude, Latitude]
  };
  geoJson: GeoJsonObject;
  // --- Extended data for story generation ---
  gdpPerCapita: number;
  educationLevel: string;
  mainIndustries: string[];
  culturalKeywords: string[];
}

// The structure for each event in the generated life story
export interface LifeEvent {
  year: number;
  age: number;
  event: string;
  category: 'Education' | 'Career' | 'Family' | 'Milestone' | 'Generic';
  imgPrompt?: string; // Reserved for future image generation
}
