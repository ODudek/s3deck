# Changelog

All notable changes to S3 Deck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-08-24

### Added
- Automatic release notes generation from changelog
- Improved CI/CD workflow with Rust-only backend
- Enhanced drag & drop functionality with Tauri native file handling
- Improved upload progress tracking and error reporting
- Better file size validation and formatting
- Debug mode toggle in settings for development

### Changed
- Migrated from Go backend to pure Rust/Tauri implementation
- Updated GitHub Actions workflows to remove Go dependencies
- Improved error handling and logging
- Replaced HTTP-based backend with Tauri IPC commands
- Improved error messages and user feedback
- Enhanced file upload reliability
- Better handling of large file uploads

### Removed
- Go backend implementation and dependencies
- HTML drag & drop support (Tauri native only)
- Debug console.log statements from production code

### Fixed
- Tauri drag & drop file handling
- Build process optimization
- Development environment startup scripts
- File drag & drop issues in desktop environment
- Upload progress reporting accuracy
- Memory usage optimization during file operations
- Cross-platform file path handling

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
