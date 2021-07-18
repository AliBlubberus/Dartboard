const { ipcRenderer, Debugger, ipcMain } = require("electron");

const playerData = ipcRenderer.sendSync("loadPlayerData");

const playerSelectList = document.getElementById("playerSelectList");
const totalScoreListContainer = document.getElementById("totalScoreList");
const averageScoreListContainer = document.getElementById("averageScoreList");



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

    let picture = document.createElement("img");
    picture.setAttribute("class", "playerSelectPic");
    picture.setAttribute("src", "svg/user-solid.svg");  //TODO: Replace this with the corresponding profile picture//
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
    scoreText.textContent = object.averageScore;
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
    if (startGameButtonInteractable) {
        settingsObject = {};
        settingsObject.gameLength = gameLengthIntervals[gameLength];
        settingsObject.gameEntry = gameEntry;
        settingsObject.gameEnding = gameEnding;
        
        settingsObject.selectedPlayers = exportSelectedPlayers();

        ipcRenderer.sendSync("startNewGame", settingsObject);
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