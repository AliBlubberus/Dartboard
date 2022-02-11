const {app, BrowserWindow, ipcMain, ipcRenderer} = require("electron");
const fs = require("fs");
const http = require("http");

delete require('electron').nativeImage.createThumbnailFromPath; //For safety reasons

var mainWindow;
var gameWindow;

const serverURL = "localhost";
const serverPort = 3000;

//Load Player Data
var rawPlayerData;

function reloadPlayerData() {
    try {
        rawPlayerData = JSON.parse(fs.readFileSync("./json/players.json"));
    }
    catch (err) {
        console.error(err);
        fs.writeFileSync("./json/players.json", "[]");
        rawPlayerData = JSON.parse(fs.readFileSync("./json/players.json"));
    }
}

const dashboardTabs = ["frontend/index.htm", "frontend/players.htm", "frontend/about.htm", "frontend/supportCreator.htm"];

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
    //mainWindow.webContents.on("did-finish-load", downloadPatch(mainWindow));
    //mainWindow.setMenu(null);
});


// Sidebar Tab Transitions //
ipcMain.on("loadTab", (event, arg) => {
    mainWindow.loadFile(dashboardTabs[arg]);
    event.returnValue = null;
});


ipcMain.on("loadPlayerData", (event, arg) => {
    reloadPlayerData();
    event.returnValue = rawPlayerData;
});

ipcMain.on("loadLatestGame", (event, arg) => {
    let file;
    try {
        file = JSON.parse(fs.readFileSync("./json/latestGame.json"));
    }
    catch {
        file = null;
    }
    event.returnValue = file;
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
    for (let i = 0; i < arg.playerData.length; i++) {
        let element = arg.playerData[i];
        let index = getGlobalPlayerIndexByName(element.name);
        rawPlayerData[index].gamesPlayed++;
        rawPlayerData[index].totalScore += (arg.gameSettings.gameLength - element.remainingScore);
        rawPlayerData[index].averageScorePerGame = (rawPlayerData[index].totalScore / rawPlayerData[index].gamesPlayed);
        if (rawPlayerData[index].winstreakRecording.length >= 20) {
            rawPlayerData[index].rank = evaluatePlayerRank(rawPlayerData[index].winstreakRecording, rawPlayerData[index].rank);
            rawPlayerData[index].winstreakRecording = [];
        }

        let winstreak = rawPlayerData[index].winstreakRecording;

        if (!Array.isArray(winstreak)) winstreak = [winstreak]; //Convert to array if necessary

        if (winstreak) winstreak.splice(0, 0, arg.winner.data.name == element.name);
        else winstreak = [arg.winner.data.name == element.name];
        rawPlayerData[index].winstreakRecording = winstreak;

        let acquiredXP = calculateXPforPlayer(arg, element.name);
        //console.log("generatePlayerXpNotification(" + element.name + ", 'rank" + rawPlayerData[index].rank + "', " + rawPlayerData[index].exp + ", " + rawPlayerData[index].exp + acquiredXP + ")");
        setTimeout(function() {
            mainWindow.webContents.executeJavaScript("generatePlayerXpNotification('" + element.name + "', 'rank" + rawPlayerData[index].rank + "', " + rawPlayerData[index].exp + ", " + acquiredXP + ")", i / 2)
        }, 3000);
        rawPlayerData[index].exp += acquiredXP;
    };
    rawPlayerData[getGlobalPlayerIndexByName(arg.winner.data.name)].gamesWon++;
    gameWindow.close();
    overrideLocalPlayerData();
    fs.writeFileSync("./json/latestGame.json", JSON.stringify(arg));
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

function calculateXPforPlayer(latestGame, playerName) {
    let xp = 10;

    //calculate best shot
    let best = {"name": null, "score": 0};
    latestGame.recording.forEach((round) => {
        round.forEach((player) => {
            if (player.darts)
            player.darts.forEach((dart) => {
                if (dart.score > best.score) best = {"name": player.name, "score": dart.score};
            });
        });
    });
    if (best.name == playerName) xp += 50;

    latestGame.playerData.forEach((player) => {
       if (player.name == playerName) {
           let averageScoreBonus = 0;
           if (player.averageScore >= 30 && player.averageScore < 40) averageScoreBonus = 15;
           if (player.averageScore >= 40 && player.averageScore < 50) averageScoreBonus = 30;
           if (player.averageScore >= 50) averageScoreBonus = 60;

           let remainingScoreBonus = 0;
           if (player.remainingScore <= 30 && player.remainingScore > 20) remainingScoreBonus = 10;
           if (player.remainingScore <= 20 && player.remainingScore > 10) remainingScoreBonus = 20;
           if (player.remainingScore <= 10 && player.remainingScore > 5) remainingScoreBonus = 30;
           if (player.remainingScore <= 5) remainingScoreBonus = 50;

           xp += averageScoreBonus + remainingScoreBonus;
           return;
       } 
    });

    if (latestGame.winner.data.name == playerName) xp += 100;

    return xp;
}


//       ###########
//    ###           ###
//  ##    #########    ##   SERVER
//      ##         ##         CONNECTIVITY
//     #    #####    #
//        ##     ##
//            0

async function downloadPatch(window) {
    
    window.webContents.executeJavaScript("expandPopup();");

    let patch = fetchPatchStruct();
    patch
        .then(result => {
            console.log(result);
        })
        .catch(err => {
            window.webContents.executeJavaScript("loadingFailed('" + err + "')");
        })
        .finally(() => {
            setTimeout(() => {window.webContents.executeJavaScript("collapsePopup()")}, 3000);
        });
}

function fetchPatchStruct() {
    return new Promise((resolve, reject) => {
        let options = {
            hostname: serverURL,
            port: serverPort,
            path: "/patch.json",
            method: "GET"
        };
        let patchReq = http.request(options, res => {
            res.on("data", d => {
                resolve(d);
            });
        });
        patchReq.on("error", err => {
            reject(err);
        });
        patchReq.end();
    });
}

function testAsyncFailAfter5Secs() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {reject("damn")}, 10000);
    });
}

function testAsyncSuccessAfter5Secs() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {resolve()}, 5000);
    });
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