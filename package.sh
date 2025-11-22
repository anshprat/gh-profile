#!/bin/bash

# Chrome Extension Packaging Script
# This script creates a zip file ready for Chrome Web Store submission

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the extension name and version from manifest.json
EXTENSION_NAME=$(grep -o '"name": "[^"]*"' manifest.json | cut -d'"' -f4 | tr ' ' '-')
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
PACKAGE_NAME="${EXTENSION_NAME}-v${VERSION}.zip"

echo -e "${GREEN}📦 Packaging Chrome Extension${NC}"
echo "Extension: $EXTENSION_NAME"
echo "Version: $VERSION"
echo ""

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="$TEMP_DIR/package"

mkdir -p "$PACKAGE_DIR"

echo -e "${YELLOW}Copying files...${NC}"

# Copy essential files
cp manifest.json "$PACKAGE_DIR/"
cp background.js "$PACKAGE_DIR/"
cp content.js "$PACKAGE_DIR/"
cp options.html "$PACKAGE_DIR/"
cp options.js "$PACKAGE_DIR/"
cp styles.css "$PACKAGE_DIR/"

# Copy icons directory
cp -r icons "$PACKAGE_DIR/"

# Create zip file
echo -e "${YELLOW}Creating zip file...${NC}"
cd "$PACKAGE_DIR"
zip -r "$OLDPWD/$PACKAGE_NAME" . -x "*.DS_Store" "*.git*" > /dev/null
cd "$OLDPWD"

# Clean up
rm -rf "$TEMP_DIR"

echo -e "${GREEN}✅ Package created: $PACKAGE_NAME${NC}"
echo ""
echo "You can now upload this file to the Chrome Web Store:"
echo "  https://chrome.google.com/webstore/devconsole"

