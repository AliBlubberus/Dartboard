const { ipcRenderer, Debugger } = require("electron");
const { stat } = require("original-fs");

const playerContainer = document.getElementById("playerScrollContainer");

//const rawPlayerData = ipcRenderer.sendSync("loadPlayerData");
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

var settingsObj;

var gameEndPopupObject = null;

var winner = null;

ipcRenderer.on("initializeGame", (event, arg) => {
    console.log(arg);
    settingsObj = arg.settings;
    initializeGame(arg.playerData, arg.settings);
});

function initializeGame(players, settings) {
    console.log(players, settings);
    for(let player = 0; player < players.length; player++) {
    // Setup player data //
        playerListings[player] = createPlayerListing(players[player], settings);
        playerData[player] = {};
        playerData[player].name = players[player].name;
        playerData[player].remainingScore = settings.gameLength;
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
        //If overshot
        if (generateCurrentDartsSum() > playerData[currentPlayer].remainingScore) {
            console.log("Ending Turn (Overshot).");
            currentPlayerObject = [
                {"notation": "OVER", "score": 0},
                {"notation": "OVER", "score": 0},
                {"notation": "OVER", "score": 0}
            ];
            if (currentRoundObject.length < playerData.length - 1) {
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                currentPlayer++;
                initializeTurn();
            }
            else {
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                gameRecording[gameRecording.length] = currentRoundObject;
                currentRoundObject = [];
                currentPlayer = 0;
                initializeTurn();
            }
        }

        if (settingsObj.gameEnding != 0 && ((settingsObj.gameEnding == 1 && generateCurrentDartsSum() == playerData[currentPlayer].remainingScore - 1) || (settingsObj.gameEnding == 2 && (generateCurrentDartsSum() == playerData[currentPlayer].remainingScore - 2) || (generateCurrentDartsSum() == playerData[currentPlayer].remainingScore - 1)))) {
            console.log("Ending Turn (Invalid landing position).");
            currentPlayerObject.darts = [
                {"notation": "INVL", "score": 0},
                {"notation": "INVL", "score": 0},
                {"notation": "INVL", "score": 0}
            ];
            if (currentRoundObject.length < playerData.length - 1) {
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                currentPlayer++;
                initializeTurn();
            }
            else {
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                gameRecording[gameRecording.length] = currentRoundObject;
                currentRoundObject = [];
                currentPlayer = 0;
                initializeTurn();
            }
            updateUI();
            return;
        }

        //If exactly right for game endings other than straight-out
        if (generateCurrentDartsSum() == playerData[currentPlayer].remainingScore && settingsObj.gameEnding != 0) {
            if (settingsObj.gameEnding != 0 && (settingsObj.gameEnding == 1 && (currentPlayerObject.darts[currentPlayerObject.darts.length - 1].notation.split("")[0] != "D"))) {
                console.log("Ending Turn (Double-Out not satisfied).");
                currentPlayerObject.darts = [
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0}
                ];
                if (currentRoundObject.length < playerData.length - 1) {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    currentPlayer++;
                    initializeTurn();
                }
                else {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    gameRecording[gameRecording.length] = currentRoundObject;
                    currentRoundObject = [];
                    currentPlayer = 0;
                    initializeTurn();
                }
            }
            else if (settingsObj.gameEnding != 0 && (settingsObj.gameEnding == 2 && (currentPlayerObject.darts[currentPlayerObject.darts.length - 1].notation.split("")[0] != "T"))) {
                console.log("Ending Turn (Triple-Out not satisfied).");
                currentPlayerObject.darts = [
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0}
                ];
                if (currentRoundObject.length < playerData.length - 1) {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    currentPlayer++;
                    initializeTurn();
                }
                else {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    gameRecording[gameRecording.length] = currentRoundObject;
                    currentRoundObject = [];
                    currentPlayer = 0;
                    initializeTurn();
                }
            }
        }

        //If exactly right
        if (generateCurrentDartsSum() == playerData[currentPlayer].remainingScore) {
            console.log("Ending Turn (Player " + playerData[currentPlayer].name + " won).");
            playerData[currentPlayer].remainingScore -= generateCurrentDartsSum();
            currentRoundObject[currentRoundObject.length] = currentPlayerObject;
            gameRecording[gameRecording.length] = currentRoundObject;

            // win logic //
            winner = currentPlayer;
            instantiateWinPopup(playerData[winner]);
            return;
        }

        //For game entry other than straight-in
        if (playerData[currentPlayer].remainingScore == settingsObj.gameLength && settingsObj.gameEntry != 0) {
            if (settingsObj.gameEntry == 1 && currentPlayerObject.darts[0].notation.split("")[0] != "D") {
                console.log("Ending Turn (Double-In not satisfied).");
                currentPlayerObject.darts = [
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0}
                ];
                if (currentRoundObject.length < playerData.length - 1) {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    currentPlayer++;
                    initializeTurn();
                }
                else {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    gameRecording[gameRecording.length] = currentRoundObject;
                    currentRoundObject = [];
                    currentPlayer = 0;
                    initializeTurn();
                }
            }
            if (settingsObj.gameEntry == 2 && currentPlayerObject.darts[0].notation.split("")[0] != "T") {
                console.log("Ending Turn (Triple-In not satisfied).");
                currentPlayerObject.darts = [
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0},
                    {"notation": "INVL", "score": 0}
                ];
                if (currentRoundObject.length < playerData.length - 1) {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    currentPlayer++;
                    initializeTurn();
                }
                else {
                    currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                    currentPlayerObject = {};
                    gameRecording[gameRecording.length] = currentRoundObject;
                    currentRoundObject = [];
                    currentPlayer = 0;
                    initializeTurn();
                } 
            }
        }

        //Any other case
        if (currentPlayerObject.darts.length == 3) {
            if (currentRoundObject.length < playerData.length - 1) {
                console.log("Ending Turn (Next Player)");
                playerData[currentPlayer].remainingScore -= generateCurrentDartsSum();
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                currentPlayer++;
                initializeTurn();
            }
            else {
                console.log("Ending Turn (New Round)");
                playerData[currentPlayer].remainingScore -= generateCurrentDartsSum();
                currentRoundObject[currentRoundObject.length] = currentPlayerObject;
                currentPlayerObject = {};
                gameRecording[gameRecording.length] = currentRoundObject;
                currentRoundObject = [];
                currentPlayer = 0;
                initializeTurn();
            }
        }
    }
    updateUI();
}

function generateCurrentDartsSum() {
    let sum = 0;
    currentPlayerObject.darts.forEach(element => {
        sum += element.score;
    });
    return sum;
}

function getAverageScore(player) {
    if (gameRecording.length > 0) {
        let totalScore = settingsObj.gameLength - playerData[player].remainingScore;

        let averageScore = 0;
        if (currentRoundObject.length >= player) averageScore = totalScore / (gameRecording.length + 1);
        else averageScore = totalScore / gameRecording.length;

        return Math.round((averageScore + Number.EPSILON) * 100) / 100;
    }
    else console.log("getAverageScore() can only be called after the first round!");
}

function getTotalDarts(player) {
    if (gameRecording.length > 0) {
        let darts = 0;
        let dartsCurrentRound = 0;

        darts = gameRecording.length * 3;
        if (currentRoundObject.length > player && currentRoundObject[player].darts) dartsCurrentRound = currentRoundObject[player].darts.length;

        return darts + dartsCurrentRound;
    }
    else console.log("getTotalDarts() gan only be called after the first round!");
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
    profilePic.setAttribute("class", "playerProfilePicture rank" + object.rank);
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
        averageStat.textContent = "Average Score: " + getAverageScore(winner);
        statsContainer.appendChild(averageStat);

        let dartsStat = document.createElement("h2");
        dartsStat.textContent = "Darts: " + getTotalDarts(winner);
        statsContainer.appendChild(dartsStat);

        let endGameButtonContainer = document.createElement("div");
        endGameButtonContainer.setAttribute("class", "endGameButtonContainer");
        popup.appendChild(endGameButtonContainer);

        let endGameButton = document.createElement("div");
        endGameButton.setAttribute("class", "endGameButton");
        endGameButton.setAttribute("onclick", "finishGame()");
        endGameButtonContainer.appendChild(endGameButton);

        let endGameButtonText = document.createElement("h1");
        endGameButtonText.textContent = "gg wp";
        endGameButton.appendChild(endGameButtonText);
    }
}

function finishGame() {
    let object = {};
    object.playerData = playerData;
    for (let i = 0; i < playerData.length; i++) {
        playerData[i].averageScore = getAverageScore(i);
        playerData[i].totalDarts = getTotalDarts(i);
    }
    object.winner = {"index": winner, "data": playerData[winner]};
    object.recording = gameRecording;
    object.gameSettings = settingsObj;

    ipcRenderer.send("handleFinishedGame", object);
}

// ======= TEST FUNCTIONS ======= //
function mutateScore(amount) {
    playerData[currentPlayer].remainingScore += amount;
    updateUI();
}