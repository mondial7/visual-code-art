export interface VisualizationSettings {
  colorTheme: 'rainbow';
  animationEnabled: boolean;
  particleIntensity: number;
}

export const defaultSettings: VisualizationSettings = {
  colorTheme: 'rainbow',
  animationEnabled: true,
  particleIntensity: 1.0
};
