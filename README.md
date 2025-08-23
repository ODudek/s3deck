# S3 Deck

A modern, cross-platform desktop application for managing S3-compatible object storage. Built with Tauri, React, and Go, S3 Deck provides an intuitive file manager interface for browsing, uploading, and managing files in your S3 buckets.

![S3 Deck Screenshot](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Build Status](https://img.shields.io/github/workflow/status/odudek/s3deck/ci.yml?branch=main)

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
- **Context Menus**: Right-click actions for files and folders
- **Settings Management**: Customizable app preferences
- **Upload Progress**: Real-time upload status and error reporting

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for building Tauri apps)
- **Go** 1.19+ (for the backend)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/adudek4/s3deck.git
   cd s3deck
   ```

2. Install dependencies:
   ```bash
   npm install
   cd src-tauri/go-backend
   go mod tidy
   cd ../..
   ```

3. Start the development environment:
   ```bash
   npm run start
   # or
   ./dev.sh
   ```

### Building for Production

Build the desktop application:
```bash
npm run tauri build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`.

## 🏗️ Architecture

S3 Deck uses a multi-layer architecture:

- **Frontend**: React + Vite + Tailwind CSS
- **Desktop Shell**: Tauri (Rust-based)
- **Backend API**: Go HTTP server
- **Configuration**: JSON-based local storage

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   React UI      │───▶│ Tauri Shell  │───▶│  Go Backend     │
│  (Frontend)     │    │  (Desktop)   │    │ (S3 Operations) │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run tauri dev` - Start Tauri in development mode
- `npm run dev:backend` - Start Go backend with hot reload
- `npm run dev:all` - Start all development servers
- `npm run build` - Build frontend for production
- `npm run tauri build` - Build desktop application

### Project Structure

```
s3deck/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   └── ...
├── src-tauri/             # Tauri configuration
│   ├── go-backend/        # Go HTTP server
│   │   ├── main.go        # Server entry point
│   │   ├── handlers.go    # HTTP handlers
│   │   ├── s3client.go    # S3 operations
│   │   └── ...
│   └── tauri.conf.json    # Tauri configuration
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

## 🔧 Backend API

The Go backend exposes a REST API on `localhost:8082`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/buckets` | List configured buckets |
| POST | `/add-bucket` | Add bucket configuration |
| GET | `/objects?bucket=ID&prefix=PATH` | List objects in bucket |
| POST | `/upload` | Upload file to bucket |
| DELETE | `/delete?bucket=ID&key=KEY` | Delete object or folder |
| GET | `/metadata?bucket=ID&key=KEY` | Get object metadata |

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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/adudek4/s3deck/issues) to report bugs or request features.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI powered by [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [Go](https://golang.org/) and [AWS SDK](https://aws.amazon.com/sdk-for-go/)

## ⭐ Support

If you find S3 Deck useful, please consider giving it a star on GitHub!

---

**Made with ❤️ by the S3 Deck team**
