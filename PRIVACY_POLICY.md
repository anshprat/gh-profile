# Privacy Policy for GitHub Admin Profile Guard

**Last Updated:** November 22, 2025

## Overview

GitHub Admin Profile Guard is a Chrome extension that alerts you when you're using an admin GitHub profile on PR pages, helping prevent accidental use of admin accounts for non-admin tasks. This privacy policy explains our data practices and commitment to user privacy.

**Note:** GitHub is a trademark of GitHub, Inc. This extension is not affiliated with or endorsed by GitHub.

## Data Collection and Usage

**We do not collect, store, or transmit any user data to external servers.**

This extension:
- Does NOT collect any personal information
- Does NOT track user behavior or browsing history
- Does NOT transmit any data to external servers
- Does NOT use analytics or telemetry services
- Does NOT communicate with any third-party services
- Does NOT access your GitHub credentials or private repository content beyond what is displayed on the page to identify your username

## Local Data Storage

The extension uses Chrome's built-in sync storage API to store the following data locally on your device:

### Stored Data
1. **Admin Usernames List**: The list of GitHub usernames you configure as admin profiles
2. **Notification Style**: Your preference for how alerts are displayed (banner, modal, or notification)
3. **Enabled/Disabled State**: A boolean value indicating whether the extension is active

### Storage Details
- All data is stored locally using Chrome's `chrome.storage.sync` API
- If you have Chrome sync enabled, this data will be synced across your Chrome browsers (this is a Chrome feature, not controlled by this extension)
- You can clear this data at any time by removing the extension or clearing Chrome's extension storage
- No data is transmitted to any external servers or third parties

### Your Control
- You can add or remove admin usernames at any time through the options page
- You can change notification styles or disable the extension at any time
- All data remains under your complete control

## Permissions

The extension requests the following permissions:

### Storage Permission
This permission allows the extension to:
- Save your list of admin usernames
- Save your notification preferences
- Save your enabled/disabled state
- Sync settings across your Chrome browsers (if Chrome sync is enabled)

### Host Permissions (github.com)
This permission allows the extension to:
- Run a content script on GitHub pages
- Detect your current username from the page DOM (specifically the avatar menu)
- Display alerts when a match is found

The extension only runs on:
- `https://github.com/*`

## What the Extension Does

The extension performs only the following operations:
1. Monitors GitHub pages to detect when you are on a PR-related page
2. Extracts your current username from the GitHub UI (avatar menu)
3. Checks if the detected username matches any in your locally stored admin list
4. Displays a visual alert if a match is found

All operations occur locally in your browser. No data leaves your device except through Chrome's sync storage (if you have Chrome sync enabled), which is a standard Chrome feature.

## Third-Party Services

This extension does not integrate with, communicate with, or share data with any third-party services. It only interacts with GitHub pages in your browser to perform its core function.

## Data Security

- All data is stored locally using Chrome's secure storage API
- No data is transmitted to external servers
- The extension does not have access to your GitHub password or API tokens
- The extension reads only the visible username from the page

## Children's Privacy

This extension does not knowingly collect information from children under 13 years of age. Since no data is transmitted to external servers, children's privacy is fully protected. Any locally stored data remains on the user's device.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the extension after such changes constitutes acceptance of the updated privacy policy.

## Contact Information

If you have any questions or concerns about this privacy policy, please open an issue on our GitHub repository:
https://github.com/anshprat/gh-profile

## Compliance

This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Other applicable privacy regulations

## Your Rights

You have the right to:
- Access your stored data (admin list and preferences) through the options page
- Modify your stored data at any time
- Delete your stored data by removing admin usernames or uninstalling the extension
- Control whether the extension is enabled or disabled

Since all data is stored locally and not transmitted to external servers, you have complete control over your data.

## Summary

In simple terms: This extension checks your GitHub username against a list you provide to warn you if you are using an admin account. It stores your settings locally on your device. It does not collect, transmit, or share any information with external servers. Your privacy is completely protected, and you have full control over all stored data.
