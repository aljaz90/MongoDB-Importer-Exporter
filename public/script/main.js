let database = {
    connected: false,
    databases: [],
    selectedDbName: null,
    collections: []
}

async function handleConnect(e) {
    e.preventDefault();

    try {
        const data = {
            databaseUrl: e.target.elements.url.value
        };

        let res = await (await fetch("/connect", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })).json();

        database.connected = res.connected;
        database.databases = res.connected ? res.databases : [];
    } 
    catch (error) {
        console.error("An error occured while trying to connect to the server");
        console.log(error);
        database.connected = false;
        database.databases = [];
    }

    database.collections = [];
    database.selectedDbName = null;

    updateConnectionStatus();
    updateActionButtons();
    updateDatabaseList();
    updateCollectionList();
}

async function handleSelectDatabase(dbName) {
    try {
        const data = {
            dbName: dbName
        };

        let res = await (await fetch("/select", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })).json();
        
        if (res.collections) {
            database.selectedDbName = dbName;
            database.collections = res.collections;
        }
        else {
            database.selectedDbName = null;
            database.collections = [];    
        }
    } 
    catch (error) {
        console.error("An error occured while trying to connect to the server");
        console.log(error);
        database.selectedDbName = null;
        database.collections = [];
    }

    updateCollectionList();
    updateActionButtons();
}

// Export (popup) functions
function handleOpenExportPopup() {
    let popup = document.querySelector(".export_popup");
    let popupCollectionList = document.querySelector(".export_popup--form--collection_list");
    popupCollectionList.replaceChildren();

    for (let collection of database.collections) {
        let item = document.createElement("div");
        item.className = "export_popup--form--collection_list--item";

        let input = document.createElement("input");
        input.type = "checkbox";
        input.name = `${collection.name}Collection`;
        input.id = `${collection.name}Collection`;
        input.value = collection.name;
        input.checked = true;
        item.appendChild(input);

        let label = document.createElement("label");
        label.innerText = collection.name;
        label.htmlFor = `${collection.name}Collection`;
        item.appendChild(label);

        popupCollectionList.appendChild(item);
    }

    popup.style.display = "block";
}

function handleCloseExportPopup() {
    let popup = document.querySelector(".export_popup");
    popup.style.display = "none";
}

async function handleExport(e) {
    e.preventDefault();

    document.querySelector(".export_popup--form--submit").disabled = true;
    document.querySelector(".export_popup--form--submit").classList.add("btn-loading");

    let collectionsToBeExported = [];

    for (let el of e.target.elements) {
        if (el.type === "checkbox" && el.checked) {
            collectionsToBeExported.push(el.value);
        }
    }

    try {
        const data = {
            collections: collectionsToBeExported
        };

        let res = await(await fetch("/export", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })).json();

        let a = document.createElement("a");
        a.href = `/${res.fileName}`;
        a.download  = res.fileName;
        a.click();
    } 
    catch (error) {
        console.log("An error occured while trying to export collections");    
        console.log(error);    
    }
    
    document.querySelector(".export_popup--form--submit").classList.remove("btn-loading");
    document.querySelector(".export_popup--form--submit").disabled = false;
}

// Import (popup) functions
function handleOpenImportPopup() {
    let popup = document.querySelector(".import_popup");
    popup.style.display = "block";
}

function handleCloseImportPopup() {
    let popup = document.querySelector(".import_popup");
    popup.style.display = "none";
}

function handleSelectFile(e) {
    let fileName = e.target.value.split("\\")[2];
    let label = document.querySelector(".import_popup--form--file--label");
    label.style.fontSize = "2.1rem"
    if (fileName.length > 45) {
        label.innerText = fileName.slice(0, 45) + "...";
    }
    else {
        label.innerText = fileName;
    }
}

async function handleImport(e) {
    e.preventDefault();
    let input = document.querySelector("#importFile");
    let overwriteDatabaseInput = document.querySelector("#overwriteCollections");

    try {
        let data = new FormData();
        data.append("file", input.files[0]);
        data.append("overwriteDatabase", overwriteDatabaseInput.checked);

        let res = await fetch("/import", {
            method: "POST",
            body: data
        }); 
    } 
    catch (error) {
        
    }

}

// Update functions
function updateConnectionStatus() {
    if (database.connected) {
        document.querySelector(".connect--status--text").innerText = "Connected";
        document.querySelector(".connect--status--icon").className = "connect--status--icon connect--status--icon-connected";
        document.querySelector("#urlInput").disabled = true;
        document.querySelector("#connectButton").value = "Disconnect";
        document.querySelector("#connectButton").style.backgroundColor = "#E02626";
    }
    else {
        document.querySelector(".connect--status--text").innerText = "Disconnected";
        document.querySelector(".connect--status--icon").className = "connect--status--icon connect--status--icon-disconnected";
        document.querySelector("#urlInput").disabled = false;
        document.querySelector("#connectButton").disabled = false;
        document.querySelector("#connectButton").value = "Connect";
        document.querySelector("#connectButton").style.backgroundColor = "#10aa50";
    }
}

function updateDatabaseList() {
    let databasesList = document.querySelector(".databases--list");
    let databasesHelper = document.querySelector(".databases--help");
    databasesList.replaceChildren();

    if (database.databases.length) {
        databasesHelper.style.display = "none";
    }
    else {
        databasesHelper.style.display = "flex";
    }

    for (let db of database.databases) {
        let item = document.createElement("div");
        item.id = `${db.name}-db-select-btn`;
        item.classList.add("databases--list--item");
        item.onclick = () => handleSelectDatabase(db.name);
        
        let name = document.createElement("div");
        name.classList.add("databases--list--item--name");
        name.innerText = db.name;
        item.appendChild(name);
        
        let size = document.createElement("div");
        size.classList.add("databases--list--item--size");
        size.innerText = `${db.sizeOnDisk} B`;
        item.appendChild(size);

        databasesList.appendChild(item);
    }
}

function updateActionButtons() {  
    let databaseBtns = document.querySelectorAll(".databases--list--item");
    for (let btn of databaseBtns) {
        if (btn.id === `${database.selectedDbName}-db-select-btn`) {
            btn.className = "databases--list--item databases--list--item-selected";
        }
        else {
            btn.className = "databases--list--item";
        }
    }

    if (database.connected) {
        document.querySelector("#import-btn").disabled = false;
    }
    else {
        document.querySelector("#import-btn").disabled = true;
    }
    
    if (database.selectedDbName) {
        document.querySelector("#export-btn").disabled = false;
    }
    else {
        document.querySelector("#export-btn").disabled = true;
    }
}

function updateCollectionList() {
    let collectionList = document.querySelector(".collections--list");
    let collectionHelper = document.querySelector(".collections--help");
    collectionList.replaceChildren();

    if (database.collections.length || database.selectedDbName) {
        collectionHelper.style.display = "none";
    }
    else {
        collectionHelper.style.display = "flex";
    }

    for (let collection of database.collections) {
        let item = document.createElement("div");
        item.classList.add("collections--list--item");
        
        let name = document.createElement("div");
        name.classList.add("collections--list--item--name");
        name.innerText = collection.name;
        item.appendChild(name);
        
        let documents = document.createElement("div");
        documents.classList.add("collections--list--item--documents");
        documents.innerText = `${collection.documentCount} documents`;
        item.appendChild(documents);

        collectionList.appendChild(item);
    }
}