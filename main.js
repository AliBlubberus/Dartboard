const {app, BrowserWindow, ipcMain, ipcRenderer} = require("electron");
const fs = require("fs");

var mainWindow;
var gameWindow;

var rawPlayerData = JSON.parse(fs.readFileSync("./json/players.json"));

const dashboardTabs = ["frontend/index.htm", "frontend/players.htm"];

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

// Sidebar Tab Transitions //
ipcMain.on("loadTab", (event, arg) => {
    mainWindow.loadFile(dashboardTabs[arg]);
    event.returnValue = null;
});


ipcMain.on("loadPlayerData", (event, arg) => {
    event.returnValue = rawPlayerData;
});

ipcMain.on("loadLatestGame", (event, arg) => {
    event.returnValue = JSON.parse(fs.readFileSync("./json/latestGame.json"));
});

ipcMain.on("deleteLatestGame", (event, arg) => {
    fs.writeFileSync("./json/latestGame.json", "{}");
    event.returnValue = null;
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
    event.returnValue = null;
});

ipcMain.on("handleFinishedGame", (event, arg) => {
    arg.playerData.forEach((element) => {
        let index = getGlobalPlayerIndexByName(element.name);
        rawPlayerData[index].gamesPlayed++;
        rawPlayerData[index].totalScore += (arg.gameSettings.gameLength - element.remainingScore);
        rawPlayerData[index].averageScorePerGame = (rawPlayerData[index].totalScore / rawPlayerData[index].gamesPlayed);
        if (rawPlayerData[index].winstreakRecording.length >= 20) {
            rawPlayerData[index].rank = evaluatePlayerRank(rawPlayerData[index].winstreakRecording, rawPlayerData[index].rank);
            rawPlayerData[index].winstreakRecording = [];
        }
        rawPlayerData[index].winstreakRecording.splice(0, 0, arg.winner.data.name == element.name);
    });
    rawPlayerData[getGlobalPlayerIndexByName(arg.winner.data.name)].gamesWon++;
    gameWindow.close();
    overrideLocalPlayerData();
    fs.writeFileSync("./json/latestGame.json", JSON.stringify(arg));
    mainWindow.webContents.executeJavaScript("updateUI();");
    event.returnValue = null;
});

ipcMain.on("overridePlayerData", (event, arg) => {
    overrideLocalPlayerData(arg);
    event.returnValue = null;
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

function evaluatePlayerRank(winstreakRecording, currentRank) {
    let timesWon = 0;
    winstreakRecording.forEach((element) => {
        if (element === true) timesWon++;
    });
    if (timesWon < 5 && currentRank > 0) return currentRank - 1;
    if (timesWon > 15 && currentRank < 5) return currentRank + 1;
    return currentRank;
}

//THESE FUNCTIONS OVERRIDE FILES
//USE WITH CAUTION

function overrideLocalPlayerData(data) {
    let string;

    if (!data)  string = JSON.stringify(rawPlayerData);
    else { 
        string = JSON.stringify(data);
        rawPlayerData = data;
    }

    fs.writeFileSync("./json/players.json", string);
}