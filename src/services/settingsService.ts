import * as vscode from 'vscode';
import { VisualizationSettings, defaultSettings } from '../models/settings';

export class SettingsService {
  /**
   * Get current visualization settings - now simplified with fixed defaults
   */
  public getSettings(): VisualizationSettings {
    return {
      style: defaultSettings.style,
      colorTheme: defaultSettings.colorTheme,
      animationEnabled: defaultSettings.animationEnabled,
      particleIntensity: defaultSettings.particleIntensity,
    };
  }

  /**
   * Update visualization settings - now simplified (no external configuration)
   */
  public async updateSettings(settings: Partial<VisualizationSettings>): Promise<void> {
    // Settings are now fixed - no external configuration needed
    console.log('[SettingsService] Settings are now fixed, no updates needed');
  }
}
