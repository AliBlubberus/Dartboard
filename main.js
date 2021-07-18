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

    //load dashboard
    mainWindow.loadFile("frontend/index.htm");
    //mainWindow.setMenu(null);
})

ipcMain.on("loadPlayerData", (event, arg) => {
    let file = fs.readFileSync("./json/players.json");
    event.returnValue = JSON.parse(file);
});

ipcMain.on("startNewGame", (event, arg) => {
    let isolatedPlayerData = isolatePlayerData(arg.selectedPlayers);
    let gameSettings = {
        "length": arg.gameLength,
        "gameEntry": arg.gameEntry,
        "gameEnding": arg.gameEnding
    };
    mainWindow.loadFile("frontend/game.htm");
    mainWindow.webContents.once('did-finish-load', () => {mainWindow.webContents.send("initializeGame", {"playerData": isolatedPlayerData, "settings": gameSettings})});
});

function isolatePlayerData(elements) {
    let isolatedData = [];
    let data = JSON.parse(fs.readFileSync("./json/players.json"));

    elements.forEach(index => {
        isolatedData[isolatedData.length] = data[index];
    });
    return isolatedData;
}