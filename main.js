const {app, BrowserWindow, ipcMain} = require("electron");
const fs = require("fs");

var mainWindow;

app.whenReady().then(() => {

    //create a window
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    //load a webpage
    mainWindow.loadFile("frontend/game.htm");
    //mainWindow.setMenu(null);
})

ipcMain.on("loadPlayerData", (event, arg) => {
    var file = fs.readFileSync("./json/players.json");
    event.returnValue = JSON.parse(file);
});