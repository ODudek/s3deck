# S3 Deck

A modern, cross-platform desktop application for managing S3-compatible object storage. Built with Tauri and React, S3 Deck provides an intuitive file manager interface for browsing, uploading, and managing files in your S3 buckets.

![Platforms](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
[![CI](https://github.com/ODudek/s3deck/actions/workflows/ci.yml/badge.svg)](https://github.com/ODudek/s3deck/actions/workflows/ci.yml)

## ✨ Features

- **Multi-bucket Management**: Connect to multiple S3-compatible services
- **Drag & Drop Upload**: Easy file and folder uploads with progress tracking
- **File Browser**: Navigate through your buckets like a local file system
- **Dark Mode Support**: Beautiful light and dark themes
- **Cross-platform**: Available for Windows, macOS, and Linux
- **S3-Compatible**: Works with AWS S3, MinIO, DigitalOcean Spaces, and more
- **Auto-refresh**: Real-time updates of your bucket contents
- **File Properties**: View detailed metadata and object information
- **Folder Operations**: Create, navigate, and manage folders
- **Search & Filter**: Find files quickly with built-in search
- **Smart Context Menus**: Right-click actions with intelligent positioning
- **File & Folder Rename**: Rename files and folders with smart content-type detection
- **Settings Management**: Customizable app preferences
- **Upload Progress**: Real-time upload status and error reporting
- **Modern UI**: Built with Tailwind CSS v4 for enhanced performance and styling

## 📸 Preview

![S3 Deck Demo](docs/demo.gif)

*See S3 Deck in action - browse buckets, upload files, and manage your S3 storage with ease.*

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for building Tauri apps)

### Installation

## 🚀 **One-Line Universal Installer**

**Works on all platforms - no prerequisites required:**

```bash
# Install latest version
curl -fsSL https://raw.githubusercontent.com/ODudek/s3deck/main/install.sh | bash

# Install specific version
curl -fsSL https://raw.githubusercontent.com/ODudek/s3deck/main/install.sh | bash -s -- -v v0.3.0
```

**This installer will:**
- ✅ **Auto-detect** your OS and architecture
- ✅ **Download** the correct pre-built binary
- ✅ **Fix macOS security warnings** automatically
- ✅ **Install** to the right location for your platform
- ✅ **Create shortcuts** and verify installation
- ✅ **No prerequisites** - just works out of the box!

**Installation locations:**
- 🍎 **macOS**: `/Applications/S3Deck.app`
- 🐧 **Linux**: `~/.local/bin/s3deck` + desktop entry
- 🪟 **Windows**: Launches MSI installer

## 📦 **Manual Download**

Alternatively, download directly from [Releases](https://github.com/ODudek/s3deck/releases/latest):
- 🪟 **Windows**: `.msi` installer
- 🍎 **macOS Intel**: `.dmg` (x64)
- 🍎 **macOS Apple Silicon**: `.dmg` (aarch64)
- 🐧 **Linux**: `.AppImage` or `.deb` packages

> **macOS Note**: If you see "app is damaged" warning, it's normal for unsigned apps. The installer fixes this automatically.

**Manual Installation:**

<details>
<summary>Click to expand manual installation instructions</summary>

1. Go to [Releases](https://github.com/ODudek/s3deck/releases) and download for your platform
2. **macOS**: If you see "app is damaged" error, run: `xattr -cr S3Deck.app`
3. **Windows**: Run the installer (.msi or .exe)
4. **Linux**: Install the .deb, .rpm, or .AppImage file

</details>

**Build from Source:**

<details>
<summary>Click to expand build instructions</summary>

1. Clone the repository:
   ```bash
   git clone https://github.com/ODudek/s3deck.git
   cd s3deck
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development environment:
   ```bash
   npm run start
   # or
   ./dev.sh
   ```

</details>

### Building for Production

Build the desktop application:
```bash
npm run tauri build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`.

## 🏗️ Architecture

S3 Deck uses a modern desktop application architecture:

- **Frontend**: React + Vite + Tailwind CSS v4
- **Backend**: Rust with AWS S3 SDK
- **Desktop Shell**: Tauri (Rust-based)
- **Communication**: Direct Tauri IPC
- **Configuration**: JSON-based local storage
- **UI Framework**: Organized component system with reusable UI components

```
┌─────────────────┐    ┌──────────────────────────────┐
│   React UI      │───▶│      Tauri + Rust            │
│  (Frontend)     │    │  (Desktop + S3 Operations)   │
│  - Modular      │    │                              │
│  - Organized    │    │                              │
│  - Reusable UI  │    │                              │
└─────────────────┘    └──────────────────────────────┘
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run dev:tauri` - Start Tauri in development mode (includes Vite)
- `npm start` - Start development environment
- `npm run build` - Build frontend for production
- `npm run tauri build` - Build desktop application

### Project Structure

```
s3deck/
├── src/                         # React frontend (REFACTORED)
│   ├── components/              # Modular component architecture
│   │   ├── layout/             # Layout components (MainLayout, AppHeader)
│   │   ├── navigation/         # Navigation (Breadcrumbs, SearchInput)
│   │   ├── object/             # Object management (ObjectsList, dragdrop/)
│   │   ├── bucket/             # Bucket management components
│   │   ├── ui/                 # Reusable UI (Button, Modal, Input, etc.)
│   │   ├── modals/             # Modal dialogs
│   │   ├── common/             # Shared components (ViewManager)
│   │   └── ...                 # Legacy components
│   ├── hooks/                   # Custom React hooks
│   │   ├── s3/                 # S3-specific hooks (useBuckets, useObjects, etc.)
│   │   ├── ui/                 # UI hooks (useContextMenu)
│   │   └── ...                 # Other hooks
│   ├── contexts/               # React contexts
│   ├── utils/                  # Utility functions (formatters, errorUtils)
│   └── ...
├── src-tauri/                  # Tauri application (UNCHANGED)
│   ├── src/                    # Rust backend
│   │   ├── main.rs             # Entry point
│   │   ├── lib.rs              # Library entry point
│   │   ├── commands.rs         # Tauri commands
│   │   ├── s3_client.rs        # S3 operations
│   │   ├── config.rs           # Configuration management
│   │   └── models.rs           # Data models
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri configuration
├── REFACTORING_PLAN.md         # Detailed refactoring documentation
└── ...
```

## ⚙️ Configuration

S3 Deck stores bucket configurations in `~/.s3deck/config.json`:

```json
{
  "buckets": [
    {
      "id": "unique-id",
      "name": "my-bucket",
      "displayName": "My S3 Bucket",
      "region": "us-east-1",
      "accessKey": "YOUR_ACCESS_KEY",
      "secretKey": "YOUR_SECRET_KEY",
      "endpoint": "https://s3.amazonaws.com"
    }
  ]
}
```

### Supported S3 Services

- **AWS S3**
- **MinIO**
- **DigitalOcean Spaces**
- **Backblaze B2**
- **Wasabi**
- Any S3-compatible service

## 🔧 Tauri Commands

The Rust backend provides the following Tauri commands for the frontend:

| Command | Description |
|---------|-------------|
| `get_buckets` | List configured buckets |
| `add_bucket` | Add bucket configuration |
| `update_bucket` | Update bucket configuration |
| `delete_bucket_config` | Delete bucket configuration |
| `list_objects` | List objects in bucket |
| `upload_files` | Upload files to bucket |
| `delete_object` | Delete object or folder |
| `get_object_metadata` | Get object metadata |
| `rename_object` | Rename files and folders |
| `count_files` | Count files for upload progress |

## 🎨 Themes

S3 Deck supports three theme modes:
- **Light** - Clean, bright interface
- **Dark** - Easy on the eyes
- **Auto** - Follows system preference

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Tips:
- 🎨 Leverage existing UI components from `src/components/ui/`
- 🎣 Follow the modular hook pattern for new S3 functionality
- 📋 Check `CLAUDE.md` for detailed development guidelines

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/ODudek/s3deck/issues) to report bugs or request features.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI powered by [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Rust](https://www.rust-lang.org/) and [AWS SDK for Rust](https://awslabs.github.io/aws-sdk-rust/)

## ⭐ Support

If you find S3 Deck useful, please consider giving it a star on GitHub!

---

**Made with ❤️ by the S3 Deck team**
