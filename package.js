#!/usr/bin/env node

/**
 * Chrome Extension Packaging Script
 * Creates a zip file ready for Chrome Web Store submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getManifestInfo() {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return {
    name: manifest.name.replace(/\s+/g, '-'),
    version: manifest.version
  };
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDirectoryExists(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
  ensureDirectoryExists(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function createZip(sourceDir, outputPath) {
  const zipCommand = process.platform === 'win32' 
    ? `powershell Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${outputPath}" -Force`
    : `cd "${sourceDir}" && zip -r "${outputPath}" . -x "*.DS_Store" "*.git*" > /dev/null`;
  
  try {
    execSync(zipCommand, { stdio: 'inherit' });
  } catch (error) {
    log('Error creating zip file. Make sure you have zip installed.', 'yellow');
    throw error;
  }
}

function main() {
  try {
    log('📦 Packaging Chrome Extension', 'green');
    
    const { name, version } = getManifestInfo();
    const packageName = `${name}-v${version}.zip`;
    
    log(`Extension: ${name}`);
    log(`Version: ${version}`);
    console.log('');
    
    // Create temporary directory
    const tempDir = fs.mkdtempSync(path.join(__dirname, 'package-temp-'));
    const packageDir = path.join(tempDir, 'package');
    ensureDirectoryExists(packageDir);
    
    log('Copying files...', 'yellow');
    
    // Files to include in the package
    const filesToInclude = [
      'manifest.json',
      'background.js',
      'content.js',
      'options.html',
      'options.js',
      'styles.css'
    ];
    
    // Copy files
    for (const file of filesToInclude) {
      const srcPath = path.join(__dirname, file);
      if (fs.existsSync(srcPath)) {
        copyFile(srcPath, path.join(packageDir, file));
      } else {
        log(`Warning: ${file} not found, skipping...`, 'yellow');
      }
    }
    
    // Copy icons directory
    const iconsDir = path.join(__dirname, 'icons');
    if (fs.existsSync(iconsDir)) {
      copyDirectory(iconsDir, path.join(packageDir, 'icons'));
    } else {
      log('Warning: icons directory not found!', 'yellow');
    }
    
    // Create zip file
    log('Creating zip file...', 'yellow');
    const outputPath = path.join(__dirname, packageName);
    createZip(packageDir, outputPath);
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    log(`✅ Package created: ${packageName}`, 'green');
    console.log('');
    log('You can now upload this file to the Chrome Web Store:');
    log('  https://chrome.google.com/webstore/devconsole');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'yellow');
    process.exit(1);
  }
}

main();

