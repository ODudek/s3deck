#!/bin/bash

# S3 Deck Universal Installer
# Downloads pre-built binaries and fixes platform-specific issues
# No prerequisites required - just works!

set -e

# Parse command line arguments
VERSION=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -h|--help)
      echo "S3 Deck Installer"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -v, --version VERSION    Install specific version (e.g., v0.2.0)"
      echo "  -h, --help              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                      # Install latest version"
      echo "  $0 -v v0.2.0           # Install specific version"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      echo "Use -h for help"
      exit 1
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO="ODudek/s3deck"
APP_NAME="S3Deck"

echo -e "${PURPLE}🚀 S3 Deck Universal Installer${NC}"
echo -e "${PURPLE}================================${NC}"
echo ""

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo -e "${BLUE}🔍 Detected system: ${CYAN}$OS${NC} on ${CYAN}$ARCH${NC}"

# Normalize architecture names
case $ARCH in
    x86_64|amd64)
        ARCH_NORM="x64"
        ;;
    aarch64|arm64)
        ARCH_NORM="aarch64"
        ;;
    i386|i686)
        ARCH_NORM="x86"
        ;;
    *)
        echo -e "${RED}❌ Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

# Determine file extension and install method based on OS
case $OS in
    darwin)
        PLATFORM="macos"
        FILE_EXT="dmg"
        INSTALL_DIR="/Applications"
        ;;
    linux)
        PLATFORM="linux"
        FILE_EXT="AppImage"
        INSTALL_DIR="$HOME/.local/bin"
        mkdir -p "$INSTALL_DIR"
        ;;
    mingw*|msys*|cygwin*)
        PLATFORM="windows"
        FILE_EXT="msi"
        echo -e "${YELLOW}⚠️  Windows detected. This installer works best in Git Bash/WSL.${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unsupported operating system: $OS${NC}"
        echo -e "${YELLOW}💡 Supported: macOS, Linux, Windows (via WSL/Git Bash)${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}🎯 Target platform: ${CYAN}$PLATFORM${NC} (${CYAN}$ARCH_NORM${NC})"

# Get release information
echo -e "${BLUE}📡 Fetching release information...${NC}"

if [ -z "$VERSION" ]; then
    # Get latest release
    LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$LATEST_RELEASE" ]; then
        VERSION=$(echo "$LATEST_RELEASE" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' | head -1)
        RELEASE_INFO="$LATEST_RELEASE"
    fi

    if [ -z "$VERSION" ]; then
        echo -e "${RED}❌ Could not fetch latest release${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Latest version: ${CYAN}$VERSION${NC}"
    fi
else
    echo -e "${BLUE}🎯 Requested version: ${CYAN}$VERSION${NC}"

    # Get specific version release info
    RELEASE_INFO=$(curl -s "https://api.github.com/repos/$REPO/releases/tags/$VERSION" 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$RELEASE_INFO" ]; then
        echo -e "${RED}❌ Version $VERSION not found${NC}"
        exit 1
    fi
fi

# Find download URL based on platform and architecture
if [ "$PLATFORM" = "macos" ]; then
    DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep "browser_download_url.*${ARCH_NORM}.*\\.${FILE_EXT}" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
elif [ "$PLATFORM" = "linux" ]; then
    # Try AppImage first, fallback to other formats
    DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep "browser_download_url.*${ARCH_NORM}.*\\.${FILE_EXT}" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$DOWNLOAD_URL" ]; then
        FILE_EXT="deb"
        DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep "browser_download_url.*${ARCH_NORM}.*\\.${FILE_EXT}" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
    fi
else
    DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep "browser_download_url.*\\.${FILE_EXT}" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
fi

if [ -z "$DOWNLOAD_URL" ]; then
    echo -e "${RED}❌ Could not find download URL for $PLATFORM ($ARCH_NORM)${NC}"
    echo -e "${YELLOW}💡 Available downloads:${NC}"
    echo "$RELEASE_INFO" | grep "browser_download_url" | sed -E 's/.*"([^"]+)".*/\1/' | head -5
    exit 1
fi

echo -e "${BLUE}📥 Download URL: ${CYAN}$(basename "$DOWNLOAD_URL")${NC}"

# Create temp directory
TEMP_DIR=$(mktemp -d)
DOWNLOAD_FILE="$TEMP_DIR/s3deck.$FILE_EXT"

# Download file
echo -e "${BLUE}⬇️  Downloading S3 Deck $VERSION...${NC}"
if ! curl -L --progress-bar -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL"; then
    echo -e "${RED}❌ Download failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Download completed${NC}"

# Platform-specific installation
case $PLATFORM in
    macos)
        echo -e "${BLUE}🍎 Installing on macOS...${NC}"

        # Remove quarantine attribute from DMG
        echo -e "${BLUE}🔧 Removing quarantine attributes...${NC}"
        xattr -cr "$DOWNLOAD_FILE" 2>/dev/null || true

        # Mount DMG
        echo -e "${BLUE}💿 Mounting installer...${NC}"

        # Check if file exists and is valid
        if [ ! -f "$DOWNLOAD_FILE" ]; then
            echo -e "${RED}❌ Downloaded file not found: $DOWNLOAD_FILE${NC}"
            exit 1
        fi

        # Check file size
        FILE_SIZE=$(stat -f%z "$DOWNLOAD_FILE" 2>/dev/null || stat -c%s "$DOWNLOAD_FILE" 2>/dev/null || echo "0")
        if [ "$FILE_SIZE" -lt 1000000 ]; then
            echo -e "${RED}❌ Downloaded file appears to be corrupt (size: $FILE_SIZE bytes)${NC}"
            echo -e "${YELLOW}💡 This might be an API rate limit or network issue. Try again in a few minutes.${NC}"
            exit 1
        fi

        # Try mounting with detailed error output
        echo -e "${BLUE}🔧 Attempting to mount DMG...${NC}"
        MOUNT_OUTPUT=$(hdiutil attach "$DOWNLOAD_FILE" 2>&1)
        MOUNT_EXIT_CODE=$?

        if [ $MOUNT_EXIT_CODE -ne 0 ]; then
            echo -e "${RED}❌ Failed to mount installer${NC}"
            echo -e "${YELLOW}💡 Error details:${NC}"
            echo "$MOUNT_OUTPUT"
            echo ""
            echo -e "${YELLOW}💡 Possible solutions:${NC}"
            echo -e "   ${CYAN}1. Try running: sudo spctl --master-disable${NC}"
            echo -e "   ${CYAN}2. Try running: xattr -cr '$DOWNLOAD_FILE'${NC}"
            echo -e "   ${CYAN}3. Download manually from: https://github.com/$REPO/releases/latest${NC}"
            exit 1
        fi

        MOUNT_POINT=$(echo "$MOUNT_OUTPUT" | grep "/Volumes/" | awk '{print $3}' | head -1)

        if [ -z "$MOUNT_POINT" ]; then
            echo -e "${RED}❌ Could not determine mount point${NC}"
            echo -e "${YELLOW}💡 Mount output:${NC}"
            echo "$MOUNT_OUTPUT"
            exit 1
        fi

        echo -e "${GREEN}✅ DMG mounted at: $MOUNT_POINT${NC}"

        # Find .app in mounted volume
        APP_PATH=$(find "$MOUNT_POINT" -name "*.app" -type d | head -1)
        if [ -z "$APP_PATH" ]; then
            echo -e "${RED}❌ Could not find application in installer${NC}"
            hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
            exit 1
        fi

        # Remove existing installation
        if [ -d "$INSTALL_DIR/$APP_NAME.app" ]; then
            echo -e "${YELLOW}⚠️  Removing existing installation...${NC}"
            rm -rf "$INSTALL_DIR/$APP_NAME.app"
        fi

        # Copy app to Applications
        echo -e "${BLUE}📁 Installing to Applications...${NC}"
        cp -R "$APP_PATH" "$INSTALL_DIR/"

        # Fix permissions and quarantine - critical for unsigned apps
        xattr -cr "$INSTALL_DIR/$APP_NAME.app" 2>/dev/null || true
        chmod +x "$INSTALL_DIR/$APP_NAME.app/Contents/MacOS"/* 2>/dev/null || true

        # Unmount DMG
        hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true

        FINAL_PATH="$INSTALL_DIR/$APP_NAME.app"
        ;;

    linux)
        echo -e "${BLUE}🐧 Installing on Linux...${NC}"

        if [ "$FILE_EXT" = "AppImage" ]; then
            # AppImage installation
            FINAL_PATH="$INSTALL_DIR/s3deck"
            cp "$DOWNLOAD_FILE" "$FINAL_PATH"
            chmod +x "$FINAL_PATH"

            # Create desktop entry
            DESKTOP_DIR="$HOME/.local/share/applications"
            mkdir -p "$DESKTOP_DIR"

            cat > "$DESKTOP_DIR/s3deck.desktop" << EOF
[Desktop Entry]
Name=S3 Deck
Comment=Modern S3 bucket manager
Exec=$FINAL_PATH
Icon=applications-internet
Type=Application
Categories=Utility;FileManager;Network;
StartupNotify=true
EOF

            echo -e "${GREEN}✅ Created desktop entry${NC}"

        elif [ "$FILE_EXT" = "deb" ]; then
            # DEB package installation
            echo -e "${BLUE}📦 Installing DEB package...${NC}"
            if command -v dpkg >/dev/null 2>&1; then
                sudo dpkg -i "$DOWNLOAD_FILE" || true
                sudo apt-get install -f -y  # Fix dependencies if needed
                FINAL_PATH="/usr/bin/s3deck"
            else
                echo -e "${RED}❌ dpkg not found. Cannot install DEB package.${NC}"
                exit 1
            fi
        fi
        ;;

    windows)
        echo -e "${BLUE}🪟 Windows installation...${NC}"
        echo -e "${BLUE}📦 Launching installer...${NC}"
        echo -e "${YELLOW}💡 Please follow the installation wizard${NC}"

        if command -v cmd.exe >/dev/null 2>&1; then
            # WSL environment
            cmd.exe /c "$(wslpath -w "$DOWNLOAD_FILE")" 2>/dev/null || start "$DOWNLOAD_FILE" 2>/dev/null || true
        elif command -v start >/dev/null 2>&1; then
            # Git Bash / MinGW
            start "$DOWNLOAD_FILE" 2>/dev/null || true
        else
            echo -e "${BLUE}💡 Please manually run: ${CYAN}$DOWNLOAD_FILE${NC}"
        fi

        echo -e "${GREEN}✅ Installer launched. S3 Deck will be available in Start Menu after installation.${NC}"
        FINAL_PATH="Installed via MSI"
        ;;
esac

# Cleanup
cd /
rm -rf "$TEMP_DIR"

# Verify installation
echo -e "${BLUE}🔍 Verifying installation...${NC}"
if [ -f "$FINAL_PATH" ] || [ -d "$FINAL_PATH" ] || [ "$FINAL_PATH" = "Installed via MSI" ]; then
    echo -e "${GREEN}✅ Installation completed successfully!${NC}"
    echo ""
    echo -e "${PURPLE}🎉 S3 Deck is now installed!${NC}"

    if [ "$FINAL_PATH" != "Installed via MSI" ]; then
        echo -e "${BLUE}📍 Location: ${CYAN}$FINAL_PATH${NC}"
    fi

    case $PLATFORM in
        macos)
            echo ""
            echo -e "${BLUE}💡 To run S3 Deck:${NC}"
            echo -e "   ${GREEN}open '$FINAL_PATH'${NC}"
            echo -e "   ${GREEN}# or use Spotlight (⌘+Space) and type 'S3 Deck'${NC}"

            read -p "$(echo -e ${CYAN}Do you want to open S3 Deck now? [y/N]: ${NC})" -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open "$FINAL_PATH"
            fi
            ;;
        linux)
            echo ""
            echo -e "${BLUE}💡 To run S3 Deck:${NC}"
            echo -e "   ${GREEN}$FINAL_PATH${NC}"
            echo -e "   ${GREEN}# or find 'S3 Deck' in your application menu${NC}"

            read -p "$(echo -e ${CYAN}Do you want to run S3 Deck now? [y/N]: ${NC})" -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                "$FINAL_PATH" &
            fi
            ;;
        windows)
            echo ""
            echo -e "${BLUE}💡 After installation, find S3 Deck in your Start Menu${NC}"
            ;;
    esac

    echo ""
    echo -e "${PURPLE}📚 Documentation: ${CYAN}https://github.com/$REPO${NC}"
    echo -e "${PURPLE}🐛 Issues: ${CYAN}https://github.com/$REPO/issues${NC}"
    echo ""
    echo -e "${GREEN}Happy S3 managing! 🚀${NC}"

else
    echo -e "${RED}❌ Installation verification failed${NC}"
    echo -e "${YELLOW}💡 The app might still be installed. Check your system's application menu.${NC}"
    exit 1
fi
