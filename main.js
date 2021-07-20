const {app, BrowserWindow, ipcMain, ipcRenderer} = require("electron");
const fs = require("fs");

var mainWindow;
var gameWindow;

var rawPlayerData = JSON.parse(fs.readFileSync("./json/players.json"));

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
    mainWindow.loadFile("frontend/players.htm");
    //mainWindow.setMenu(null);
});

ipcMain.on("loadPlayerData", (event, arg) => {
    event.returnValue = rawPlayerData;
});

ipcMain.on("loadLatestGame", (event, arg) => {
    event.returnValue = JSON.parse(fs.readFileSync("./json/latestGame.json"));
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

ipcMain.on("handleFinishedGame", (event, arg) => {
    arg.playerData.forEach((element) => {
        let index = getGlobalPlayerIndexByName(element.name);
        rawPlayerData[index].gamesPlayed++;
        rawPlayerData[index].totalScore += (arg.gameSettings.gameLength - element.remainingScore);
        rawPlayerData[index].averageScorePerGame = (rawPlayerData[index].totalScore / rawPlayerData[index].gamesPlayed);
    });
    rawPlayerData[getGlobalPlayerIndexByName(arg.winner.data.name)].gamesWon++;
    gameWindow.close();
    overrideLocalPlayerData();
    fs.writeFileSync("./json/latestGame.json", JSON.stringify(arg));
});

function getGlobalPlayerIndexByName(name) {
    for (let i = 0; i < rawPlayerData.length; i++) {
        if (rawPlayerData[i].name == name) return i;
    }
    console.log("No player matching '" + name + "'.");
}

function isolatePlayerData(elements) {
    let isolatedData = [];
    let data = JSON.parse(fs.readFileSync("./json/players.json"));

    elements.forEach(index => {
        isolatedData[isolatedData.length] = data[index];
    });
    return isolatedData;
}


//THESE FUNCTIONS OVERRIDE FILES
//USE WITH CAUTION

function overrideLocalPlayerData() {
    let string = JSON.stringify(rawPlayerData);
    fs.writeFileSync("./json/players.json", string);
}