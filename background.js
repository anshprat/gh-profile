// Background service worker for GitHub Admin Profile Guard
chrome.runtime.onInstalled.addListener(() => {
  // Set default configuration
  chrome.storage.sync.get(['adminUsernames', 'notificationStyle', 'enabled'], (result) => {
    if (!result.adminUsernames) {
      chrome.storage.sync.set({ adminUsernames: [] });
    }
    if (!result.notificationStyle) {
      chrome.storage.sync.set({ notificationStyle: 'banner' });
    }
    if (result.enabled === undefined) {
      chrome.storage.sync.set({ enabled: true });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'adminDetected') {
    // Update badge to show warning
    chrome.action.setBadgeText({
      text: '!',
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#d73a49'
    });
    
    // Send browser notification if enabled
    chrome.storage.sync.get(['notificationStyle', 'enabled'], (result) => {
      if (result.enabled && result.notificationStyle === 'browser') {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Admin Profile Detected',
          message: `You are using an admin profile on a PR page: ${message.username}`
        });
      }
    });
  } else if (message.type === 'clearBadge') {
    chrome.action.setBadgeText({
      text: '',
      tabId: sender.tab.id
    });
  }
});

// Clear badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('github.com')) {
    // Badge will be updated by content script if admin is detected
  }
});

