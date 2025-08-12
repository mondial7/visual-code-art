export type ThemeMode = 'auto' | 'day' | 'night';

export interface VisualizationSettings {
  colorTheme: 'rainbow';
  animationEnabled: boolean;
  particleIntensity: number;
  themeMode: ThemeMode;
}

export const defaultSettings: VisualizationSettings = {
  colorTheme: 'rainbow',
  animationEnabled: true,
  particleIntensity: 1.0,
  themeMode: 'auto'
};
