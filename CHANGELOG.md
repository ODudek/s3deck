# Changelog

All notable changes to S3 Deck will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release preparations
- GitHub Actions CI/CD pipeline
- Cross-platform build system

## [0.1.0] - 2024-08-23

### Added
- 🎉 Initial release of S3 Deck
- Multi-bucket S3 management interface
- Drag & drop file and folder uploads
- Real-time upload progress tracking
- Dark mode and light mode themes
- Auto-refresh functionality
- File browser with folder navigation
- Context menus for files and folders
- Search and filter functionality
- Settings management with persistence
- Cross-platform support (Windows, macOS, Linux)
- Support for S3-compatible services (AWS S3, MinIO, DigitalOcean Spaces, etc.)
- File metadata viewing
- Bulk file operations
- Breadcrumb navigation
- Upload error reporting and retry mechanisms
- Configurable file size limits
- Hidden file visibility toggle
- Delete confirmation dialogs
- Responsive UI design

### Architecture
- React frontend with Vite build system
- Tauri desktop application shell
- Go backend HTTP server for S3 operations
- Local JSON configuration storage
- AWS SDK v2 for S3 operations
- Tailwind CSS for styling

### Supported Platforms
- Windows (x64)
- macOS (Intel and Apple Silicon)
- Linux (x64)

### Supported S3 Services
- Amazon S3
- MinIO
- DigitalOcean Spaces
- Backblaze B2
- Wasabi
- Any S3-compatible service

---

## Release Notes Template

For future releases, please follow this format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Any bug fixes

### Security
- Security improvements
```