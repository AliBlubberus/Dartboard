const { ipcRenderer, Debugger, ipcMain, desktopCapturer } = require("electron");

const diagramSVG = document.getElementById("gameSummaryDiagram");
const ns = "http://www.w3.org/2000/svg";

const latestGame = ipcRenderer.sendSync("loadLatestGame");

window.onload = generateLastGameCard();

const playerData = ipcRenderer.sendSync("loadPlayerData");

const playerSelectList = document.getElementById("playerSelectList");
const totalScoreListContainer = document.getElementById("totalScoreList");
const averageScoreListContainer = document.getElementById("averageScoreList");

var gameRunning = false;

playerData.forEach(element => {
    generatePlayerListing(element);
    generateAverageScoreListing(element);
    generateTotalScoreListing(element);
});

function generatePlayerListing(object) {
    let scrollItem = document.createElement("div");
    scrollItem.setAttribute("class", "playerScrollItem");
    playerSelectList.appendChild(scrollItem);

    let playerItem = document.createElement("div");
    playerItem.setAttribute("class", "playerSelectItem");
    scrollItem.appendChild(playerItem);

    let pictureContainer = document.createElement("div");
    pictureContainer.setAttribute("class", "playerSelectPicContainer");
    playerItem.appendChild(pictureContainer);

    let picture = document.createElement("div");
    picture.setAttribute("class", "playerSelectPic rank" + object.rank);
    pictureContainer.appendChild(picture);

    let nameContainer = document.createElement("div");
    nameContainer.setAttribute("class", "playerSelectNameContainer");
    playerItem.appendChild(nameContainer);

    let nameText = document.createElement("h3");
    nameContainer.appendChild(nameText);
    nameText.textContent = object.name;
}

function generateTotalScoreListing(object) {
    let entry = document.createElement("div");
    entry.setAttribute("class", "averageScoreEntry");
    totalScoreListContainer.appendChild(entry);

    let nameContainer = document.createElement("div");
    nameContainer.setAttribute("class", "averageScoreName");
    entry.appendChild(nameContainer);

    let playerName = document.createElement("h3");
    playerName.textContent = object.name;
    nameContainer.appendChild(playerName);


    let scoreContainer = document.createElement("div");
    scoreContainer.setAttribute("class", "averageScoreValue");
    entry.appendChild(scoreContainer);

    let scoreText = document.createElement("h3");
    scoreText.textContent = object.totalScore;
    scoreContainer.appendChild(scoreText);
}

function generateAverageScoreListing(object) {
    let entry = document.createElement("div");
    entry.setAttribute("class", "averageScoreEntry");
    averageScoreListContainer.appendChild(entry);

    let nameContainer = document.createElement("div");
    nameContainer.setAttribute("class", "averageScoreName");
    entry.appendChild(nameContainer);

    let playerName = document.createElement("h3");
    playerName.textContent = object.name;
    nameContainer.appendChild(playerName);


    let scoreContainer = document.createElement("div");
    scoreContainer.setAttribute("class", "averageScoreValue");
    entry.appendChild(scoreContainer);

    let scoreText = document.createElement("h3");
    scoreText.textContent = roundNumber(object.averageScorePerGame);
    scoreContainer.appendChild(scoreText);
}

// player listing logic //

var playerListings = playerSelectList.children;
var playerListingReferences = [];
for (let i = 0; i < playerListings.length; i++) {
    playerListingReferences[i] = new playerListing(playerListings[i], false);
    playerListings[i].setAttribute("onclick", "togglePlayerListing(" + i + ")");
}

console.log(playerListingReferences);

function togglePlayerListing(index) {
    playerListingReferences[index].toggle();
    exportSelectedPlayers();
}

function exportSelectedPlayers() {
    var output = [];
    for (let i = 0; i < playerListingReferences.length; i++) {
        if (playerListingReferences[i].active) output[output.length] = i;
    }
    console.log("Selected Players Exported: " + output);
    return output;
}


// new game logic //

// start game button //

const startGameButton = document.getElementById("startGameButton");
var startGameButtonInteractable = false;

function startGame() {
    if (startGameButtonInteractable && !gameRunning && exportSelectedPlayers().length > 0) {
        settingsObject = {};
        settingsObject.gameLength = gameLengthIntervals[gameLength];
        settingsObject.gameEntry = gameEntry;
        settingsObject.gameEnding = gameEnding;
        
        settingsObject.selectedPlayers = exportSelectedPlayers();

        ipcRenderer.send("startNewGame", settingsObject);
    }
}

function updateStartGameButtonVisual() {
    if (startGameButtonInteractable === true) {
        startGameButton.style.boxShadow = "inset 0 -20px 20px -21px var(--light-blue)";
        startGameButton.style.borderBottomColor = "var(--light-blue)";
    }
    else {
        startGameButton.style.boxShadow = "inset 0 -20px 20px -21px var(--black)";
        startGameButton.style.borderBottomColor = "var(--black)";
    }
}

function checkIfGameStartable() {
    if (gameLength != null && gameEntry != null && gameEnding != null) startGameButtonInteractable = true;
    else startGameButtonInteractable = false;

    updateStartGameButtonVisual();
}

updateStartGameButtonVisual();

// game length buttons //

const gameLengthButtons = document.getElementById("gameLengthButtonContainer").children;
var gameLength = null;

for (let i = 0; i < gameLengthButtons.length; i++) {
    gameLengthButtons[i].setAttribute("onclick", "setGameLength(" + i + ")");
}


const gameLengthIntervals = [101, 201, 301, 401, 501, 601, 701, 801, 901];

function setGameLength(index) {
    gameLength = index;

    updateGameLengthButtons(index);

    checkIfGameStartable();

    console.log("Game length set to " + gameLengthIntervals[index] + ".");
}

function updateGameLengthButtons(index) {
    for (let i = 0; i < gameLengthButtons.length; i++) {
        if (i == index) {
            gameLengthButtons[i].style.boxShadow = "inset 0 -20px 20px -21px var(--white)";
            gameLengthButtons[i].style.borderBottomColor = "var(--white)";
        }
        else {
            gameLengthButtons[i].style.boxShadow = "inset 0 -20px 20px -21px var(--black)";
            gameLengthButtons[i].style.borderBottomColor = "var(--black)";
        }
    }
}

updateGameLengthButtons();


// game entry //

const gameEntryButtons = document.getElementById("gameEntryButtonContainer").children;
var gameEntry = null;

for (let i = 0; i < gameEntryButtons.length; i++) {
    gameEntryButtons[i].setAttribute("onclick", "setGameEntry(" + i + ")");
}

function setGameEntry(index) {
    gameEntry = index;

    updateGameEntryButtons(index);

    checkIfGameStartable();

    console.log("Game entry set to " + index);
}

function updateGameEntryButtons(index) {
    for (let i = 0; i < gameEntryButtons.length; i++) {
        if (i == index) {
            gameEntryButtons[i].style.boxShadow = "inset 0 -20px 20px -21px var(--white)";
            gameEntryButtons[i].style.borderBottomColor = "var(--white)";
        }
        else {
            gameEntryButtons[i].style.boxShadow = "inset 0 -20px 20px -21px var(--black)";
            gameEntryButtons[i].style.borderBottomColor = "var(--black)";
        }
    }
}

updateGameEntryButtons();


// game ending //

const gameEndingButtons = document.getElementById("gameEndingButtonContainer").children;
var gameEnding = null;

for (let i = 0; i < gameEndingButtons.length; i++) {
    gameEndingButtons[i].setAttribute("onclick", "setGameEnding(" + i + ")");
}

function setGameEnding(index) {
    gameEnding = index;

    updateGameEndingButtons(index);

    checkIfGameStartable();

    console.log("Game ending set to " + index);
}

function updateGameEndingButtons(index) {
    for (let i = 0; i < gameEndingButtons.length; i++) {
        if (i == index) {
            gameEndingButtons[i].style.boxShadow = "inset 0 -20px 20px -21px var(--white)";
            gameEndingButtons[i].style.borderBottomColor = "var(--white)";
        }
        else {
            gameEndingButtons[i].style.boxShadow = "inset 0 -20px 20px -21px var(--black)";
            gameEndingButtons[i].style.borderBottomColor = "var(--black)";
        }
    }
}

updateGameEndingButtons();

// Game Summary Diagram

function generateLastGameCard() {
    try {
        console.log("Generating Graph...");
        let top4list = getTop4();

        let players = [];
        top4list.forEach((element) => {
            players[players.length] = getLocalIndexByPlayerName(element.name, latestGame.playerData);
        });
        for (let i = 0; i < clamp(latestGame.playerData.length, 0, 4); i++) {
            let newLayer = document.createElementNS(ns, "polyline");

            newLayer.setAttribute("class", "diagramLayer" + (i + 1));
            newLayer.setAttribute("style", "stroke-width:2");
            newLayer.setAttribute("points", generatePointDefinition(players[i]));

            diagramSVG.appendChild(newLayer);
        };

        let top4ScoreboardItems = [];
        for (let j = 0; j < clamp(latestGame.playerData.length, 0, 4); j++) {
            top4ScoreboardItems[j] = [];
            top4ScoreboardItems[j][0] = document.getElementById("top" + (j + 1) + "Name");
            top4ScoreboardItems[j][1] = document.getElementById("top" + (j + 1) + "Avrg");
            top4ScoreboardItems[j][2] = document.getElementById("top" + (j + 1) + "Darts");
        }

        for (let k = 0; k < clamp(latestGame.playerData.length, 0, 4); k++) {
            top4ScoreboardItems[k][0].textContent = top4list[k].name;
            top4ScoreboardItems[k][1].textContent = "Average Score: " + top4list[k].averageScore;
            top4ScoreboardItems[k][2].textContent = "Darts: " + top4list[k].totalDarts;
        }

        for (let l = 1; l <= 4; l++) {
            if (l > latestGame.playerData.length) document.getElementById("scoreboardPlayerContainer" + l).remove();
        }
    }
    catch { //show placeholder if no recording for the latest game exists
        console.log("No recording found, rendering placeholder");
        let content = document.getElementById("lastGame").getElementsByClassName("cardContent")[0];
        Array.from(content.children).forEach((element) => {
            element.remove();
        });
        content.style.display = "grid";
        content.style.placeItems = "center";

        let recordingMissingText = document.createElement("h2");
        recordingMissingText.textContent = "No Recording Found...";
        content.appendChild(recordingMissingText);
    }
}

function generatePointDefinition(layer) {
    let string = "";
    let yValues = generateProcedualRecordingArray(layer);

    for (let i = 0 ; i <= latestGame.recording.length ; i++) {
        let x = 500 / latestGame.recording.length * i;
        let y = 200 - (yValues[i] * 200 / latestGame.gameSettings.gameLength);

        string += " " + x.toString() + "," + roundNumber(y).toString();
    }

    return string;
}

function generateProcedualRecordingArray(player) {
    let array = [];
    array[0] = latestGame.gameSettings.gameLength;
    for (let i = 1; i <= latestGame.recording.length; i++) {
        array[i] = array[i - 1] - generateDartSum(latestGame.recording[i - 1][player]);
    }
    return array;
}

function generateDartSum(obj) {
    if (obj && obj.darts) {
        let score = 0;
        obj.darts.forEach(element => {
            score += element.score;
        });
        return score;
    }
    return 0;
}

function roundNumber(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}


function getTop4() {
    let top4 = [];

    for (let i = 0; i < 4; i++) {
        let match = {"remainingScore": latestGame.gameSettings.gameLength + 1};
        latestGame.playerData.forEach((player) => {
            if (player.remainingScore < match.remainingScore && !matchAgainstBlacklist(player, top4)) {
                match = player;
            }
        });
        top4[top4.length] = match;
    }

    return top4;
}

function matchAgainstBlacklist(item, list) {
    let out = false;

    list.forEach((element) => {
        if (element == item) out = true;
    });

    return out;
}

function getLocalIndexByPlayerName(name, list) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].name == name) return i;
    }
    console.log("No such element found in list!");
}

// Aim Card Logic

const aimCardPlayerName = document.getElementById("aimCardPlayerName");
var currentAimCardPlayer = 0;

refreshAimCard(currentAimCardPlayer);
refreshAimCard(currentAimCardPlayer);
aimCardPlayerName.textContent = latestGame.playerData[currentAimCardPlayer].name;

function moveCurrentAimPlayer(dir) {
    //Move
    if (dir) currentAimCardPlayer++;
    else currentAimCardPlayer--;

    //Wrap Around
    if (currentAimCardPlayer < 0) currentAimCardPlayer = latestGame.playerData.length - 1;
    if (currentAimCardPlayer >= latestGame.playerData.length) currentAimCardPlayer = 0

    //UI
    refreshAimCard(currentAimCardPlayer);
    aimCardPlayerName.textContent = latestGame.playerData[currentAimCardPlayer].name;
}

function refreshAimCard(player) {
    try {
        let dartFields = [];

        for (let r = 0; r < latestGame.recording.length; r++) {
            for (let d = 0; d < 3; d++) {
                if (latestGame.recording[r][player] && latestGame.recording[r][player].darts && latestGame.recording[r][player].darts[d]) {
                    let dart = latestGame.recording[r][player].darts[d];
                    addDartToArray(dart);
                }
            }
        }

        function addDartToArray(item) {
            if (item && item.notation) {
                let existing = false;
                dartFields.forEach((element) => {
                    if (element.notation == item.notation) existing = true;
                });

                if (!existing) {
                    dartFields[dartFields.length] = {
                        "notation": item.notation,
                        "amount": 1
                    }
                }
                else {
                    let index;
                    for (let i = 0; i < dartFields.length; i++) {
                        if (item.notation == dartFields[i].notation) index = i;
                    }
                    dartFields[index].amount++;
                }
            }
        }

        console.log(dartFields);

        let normalizedDartFields = normalizeDartArray(dartFields);
        normalizedDartFields.forEach((element) => {
            if (element.notation) {
                let DOMelement = document.getElementById(element.notation);
                if (DOMelement) DOMelement.style.opacity = element.amount;
            }
        });

        function normalizeDartArray(array) {
            let factor = 0;
            array.forEach((element) => {
                if (element.amount > factor) factor = element.amount;
            });

            Array.from(document.getElementsByClassName("dartboardVisual")[0].children).forEach((element) => {
                element.style.opacity = 0;
            });

            let out = [];
            for (let i = 0; i < array.length; i++) {
                out[i] = {};
                out[i].notation = array[i].notation;
                out[i].amount = array[i].amount / factor * 0.85;
            }
            return out;
        }
    }
    catch (err) { //Show Placeholder
        console.log("No recording found, rendering placeholder");
        console.error(err)
        let content = document.getElementById("aim").getElementsByClassName("cardContent")[0];
        Array.from(content.children).forEach((element) => {
            element.remove();
        });
        content.style.display = "grid";
        content.style.placeItems = "center";

        let recordingMissingText = document.createElement("h2");
        recordingMissingText.textContent = "No Recording Found...";
        content.appendChild(recordingMissingText);
    }
}


// Player Notifications
const notificationContainer = document.getElementById("notificationLayout");

function generatePlayerXpNotification(playerName, spriteID, baseXp, gainedXp, animationDelay) {
    let card = document.createElement("div");
    card.setAttribute("class", "notificationCard");
    notificationContainer.appendChild(card);
    card.style.animationDelay = animationDelay + "s";

    let pic = document.createElement("div");
    pic.setAttribute("class", "notificationPlayerPic " + spriteID);
    card.appendChild(pic);

    let contents = document.createElement("div");
    contents.setAttribute("class", "notificationContents");
    card.appendChild(contents);


    let titleContainer = document.createElement("div");
    titleContainer.setAttribute("class", "notificationTitleContainer");
    contents.appendChild(titleContainer);

    let playerTitle = document.createElement("h2");
    playerTitle.textContent = playerName;
    titleContainer.appendChild(playerTitle);

    let subtitle = document.createElement("h3");
    subtitle.textContent = "has gained xp";
    titleContainer.appendChild(subtitle);


    let progressDisplay = document.createElement("div");
    progressDisplay.setAttribute("class", "notificationProgressContainer");
    contents.appendChild(progressDisplay);

    let base = document.createElement("p");
    base.setAttribute("class", "xpNotificationBaseDisplay");
    base.textContent = baseXp + "xp";
    progressDisplay.appendChild(base);

    let gain = document.createElement("p");
    gain.setAttribute("class", "xpNotificationGainDisplay");
    gain.textContent = "+" + gainedXp + "xp";
    progressDisplay.appendChild(gain);

    setTimeout(function() {
        card.remove();
    }, 10000);
}


// Intro

function highlightElement(element) {
    if (!element) {
        document.getElementsByClassName("elementHighlightBackdrop")[0].remove();
        return;
    }

    let previous = document.getElementsByClassName("highlighted")[0];

    if (previous) {
        let list = [];
        previous.classList.forEach((tag) => {
            if (tag != "highlighted") list.push(tag);
        });
        previous.setAttribute("class", list.join(" "));
    }
    else {
        let backdrop = document.createElement("div");
        backdrop.setAttribute("class", "elementHighlightBackdrop");
        document.body.appendChild(backdrop);
    }
    element.setAttribute("class", element.className + " highlighted");
}

function initializeGameIntro() {

}

function spawnGameIntroPrompt() {
    let container = document.createElement("div");
    container.setAttribute("class", "gameIntroPrompContainer");
    document.body.appendChild(container);

    let popup = document.createElement("div");
    popup.setAttribute("class", "gameIntroPrompt");
    container.appendChild(popup);

    let titleContainer = document.createElement("div");
    titleContainer.setAttribute("class", "gameIntroPromptTitle");
    popup.appendChild(titleContainer);

    let title = document.createElement("h2");
    title.textContent = "Welcome!";
    titleContainer.appendChild(title);

    let paragraphContainer = document.createElement("div");
    paragraphContainer.setAttribute("class", "gameIntroPromptParagraph");
    popup.appendChild(paragraphContainer);

    let paragraph = document.createElement("p");
    paragraph.textContent = "It looks like you're here for the first time. Would you like to have a brief introduction?";
    paragraphContainer.appendChild(paragraph);

    let buttonContainer = document.createElement("div");
    buttonContainer.setAttribute("class", "gameIntroPromptButtonContainer");
    popup.appendChild(buttonContainer);

    let declineButton = document.createElement("div");
    declineButton.setAttribute("class", "gameIntroPromptButton");
    buttonContainer.appendChild(declineButton);

    let declineText = document.createElement("h2");
    declineText.textContent = "No, thanks!";
    declineButton.appendChild(declineText);

    let acceptButton = document.createElement("div");
    acceptButton.setAttribute("class", "gameIntroPromptButton");
    buttonContainer.appendChild(acceptButton);

    let acceptText = document.createElement("h2");
    acceptText.textContent = "Sure";
    acceptButton.appendChild(acceptText);
}