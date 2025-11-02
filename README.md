# GitHub Admin Profile Guard

A Chrome extension that alerts you when you're using an admin GitHub profile on PR pages, helping prevent accidental use of admin accounts for non-admin tasks.

## Features

- **Profile Detection**: Automatically detects your current GitHub username from the avatar menu
- **PR Page Monitoring**: Alerts you only on PR-related pages (pull requests, compare pages, etc.)
- **Configurable Admin List**: Add/remove admin usernames through the options page
- **Multiple Notification Styles**: Choose from banner, modal, or browser notification styles
- **Easy Configuration**: Simple options page for all settings

## Installation

1. **Download or clone this repository**
   ```bash
   git clone <repository-url>
   cd gh-profile
   ```

2. **Create Extension Icons** (Required)
   
   You need to create icon files for the extension:
   - `icons/icon16.png` - 16x16 pixels
   - `icons/icon48.png` - 48x48 pixels  
   - `icons/icon128.png` - 128x128 pixels
   
   You can create these using any image editor. Suggested design: A shield or guard icon with GitHub's color scheme.

3. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `gh-profile` directory

## Configuration

1. **Open the Options Page**
   - Click the extension icon in Chrome toolbar, or
   - Right-click the extension icon → Options, or
   - Navigate to `chrome://extensions/` → Find the extension → Click "Extension options"

2. **Add Admin Usernames**
   - Enter GitHub usernames (without @) that should be considered admin profiles
   - Click "Add" for each username
   - The extension will alert you when any of these usernames are detected on PR pages

3. **Choose Notification Style**
   - **Banner**: Persistent red banner at the top of the page (default)
   - **Modal**: Popup overlay that must be acknowledged
   - **Browser Notification**: System notification with badge indicator

4. **Enable/Disable Extension**
   - Use the toggle switch to enable or disable the extension

## How It Works

1. The extension monitors GitHub pages and detects when you're on a PR-related page
2. It extracts your current GitHub username from the avatar menu dropdown
3. It checks if your username matches any in the configured admin list
4. If a match is found, it displays the selected notification style
5. The extension badge shows a "!" indicator when an admin profile is detected

## Supported Pages

The extension monitors the following GitHub pages:
- Pull request pages: `github.com/*/*/pull/*`
- Compare pages: `github.com/*/*/compare/*`
- Pull requests list: `github.com/*/*/pulls`

## Troubleshooting

**Extension not detecting my username?**
- Make sure you're logged into GitHub
- The extension reads the username from GitHub's avatar menu. If GitHub's UI changes, detection might need updating.

**Notifications not showing?**
- Check that the extension is enabled in the options page
- Verify you're on a PR page (not just any GitHub page)
- Check that your username is in the admin list

**Want to temporarily disable?**
- Use the toggle switch in the options page instead of uninstalling

## Development

### File Structure
- `manifest.json` - Extension configuration
- `background.js` - Service worker for badge and notifications
- `content.js` - Content script injected on GitHub pages
- `options.html` - Settings page UI
- `options.js` - Settings page logic
- `styles.css` - Notification styling
- `icons/` - Extension icons directory

### Testing
1. Load the extension in developer mode
2. Add a test admin username in options
3. Navigate to a PR page while logged in with that username
4. Verify the notification appears

## License

MIT License - feel free to use and modify as needed.

