let profiles = [];

async function loadProfiles() {
  try {
    const result = await window.api.listProfiles();
    if (result.error) {
      showMessage(result.error, 'error');
      profiles = [];
    } else {
      profiles = result;
    }
    renderProfiles();
  } catch (error) {
    showMessage(`Failed to load profiles: ${error.message}`, 'error');
    profiles = [];
    renderProfiles();
  }
}

async function createNewProfile() {
  const input = document.getElementById('profileName');
  const name = input.value.trim();

  if (!name) {
    showMessage('Please enter a profile name', 'error');
    return;
  }

  try {
    const result = await window.api.createProfile(name);
    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage(`Profile "${name}" created successfully`, 'success');
      input.value = '';
      await loadProfiles();
    }
  } catch (error) {
    showMessage(`Failed to create profile: ${error.message}`, 'error');
  }
}

async function deleteProfile(name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  try {
    const result = await window.api.deleteProfile(name);
    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage(`Profile "${name}" deleted successfully`, 'success');
      await loadProfiles();
    }
  } catch (error) {
    showMessage(`Failed to delete profile: ${error.message}`, 'error');
  }
}

async function openProfile(name) {
  const button = event.target;
  button.disabled = true;
  button.textContent = 'Opening...';

  try {
    const result = await window.api.openProfile(name);
    if (result.error) {
      showMessage(result.error, 'error');
      button.disabled = false;
      button.textContent = 'Open';
    } else {
      showMessage(`Profile "${name}" opened successfully`, 'success');
      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Open';
      }, 2000);
    }
  } catch (error) {
    showMessage(`Failed to open profile: ${error.message}`, 'error');
    button.disabled = false;
    button.textContent = 'Open';
  }
}

function renderProfiles() {
  const container = document.getElementById('profilesList');
  
  if (profiles.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No profiles yet. Create one to get started!</p></div>';
    return;
  }

  container.innerHTML = profiles.map(profile => `
    <div class="profile-card">
      <div class="profile-name">${escapeHtml(profile.name)}</div>
      <div class="profile-actions">
        <button class="btn-secondary" onclick="openProfile('${escapeHtml(profile.name)}')">Open</button>
        <button class="btn-danger" onclick="deleteProfile('${escapeHtml(profile.name)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  
  setTimeout(() => {
    messageDiv.className = 'message';
  }, 4000);
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    createNewProfile();
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadProfiles);
