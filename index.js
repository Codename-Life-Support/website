

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
let current_join_url = "";
function LockJoinPrompt(){
    prompt_lock = true;
    document.getElementById("prompt_background").style.display = "flex";
}
function UnlockJoinPrompt(){
    prompt_lock = false;
    current_join_url = "";
    document.getElementById("prompt_background").style.display = "none";
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
        let map2Cell = document.createElement("td");
        if (server.mod_required_dlc.length === 0 ){
            mapCell.textContent = "MAIN MENU ";
            map2Cell.textContent = "not in game";
        } else {
            mapCell.textContent = ResolveRequiredDLC(server.mod_required_dlc[0]);
            map2Cell.textContent = server.mod_name + " (" + GetTimeSince(server.creation_t) + ")";
        }
        row.appendChild(mapCell);
        row.appendChild(map2Cell);



        // create links to each mod
        let modsCell = document.createElement("td");
        server.mods.forEach(mod => {
            let modLink = document.createElement("a");
            modLink.className = "join-link";
            modLink.textContent = mod.mod_name;
            modLink.href = "steam://url/CommunityFilePage/" + mod.mod_workshop_id;
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
            method: "GET",
            headers: { "Content-Type": "application/json" }
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
                for (const item of mod.mod_required_dlc) {
                    unique_set.add(item);
            }}
            // convert set back to array
            server.mod_required_dlc = Array.from(unique_set);
            
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

function resetDetails(){
    document.getElementById("odst_wrapper").style.display = "none";
    document.getElementById("reach_wrapper").style.display = "none";
    document.getElementById("h1_wrapper").style.display = "none";
    document.getElementById("h2_wrapper").style.display = "none";
    document.getElementById("h3_wrapper").style.display = "none";
    document.getElementById("h4_wrapper").style.display = "none";

    document.getElementById("quick_odst_wrapper").style.display = "none";
    document.getElementById("quick_reach_wrapper").style.display = "none";
    document.getElementById("quick_h1_wrapper").style.display = "none";
    document.getElementById("quick_h2_wrapper").style.display = "none";
    document.getElementById("quick_h3_wrapper").style.display = "none";
    document.getElementById("quick_h4_wrapper").style.display = "none";

    document.getElementById("odst_install").style.display = "none";
    document.getElementById("reach_install").style.display = "none";
    document.getElementById("reach_mp_install").style.display = "none";
    document.getElementById("h1_install").style.display = "none";
    document.getElementById("h1_mp_install").style.display = "none";
    document.getElementById("h2_install").style.display = "none";
    document.getElementById("h2_mp_install").style.display = "none";
    document.getElementById("h3_install").style.display = "none";
    document.getElementById("h3_mp_install").style.display = "none";
    document.getElementById("h4_install").style.display = "none";
    document.getElementById("h4_mp_install").style.display = "none";
    
    document.getElementById("quick_odst_install").style.display = "none";
    document.getElementById("quick_reach_install").style.display = "none";
    document.getElementById("quick_reach_mp_install").style.display = "none";
    document.getElementById("quick_h1_install").style.display = "none";
    document.getElementById("quick_h1_mp_install").style.display = "none";
    document.getElementById("quick_h2_install").style.display = "none";
    document.getElementById("quick_h2_mp_install").style.display = "none";
    document.getElementById("quick_h3_install").style.display = "none";
    document.getElementById("quick_h3_mp_install").style.display = "none";
    document.getElementById("quick_h4_install").style.display = "none";
    document.getElementById("quick_h4_mp_install").style.display = "none";

    document.getElementById("other_mods_box").innerHTML = "";
    document.getElementById("current_mods_box").innerHTML = "";
}

function JoinServer(index){
    if (prompt_lock) return;
    LockJoinPrompt();
    let server = current_servers[index];
    current_join_url = server.join_link;
    resetDetails();
    document.getElementById("details_server_name").textContent = server.name;
    if (isNullOrWhiteSpace(server.mod_name))
         document.getElementById("details_map_name").textContent = "Not in game for " + GetTimeSince(server.status_t);
    else document.getElementById("details_map_name").textContent = server.mod_name + " for " + GetTimeSince(server.status_t);
    document.getElementById("details_player_count").textContent = "Players: " + server.player_count;
    document.getElementById("details_created_t").textContent = "Started " + GetTimeSince(server.creation_t) + " ago by ";
    document.getElementById("details_creator").textContent = server.creator;
    document.getElementById("details_creator").href = server.creator_url;
    document.getElementById("details_refresh_t").textContent = "last refreshed: " + GetTimeSince(server.refresh_t) + " ago";
    document.getElementById("details_desc").innerHTML = server.description.replace(/\n/g, "<br/>");




    if (!isNullOrWhiteSpace(server.mod_workshop_id)){
        let modWrapper = document.createElement("div");
        modWrapper.className = "install_mod_wrapper";
        let modLink = document.createElement("a");
        modLink.className = "join-link";
        modLink.textContent = server.mod_name;
        modLink.href = "steam://url/CommunityFilePage/" + server.mod_workshop_id;
        modWrapper.appendChild(modLink);
        document.getElementById("current_mods_box").appendChild(modWrapper);
    } else {
        let modWrapper = document.createElement("div");
        modWrapper.textContent = "no mod hosted...";
        document.getElementById("current_mods_box").appendChild(modWrapper);
    }

    // generate clickable links for required dlc
    server.mods.forEach(mod => {
        let modWrapper = document.createElement("div");
        modWrapper.className = "install_mod_wrapper";
        let modLink = document.createElement("a");
        modLink.className = "join-link";
        modLink.textContent = mod.mod_name;
        modLink.href = "steam://url/CommunityFilePage/" + mod.mod_workshop_id;
        modWrapper.appendChild(modLink);
        document.getElementById("other_mods_box").appendChild(modWrapper);
    });

    server.mod_required_dlc.forEach(dlc => {
        if (dlc == "1064272"){ //odst
            document.getElementById("quick_odst_wrapper").style.display = "inline-block";
            document.getElementById("quick_odst_install").style.display = "inline-block";
        } else if (dlc == "1064220" || dlc == "1097224"){ //reach
            document.getElementById("quick_reach_wrapper").style.display = "inline-block";
            document.getElementById("quick_reach_mp_install").style.display = "inline-block";
            if (dlc == "1064220") document.getElementById("quick_reach_install").style.display = "inline-block";
        } else if (dlc == "1064221" || dlc == "1080080"){ //h1
            document.getElementById("quick_h1_wrapper").style.display = "inline-block";
            document.getElementById("quick_h1_mp_install").style.display = "inline-block";
            if (dlc == "1064221") document.getElementById("quick_h1_install").style.display = "inline-block";
        } else if (dlc == "1064270" || dlc == "1097223"){ //h2
            document.getElementById("quick_h2_wrapper").style.display = "inline-block";
            document.getElementById("quick_h2_mp_install").style.display = "inline-block";
            if (dlc == "1064270") document.getElementById("quick_h2_install").style.display = "inline-block";
        } else if (dlc == "1064271" || dlc == "1097222"){ //h3
            document.getElementById("quick_h3_wrapper").style.display = "inline-block";
            document.getElementById("quick_h3_mp_install").style.display = "inline-block";
            if (dlc == "1064271") document.getElementById("quick_h3_install").style.display = "inline-block";
        } else if (dlc == "1064273" || dlc == "1097220"){ //h4
            document.getElementById("quick_h4_wrapper").style.display = "inline-block";
            document.getElementById("quick_h4_mp_install").style.display = "inline-block";
            if (dlc == "1064273") document.getElementById("quick_h4_install").style.display = "inline-block";
        }
    });

    server.mod_required_dlc.forEach(dlc => {
        if (dlc == "1064272"){ //odst
            document.getElementById("odst_wrapper").style.display = "inline-block";
            document.getElementById("odst_install").style.display = "inline-block";
        } else if (dlc == "1064220" || dlc == "1097224"){ //reach
            document.getElementById("reach_wrapper").style.display = "inline-block";
            document.getElementById("reach_mp_install").style.display = "inline-block";
            if (dlc == "1064220") document.getElementById("reach_install").style.display = "inline-block";
        } else if (dlc == "1064221" || dlc == "1080080"){ //h1
            document.getElementById("h1_wrapper").style.display = "inline-block";
            document.getElementById("h1_mp_install").style.display = "inline-block";
            if (dlc == "1064221") document.getElementById("h1_install").style.display = "inline-block";
        } else if (dlc == "1064270" || dlc == "1097223"){ //h2
            document.getElementById("h2_wrapper").style.display = "inline-block";
            document.getElementById("h2_mp_install").style.display = "inline-block";
            if (dlc == "1064270") document.getElementById("h2_install").style.display = "inline-block";
        } else if (dlc == "1064271" || dlc == "1097222"){ //h3
            document.getElementById("h3_wrapper").style.display = "inline-block";
            document.getElementById("h3_mp_install").style.display = "inline-block";
            if (dlc == "1064271") document.getElementById("h3_install").style.display = "inline-block";
        } else if (dlc == "1064273" || dlc == "1097220"){ //h4
            document.getElementById("h4_wrapper").style.display = "inline-block";
            document.getElementById("h4_mp_install").style.display = "inline-block";
            if (dlc == "1064273") document.getElementById("h4_install").style.display = "inline-block";
        }
    });
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