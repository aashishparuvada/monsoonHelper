export type Phase = 'Before' | 'During' | 'After';

export type Severity = 'safe' | 'caution' | 'severe';

export interface UserProfile {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  context: string[];
  language: string;
}

export interface ResolvedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface LocationRef {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface WeatherAlert {
  id: string;
  severity: Severity;
  timestamp: string;
  summary: string;
  area: string;
}

export interface LiveWeather {
  resolvedLocation: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  precipitationMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  condition: string;
  severity: Severity;
  precipitationProbabilityNext6h: number;
}

export interface PlanItem {
  id: string;
  task: string;
  completed: boolean;
  phase: Phase;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
