const {
    app,
    BrowserWindow,
    Menu,
    Notification,
    dialog,
    ipcMain,
    nativeTheme,
} = require('electron/main');
const path = require('node:path')
const fs = require("fs")

const isMac = process.platform === 'darwin'

let win;
let openedFilePath;

const createWindow = () => {
    win = new BrowserWindow({
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
                    accelerator: 'CmdOrCtrl+N',
                },
                {
                    label: "New Folder",
                    click: () => ipcMain.emit("new-folder"),
                    accelerator: 'CmdOrCtrl+Shift+N',
                },
                { type: "separator" },
                {
                    label: "Open...",
                    click: () => ipcMain.emit("open-document-triggered"),
                    accelerator: 'CmdOrCtrl+O',
                },
                {
                    label: "Open Recent",
                    role: "recentdocuments",
                    submenu: [
                        {
                            label: "Clear Recent",
                            role: "clearrecentdocuments",
                    },
                    ],
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

const handleError = () => {
    new Notification({
        title: "Error",
        body: "Something went wrong.",
    }).show();
};

const openFile = (filePath) => {
    fs.readFile(filePath, "utf8", (error, content) => {
        if (error) {
            handleError();
        } else {
            app.addRecentDocument(filePath);
            openedFilePath = filePath;
            win.webContents.send("document-opened", { filePath, content });
        }
    });
};

app.on("open-file", (_, filePath) => {
    openFile(filePath);
});

ipcMain.on("open-document-triggered", () => {
    dialog
    .showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "text files", extensions: ["md", "markdown", "txt"] }],
    })
    .then(({ filePaths }) => {
        const filePath = filePaths[0];

        openFile(filePath);
    });
});

ipcMain.on("create-document-triggered", () => {
    dialog
    .showSaveDialog(win, {
        filters: [{ name: "text files", extensions: ["md", "markdown", "txt"] }],
    })
    .then(({ filePath }) => {
        fs.writeFile(filePath, "", (error) => {
            if (error) {
                handleError();
            } else {
                app.addRecentDocument(filePath);
                openedFilePath = filePath;
                win.webContents.send("document-created", filePath);
            }
        });
    });
});

ipcMain.on("file-content-updated", (_, textareaContent) => {
    fs.writeFile(openedFilePath, textareaContent, (error) => {
        if (error) {
            handleError();
        }
    });
});