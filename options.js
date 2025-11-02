// Options page script for GitHub Admin Profile Guard

document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username-input');
  const addUsernameBtn = document.getElementById('add-username-btn');
  const usernameList = document.getElementById('username-list');
  const enableToggle = document.getElementById('enable-toggle');
  const notificationRadios = document.querySelectorAll('input[name="notification-style"]');
  const statusMessage = document.getElementById('status-message');

  let adminUsernames = [];
  let enabled = true;
  let notificationStyle = 'banner';

  // Load saved configuration
  chrome.storage.sync.get(['adminUsernames', 'notificationStyle', 'enabled'], (result) => {
    adminUsernames = result.adminUsernames || [];
    enabled = result.enabled !== undefined ? result.enabled : true;
    notificationStyle = result.notificationStyle || 'banner';

    updateUI();
  });

  // Update UI based on current state
  function updateUI() {
    // Update toggle
    if (enabled) {
      enableToggle.classList.add('active');
    } else {
      enableToggle.classList.remove('active');
    }

    // Update username list
    if (adminUsernames.length === 0) {
      usernameList.innerHTML = '<li class="empty-state">No admin usernames added yet</li>';
    } else {
      usernameList.innerHTML = adminUsernames.map((username, index) => `
        <li class="username-item">
          <span class="username-text">@${username}</span>
          <button class="remove-btn" data-index="${index}">Remove</button>
        </li>
      `).join('');

      // Add remove button handlers
      usernameList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.getAttribute('data-index'));
          removeUsername(index);
        });
      });
    }

    // Update notification style selection
    notificationRadios.forEach(radio => {
      if (radio.value === notificationStyle) {
        radio.checked = true;
        radio.closest('.radio-option').classList.add('selected');
      } else {
        radio.closest('.radio-option').classList.remove('selected');
      }
    });
  }

  // Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    setTimeout(() => {
      statusMessage.className = 'status-message';
    }, 3000);
  }

  // Add username
  function addUsername() {
    const username = usernameInput.value.trim().toLowerCase();
    
    if (!username) {
      showStatus('Please enter a username', 'error');
      return;
    }

    // Remove @ if present
    const cleanUsername = username.replace(/^@/, '');

    if (adminUsernames.includes(cleanUsername)) {
      showStatus('Username already in the list', 'error');
      usernameInput.value = '';
      return;
    }

    adminUsernames.push(cleanUsername);
    saveConfig();
    usernameInput.value = '';
    showStatus('Username added successfully', 'success');
    updateUI();
  }

  // Remove username
  function removeUsername(index) {
    adminUsernames.splice(index, 1);
    saveConfig();
    showStatus('Username removed', 'success');
    updateUI();
  }

  // Save configuration
  function saveConfig() {
    chrome.storage.sync.set({
      adminUsernames: adminUsernames,
      notificationStyle: notificationStyle,
      enabled: enabled
    });
  }

  // Event listeners
  addUsernameBtn.addEventListener('click', addUsername);

  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addUsername();
    }
  });

  enableToggle.addEventListener('click', () => {
    enabled = !enabled;
    saveConfig();
    updateUI();
    showStatus(enabled ? 'Extension enabled' : 'Extension disabled', 'success');
  });

  notificationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        notificationStyle = radio.value;
        saveConfig();
        updateUI();
        showStatus('Notification style updated', 'success');
      }
    });

    radio.addEventListener('click', () => {
      notificationRadios.forEach(r => {
        r.closest('.radio-option').classList.remove('selected');
      });
      if (radio.checked) {
        radio.closest('.radio-option').classList.add('selected');
      }
    });
  });
});

