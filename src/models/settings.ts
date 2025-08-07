export interface VisualizationSettings {
  style: 'particles' | 'chaos' | 'flow' | 'classic';
  colorTheme: 'rainbow';
  animationEnabled: boolean;
  particleIntensity: number;
}

export const defaultSettings: VisualizationSettings = {
  style: 'particles',
  colorTheme: 'rainbow',
  animationEnabled: true,
  particleIntensity: 1.0
};
