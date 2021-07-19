const {app, BrowserWindow, ipcMain} = require("electron");
const fs = require("fs");

var mainWindow;
var gameWindow;

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
});

ipcMain.on("loadPlayerData", (event, arg) => {
    let file = fs.readFileSync("./json/players.json");
    event.returnValue = JSON.parse(file);
});

ipcMain.on("gameRunning", (event, arg) => {
    event.returnValue = gameWindow != null;
})

ipcMain.on("startNewGame", (event, arg) => {
    let isolatedPlayerData = isolatePlayerData(arg.selectedPlayers);
    let gameSettings = {
        "gameLength": arg.gameLength,
        "gameEntry": arg.gameEntry,
        "gameEnding": arg.gameEnding
    };
    gameWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    gameWindow.loadFile("frontend/game.htm");
    gameWindow.webContents.on('did-finish-load', () => {gameWindow.webContents.send("initializeGame", {"playerData": isolatedPlayerData, "settings": gameSettings})});
    mainWindow.webContents.executeJavaScript("gameRunning = true;");
    gameWindow.on("close", function() {mainWindow.webContents.executeJavaScript("gameRunning = false;")});
});

function isolatePlayerData(elements) {
    let isolatedData = [];
    let data = JSON.parse(fs.readFileSync("./json/players.json"));

    elements.forEach(index => {
        isolatedData[isolatedData.length] = data[index];
    });
    return isolatedData;
}