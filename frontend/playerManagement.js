const { ipcRenderer, Debugger, ipcMain } = require("electron");
const ns = "http://www.w3.org/2000/svg";

var rawPlayerData = ipcRenderer.sendSync("loadPlayerData");

const playerNameInputField = document.getElementById("playerNameField");
const playerListObj = document.getElementById("playersList");

var playerListings = [];
var selectedPlayer = 0;

const statDisplay = {
    playerName: document.getElementById("playerName"),
    gamesPlayed: document.getElementById("gamesPlayed"),
    totalScore: document.getElementById("totalScore"),
    averageScore: document.getElementById("averageScore"),
    gamesWon: document.getElementById("gamesWon"),
    exp: document.getElementById("exp"),
    rank: document.getElementById("rank")
}
const edit = document.getElementById("editBtn");
const del = document.getElementById("deleteBtn");

generatePlayerList();

selectPlayer(0);

function addPlayer() {
    let playerName = playerNameInputField.value;
    let singleLetters = playerName.split("");
    if (nameAvailable(playerName) && playerName != "" && singleLetters[0] != " " && singleLetters[singleLetters.length] != " ") {
        // Template for new players. Change this everytime a new value is added to player data!
        rawPlayerData[rawPlayerData.length] = {
            "name": playerName,
            "gamesPlayed": 0,
            "totalScore": 0,
            "averageScorePerGame": 0,
            "gamesWon": 0,
            "exp": 0,
            "rank": 0,
            //Recording of the latest 20 games
            "winstreakRecording": []
        }
        generatePlayerList();
        ipcRenderer.sendSync("overridePlayerData", rawPlayerData);
    }
}

function nameAvailable(name) {
    out = true;
    rawPlayerData.forEach(element => {
        if (element.name == name) out = false;
    });
    return out;
}

function clearPlayersList() {
    Array.from(document.getElementById("playersList").children).forEach((element) => {
        element.remove();
    });
    playerListings = [];
}

function instantiatePlayerListing(index) {
    let listingContainer = document.createElement("div");
    listingContainer.setAttribute("class", "playerListingContainer");
    listingContainer.setAttribute("onclick", "selectPlayer(" + index + ")");
    playerListObj.appendChild(listingContainer);

    let listing = document.createElement("div");
    listing.setAttribute("class", "playerListing");
    listingContainer.appendChild(listing);

    let picContainer = document.createElement("div");
    picContainer.setAttribute("class", "picContainer");
    listing.appendChild(picContainer);
    
    let pic = document.createElement("div");
    pic.setAttribute("class", "pic rank" + rawPlayerData[index].rank);
    picContainer.appendChild(pic);

    let nameContainer = document.createElement("div");
    nameContainer.setAttribute("class", "nameContainer");
    listing.appendChild(nameContainer);

    let nameText = document.createElement("h2");
    nameText.textContent = rawPlayerData[index].name;
    nameContainer.appendChild(nameText);

    return listing;
}

function generatePlayerList() {
    clearPlayersList();
    for (let i = 0; i < rawPlayerData.length; i++) {
        playerListings[i] = instantiatePlayerListing(i);
    }
    selectPlayer(selectedPlayer);
}

function selectPlayer(index) {
    // Un-Highlight previous highlighted element
    let previous = document.getElementsByClassName("playerListingSelected")[0];
    if (previous) {
        let list = [];
        previous.classList.forEach((tag) => {
            if (tag != "playerListingSelected") list.push(tag);
        });
        previous.setAttribute("class", list.join(" "));
    }

    //Highlight New Element
    playerListings[index].setAttribute("class", playerListings[index].className + " playerListingSelected");
    selectedPlayer = index;

    //Update Stats Display
    statDisplay.playerName.textContent = rawPlayerData[index].name;
    statDisplay.averageScore.textContent = "Average Score: " + rawPlayerData[index].averageScorePerGame;
    statDisplay.exp.textContent = "Exp: " + rawPlayerData[index].exp;
    statDisplay.gamesPlayed.textContent = "Games Played: " + rawPlayerData[index].gamesPlayed;
    statDisplay.gamesWon.textContent = "Games Won: " + rawPlayerData[index].gamesWon;
    statDisplay.rank.textContent = "Rank: " + rawPlayerData[index].rank;
    statDisplay.totalScore.textContent = "Total Score: " + rawPlayerData[index].totalScore;

    //Update onClick events on Action Buttons
    edit.setAttribute("onclick", "instantiateRenamePopup(" + index + ")");
    del.setAttribute("onclick", "instantiateDeletionPopup(" + index + ")");
}

function instantiateDeletionPopup(playerID) {
    let background = document.createElement("div");
    background.setAttribute("class", "deleteConfirmBackground");
    background.setAttribute("id", "deletionPopupRoot");
    document.body.appendChild(background);

    let window = document.createElement("div");
    window.setAttribute("class", "deleteConfirmPopup");
    background.appendChild(window);

    let titleContainer = document.createElement("div");
    titleContainer.setAttribute("class", "deletePopupTitle");
    window.appendChild(titleContainer);

    let title = document.createElement("h2");
    title.textContent = "Are you sure about that?";
    titleContainer.appendChild(title);

    let paragraphContainer = document.createElement("div");
    paragraphContainer.setAttribute("class", "deletePopupParagraphContainer");
    window.appendChild(paragraphContainer);

    let paragraph = document.createElement("p");
    paragraph.textContent = "You are about to permanently delete '" + rawPlayerData[playerID].name + "' and all files associated with them. This is irreversible! Do you wish to proceed?";
    paragraphContainer.appendChild(paragraph);

    let buttonsContainer = document.createElement("div");
    buttonsContainer.setAttribute("class", "deletePopupButtonsContainer");
    window.appendChild(buttonsContainer);

    let lButtonCont = document.createElement("div");
    lButtonCont.setAttribute("class", "deletePopupButtonContainer");
    buttonsContainer.appendChild(lButtonCont);

    let rButtonCont = document.createElement("div");
    rButtonCont.setAttribute("class", "deletePopupButtonContainer");
    buttonsContainer.appendChild(rButtonCont);

    let cancelButton = document.createElement("div");
    cancelButton.setAttribute("class", "deletePopupButton");
    cancelButton.setAttribute("onclick", "document.getElementById('deletionPopupRoot').remove()");
    lButtonCont.appendChild(cancelButton);

    let cancelText = document.createElement("h2");
    cancelText.textContent = "Cancel";
    cancelButton.appendChild(cancelText);

    let proceedButton = document.createElement("div");
    proceedButton.setAttribute("class", "deletePopupButton");
    proceedButton.setAttribute("id", "deleteProceedButton");
    proceedButton.setAttribute("onclick", "document.getElementById('deletionPopupRoot').remove(); deletePlayer(" + playerID + ")");
    rButtonCont.appendChild(proceedButton);

    let proceedText = document.createElement("h2");
    proceedText.textContent = "Proceed";
    proceedButton.appendChild(proceedText);
}

function deletePlayer(index) {
    console.log("Deleting " + rawPlayerData[index].name + "...");

    let latestGame = ipcRenderer.sendSync("loadLatestGame");
    if (latestGame.playerData) {
        let contains = false;
        latestGame.playerData.forEach((element) => {
            if (element.name == rawPlayerData[index].name) contains = true;
        });
        if (contains) ipcRenderer.sendSync("deleteLatestGame");
    }


    rawPlayerData.splice(index, 1);
    ipcRenderer.sendSync("overridePlayerData", rawPlayerData);

    generatePlayerList();
}

function instantiateRenamePopup(playerID) {
    let background = document.createElement("div");
    background.setAttribute("class", "renamePopupBackground");
    background.setAttribute("id", "renamePopupRoot");
    document.body.appendChild(background);

    let window = document.createElement("div");
    window.setAttribute("class", "renamePopup");
    background.appendChild(window);

    let titleContainer = document.createElement("div");
    titleContainer.setAttribute("class", "renameTitleContainer");
    window.appendChild(titleContainer);

    let title = document.createElement("h2");
    title.textContent = "Rename " + rawPlayerData[playerID].name;
    titleContainer.appendChild(title);

    let content = document.createElement("div");
    content.setAttribute("class", "renameContent");
    window.appendChild(content);

    let textField = document.createElement("input");
    textField.setAttribute("type", "text");
    textField.setAttribute("id", "renameTextInput");
    textField.setAttribute("placeholder", "Enter New Name...");
    content.appendChild(textField);

    let button = document.createElement("div");
    button.setAttribute("class", "renameActionButton");
    button.setAttribute("onclick", "renamePlayer(" + playerID +', "' + rawPlayerData[playerID].name + '"); document.getElementById("renamePopupRoot").remove()');
    content.appendChild(button);

    let buttonText = document.createElement("h2");
    buttonText.textContent = "Accept";
    button.appendChild(buttonText);
}

function renamePlayer(playerID, oldName) {
    let newName = document.getElementById("renameTextInput").value;
    console.log(playerID, newName, oldName);
    let singleLetters = newName.split("");
    console.log(singleLetters);
    if (nameAvailable(newName) && newName != "" && singleLetters[0] != " " && singleLetters[singleLetters.length] != " ") {
        console.log("Renaming Player " + oldName + "...");
        rawPlayerData[playerID].name = newName;
        ipcRenderer.sendSync("overridePlayerData", rawPlayerData);
        let latestGame = ipcRenderer.sendSync("loadLatestGame");
        if (latestGame.playerData) {
            for (let i = 0; i < latestGame.playerData.length; i++) {
                if (latestGame.playerData[i].name == oldName) latestGame.playerData[i].name = newName;
            }
        }
    }

    generatePlayerList();
}