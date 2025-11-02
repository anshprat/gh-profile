// Content script for GitHub Admin Profile Guard
(function() {
  'use strict';

  let currentUsername = null;
  let isAdminProfile = false;
  let notificationShown = false;

  // Debug logging
  function debugLog(...args) {
    console.log('[GitHub Admin Guard]', ...args);
  }

  // Safely send message to background script
  function sendMessageToBackground(message) {
    return new Promise((resolve) => {
      try {
        if (!chrome || !chrome.runtime || !chrome.runtime.id) {
          debugLog('Chrome runtime not available');
          resolve(false);
          return;
        }
        
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            if (error && error.includes('Extension context invalidated')) {
              debugLog('Extension context invalidated - extension may have been reloaded');
            } else {
              debugLog('Error sending message:', error);
            }
            resolve(false);
          } else {
            resolve(true);
          }
        });
      } catch (error) {
        if (error.message && error.message.includes('Extension context invalidated')) {
          debugLog('Extension context invalidated');
        } else {
          debugLog('Error in sendMessageToBackground:', error);
        }
        resolve(false);
      }
    });
  }

  // Safely get storage data
  function getStorageData(keys) {
    return new Promise((resolve) => {
      try {
        if (!chrome || !chrome.storage || !chrome.storage.sync) {
          debugLog('Chrome storage not available');
          resolve({});
          return;
        }
        
        chrome.storage.sync.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            if (error && error.includes('Extension context invalidated')) {
              debugLog('Extension context invalidated during storage get');
            } else {
              debugLog('Error getting storage:', error);
            }
            resolve({});
          } else {
            resolve(result || {});
          }
        });
      } catch (error) {
        if (error.message && error.message.includes('Extension context invalidated')) {
          debugLog('Extension context invalidated');
        } else {
          debugLog('Error in getStorageData:', error);
        }
        resolve({});
      }
    });
  }

  // Check if current page is a PR page
  function isPRPage() {
    const url = window.location.href;
    const isPR = url.includes('/pull/') || url.includes('/compare/') || url.includes('/pulls');
    debugLog('isPRPage check:', url, '->', isPR);
    return isPR;
  }

  // Cache for username to avoid repeated API calls
  let cachedUsername = null;
  let usernameFetchInProgress = false;

  // Extract username using GitHub API (most reliable method)
  async function detectUsername() {
    debugLog('Attempting to detect username...');
    
    // Return cached username if available
    if (cachedUsername) {
      debugLog('Using cached username:', cachedUsername);
      return cachedUsername;
    }

    // Prevent concurrent requests
    if (usernameFetchInProgress) {
      debugLog('Username fetch already in progress, waiting...');
      // Wait for existing request
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!usernameFetchInProgress && cachedUsername) {
            clearInterval(checkInterval);
            resolve(cachedUsername);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 5000);
      });
    }

    usernameFetchInProgress = true;

    try {
      // Method 1: Try GitHub API endpoint (works because we're authenticated)
      // GitHub has several API endpoints we can try
      const apiEndpoints = [
        'https://api.github.com/user',
        'https://github.com/api/v3/user'
      ];

      for (const endpoint of apiEndpoints) {
        try {
          debugLog('Trying API endpoint:', endpoint);
          const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData && userData.login) {
              cachedUsername = userData.login;
              debugLog('Detected username via API:', cachedUsername);
              usernameFetchInProgress = false;
              return cachedUsername;
            }
          }
        } catch (err) {
          debugLog('API endpoint failed:', endpoint, err);
        }
      }

      // Method 2: Try accessing GitHub's internal state (if available)
      // GitHub sometimes exposes user data in window.__INITIAL_STATE__ or similar
      if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.context && window.__INITIAL_STATE__.context.user) {
        const username = window.__INITIAL_STATE__.context.user.login;
        if (username) {
          cachedUsername = username;
          debugLog('Detected username from __INITIAL_STATE__:', cachedUsername);
          usernameFetchInProgress = false;
          return cachedUsername;
        }
      }

      // Check other possible global variables GitHub might use
      const possibleGlobals = [
        'app', 'gh', 'GitHub', '__app__', '__DATA__'
      ];

      for (const globalName of possibleGlobals) {
        if (window[globalName]) {
          try {
            const global = window[globalName];
            // Try to find user object in nested structures
            const userPath = findUserInObject(global);
            if (userPath) {
              cachedUsername = userPath;
              debugLog(`Detected username from ${globalName}:`, cachedUsername);
              usernameFetchInProgress = false;
              return cachedUsername;
            }
          } catch (e) {
            // Ignore errors accessing global objects
          }
        }
      }

      // Method 3: Try meta tag (some GitHub pages have this)
      const metaUser = document.querySelector('meta[name="user-login"], meta[property="og:site_name"]');
      if (metaUser) {
        const username = metaUser.getAttribute('content');
        if (username && !username.includes('GitHub')) {
          cachedUsername = username;
          debugLog('Detected username from meta tag:', cachedUsername);
          usernameFetchInProgress = false;
          return cachedUsername;
        }
      }

      // Method 4: Fallback to DOM-based detection (less reliable but backup)
      const domUsername = detectUsernameFromDOM();
      if (domUsername) {
        cachedUsername = domUsername;
        debugLog('Detected username from DOM (fallback):', cachedUsername);
        usernameFetchInProgress = false;
        return cachedUsername;
      }

      usernameFetchInProgress = false;
      debugLog('Could not detect username');
      return null;

    } catch (error) {
      usernameFetchInProgress = false;
      debugLog('Error detecting username:', error);
      
      // Fallback to DOM method
      const domUsername = detectUsernameFromDOM();
      if (domUsername) {
        cachedUsername = domUsername;
        return cachedUsername;
      }
      
      return null;
    }
  }

  // Helper function to search for user object in nested structures
  function findUserInObject(obj, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return null;
    if (!obj || typeof obj !== 'object') return null;

    // Check if this object has a login property (username)
    if (obj.login && typeof obj.login === 'string' && obj.login.length > 0) {
      return obj.login;
    }

    // Check if this object has a username property
    if (obj.username && typeof obj.username === 'string' && obj.username.length > 0) {
      return obj.username;
    }

    // Recursively check nested objects (limit recursion depth)
    try {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value && typeof value === 'object') {
            const found = findUserInObject(value, depth + 1, maxDepth);
            if (found) return found;
          }
        }
      }
    } catch (e) {
      // Ignore errors from accessing object properties
    }

    return null;
  }

  // Fallback DOM-based detection (kept as backup)
  function detectUsernameFromDOM() {
    debugLog('Attempting DOM-based username detection (fallback)...');
    
    // Try to find from avatar button or dropdown
    const avatarButton = document.querySelector('summary[aria-label*="View profile"], summary[aria-label*="Account"], summary[aria-label*="User"]');
    if (avatarButton) {
      const parentElement = avatarButton.closest('details');
      if (parentElement) {
        const usernameLink = parentElement.querySelector('a[href^="/"]');
        if (usernameLink) {
          const href = usernameLink.getAttribute('href');
          const match = href.match(/^\/([^\/]+)/);
          if (match && match[1] !== 'settings' && match[1] !== 'logout') {
            return match[1];
          }
        }
      }
    }

    // Try profile dropdown
    const profileDropdown = document.querySelector('details-menu');
    if (profileDropdown) {
      const profileLinks = profileDropdown.querySelectorAll('a[href^="/"]');
      for (const link of profileLinks) {
        const href = link.getAttribute('href');
        const match = href.match(/^\/([^\/]+)$/);
        if (match && match[1] !== 'settings' && match[1] !== 'logout' && match[1] !== 'new') {
          return match[1];
        }
      }
    }

    return null;
  }

  // Check if username is in admin list
  function checkIfAdmin(username, adminList) {
    if (!username || !adminList || adminList.length === 0) {
      return false;
    }
    return adminList.includes(username.toLowerCase());
  }

  // Show banner notification
  function showBannerNotification(username) {
    if (document.getElementById('gh-admin-guard-banner')) {
      return; // Already shown
    }

    const banner = document.createElement('div');
    banner.id = 'gh-admin-guard-banner';
    banner.className = 'gh-admin-guard-banner';
    banner.innerHTML = `
      <div class="gh-admin-guard-content">
        <span class="gh-admin-guard-icon">⚠️</span>
        <span class="gh-admin-guard-message">
          <strong>Admin Profile Detected!</strong> You are using admin profile <strong>${username}</strong> on a PR page.
        </span>
        <button class="gh-admin-guard-dismiss" id="gh-admin-guard-dismiss">Dismiss</button>
      </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);

    // Dismiss button handler
    document.getElementById('gh-admin-guard-dismiss').addEventListener('click', () => {
      banner.remove();
      notificationShown = false;
      sendMessageToBackground({ type: 'clearBadge' });
    });

    // Scroll to top to ensure visibility
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Show modal notification
  function showModalNotification(username) {
    if (document.getElementById('gh-admin-guard-modal')) {
      return; // Already shown
    }

    const overlay = document.createElement('div');
    overlay.id = 'gh-admin-guard-modal';
    overlay.className = 'gh-admin-guard-modal';
    overlay.innerHTML = `
      <div class="gh-admin-guard-modal-content">
        <div class="gh-admin-guard-modal-header">
          <span class="gh-admin-guard-icon-large">⚠️</span>
          <h2>Admin Profile Detected</h2>
        </div>
        <div class="gh-admin-guard-modal-body">
          <p>You are using admin profile <strong>${username}</strong> on a PR page.</p>
          <p>This may not be intended. Please switch to a non-admin profile.</p>
        </div>
        <div class="gh-admin-guard-modal-footer">
          <button class="gh-admin-guard-acknowledge" id="gh-admin-guard-acknowledge">I Understand</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Acknowledge button handler
    document.getElementById('gh-admin-guard-acknowledge').addEventListener('click', () => {
      overlay.remove();
      notificationShown = false;
      sendMessageToBackground({ type: 'clearBadge' });
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        notificationShown = false;
        sendMessageToBackground({ type: 'clearBadge' });
      }
    });
  }

  // Main check function
  function checkProfile() {
    debugLog('checkProfile called');
    
    // Only check on PR pages
    if (!isPRPage()) {
      debugLog('Not a PR page, skipping check');
      return;
    }

    debugLog('PR page detected, checking profile...');

    // Get configuration
    getStorageData(['adminUsernames', 'notificationStyle', 'enabled']).then((result) => {
      debugLog('Config loaded:', {
        enabled: result.enabled,
        adminUsernames: result.adminUsernames,
        notificationStyle: result.notificationStyle,
        adminUsernamesCount: (result.adminUsernames || []).length
      });

      if (!result.enabled) {
        debugLog('Extension is disabled');
        return;
      }

      const adminList = (result.adminUsernames || []).map(u => u.toLowerCase());
      const notificationStyle = result.notificationStyle || 'banner';

      debugLog('Admin list (normalized):', adminList);

      // Detect current username (async)
      detectUsername().then(username => {
        currentUsername = username;

        debugLog('Current username detected:', currentUsername);

        if (currentUsername) {
          isAdminProfile = checkIfAdmin(currentUsername, adminList);
          debugLog('Is admin profile?', isAdminProfile, '(checked:', currentUsername.toLowerCase(), 'against:', adminList, ')');

          if (isAdminProfile && !notificationShown) {
            debugLog('Admin profile detected, showing notification...');
            notificationShown = true;
            
            // Send message to background for badge
            sendMessageToBackground({
              type: 'adminDetected',
              username: currentUsername
            });

            // Show appropriate notification
            if (notificationStyle === 'modal') {
              debugLog('Showing modal notification');
              showModalNotification(currentUsername);
            } else if (notificationStyle === 'banner') {
              debugLog('Showing banner notification');
              showBannerNotification(currentUsername);
            } else if (notificationStyle === 'browser') {
              debugLog('Browser notification will be shown by background script');
            }
          } else if (isAdminProfile && notificationShown) {
            debugLog('Admin profile already detected, notification already shown');
          } else {
            debugLog('Not an admin profile or notification already shown');
          }
        } else {
          debugLog('Could not detect current username');
        }
      }).catch(err => {
        debugLog('Error detecting username:', err);
      });
    });
  }

  // Initial check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkProfile, 1000); // Wait for GitHub UI to load
    });
  } else {
    setTimeout(checkProfile, 1000);
  }

  // Monitor for navigation changes (GitHub is a SPA)
  let lastUrl = location.href;
  
  // Watch for URL changes
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      debugLog('URL changed from', lastUrl, 'to', url);
      lastUrl = url;
      notificationShown = false; // Reset for new page
      setTimeout(checkProfile, 1000);
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });

  // Also use popstate for navigation
  window.addEventListener('popstate', () => {
    debugLog('popstate event detected');
    notificationShown = false;
    setTimeout(checkProfile, 1000);
  });

  // Use pushState/replaceState intercept
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    debugLog('pushState called');
    notificationShown = false;
    setTimeout(checkProfile, 1000);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    debugLog('replaceState called');
    notificationShown = false;
    setTimeout(checkProfile, 1000);
  };

  // Store interval IDs for cleanup
  let periodicCheckInterval = null;
  let contextCheckInterval = null;

  // Check if extension context is valid
  function isExtensionContextValid() {
    try {
      return chrome && chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  // Cleanup function
  function cleanup() {
    if (periodicCheckInterval) {
      clearInterval(periodicCheckInterval);
      periodicCheckInterval = null;
    }
    if (contextCheckInterval) {
      clearInterval(contextCheckInterval);
      contextCheckInterval = null;
    }
    if (typeof urlObserver !== 'undefined') {
      urlObserver.disconnect();
    }
    debugLog('Script cleaned up');
  }

  // Periodic check for username changes
  if (isExtensionContextValid()) {
    periodicCheckInterval = setInterval(() => {
      if (!isExtensionContextValid()) {
        cleanup();
        return;
      }
      if (isPRPage()) {
        debugLog('Periodic check running...');
        checkProfile();
      }
    }, 5000);

    // Periodic check for extension context validity
    contextCheckInterval = setInterval(() => {
      if (!isExtensionContextValid()) {
        debugLog('Extension context invalidated - stopping script');
        cleanup();
      }
    }, 1000);

    debugLog('Content script initialized');
  } else {
    debugLog('Extension context not available on initialization');
  }
})();

