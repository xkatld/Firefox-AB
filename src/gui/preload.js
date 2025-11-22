import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  listProfiles: () => ipcRenderer.invoke('list-profiles'),
  createProfile: (name, browserType = 'chromium') => ipcRenderer.invoke('create-profile', name, browserType),
  deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),
  openProfile: (name, browserType = 'chromium') => ipcRenderer.invoke('open-profile', name, browserType),
  closeProfile: (name) => ipcRenderer.invoke('close-profile', name),
});
