import * as vscode from 'vscode';
import { VisualizationSettings, defaultSettings, ThemeMode } from '../models/settings';

export class SettingsService {
  /**
   * Get current visualization settings from VSCode configuration
   */
  public getSettings(): VisualizationSettings {
    const config = vscode.workspace.getConfiguration('visualCodeArt');
    
    const themeMode = config.get<ThemeMode>('themeMode', defaultSettings.themeMode);
    const animationEnabled = config.get<boolean>('animationEnabled', defaultSettings.animationEnabled);
    const particleIntensity = config.get<number>('particleIntensity', defaultSettings.particleIntensity);
    
    return {
      colorTheme: defaultSettings.colorTheme,
      animationEnabled,
      particleIntensity,
      themeMode: this.resolveThemeMode(themeMode)
    };
  }

  /**
   * Update visualization settings in VSCode configuration
   */
  public async updateSettings(settings: Partial<VisualizationSettings>): Promise<void> {
    const config = vscode.workspace.getConfiguration('visualCodeArt');
    
    if (settings.themeMode !== undefined) {
      await config.update('themeMode', settings.themeMode, vscode.ConfigurationTarget.Global);
    }
    if (settings.animationEnabled !== undefined) {
      await config.update('animationEnabled', settings.animationEnabled, vscode.ConfigurationTarget.Global);
    }
    if (settings.particleIntensity !== undefined) {
      await config.update('particleIntensity', settings.particleIntensity, vscode.ConfigurationTarget.Global);
    }
  }

  /**
   * Resolve theme mode based on user preference and time of day
   */
  private resolveThemeMode(themeMode: ThemeMode): ThemeMode {
    if (themeMode === 'auto') {
      return this.getTimeBasedTheme();
    }
    return themeMode;
  }

  /**
   * Determine theme based on current time (6am-6pm = day, 6pm-6am = night)
   */
  private getTimeBasedTheme(): 'day' | 'night' {
    const currentHour = new Date().getHours();
    return (currentHour >= 6 && currentHour < 18) ? 'day' : 'night';
  }

  /**
   * Get the resolved theme (day/night) for the current settings
   */
  public getCurrentTheme(): 'day' | 'night' {
    const settings = this.getSettings();
    return settings.themeMode === 'auto' ? this.getTimeBasedTheme() : settings.themeMode as 'day' | 'night';
  }
}
