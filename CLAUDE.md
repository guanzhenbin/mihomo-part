# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mihomo Party is an Electron-based GUI application for managing Mihomo (clash) proxy configurations. It's built with React, TypeScript, and Electron, using Vite as the build tool.

## Development Commands

```bash
# Development
pnpm dev                    # Start development server with hot reload
pnpm prepare               # Prepare development environment and download dependencies

# Code Quality
pnpm lint                  # Run ESLint with auto-fix
pnpm format                # Format code with Prettier
pnpm typecheck             # Run TypeScript type checking for both node and web
pnpm typecheck:node        # Type check main process only
pnpm typecheck:web         # Type check renderer process only

# Building
pnpm build:win             # Build for Windows
pnpm build:mac             # Build for macOS  
pnpm build:linux           # Build for Linux

# Utilities
pnpm updater               # Update mihomo core versions
pnpm checksum              # Generate checksums for releases
```

## Architecture Overview

### Electron Multi-Process Architecture

- **Main Process** (`src/main/`): Node.js backend handling system integration, file operations, and mihomo core management
- **Renderer Process** (`src/renderer/`): React frontend for the main application UI
- **Floating Window** (`src/renderer/floating.html`): Separate renderer for floating window UI
- **Preload Scripts** (`src/preload/`): Bridge between main and renderer processes

### Key Architectural Components

#### Main Process Structure (`src/main/`)
- `config/`: Configuration management (app settings, profiles, overrides)
- `core/`: Mihomo core integration, API communication, and profile updates
- `resolve/`: System integrations (auto-updater, backup, shortcuts, tray)
- `sys/`: OS-specific functionality (system proxy, auto-run, SSID detection)
- `utils/`: IPC handlers, utilities, and helper functions

#### Renderer Process Structure (`src/renderer/src/`)
- `pages/`: Main application pages (proxies, profiles, settings, etc.)
- `components/`: Reusable UI components organized by feature
- `hooks/`: React hooks for state management and API integration
- `services/`: External API services and data fetching
- `utils/`: Frontend utilities and IPC communication

### Configuration Management

The app manages multiple configuration layers:
- **App Config**: Application-level settings (theme, language, system proxy)
- **Mihomo Config**: Proxy core configuration (controlled via app)
- **Profile Config**: Subscription and profile management
- **Override Config**: User customizations and rule overrides

### IPC Communication Pattern

All communication between main and renderer processes follows a consistent pattern:
- Frontend calls via `src/renderer/src/utils/ipc.ts`
- Main process handlers in `src/main/utils/ipc.ts`
- Error wrapping and type safety throughout the chain

### State Management

- **SWR**: Data fetching and caching for configuration and API calls
- **React Context**: Global state for authentication and app configuration
- **Local State**: Component-level state for UI interactions

### UI Framework

- **HeroUI**: Primary component library
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon system
- **Framer Motion**: Animations and transitions

## Important Development Patterns

### Authentication Flow
The app includes a login system that:
- Stores tokens in sessionStorage
- Auto-adds subscription URLs from user profiles
- Validates tokens via API calls
- Clears session data on logout

### System Proxy Integration
System proxy functionality is handled through:
- Native system calls for each platform (Windows/macOS/Linux)
- PAC (Proxy Auto Configuration) script support
- Automatic bypass rule management

### Profile and Subscription Management
- Remote subscription URL fetching with proxy support
- SubStore integration for advanced subscription management
- Automatic profile updates with configurable intervals
- Override system for custom rule modifications

### Multi-language Support
- i18next for internationalization
- Support for English, Chinese, Persian, and Russian
- Dynamic language switching without restart

## Development Notes

- Use `pnpm` as the package manager (specified in packageManager field)
- The project uses biome for some linting rules (see biome-ignore comments)
- Monaco Editor is integrated for YAML/JSON editing with custom workers
- The build process optimizes for fast CI builds with disabled sourcemaps and selective minification
- System-specific dependencies are handled through conditional imports and platform detection

## Common File Patterns

- Configuration files use `.ts` extension and export interfaces/functions
- React components follow PascalCase naming in their respective feature directories
- IPC handlers mirror their frontend counterparts with consistent naming
- Type definitions are centralized in `src/shared/types.d.ts`

When adding new features, follow the established patterns for IPC communication, configuration management, and component organization.