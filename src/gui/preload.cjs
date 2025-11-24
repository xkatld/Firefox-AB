const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listProfiles: () => ipcRenderer.invoke('list-profiles'),
  createProfile: (name, options) => ipcRenderer.invoke('create-profile', name, options),
  deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),
  openProfile: (name) => ipcRenderer.invoke('open-profile', name),
  closeProfile: (name) => ipcRenderer.invoke('close-profile', name),
  getRunningProfiles: () => ipcRenderer.invoke('get-running-profiles'),
  updateProfile: (name, updates) => ipcRenderer.invoke('update-profile', name, updates),
  renameProfile: (oldName, newName) => ipcRenderer.invoke('rename-profile', oldName, newName),
  regenerateFingerprint: (name) => ipcRenderer.invoke('regenerate-fingerprint', name),
  createGroup: (name, color) => ipcRenderer.invoke('create-group', name, color),
  listGroups: () => ipcRenderer.invoke('list-groups'),
  updateGroup: (id, updates) => ipcRenderer.invoke('update-group', id, updates),
  deleteGroup: (id) => ipcRenderer.invoke('delete-group', id),
  exportProfile: (name) => ipcRenderer.invoke('export-profile', name),
  importProfile: (name, config) => ipcRenderer.invoke('import-profile', name, config),
  batchDeleteProfiles: (names) => ipcRenderer.invoke('batch-delete-profiles', names),
  checkBrowsers: () => ipcRenderer.invoke('check-browsers'),
});

console.log('✓ Preload script loaded successfully');
