const { ipcRenderer, Debugger, ipcMain } = require("electron");
const ns = "http://www.w3.org/2000/svg";

var rawPlayerData = ipcRenderer.sendSync("loadPlayerData");

const playerNameInputField = document.getElementById("playerNameField");
const playerListObj = document.getElementById("playersList");

generatePlayerList();

function addPlayer() {
    let playerName = playerNameInputField.value;
    let singleLetters = playerName.split("");
    if (nameAvailable(playerName) && playerName != "" && singleLetters[0] != " " && singleLetters[singleLetters.length] != " ") {
        rawPlayerData[rawPlayerData.length] = {
            "name": playerName,
            "gamesPlayed": 0,
            "totalScore": 0,
            "averageScorePerGame": 0,
            "gamesWon": 0
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
}

function instantiatePlayerListing(index) {
    let listingContainer = document.createElement("div");
    listingContainer.setAttribute("class", "playerListingContainer");
    playerListObj.appendChild(listingContainer);

    let listing = document.createElement("div");
    listing.setAttribute("class", "playerListing");
    listingContainer.appendChild(listing);

    let picContainer = document.createElement("div");
    picContainer.setAttribute("class", "picContainer");
    listing.appendChild(picContainer);
    
    let pic = document.createElement("div");
    pic.setAttribute("class", "pic");
    picContainer.appendChild(pic);

    let nameContainer = document.createElement("div");
    nameContainer.setAttribute("class", "nameContainer");
    listing.appendChild(nameContainer);

    let nameText = document.createElement("h2");
    nameText.textContent = rawPlayerData[index].name;
    nameContainer.appendChild(nameText);

    let actionsContainer = document.createElement("div");
    actionsContainer.setAttribute("class", "actionsContainer");
    listing.appendChild(actionsContainer);

    let editButton = document.createElement("div");
    editButton.setAttribute("class", "editPlayerButton");
    actionsContainer.appendChild(editButton);

    let editIcon = document.createElementNS(ns, "svg");
    editIcon.setAttributeNS(null, "class", "playerActionBtnSvg");
    editIcon.setAttributeNS(null, "viewBox", "0 0 512 512");
    editButton.appendChild(editIcon);

    let editIconPath = document.createElementNS(ns, "path");
    editIconPath.setAttributeNS(null, "d", "M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z");
    editIcon.appendChild(editIconPath);

    let deleteButton = document.createElement("div");
    deleteButton.setAttribute("class", "deletePlayerButton");
    deleteButton.setAttribute("onclick", "instantiateDeletionPopup(" + index + ")");
    actionsContainer.appendChild(deleteButton);

    let deleteIcon = document.createElementNS(ns, "svg");
    deleteIcon.setAttributeNS(null, "class", "playerActionBtnSvg");
    deleteIcon.setAttributeNS(null, "viewBox", "0 0 448 512");
    deleteButton.appendChild(deleteIcon);

    let deleteIconPath = document.createElementNS(ns, "path");
    deleteIconPath.setAttributeNS(null, "d", "M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z");
    deleteIcon.appendChild(deleteIconPath);
}

function generatePlayerList() {
    clearPlayersList();
    for (let i = 0; i < rawPlayerData.length; i++) {
        instantiatePlayerListing(i);
    }
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
    paragraph.textContent = "You are about to permanently delete '" + rawPlayerData[playerID].name + "' and all files associated with them. This is irreversible! Do you widh to proceed?";
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