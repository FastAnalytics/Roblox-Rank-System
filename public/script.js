// API Base URL
const API_BASE = '/api';
let allPlayers = [];

// Tab Navigation
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
    
    if (button.dataset.tab === 'players') {
      loadPlayers();
    }
  });
});

// Load players
async function loadPlayers() {
  try {
    const response = await fetch(`${API_BASE}/players`);
    allPlayers = await response.json();
    displayPlayers(allPlayers);
    updateStats();
  } catch (error) {
    showNotification('Error loading players: ' + error.message, 'error');
  }
}

// Display players
function displayPlayers(players) {
  const playersList = document.getElementById('players-list');
  
  if (players.length === 0) {
    playersList.innerHTML = '<p class="empty-state">No players added yet</p>';
    return;
  }

  playersList.innerHTML = players.map(player => `
    <div class="player-card">
      <h3>${player.username}</h3>
      <span class="player-rank">${player.currentRank}</span>
      <div class="player-info">
        <p>Roblox ID: ${player.robloxId}</p>
        <p>Joined: ${new Date(player.joinedDate).toLocaleDateString()}</p>
      </div>
      <div class="player-actions">
        <button class="btn btn-success" onclick="promotePlayer('${player.robloxId}')">Promote</button>
        <button class="btn btn-warning" onclick="demotePlayer('${player.robloxId}')">Demote</button>
        <button class="btn btn-info" onclick="editPlayerRank('${player.robloxId}')">Edit</button>
        <button class="btn btn-danger" onclick="deletePlayer('${player.robloxId}')">Delete</button>
      </div>
      <a href="https://www.roblox.com/users/${player.robloxId}/profile" target="_blank" class="roblox-link">View Roblox Profile</a>
    </div>
  `).join('');
}

// Add player modal
const addPlayerBtn = document.getElementById('add-player-btn');
const addPlayerModal = document.getElementById('add-player-modal');
const closeModal = document.querySelector('.close-modal');
const addPlayerForm = document.getElementById('add-player-form');

addPlayerBtn.addEventListener('click', () => {
  addPlayerModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  addPlayerModal.classList.add('hidden');
});

addPlayerModal.addEventListener('click', (e) => {
  if (e.target === addPlayerModal) {
    addPlayerModal.classList.add('hidden');
  }
});

addPlayerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const robloxId = document.getElementById('roblox-id').value;
  const username = document.getElementById('player-username').value;
  const rank = document.getElementById('player-rank').value;

  try {
    const response = await fetch(`${API_BASE}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ robloxId, username, rank })
    });

    if (!response.ok) throw new Error('Failed to add player');
    
    showNotification('Player added successfully! 🎉');
    addPlayerForm.reset();
    addPlayerModal.classList.add('hidden');
    loadPlayers();
  } catch (error) {
    showNotification('Error adding player: ' + error.message, 'error');
  }
});

// Promote player
async function promotePlayer(robloxId) {
  try {
    const response = await fetch(`${API_BASE}/players/${robloxId}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performedBy: 'System' })
    });

    if (!response.ok) throw new Error('Failed to promote player');
    
    const result = await response.json();
    showNotification(`✅ Promoted ${result.robloxId} from ${result.oldRank} to ${result.newRank}`);
    loadPlayers();
  } catch (error) {
    showNotification('Error promoting player: ' + error.message, 'error');
  }
}

// Demote player
async function demotePlayer(robloxId) {
  try {
    const response = await fetch(`${API_BASE}/players/${robloxId}/demote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performedBy: 'System' })
    });

    if (!response.ok) throw new Error('Failed to demote player');
    
    const result = await response.json();
    showNotification(`⬇️ Demoted ${result.robloxId} from ${result.oldRank} to ${result.newRank}`);
    loadPlayers();
  } catch (error) {
    showNotification('Error demoting player: ' + error.message, 'error');
  }
}

// Edit player rank
async function editPlayerRank(robloxId) {
  const player = allPlayers.find(p => p.robloxId === robloxId);
  if (!player) return;

  const ranks = ['Member', 'Moderator', 'Admin', 'Owner'];
  const newRank = prompt(`Set rank for ${player.username}:\n\nCurrent: ${player.currentRank}\n\nOptions: ${ranks.join(', ')}\n\nEnter new rank:`, player.currentRank);

  if (!newRank || newRank === player.currentRank) return;

  try {
    const response = await fetch(`${API_BASE}/players/${robloxId}/rank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRank, performedBy: 'System' })
    });

    if (!response.ok) throw new Error('Failed to set rank');
    
    const result = await response.json();
    showNotification(`🎖️ Set ${result.robloxId} rank to ${result.newRank}`);
    loadPlayers();
  } catch (error) {
    showNotification('Error setting rank: ' + error.message, 'error');
  }
}

// Delete player
async function deletePlayer(robloxId) {
  if (!confirm('Are you sure you want to delete this player?')) return;

  try {
    const response = await fetch(`${API_BASE}/players/${robloxId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete player');
    
    showNotification('Player deleted successfully');
    loadPlayers();
  } catch (error) {
    showNotification('Error deleting player: ' + error.message, 'error');
  }
}

// Handle commands
async function handleCommand(command) {
  const inputSelectors = {
    promote: '.promote-input',
    demote: '.demote-input',
    setrank: '.setrank-input'
  };

  const input = document.querySelector(inputSelectors[command])?.value;
  
  if (!input) {
    showNotification('Please enter a Roblox ID or username', 'error');
    return;
  }

  // Find player by ID or username
  const player = allPlayers.find(p => 
    p.robloxId === input || p.username.toLowerCase() === input.toLowerCase()
  );

  if (!player) {
    showNotification('Player not found', 'error');
    return;
  }

  if (command === 'promote') {
    await promotePlayer(player.robloxId);
  } else if (command === 'demote') {
    await demotePlayer(player.robloxId);
  } else if (command === 'setrank') {
    const rankSelect = document.querySelector('.setrank-rank');
    const newRank = rankSelect.value;
    try {
      const response = await fetch(`${API_BASE}/players/${player.robloxId}/rank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRank, performedBy: 'System' })
      });
      if (!response.ok) throw new Error('Failed to set rank');
      const result = await response.json();
      showNotification(`🎖️ Set ${result.robloxId} rank to ${result.newRank}`);
      loadPlayers();
    } catch (error) {
      showNotification('Error setting rank: ' + error.message, 'error');
    }
  }
}

// Update stats
function updateStats() {
  document.getElementById('total-players').textContent = allPlayers.length;
}

// Search players
document.getElementById('search-players').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allPlayers.filter(p => 
    p.username.toLowerCase().includes(query) || 
    p.robloxId.includes(query)
  );
  displayPlayers(filtered);
});

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type === 'error' ? 'error' : ''}`;
  notification.classList.remove('hidden');

  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// Save settings
function saveGroupId() {
  const groupId = document.getElementById('group-id').value;
  if (groupId) {
    localStorage.setItem('roblox-group-id', groupId);
    showNotification('Group ID saved! 💾');
  }
}

function saveApiKey() {
  const apiKey = document.getElementById('api-key').value;
  if (apiKey) {
    localStorage.setItem('roblox-api-key', apiKey);
    showNotification('API Key saved! 💾');
  }
}

// Load settings on page load
window.addEventListener('load', () => {
  const savedGroupId = localStorage.getItem('roblox-group-id');
  const savedApiKey = localStorage.getItem('roblox-api-key');
  
  if (savedGroupId) document.getElementById('group-id').value = savedGroupId;
  if (savedApiKey) document.getElementById('api-key').value = savedApiKey;
  
  loadPlayers();
});
