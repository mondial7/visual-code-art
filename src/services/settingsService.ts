import * as vscode from 'vscode';
import { VisualizationSettings, defaultSettings } from '../models/settings';

export class SettingsService {
  /**
   * Get current visualization settings from workspace configuration
   */
  public getSettings(): VisualizationSettings {
    const config = vscode.workspace.getConfiguration('visualCodeArt');
    
    return {
      style: config.get('visualization.style', defaultSettings.style) as 'squares' | 'circles' | 'triangles',
      colorTheme: config.get('visualization.colorTheme', defaultSettings.colorTheme) as 'rainbow' | 'monoBlue' | 'monoGreen' | 'monoPurple' | 'custom',
      customColorPrimary: config.get('visualization.customColorPrimary', defaultSettings.customColorPrimary),
      customColorSecondary: config.get('visualization.customColorSecondary', defaultSettings.customColorSecondary),
      padding: config.get('layout.padding', defaultSettings.padding),
      animationEnabled: config.get('animation.enabled', defaultSettings.animationEnabled),
    };
  }
}
