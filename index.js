

let current_servers = [];
let prompt_lock = false;
let refresh_lock = false;
function LockRefreshServers(){
    refresh_lock = true;
    let spinner = document.getElementById("loading_spinner");
    spinner.style.display = "block";
}
function UnlockRefreshServers(){
    refresh_lock = false;
    let spinner = document.getElementById("loading_spinner");
    spinner.style.display = "none";
}

function UpdateServerCount(){
    let serverCountText = document.getElementById("server_count_text");
    serverCountText.textContent = "" + current_servers.length + " Servers Found";
}

function ClearServers(){
    current_servers = [];
    UpdateServerCount();
    let table = document.getElementById("server_table");
    while(table.firstChild){
        table.removeChild(table.firstChild);
    }
}

function GetTimeSince(timestamp){
    let creationDate = new Date(timestamp);
    let now = new Date();
    let diffMs = now - creationDate;
    // decide whether to show in mins, hours, days
    let diffDays = Math.floor(diffMs / 86400000);
    if(diffDays > 0){
        return diffDays + " days";
    }
    let diffHours = Math.floor(diffMs / 3600000);
    if(diffHours > 0){
        return diffHours + " hours";
    }
    let diffMins = Math.floor(diffMs / 60000);
    return diffMins + " mins";
}

function ResolveRequiredDLC(DLC){
    return DLC_IDs[DLC] ?? "UNKNOWN DLC";
}

function RegenerateServers(){
    let table = document.getElementById("server_table");
    for (let i = 0; i < current_servers.length; i++) {
        let server = current_servers[i];
        let row = document.createElement("tr");

        // name
        let nameCell = document.createElement("td");
        nameCell.textContent = server.name;
        row.appendChild(nameCell);

        // creator url
        let creatorCell = document.createElement("td");
        let creatorLink = document.createElement("a");
        creatorLink.className = "join-link";
        creatorLink.textContent = server.creator;
        creatorLink.href = server.creator_url;
        creatorCell.appendChild(creatorLink);
        row.appendChild(creatorCell);

        // get time since creation
        let createdCell = document.createElement("td");
        // convert creation timestamp to time since then
        createdCell.textContent = GetTimeSince(server.creation_t) + " ago"; 
        row.appendChild(createdCell);

        let mapCell = document.createElement("td");
        if (isNullOrWhiteSpace(server.current_required_dlc)){
            mapCell.textContent = "MAIN MENU | Not in game";
        } else {
            mapCell.textContent = ResolveRequiredDLC(server.current_required_dlc) + " | " + server.current_map_name + " (" + GetTimeSince(server.creation_t) + ")";
        }
        row.appendChild(mapCell);

        // create links to each mod
        let modsCell = document.createElement("td");
        server.mods.forEach(mod => {
            let modLink = document.createElement("a");
            modLink.className = "join-link";
            modLink.textContent = mod.name;
            modLink.href = "steam://url/CommunityFilePage/" + mod.workshop_id;
            modsCell.appendChild(modLink);
        });
        row.appendChild(modsCell);

        let playersCell = document.createElement("td");
        playersCell.textContent = server.player_count;
        row.appendChild(playersCell);

        let joinCell = document.createElement("td");
        // let joinLink = document.createElement("a");
        // joinLink.className = "join-link";
        // joinLink.textContent = "Join";
        // joinLink.href = server.join_link;
        // joinCell.appendChild(joinLink);
        // row.appendChild(joinCell);

        const btn = document.createElement("button"); 
        btn.textContent = "Join"; 
        btn.className = "join-button"; 
        btn.dataset.index = i; 
        btn.onclick = function() {JoinServer(this.dataset.index);}
        joinCell.appendChild(btn);
        row.appendChild(joinCell);

        table.appendChild(row);
    }
}

async function LoadServers(){
    if (refresh_lock) return;

    LockRefreshServers();
    try {
        ClearServers();
        // make request to backend to get server list
        let res = await fetch("http://localhost:3000/api/servers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sample: "example" })
        });
        console.log("Fetched server res:", res);
        let data = await res.json();
        console.log("Fetched server data:", data);
        current_servers = data.data.servers;
        UpdateServerCount();

        // process data
        current_servers.forEach(server => {
            // parse creation time to timestamp
            let unique_set = new Set();
            for (const mod of server.mods) {
                for (const item of mod.required_dlc) {
                    unique_set.add(item);
            }}
            // convert set back to array
            server.required_dlc = Array.from(unique_set);
            
            // generate creator url from invite link??
            let parts = server.join_link.split("/");
            let uuid = parts[parts.length - 1];
            server.creator_url = "https://steamcommunity.com/profiles/" + uuid;
        });

        RegenerateServers();
    } catch (error) {
        console.error("Error fetching server data:", error);
    }

    UnlockRefreshServers();
}


function JoinServer(index){
    // bring up popup confirming all the things you need to join the server
    let server = current_servers[index];
    // generate clickable links for required dlc
    server.mods.forEach(mod => {
        let modLink = document.createElement("a");
        modLink.className = "join-link";
        modLink.textContent = mod.name;
        modLink.href = "steam://url/CommunityFilePage/" + mod.workshop_id;
        modsCell.appendChild(modLink);
    });

    // present all workshop links for mods so users can download them if need be

    let confirmJoin = confirm("Do you want to join the server: " + server.name + "?\nMake sure you have the required DLC and mods installed.");
    if (confirmJoin){
        // open the join link
        window.open(server.join_link);
    }
}



window.onload = function() {
    LoadServers();


}

function LoadEACoff(){
    window.open("steam://launch/976730/option2");
}
function LoadEACon(){
    window.open("steam://rungameid/976730");
}