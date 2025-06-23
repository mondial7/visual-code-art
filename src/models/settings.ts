export interface VisualizationSettings {
  style: 'squares' | 'circles' | 'triangles';
  colorTheme: 'rainbow' | 'monoBlue' | 'monoGreen' | 'monoPurple' | 'custom';
  customColorPrimary: string;
  customColorSecondary: string;
  padding: number;
  animationEnabled: boolean;
}

export const defaultSettings: VisualizationSettings = {
  style: 'squares',
  colorTheme: 'rainbow',
  customColorPrimary: '#FF0000',
  customColorSecondary: '#0000FF',
  padding: 10,
  animationEnabled: true
};
