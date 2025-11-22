let profiles = [];

console.log('========== 渲染进程已启动 ==========');
console.log('检查 window.api...');
console.log('window.api 可用:', typeof window.api !== 'undefined');

if (typeof window.api !== 'undefined') {
  console.log('✓ API 已加载');
  console.log('可用方法:', Object.keys(window.api));
} else {
  console.error('✗ API 加载失败！window.api is undefined');
  console.error('window 对象:', typeof window);
  console.error('contextBridge 可用:', typeof window.api);
}

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
    showMessage(`加载配置失败: ${error.message}`, 'error');
    profiles = [];
    renderProfiles();
  }
}

async function createNewProfile() {
  const input = document.getElementById('profileName');
  const browserSelect = document.getElementById('browserType');
  const name = input.value.trim();
  const browserType = browserSelect ? browserSelect.value : 'chromium';

  if (!name) {
    showMessage('请输入配置名称', 'error');
    return;
  }

  try {
    const result = await window.api.createProfile(name, browserType);
    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage(`配置 "${name}" (${browserType === 'firefox' ? '火狐' : '谷歌'}) 创建成功`, 'success');
      input.value = '';
      await loadProfiles();
    }
  } catch (error) {
    showMessage(`创建配置失败: ${error.message}`, 'error');
  }
}

async function deleteProfile(name) {
  if (!confirm(`确定要删除配置 "${name}" 吗？`)) {
    return;
  }

  try {
    const result = await window.api.deleteProfile(name);
    if (result.error) {
      showMessage(result.error, 'error');
    } else {
      showMessage(`配置 "${name}" 删除成功`, 'success');
      await loadProfiles();
    }
  } catch (error) {
    showMessage(`删除配置失败: ${error.message}`, 'error');
  }
}

async function openProfile(name, browserType = 'chromium') {
  const button = event.target;
  button.disabled = true;
  button.textContent = '打开中...';

  try {
    const result = await window.api.openProfile(name, browserType);
    if (result.error) {
      showMessage(result.error, 'error');
      button.disabled = false;
      button.textContent = '打开';
    } else {
      showMessage(`配置 "${name}" 打开成功`, 'success');
      setTimeout(() => {
        button.disabled = false;
        button.textContent = '打开';
      }, 2000);
    }
  } catch (error) {
    showMessage(`打开配置失败: ${error.message}`, 'error');
    button.disabled = false;
    button.textContent = '打开';
  }
}

function renderProfiles() {
  const container = document.getElementById('profilesList');
  
  if (profiles.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>暂无配置，创建一个开始使用吧</p></div>';
    return;
  }

  container.innerHTML = profiles.map(profile => {
    const browserLabel = profile.browserType === 'firefox' ? '🦊 火狐' : '🔵 谷歌';
    return `
    <div class="profile-card">
      <div class="profile-name">${escapeHtml(profile.name)}</div>
      <div class="profile-browser">${browserLabel}</div>
      <div class="profile-actions">
        <button class="btn-secondary" onclick="openProfile('${escapeHtml(profile.name)}', '${profile.browserType}')">打开</button>
        <button class="btn-danger" onclick="deleteProfile('${escapeHtml(profile.name)}')">删除</button>
      </div>
    </div>
  `;
  }).join('');
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
