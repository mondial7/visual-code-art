import * as vscode from 'vscode';
import { VisualizationSettings, defaultSettings } from '../models/settings';

export class SettingsService {
  /**
   * Get current visualization settings from workspace configuration
   */
  public getSettings(): VisualizationSettings {
    const config = vscode.workspace.getConfiguration('visualCodeArt');
    
    return {
      style: config.get('visualization.style', defaultSettings.style) as 'particles' | 'chaos' | 'flow' | 'classic',
      colorTheme: config.get('visualization.colorTheme', defaultSettings.colorTheme) as 'rainbow' | 'intensity' | 'monoBlue' | 'monoGreen' | 'monoPurple' | 'custom',
      customColorPrimary: config.get('visualization.customColorPrimary', defaultSettings.customColorPrimary),
      customColorSecondary: config.get('visualization.customColorSecondary', defaultSettings.customColorSecondary),
      padding: config.get('layout.padding', defaultSettings.padding),
      animationEnabled: config.get('animation.enabled', defaultSettings.animationEnabled),
      particleIntensity: config.get('visualization.particleIntensity', defaultSettings.particleIntensity),
      debugMode: config.get('debug.enabled', defaultSettings.debugMode),
    };
  }

  /**
   * Update visualization settings in workspace configuration
   */
  public async updateSettings(settings: Partial<VisualizationSettings>): Promise<void> {
    const config = vscode.workspace.getConfiguration('visualCodeArt');
    
    if (settings.style !== undefined) {
      await config.update('visualization.style', settings.style, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.colorTheme !== undefined) {
      await config.update('visualization.colorTheme', settings.colorTheme, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.customColorPrimary !== undefined) {
      await config.update('visualization.customColorPrimary', settings.customColorPrimary, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.customColorSecondary !== undefined) {
      await config.update('visualization.customColorSecondary', settings.customColorSecondary, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.padding !== undefined) {
      await config.update('layout.padding', settings.padding, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.animationEnabled !== undefined) {
      await config.update('animation.enabled', settings.animationEnabled, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.particleIntensity !== undefined) {
      await config.update('visualization.particleIntensity', settings.particleIntensity, vscode.ConfigurationTarget.Workspace);
    }
    if (settings.debugMode !== undefined) {
      await config.update('debug.enabled', settings.debugMode, vscode.ConfigurationTarget.Workspace);
    }
  }
}
