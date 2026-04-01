
    // ==================== CORE SYSTEM ====================
    const consoleOutput = document.getElementById('systemConsoleOutput');
    function addConsoleMessage(message, type = 'info') {
        if (!consoleOutput) return;
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        const time = new Date().toLocaleTimeString();
        const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
        const icon = icons[type] || '>';
        line.innerHTML = `${icon} [${time}] ${message}`;
        consoleOutput.appendChild(line);
        line.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        while (consoleOutput.children.length > 80) consoleOutput.removeChild(consoleOutput.firstChild);
    }
    document.getElementById('clearConsoleBtn')?.addEventListener('click', () => {
        consoleOutput.innerHTML = '';
        addConsoleMessage('Console cleared', 'warning');
    });

    const STORAGE_KEYS = {
        TEAMS: 'mlbb_teams_noscroll_v2',
        ACTIVE_TEAM_ID: 'mlbb_active_team_noscroll_v2',
        GRID_CELL_TEAMS: 'mlbb_grid_noscroll_v2'
    };
    let teams = [];
    let activeTeamId = null;
    let gridCellTeams = Array(6).fill().map(() => Array(5).fill(null));
    let nextId = 100;

    function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

    function saveAllData() {
        try {
            localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, activeTeamId !== null ? activeTeamId.toString() : '');
            localStorage.setItem(STORAGE_KEYS.GRID_CELL_TEAMS, JSON.stringify(gridCellTeams));
            const statusEl = document.getElementById('saveStatus');
            if (statusEl) { statusEl.style.opacity = '1'; setTimeout(() => { statusEl.style.opacity = '0.6'; }, 1000); }
            addConsoleMessage(`Auto-saved: ${teams.length} teams`, 'success');
        } catch(e) { addConsoleMessage(`Save error: ${e.message}`, 'error'); }
    }

    function getDemoTeams() {
        return [{ id: 100, name: "NANI RYUJIN", members: [
            { ign: "Kenshiro", id: "1736414595 (14557)" },
            { ign: "tofuu", id: "56209258 (3071)" },
            { ign: "CODEX", id: "295130226 (3590)" },
            { ign: "Super J", id: "1773762399 (14631)" },
            { ign: "Akuma", id: "99887766" }
        ], logoDataURL: null }];
    }

    // NEW PARSER: Supports "TEAM NAME: Panic Ult" + IGN/ID blocks + RESERVED PLAYERS (ignored for main roster)
    function parseRosterFromText(text) {
        const lines = text.split(/\r?\n/);
        let teamName = "Imported Team";
        let members = [];
        let inReserved = false;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            // Detect team name line
            if (line.match(/^team\s*name\s*:/i)) {
                let extracted = line.replace(/team\s*name\s*:/i, '').trim();
                if (extracted) teamName = extracted;
                continue;
            }
            
            // Detect RESERVED PLAYERS section - skip everything after this marker
            if (line.match(/reserved\s*players/i)) {
                inReserved = true;
                addConsoleMessage("Reserved players section detected → ignored for main lineup", 'info');
                break; // Stop processing further lines (reserved players not included)
            }
            
            // Extract IGN and ID from patterns like "IGN: xxx" and "ID: yyy"
            let ignMatch = line.match(/^IGN\s*:\s*(.+)$/i);
            if (ignMatch) {
                let ignValue = ignMatch[1].trim();
                // Look ahead to next line for ID
                let nextLine = (i+1 < lines.length) ? lines[i+1].trim() : "";
                let idMatch = nextLine.match(/^ID\s*:\s*(.+)$/i);
                if (idMatch) {
                    let idValue = idMatch[1].trim();
                    members.push({ ign: ignValue, id: idValue });
                    i++; // skip the ID line
                } else {
                    members.push({ ign: ignValue, id: "" });
                }
                continue;
            }
            
            // Also support simple format: "Seb | 1754620111" (pipe format) as fallback
            if (line.includes('|')) {
                let parts = line.split('|');
                if (parts.length >= 2) {
                    members.push({ ign: parts[0].trim(), id: parts[1].trim() });
                    continue;
                }
            }
        }
        
        // Remove duplicates based on IGN (case-insensitive)
        let uniqueMembers = [];
        let seen = new Set();
        for(let m of members){
            let key = (m.ign || "").toLowerCase().trim();
            if(!seen.has(key) && m.ign && m.ign.trim() !== ""){
                seen.add(key);
                uniqueMembers.push({ ign: m.ign.trim(), id: m.id.trim() });
            }
        }
        
        if(uniqueMembers.length === 0){
            addConsoleMessage("No valid members found in paste", 'error');
            return null;
        }
        
        addConsoleMessage(`Parsed ${uniqueMembers.length} members, team: ${teamName}`, 'success');
        return { teamName: teamName.substring(0,40), members: uniqueMembers };
    }

    function createTeamFromParsed(name, memberArray, logoURL = null){
        const newTeam = { id: nextId++, name: name.trim(), members: memberArray.map(m=>({ ign:m.ign, id:m.id||"" })), logoDataURL: logoURL };
        teams.push(newTeam);
        activeTeamId = newTeam.id;
        addConsoleMessage(`Team created: "${newTeam.name}" with ${newTeam.members.length} members`, 'success');
        renderAllUI();
        saveAllData();
        return newTeam;
    }
    function createEmptyTeam(name){
        if(!name.trim()) return null;
        const newTeam = { id: nextId++, name: name.trim(), members: [], logoDataURL: null };
        teams.push(newTeam);
        activeTeamId = newTeam.id;
        addConsoleMessage(`Empty team: "${newTeam.name}"`, 'success');
        renderAllUI();
        saveAllData();
        return newTeam;
    }
    function addMemberToActiveTeam(ign, id){
        if(!activeTeamId){ addConsoleMessage('No active team', 'error'); return false; }
        if(!ign || !ign.trim()){ addConsoleMessage('IGN required', 'error'); return false; }
        const team = teams.find(t=>t.id===activeTeamId);
        if(!team) return false;
        if(team.members.some(m=>m.ign.toLowerCase()===ign.trim().toLowerCase())){ addConsoleMessage(`Member "${ign}" exists`, 'warning'); return false; }
        team.members.push({ ign: ign.trim(), id: (id||"").trim() });
        addConsoleMessage(`Added "${ign}" to "${team.name}"`, 'success');
        renderAllUI();
        saveAllData();
        return true;
    }
    function updateTeamLogo(teamId, logoDataURL){
        const team = teams.find(t=>t.id===teamId);
        if(team){ team.logoDataURL = logoDataURL; addConsoleMessage(`Logo updated for "${team.name}"`, 'success'); renderAllUI(); saveAllData(); }
    }
    function deleteMember(teamId, memberIndex){
        const team = teams.find(t=>t.id===teamId);
        if(team && team.members[memberIndex]){ let removed = team.members[memberIndex].ign; team.members.splice(memberIndex,1); addConsoleMessage(`Removed "${removed}" from "${team.name}"`, 'warning'); renderAllUI(); saveAllData(); }
    }
    function deleteActiveTeam(){
        if(!activeTeamId) return;
        if(teams.length === 1){ addConsoleMessage('Cannot delete last team. Use Delete ALL', 'error'); return; }
        const idx = teams.findIndex(t=>t.id===activeTeamId);
        if(idx!==-1){
            for(let r=0;r<6;r++) for(let c=0;c<5;c++) if(gridCellTeams[r][c]===activeTeamId) gridCellTeams[r][c]=null;
            let removedName = teams[idx].name;
            teams.splice(idx,1);
            activeTeamId = teams[0]?.id || null;
            addConsoleMessage(`Team "${removedName}" deleted`, 'warning');
            renderAllUI(); saveAllData();
        }
    }
    function deleteAllTeams(){
        if(teams.length===0) return;
        if(confirm(`⚠️ DELETE ALL ${teams.length} TEAMS?`)){
            teams = [];
            activeTeamId = null;
            gridCellTeams = Array(6).fill().map(()=>Array(5).fill(null));
            nextId = 100;
            addConsoleMessage(`ALL TEAMS DELETED`, 'error');
            renderAllUI(); saveAllData();
        }
    }
    function assignTeamToCell(row, col, teamId){
        if(row>=0 && row<6 && col>=0 && col<5){
            gridCellTeams[row][col] = teamId;
            const team = teams.find(t=>t.id===teamId);
            addConsoleMessage(`Team "${team?.name}" placed at ${String.fromCharCode(65+col)}${row+1}`, 'success');
            renderGrid(); saveAllData();
        }
    }
    function clearGrid(){
        gridCellTeams = Array(6).fill().map(()=>Array(5).fill(null));
        addConsoleMessage('Grid cleared', 'warning');
        renderGrid(); saveAllData();
    }

    // RENDER FUNCTIONS
    function renderTeamSelector(){
        const container = document.getElementById('teamSelectorContainer');
        if(!container) return;
        container.innerHTML = '';
        teams.forEach(team=>{
            const badge = document.createElement('div');
            badge.className = `team-badge ${activeTeamId===team.id?'active':''}`;
            const logoImg = team.logoDataURL ? `<img src="${team.logoDataURL}" class="team-badge-logo">` : `<span>🏆</span>`;
            badge.innerHTML = `${logoImg}<span>${escapeHtml(team.name)} (${team.members.length})</span>`;
            badge.addEventListener('click',()=>{ activeTeamId = team.id; addConsoleMessage(`Active: ${team.name}`, 'info'); renderAllUI(); saveAllData(); });
            container.appendChild(badge);
        });
        if(teams.length===0) container.innerHTML = '<div>⚠️ No teams — paste roster</div>';
    }
    function renderActiveTeamHeader(){
        const activeTeam = teams.find(t=>t.id===activeTeamId);
        const logoImg = document.getElementById('teamLogoLarge');
        const teamNameSpan = document.getElementById('activeTeamNameDisplay');
        const memberCountSpan = document.getElementById('activeMemberCount');
        if(!activeTeam){
            if(teamNameSpan) teamNameSpan.innerText = 'No Team Selected';
            if(memberCountSpan) memberCountSpan.innerText = '0 members';
            if(logoImg) logoImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232a3a55'/%3E%3Ctext x='50' y='67' font-size='40' text-anchor='middle' fill='%23F9B43A'%3E🏆%3C/text%3E%3C/svg%3E";
            return;
        }
        if(teamNameSpan) teamNameSpan.innerText = escapeHtml(activeTeam.name);
        if(memberCountSpan) memberCountSpan.innerText = `${activeTeam.members.length} members`;
        if(logoImg) logoImg.src = activeTeam.logoDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232a3a55'/%3E%3Ctext x='50' y='67' font-size='40' text-anchor='middle' fill='%23F9B43A'%3E🏆%3C/text%3E%3C/svg%3E";
    }
    function renderMembersColumn(){
        const container = document.getElementById('membersColumnList');
        if(!container) return;
        const activeTeam = teams.find(t=>t.id===activeTeamId);
        if(!activeTeam){ container.innerHTML = '<div style="padding:30px;text-align:center;">👈 Select a team</div>'; return; }
        if(activeTeam.members.length===0){ container.innerHTML = '<div style="padding:30px;text-align:center;">✨ No members yet.<br>Add member or paste roster</div>'; return; }
        let html = '';
        activeTeam.members.forEach((member,idx)=>{
            html += `<div class="member-card"><div class="member-info"><div class="member-ign">🎖️ ${escapeHtml(member.ign)}</div><div class="member-id">ID: ${escapeHtml(member.id||'—')}</div></div><div><button class="delete-member-btn" data-idx="${idx}">🗑️</button></div></div>`;
        });
        container.innerHTML = html;
        document.querySelectorAll('.delete-member-btn').forEach(btn=>{
            btn.addEventListener('click',()=>{ const idx = parseInt(btn.dataset.idx); if(confirm("Delete member?")) deleteMember(activeTeamId, idx); });
        });
    }
    
    function renderGrid(){
        const container = document.getElementById('battleGridContainer');
        if(!container) return;
        container.innerHTML = '';
        for(let r=0;r<6;r++){
            for(let c=0;c<5;c++){
                const teamId = gridCellTeams[r][c];
                const team = teamId ? teams.find(t=>t.id===teamId) : null;
                const div = document.createElement('div');
                div.className = `grid-cell ${team?'filled':''}`;
                if(team){
                    const logoUrl = team.logoDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232a3a55'/%3E%3Ctext x='50' y='67' font-size='40' text-anchor='middle' fill='%23F9B43A'%3E🏆%3C/text%3E%3C/svg%3E";
                    let membersHtml = '';
                    if(team.members.length === 0){
                        membersHtml = '<div style="padding:8px;">✨ No members</div>';
                    } else {
                        membersHtml = '<div class="cell-members-list">' + team.members.map(m => `
                            <div class="cell-member-item">
                                <div class="cell-member-ign">🎮 ${escapeHtml(m.ign)}</div>
                                <div class="cell-member-id">🆔 ${escapeHtml(m.id||'—')}</div>
                            </div>
                        `).join('') + '</div>';
                    }
                    div.innerHTML = `
                        <div class="cell-team-header">
                            <img src="${logoUrl}" class="cell-team-logo">
                            <div class="cell-team-name">${escapeHtml(team.name)}</div>
                        </div>
                        <div class="member-count-badge">📋 ${team.members.length} member${team.members.length!==1?'s':''}</div>
                        ${membersHtml}
                    `;
                } else {
                    div.innerHTML = `<div class="empty-slot-label">⚔️ EMPTY SLOT<br><span>${String.fromCharCode(65+c)}${r+1}</span><br>👇 Click to assign</div>`;
                }
                div.addEventListener('click',(()=>{
                    if(!activeTeamId){ addConsoleMessage('No active team selected', 'error'); alert("Select a team first"); return; }
                    const activeTeam = teams.find(t=>t.id===activeTeamId);
                    if(!activeTeam || activeTeam.members.length===0){ alert("Team has no members"); addConsoleMessage(`Cannot assign empty team`, 'warning'); return; }
                    assignTeamToCell(r,c,activeTeamId);
                    alert(`✅ Assigned "${activeTeam.name}" to ${String.fromCharCode(65+c)}${r+1}`);
                }));
                container.appendChild(div);
            }
        }
    }
    function renderAllUI(){ renderTeamSelector(); renderActiveTeamHeader(); renderMembersColumn(); renderGrid(); }

    function loadAllData(){
        try{
            const savedTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
            if(savedTeams && JSON.parse(savedTeams).length>0){
                teams = JSON.parse(savedTeams);
                if(teams.length) nextId = Math.max(...teams.map(t=>t.id),99)+1;
                const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEAM_ID);
                if(savedActiveId && teams.some(t=>t.id===parseInt(savedActiveId))) activeTeamId = parseInt(savedActiveId);
                else if(teams.length) activeTeamId = teams[0].id;
                const savedGrid = localStorage.getItem(STORAGE_KEYS.GRID_CELL_TEAMS);
                if(savedGrid){ gridCellTeams = JSON.parse(savedGrid); if(!gridCellTeams || gridCellTeams.length!==6) gridCellTeams = Array(6).fill().map(()=>Array(5).fill(null)); }
                addConsoleMessage(`Loaded ${teams.length} teams`, 'success');
            } else {
                teams = getDemoTeams();
                nextId = 101;
                activeTeamId = teams[0].id;
                gridCellTeams = Array(6).fill().map(()=>Array(5).fill(null));
                gridCellTeams[0][0] = teams[0].id;
                addConsoleMessage('Demo team loaded with 5 members', 'success');
            }
        } catch(e){ teams = getDemoTeams(); nextId=101; activeTeamId=teams[0].id; gridCellTeams = Array(6).fill().map(()=>Array(5).fill(null)); gridCellTeams[0][0]=teams[0].id; addConsoleMessage('Fallback demo', 'warning'); }
    }

    function setupEventListeners(){
        document.getElementById('parseAndCreateTeamBtn')?.addEventListener('click',()=>{
            const raw = document.getElementById('pasteRosterInput').value;
            if(!raw.trim()){ alert("Paste roster with TEAM NAME and IGN/ID blocks"); return; }
            const parsed = parseRosterFromText(raw);
            if(!parsed || parsed.members.length===0){ alert("No valid members found. Use format: TEAM NAME: XYZ\nIGN: Player\nID: 12345"); return; }
            createTeamFromParsed(parsed.teamName, parsed.members);
            document.getElementById('pasteRosterInput').value = '';
        });
        document.getElementById('clearPasteBtn')?.addEventListener('click',()=>{ document.getElementById('pasteRosterInput').value=''; });
        document.getElementById('createEmptyTeamBtn')?.addEventListener('click',()=>{ let name = document.getElementById('quickTeamName').value.trim(); if(name) createEmptyTeam(name); else alert("Enter team name"); document.getElementById('quickTeamName').value=''; });
        document.getElementById('addMemberBtn')?.addEventListener('click',()=>{ let ign=document.getElementById('newMemberIgn').value.trim(); let id=document.getElementById('newMemberId').value.trim(); if(addMemberToActiveTeam(ign,id)){ document.getElementById('newMemberIgn').value=''; document.getElementById('newMemberId').value=''; } });
        document.getElementById('placeTeamToSelectedCellBtn')?.addEventListener('click',()=>{
            if(!activeTeamId){ alert("No active team"); return; }
            const activeTeam = teams.find(t=>t.id===activeTeamId);
            if(!activeTeam || activeTeam.members.length===0){ alert("Team has no members"); return; }
            let row = prompt("ROW (1-6):"); if(!row) return;
            let col = prompt("COLUMN (1-5):"); if(!col) return;
            let r=parseInt(row)-1, c=parseInt(col)-1;
            if(r>=0 && r<6 && c>=0 && c<5) assignTeamToCell(r,c,activeTeamId);
            else alert("Invalid cell");
        });
        document.getElementById('clearGridBtn')?.addEventListener('click',clearGrid);
        document.getElementById('resetGridBtn')?.addEventListener('click',clearGrid);
        document.getElementById('deleteTeamBtn')?.addEventListener('click',()=>{ if(confirm("Delete current team?")) deleteActiveTeam(); });
        document.getElementById('deleteAllTeamsBtn')?.addEventListener('click',deleteAllTeams);
        const uploadBtn = document.getElementById('uploadLogoBtn'), fileInput = document.getElementById('logoFileInput');
        uploadBtn?.addEventListener('click',()=>fileInput.click());
        fileInput?.addEventListener('change',(e)=>{
            const file = e.target.files[0];
            if(file && activeTeamId){
                const reader = new FileReader();
                reader.onload = (ev)=>{ updateTeamLogo(activeTeamId, ev.target.result); };
                reader.readAsDataURL(file);
            }
            fileInput.value='';
        });
    }

    loadAllData();
    setupEventListeners();
    renderAllUI();
    addConsoleMessage('NO-SCROLL GRID ACTIVE | PANIC ULT format parser ready (IGN/ID blocks + TEAM NAME)', 'success');
