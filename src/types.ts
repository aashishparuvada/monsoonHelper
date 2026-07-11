export type Phase = 'Before' | 'During' | 'After';

export type Severity = 'safe' | 'caution' | 'severe';

export interface UserProfile {
  name: string;
  location: string;
  context: string[];
  language: string;
}

export interface WeatherAlert {
  id: string;
  severity: Severity;
  timestamp: string;
  summary: string;
  area: string;
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
