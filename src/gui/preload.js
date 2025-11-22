import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  listProfiles: () => ipcRenderer.invoke('list-profiles'),
  createProfile: (name) => ipcRenderer.invoke('create-profile', name),
  deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),
  openProfile: (name) => ipcRenderer.invoke('open-profile', name),
  closeProfile: (name) => ipcRenderer.invoke('close-profile', name),
});
