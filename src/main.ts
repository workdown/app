const { app, BrowserWindow, Menu, MenuItem, ipcMain, nativeTheme } = require('electron/main');
const path = require('node:path')
const fs = require("fs")

const isMac = process.platform === 'darwin'

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Workdown",
        titleBarStyle: 'hidden',
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        trafficLightPosition: { x: 15, y: 15 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');

    const menuTemplate = [
        ...(isMac
            ? [{
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            }]
            : []),
        {
            label: "File",
            submenu: [
                {
                    label: "New File",
                    click: () => ipcMain.emit("new-file"),
                },
                {
                    label: "New Folder",
                    click: () => ipcMain.emit("new-folder"),
                },
                { type: "separator" },
                {
                    label: "Open...",
                    role: "open",
                    accelerator: 'CmdOrCtrl+O',
                },
                isMac ? { role: 'close' } : { role: 'quit' },
            ],
        },
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "pasteAndMatchStyle" },
                { role: "delete" },
                { role: "selectAll" },
                { type: "separator" },
                {
                    label: "Speech",
                    submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Workdown GitHub",
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal("https://github.com/workdown/");
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
};

ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light';
    } else {
        nativeTheme.themeSource = 'dark';
    }
    return nativeTheme.shouldUseDarkColors
});

ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});