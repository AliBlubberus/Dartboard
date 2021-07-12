// do it wurks?

const { ipcRenderer, Debugger } = require("electron");
const { stat } = require("original-fs");

const playerContainer = document.getElementById("playerScrollContainer");

const rawPlayerData = ipcRenderer.sendSync("loadPlayerData");
var playerData = [];
var playerListings = [];

var currentPlayer = 0;

const currentPlayerScoreText = document.getElementById("currentPlayerRemainingScore");
const currentPlayerNameText = document.getElementById("currentPlayerName");

const dartFields = [document.getElementById("firstDart"), document.getElementById("secondDart"), document.getElementById("thirdDart")];

var currentRound = 0;
var gameRecording = [];
var currentRoundObject = [];
var currentPlayerObject = {};

var gameEndPopupObject = null;

var winner = null;

// TODO: Delete this and replace it with actual logic
settingsObj = {};
settingsObj.gameLength = 401;

initializeGame(settingsObj);

function initializeGame() {
    
    for(let player = 0; player < rawPlayerData.length; player++) {
    // Setup player data //
        playerListings[player] = createPlayerListing(rawPlayerData[player], settingsObj);
        playerData[player] = {};
        playerData[player].name = rawPlayerData[player].name;
        playerData[player].remainingScore = settingsObj.gameLength;
    }

    initializeTurn();

    updateUI();
}

function initializeTurn() {
    // Call endTurn() BEFORE calling this function. Otherwise you will override the current round
    currentPlayerObject.name = playerData[currentPlayer].name;
    currentPlayerObject.darts = [];
}

function addDart(position) {
    if (currentPlayerObject.darts.length < 3) {
        currentPlayerObject.darts[currentPlayerObject.darts.length] = {"notation": sampleDartNotation(position), "score": sampleDartScore(position)};
        updateUI();
    }
}

function endTurn() {
    if (currentPlayerObject.darts) {
        if (currentPlayerObject.darts.length == 3) {
            if (currentRoundObject.length < playerData.length - 1) {
                console.log("Ending Turn (Next Player)");
                playerData[currentPlayer].remainingScore -= generateSum();
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                currentPlayer++;
                initializeTurn();
            }
            else {
                console.log("Ending Turn (New Round)");
                playerData[currentPlayer].remainingScore -= generateSum();
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                gameRecording[gameRecording.length] = currentRoundObject;
                currentRoundObject = [];
                currentPlayer = 0;
                initializeTurn();
            }
        }
        else if (generateSum() == playerData[currentPlayer].remainingScore) {
            console.log("Ending Turn (Player " + playerData[currentPlayer].name + " won).");
            playerData[currentPlayer].remainingScore -= generateSum();
            currentRoundObject[currentRoundObject.length] = currentPlayerObject;

            // win logic //
            winner = currentPlayer;
            instantiateWinPopup(playerData[winner]);
        }
    }
    updateUI();
}

function generateSum() {
    let sum = 0;
    currentPlayerObject.darts.forEach(element => {
        sum += element.score;
    });
    return sum;
}

function correctLastDart() {
    if (currentPlayerObject.darts) {
        currentPlayerObject.darts.pop();
    }
    updateUI();
}

function sampleDartScore(string) {
    if (string == "MISS") return 0;
    if (string == "BULL") return 25;
    if (string == "D BULL") return 50;

    let parts = string.split(" ");

    let mult = 1;
    if (parts[0].charAt(0) == "S" || parts[0].charAt == "L") mult = 1;
    if (parts[0].charAt(0) == "D") mult = 2;
    if (parts[0].charAt(0) == "T") mult = 3;

    let score = parseInt(parts[1], 10);
    return score*mult;
}

function sampleDartNotation(string) {
    if (string == "MISS") return "MISS";
    if (string == "BULL") return "BULL";
    if (string == "D BULL") return "DBULL";

    let parts = string.split(" ");

    if (parts && parts [0] && parts[1]) {
        if (parts[0] == "S" || parts [0] == "L") parts[0] += "S";
        return parts[0] + parts [1];
    }
    else (console.error("An error occurred whilst sampling Dart Notation!"));
}

function createPlayerListing(object, settings) {
    let scrollItem = document.createElement("div");
    scrollItem.setAttribute("class", "playerScrollItem");
    playerContainer.appendChild(scrollItem);

    let profilePic = document.createElement("div");
    profilePic.setAttribute("class", "playerProfilePicture");
    scrollItem.appendChild(profilePic);

    let nameContainer = document.createElement("div");
    nameContainer.setAttribute("class", "playerNameContainer");
    scrollItem.appendChild(nameContainer);

    let nameText = document.createElement("h3");
    nameText.textContent = object.name;
    nameContainer.appendChild(nameText);

    let infoContainer = document.createElement("div");
    infoContainer.setAttribute("class", "playerGameInfoContainer");
    scrollItem.appendChild(infoContainer);

    let remainingScore = document.createElement("h3");
    remainingScore.textContent = "Remaining Score";
    infoContainer.appendChild(remainingScore);

    let scoreContainer = document.createElement("div");
    scoreContainer.setAttribute("class", "playerScoreContainer");
    infoContainer.appendChild(scoreContainer);

    let scoreText = document.createElement("h1");
    scoreText.setAttribute("class", "scoreText");
    scoreText.textContent = settings.gameLength;
    scoreContainer.appendChild(scoreText);

    return scrollItem;
}

function updateUI() {
    // Update player listings //
    for(let playerItem = 0; playerItem < playerListings.length; playerItem++) {
        let listing = playerListings[playerItem];
        if(playerItem == currentPlayer) {
            listing.style.borderBottomColor = "var(--white)";
            listing.style.boxShadow = "inset 0 -30px 30px -31px var(--white)";
        }
        else {
            listing.style.borderBottomColor = "var(--black)";
            listing.style.boxShadow = "inset 0 -30px 30px -31px var(--black)";
        }
        listing.getElementsByClassName("scoreText")[0].textContent = playerData[playerItem].remainingScore;
    }

    // Update sidebar bottom half //
    let currentScore = 0;
    for (let dart = 0; dart < currentPlayerObject.darts.length; dart++) {
        currentScore += currentPlayerObject.darts[dart].score;
    }
    currentPlayerScoreText.textContent = currentScore;
    currentPlayerNameText.textContent = playerData[currentPlayer].name + "'s";

    for (let dart = 0; dart < 3; dart++) {
        dartFields[dart].textContent = "";
    }
    for (let dart = 0; dart < currentPlayerObject.darts.length; dart++) {
        dartFields[dart].textContent = currentPlayerObject.darts[dart].notation;
    }
}

// Instantiate Game Ending Window //

function instantiateWinPopup(player) {
    if (!gameEndPopupObject) {
        console.log("Instantiating Win Popup...");

        gameEndPopupObject = document.createElement("div");
        gameEndPopupObject.setAttribute("class", "winPopupContainer");
        document.body.appendChild(gameEndPopupObject);

        let popup = document.createElement("div");
        popup.setAttribute("class", "winPopup");
        gameEndPopupObject.appendChild(popup);

        let ggContainer = document.createElement("div");
        ggContainer.setAttribute("class", "ggContainer");
        popup.appendChild(ggContainer);

        let gg = document.createElement("h1");
        ggContainer.appendChild(gg);
        gg.textContent = "GG";


        let winningPlayerContainer = document.createElement("div");
        winningPlayerContainer.setAttribute("class", "winningPlayerNameContainer");
        popup.appendChild(winningPlayerContainer);

        let winningPlayerName = document.createElement("h1");
        winningPlayerName.textContent = player.name;
        winningPlayerContainer.appendChild(winningPlayerName);

        let winningPlayerSubtitle = document.createElement("h2");
        winningPlayerContainer.appendChild(winningPlayerSubtitle);
        winningPlayerSubtitle.textContent = "won the game!";


        let statsContainer = document.createElement("div");
        statsContainer.setAttribute("class", "topPlayerStatsContainer");
        popup.appendChild(statsContainer);

        let averageStat = document.createElement("h2");
        averageStat.textContent = "Average Score: X";
        statsContainer.appendChild(averageStat);

        let dartsStat = document.createElement("h2");
        dartsStat.textContent = "Darts: X";
        statsContainer.appendChild(dartsStat);

        let endGameButtonContainer = document.createElement("div");
        endGameButtonContainer.setAttribute("class", "endGameButtonContainer");
        popup.appendChild(endGameButtonContainer);

        let endGameButton = document.createElement("div");
        endGameButton.setAttribute("class", "endGameButton");
        endGameButtonContainer.appendChild(endGameButton);

        let endGameButtonText = document.createElement("h1");
        endGameButtonText.textContent = "gg wp";
        endGameButton.appendChild(endGameButtonText);
    }
}


// ======= TEST FUNCTIONS ======= //
function mutateScore(amount) {
    playerData[currentPlayer].remainingScore += amount;
    updateUI();
}