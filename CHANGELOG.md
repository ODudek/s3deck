# Changelog

All notable changes to S3 Deck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Frontend Architecture Refactor**: Complete modular component reorganization
  - Split large components (AppContent, ObjectsTable, Header) into smaller, focused components
  - Organized components by functionality (layout/, navigation/, object/, ui/, modals/)
  - Created reusable UI component system (Button, Modal, Input, LoadingSpinner, EmptyState)
  - Refactored useS3Operations hook into specialized hooks (useBuckets, useObjects, useS3Delete, etc.)
  - Improved code maintainability and development experience
  - Better performance through smaller, optimized components
  - Enhanced testing capabilities with modular architecture

### Added
- **Component Documentation**: Updated CLAUDE.md and README.md with new architecture details
- **Reusable UI Components**: Button, Modal, Input component system for consistency
- **Specialized Hooks**: Focused S3 operation hooks for better code organization
- **Drag & Drop Components**: Modular drag & drop system in object/dragdrop/ folder

## [0.2.2] - 2025-01-01

### Added
- **Show Folder Modified Dates Setting**: New toggle in Configuration to control folder modification date display (default: disabled for better performance)
- Demo GIF in README with dedicated Preview section for better project showcase

### Fixed
- **Critical Drag & Drop Bug**: Fixed issue where dragging a folder would upload the entire parent directory instead of just the selected folder
- **Universal Drag & Drop Logic**: Implemented proper common parent path detection that works for folders at any depth
- **S3 Key Building**: Corrected backend logic to properly handle dragged items regardless of their filesystem location

### Changed
- **Consistent Text Colors**: Unified all text colors in Configuration view to use consistent gray-800/gray-300 pattern for better readability
- **Performance Optimization**: Folder modification dates are now opt-in to prevent slow S3 API calls and potential errors
- **Better Error Handling**: Improved error messaging for folder date fetching with graceful fallbacks

## [0.2.1] - 2024-08-25

### Added
- Smart context menu positioning that automatically adjusts to viewport boundaries
- Intelligent menu placement (shows above when too close to bottom, left when too close to right)
- Global cursor pointer styles for all interactive elements
- Context menu margin safety zones to prevent edge clipping

### Fixed
- Button cursor pointer missing after Tailwind CSS v4 migration
- Context menu overflow issues when right-clicking near viewport edges
- Interactive elements not showing proper cursor on hover
- Context menu accessibility in constrained viewport areas

## [0.2.0] - 2024-08-25

### Added
- **New Folder Creation**: Button to create new folders with comprehensive validation
- **Folder Modification Dates**: Display latest file modification date for folders in the Modified column
- **Smart Error Handling**: In-modal error display for better user experience and visibility
- Automatic release notes generation from changelog
- Improved CI/CD workflow with Rust-only backend
- Enhanced drag & drop functionality with Tauri native file handling
- Improved upload progress tracking and error reporting
- Better file size validation and formatting
- Debug mode toggle in settings for development
- File and folder rename functionality with smart content-type detection
- Support for changing file extensions during rename (automatically updates MIME type)
- Comprehensive filename validation with cross-platform compatibility
- Bulk folder renaming that preserves internal file structure
- Rename option in context menu for all objects
- Simplified notification messages showing only file/folder names instead of full paths
- Warning notification type with appropriate styling and icon

### Changed
- **Breadcrumbs Layout**: Moved breadcrumbs under search section to prevent horizontal scrolling
- **Header Layout**: Improved spacing and organization in header components
- Migrated from Go backend to pure Rust/Tauri implementation
- Updated GitHub Actions workflows to remove Go dependencies
- Improved error handling and logging
- **BREAKING**: Upgraded to Tailwind CSS v4.1.12 with new configuration system
- Updated PostCSS configuration for Tailwind v4 compatibility
- Migrated CSS imports from `@tailwind` directives to `@import "tailwindcss"`
- Updated opacity syntax from `bg-opacity-*` to new slash notation (`bg-black/50`)

### Removed
- Go backend implementation and dependencies
- HTML drag & drop support (Tauri native only)
- Debug console.log statements from production code
- Legacy Tailwind v3 configuration and directives

### Fixed
- **Double Scrollbar Issue**: Removed duplicate Y-axis scrollbars in objects view
- **Error Visibility**: Fixed server error messages being hidden behind modal overlays
- **Folder Validation**: Added proper validation for duplicate folder names and invalid characters
- Tauri drag & drop file handling
- Build process optimization
- Development environment startup scripts
- File drag & drop issues in desktop environment
- Upload progress reporting accuracy
- Memory usage optimization during file operations
- Cross-platform file path handling
- Dark mode theme switching with custom variant configuration
- Modal and sidebar overlay transparency issues
- CSS build process with Tailwind v4

### Security
- Removed network-based communication in favor of secure IPC
- Enhanced credential storage security recommendations

## [0.1.0] - 2024-08-23

### Added
- 🎉 Initial release of S3 Deck
- Multi-bucket S3 management interface
- Drag & drop file and folder uploads with progress tracking
- Real-time upload progress with detailed error reporting
- Dark mode and light mode themes with auto-detection
- Auto-refresh functionality with configurable intervals
- File browser with intuitive folder navigation
- Context menus for files and folders with quick actions
- Search and filter functionality for large buckets
- Settings management with local persistence
- Cross-platform support (Windows, macOS, Linux)
- Support for S3-compatible services (AWS S3, MinIO, DigitalOcean Spaces, etc.)
- Comprehensive file metadata viewing
- Bulk file operations and management
- Breadcrumb navigation for easy path traversal
- Upload error reporting with retry mechanisms
- Configurable file size limits and validation
- Hidden file visibility toggle
- Delete confirmation dialogs for safety
- Responsive UI design with modern styling

### Architecture
- React frontend with Vite build system for fast development
- Tauri desktop application shell for native performance
- Rust backend with Tauri commands for secure S3 operations
- Local JSON configuration storage in user directory
- AWS SDK for Rust for reliable S3 operations
- Tailwind CSS for consistent, modern styling
- TypeScript support for better development experience

### Supported Platforms
- Windows (x64) with MSI installer
- macOS (Intel and Apple Silicon) with DMG packages
- Linux (x64) with AppImage and DEB packages

### Supported S3 Services
- Amazon S3 (all regions)
- MinIO (self-hosted and cloud)
- DigitalOcean Spaces
- Backblaze B2
- Wasabi Hot Cloud Storage
- Any S3-compatible service with custom endpoints

---

## Release Notes Template

For future releases, please follow this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and functionality

### Changed
- Changes in existing functionality
- Performance improvements
- UI/UX enhancements

### Deprecated
- Soon-to-be removed features
- Migration instructions

### Removed
- Now removed features
- Breaking changes

### Fixed
- Bug fixes
- Security patches
- Performance issues

### Security
- Security improvements
- Vulnerability fixes
```

## Contributing to Changelog

When contributing to S3 Deck, please:

1. Add your changes to the `[Unreleased]` section
2. Use the appropriate category (Added, Changed, Fixed, etc.)
3. Write clear, user-focused descriptions
4. Include relevant details for users and developers
5. Follow the existing format and style

## Changelog Guidelines

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for security-related changes
