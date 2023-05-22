const { app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const {loadFiles, getMods, minecraftLookup, relaunchWithWeave} = require("./js/launch-util");
const {fadeWindowIn, fadeWindowOut} = require("./js/window-util");

ipcMain.on("toMain", (event, ...args) => {
    if (args.includes('getModList')) {
        if (getMods.length < 0) loadFiles()

        win.webContents.send("fromMain", ['getModList', getMods()])
    } else if (args.includes('closeWindow')) {
        fadeWindowOut(BrowserWindow.fromWebContents(event.sender), 0.1, 10, true)
    } else if (args.includes('minimizeWindow')) {
        fadeWindowOut(BrowserWindow.fromWebContents(event.sender), 0.1, 10)
    }
})

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        fullscreenable: false,
        maximizable: false,
        resizable: false,
        transparent: true,
        show: false,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    })

    win.once('ready-to-show', () => {
        win.show()
    })

    win.setIcon('public/icon.png')
    win.loadFile('public/index.html')

    return win
}

let win
app.whenReady().then(() => {
    loadFiles()
    win = createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            win = createWindow()
            win.openDevTools()
        }
    })

    win.on('focus', () => {
        fadeWindowIn(win, 0.1, 10)
    })

    minecraftLookup().then((minecraft) => {
        relaunchWithWeave(minecraft)
        let mcType

        if (minecraft.cmd.includes('lunar'))
            mcType = 'Lunar Client'
        else if (minecraft.cmd.includes('minecraftforge'))
            mcType = 'Minecraft Forge'

        win.webContents.send('fromMain', ['weaveState', `Weave is currently running in ${mcType}`])
    }).catch((err) => {
        console.log('Error:', err.stack || err)
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

