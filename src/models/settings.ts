export interface VisualizationSettings {
  style: 'particles' | 'chaos' | 'flow' | 'classic';
  colorTheme: 'rainbow' | 'intensity' | 'monoBlue' | 'monoGreen' | 'monoPurple' | 'custom';
  customColorPrimary: string;
  customColorSecondary: string;
  padding: number;
  animationEnabled: boolean;
  particleIntensity: number; // 0-1 multiplier for particle effects
  debugMode: boolean; // Show debug information panel
}

export const defaultSettings: VisualizationSettings = {
  style: 'particles',
  colorTheme: 'intensity',
  customColorPrimary: '#FF0000',
  customColorSecondary: '#0000FF',
  padding: 10,
  animationEnabled: true,
  particleIntensity: 1.0,
  debugMode: false
};
