# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension that visualizes code as art in a side panel. It analyzes code structure (functions, lines) and renders interactive visual representations using p5.js. The extension provides real-time visualization updates as code changes and includes a settings UI for customization.

## Development Commands

### Build and Development
- `npm run compile` - Build extension and webview components with linting and type checking
- `npm run watch` - Start development mode with file watching for both extension and sketch components
- `npm run package` - Production build with minification and optimization
- `npm run check-types` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint on src directory

### Testing
- `npm run test` - Run all tests using vscode-test
- `npm run pretest` - Prepare for testing (compile, build, lint)
- `npm run compile-tests` - Compile test files to out directory
- `npm run watch-tests` - Watch mode for test compilation

### Single Test Execution
To run a specific test file, use the VSCode testing interface or compile tests and run specific files from the out directory.

## Architecture

### Core Components
- **Extension Entry Point** (`src/extension.ts`) - Activates extension and registers webview provider
- **CodeArtViewProvider** (`src/codeArtViewProvider.ts`) - Main webview provider managing visualization panel
- **Services Layer** (`src/services/`) - Business logic components:
  - `CodeParser` - Extracts function data from documents using regex patterns
  - `SettingsService` - Manages VSCode configuration for visualization options
- **Models** (`src/models/`) - TypeScript interfaces for data structures
- **Webview** (`src/webview/`) - HTML content generation for the visualization panel
- **Sketch** (`src/sketch/`) - p5.js visualization logic (compiled separately for browser)

### Build Process
The project uses esbuild with two separate compilation targets:
1. Extension code (`src/extension.ts`) → `dist/extension.js` (Node.js/CommonJS)
2. Visualization sketch (`src/sketch/codeArtSketch.ts`) → `media/codeArtSketch.js` (Browser/IIFE)

### Configuration
The extension contributes VSCode settings under `visualCodeArt.*` namespace:
- Visualization style (squares, circles, triangles)
- Color themes (rainbow, mono variants, custom)
- Layout padding and animation preferences

Settings sync between VSCode configuration and webview UI with live preview functionality.

### Event Flow
1. User edits code → Document change events trigger
2. CodeParser extracts function metrics from active document
3. Data sent to webview via postMessage
4. p5.js sketch renders visualization based on function sizes and settings
5. Settings changes flow from webview → SettingsService → VSCode configuration → webview update

## Development Guidelines
- remember to create small commits at each step. Follow baby steps for the implementation.