let order = [];
let playerOrder = [];
let flash;
let turn;
let good;
let compTurn;
let intervalId;
let noise = true;
let on = false;
let win;
let currentPlayer = null;
let allPlayers = JSON.parse(localStorage.getItem('players') || '[]');

const turnCounter = document.querySelector("#turn");
const topLeft = document.querySelector("#topleft");
const topRight = document.querySelector("#topright");
const bottomLeft = document.querySelector("#bottomleft");
const bottomRight = document.querySelector("#bottomright");
const onButton = document.querySelector("#on");
const startButton = document.querySelector("#start");
const modal = document.getElementById("userModal");
const span = document.getElementsByClassName("close")[0];
const registrationForm = document.getElementById("registrationForm");
const playerNameInput = document.getElementById("playerName");
const logoutBtn = document.getElementById('logoutBtn');


window.addEventListener('load', () => {
  allPlayers = JSON.parse(localStorage.getItem('players') || []);
  const currentPlayerData = localStorage.getItem('currentPlayer');
  
  // Resetea el auth mode para hacer login si hay players existentes
  if (allPlayers.length > 0) {
      toggleAuthMode();
  }
  
  if (currentPlayerData) {
      currentPlayer = JSON.parse(currentPlayerData);
      updateUI();
  } else {
      showModal();
  }
  updateScoreboard();
});

onButton.addEventListener('click', (event) => {
  if (onButton.checked == true) {
    on = true;
    turnCounter.innerHTML = "-";
  } else {
    on = false;
    turnCounter.innerHTML = "";
    clearColor();
    clearInterval(intervalId);
  }
});

startButton.addEventListener('click', (event) => {
  if (currentPlayer) {
      if (on || win) {
          play();
      } else {
          // Prende el boton de encendido una vez se le da click a "play"
          onButton.checked = true;
          on = true;
          turnCounter.innerHTML = "-";
          play();
      }
  } else {
      showModal();
  }
});

// Se actualizo el registration/login handler
registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = playerNameInput.value.trim();
  const password = document.getElementById('password').value;
  const isLogin = modalTitle.textContent.includes('Login');

  if (!name || !password) {
      alert('Please fill in all fields');
      return;
  }

  try {
      const hashedPassword = await hashPassword(password);
      const existingPlayer = allPlayers.find(p => p.name.toLowerCase() === name.toLowerCase());

      if (isLogin) {
          if (!existingPlayer) {
              alert('User not found');
              return;
          }
          if (existingPlayer.password !== hashedPassword) {
              alert('Incorrect password');
              return;
          }
          currentPlayer = existingPlayer;
      } else {
          const confirmPassword = document.getElementById('confirmPassword').value;
          if (password !== confirmPassword) {
              alert('Passwords do not match');
              return;
          }
          if (existingPlayer) {
              alert('Username already taken');
              return;
          }

          currentPlayer = {
              name: name,
              score: 0,
              id: Date.now(),
              password: hashedPassword
          };
          allPlayers.push(currentPlayer);
      }

      localStorage.setItem('players', JSON.stringify(allPlayers));
      localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
      updateUI();
      modal.style.display = "none";
      playerNameInput.value = "";
      document.getElementById('password').value = "";
      if (document.getElementById('confirmPassword')) {
          document.getElementById('confirmPassword').value = "";
      }
  } catch (error) {
      alert(error.message);
  }
});

logoutBtn.addEventListener('click', () => {
  // Guarda el score actual
  const index = allPlayers.findIndex(p => p.id === currentPlayer.id);
  if (index > -1) {
      allPlayers[index].score = Math.max(allPlayers[index].score, currentPlayer.score);
  }
  
  localStorage.setItem('players', JSON.stringify(allPlayers));
  localStorage.removeItem('currentPlayer');
  
  currentPlayer = null;
  updateUI();
  showModal();
});

function showModal() {
  if (!currentPlayer) {
      modal.style.display = "block";
  }
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
span.onclick = function() {
  modal.style.display = "none";
}

function updateScoreboard() {
  // busca players por score
  const sorted = [...allPlayers].sort((a, b) => b.score - a.score);
  
  // Actualiza a los top 3
  const entries = document.querySelectorAll('.score-entry');
  entries.forEach((entry, index) => {
      const player = sorted[index];
      if (player) {
          entry.querySelector('.player').textContent = `${index + 1}rd: ${player.name}`;
          entry.querySelector('.score').textContent = player.score;
      }
  });
  
  // actualiza al player display actual
  if (currentPlayer) {
      const rank = sorted.findIndex(p => p.id === currentPlayer.id) + 1;
      const totalPlayers = sorted.length;
      const rankElement = document.getElementById('playerRank');
      
      if (rank > 0) {
          const percentage = Math.round((rank / totalPlayers) * 100);
          rankElement.textContent = `Your rank: Top ${percentage}%`;
      }
  }
}
function saveToLocalStorage() {
  localStorage.setItem('playerData', JSON.stringify(currentPlayer));
}
function play() {
  win = false;
  order = [];
  playerOrder = [];
  flash = 0;
  intervalId = 0;
  turn = 1;
  turnCounter.innerHTML = 1;
  good = true;
  for (var i = 0; i < 20; i++) {
    order.push(Math.floor(Math.random() * 4) + 1);
  }
  compTurn = true;

  intervalId = setInterval(gameTurn, 800);
}

function gameTurn() {
  on = false;

  if (flash == turn) {
    clearInterval(intervalId);
    compTurn = false;
    clearColor();
    on = true;
  }

  if (compTurn) {
    clearColor();
    setTimeout(() => {
      if (order[flash] == 1) one();
      if (order[flash] == 2) two();
      if (order[flash] == 3) three();
      if (order[flash] == 4) four();
      flash++;
    }, 200);
  }
}

function one() {
  if (noise) {
    let audio = document.getElementById("clip1");
    audio.play();
  }
  noise = true;
  topLeft.style.backgroundColor = "lightgreen";
}

function two() {
  if (noise) {
    let audio = document.getElementById("clip2");
    audio.play();
  }
  noise = true;
  topRight.style.backgroundColor = "tomato";
}

function three() {
  if (noise) {
    let audio = document.getElementById("clip3");
    audio.play();
  }
  noise = true;
  bottomLeft.style.backgroundColor = "yellow";
}

function four() {
  if (noise) {
    let audio = document.getElementById("clip4");
    audio.play();
  }
  noise = true;
  bottomRight.style.backgroundColor = "lightskyblue";
}

function clearColor() {
  topLeft.style.backgroundColor = "darkgreen";
  topRight.style.backgroundColor = "darkred";
  bottomLeft.style.backgroundColor = "goldenrod";
  bottomRight.style.backgroundColor = "darkblue";
}

function flashColor() {
  topLeft.style.backgroundColor = "lightgreen";
  topRight.style.backgroundColor = "tomato";
  bottomLeft.style.backgroundColor = "yellow";
  bottomRight.style.backgroundColor = "lightskyblue";
}

topLeft.addEventListener('click', (event) => {
  if (on) {
    playerOrder.push(1);
    check();
    one();
    if(!win) {
      setTimeout(() => {
        clearColor();
      }, 300);
    }
  }
})

topRight.addEventListener('click', (event) => {
  if (on) {
    playerOrder.push(2);
    check();
    two();
    if(!win) {
      setTimeout(() => {
        clearColor();
      }, 300);
    }
  }
})

bottomLeft.addEventListener('click', (event) => {
  if (on) {
    playerOrder.push(3);
    check();
    three();
    if(!win) {
      setTimeout(() => {
        clearColor();
      }, 300);
    }
  }
})

bottomRight.addEventListener('click', (event) => {
  if (on) {
    playerOrder.push(4);
    check();
    four();
    if(!win) {
      setTimeout(() => {
        clearColor();
      }, 300);
    }
  }
})

function check() {
  if (playerOrder[playerOrder.length - 1] !== order[playerOrder.length - 1]) {
      good = false;
  }

  // Actualiza el winning condition a (5 rounds = 50 points)
  if (turn === 5 && good) {
      winGame();
      return;
  }

  if (good === false) {
      flashColor();
      turnCounter.innerHTML = "NO!";
      setTimeout(() => {
          turnCounter.innerHTML = turn;
          clearColor();

              compTurn = true;
              flash = 0;
              playerOrder = [];
              good = true;
              intervalId = setInterval(gameTurn, 800);
          
      }, 800);
      noise = false;
  }

  if (turn === playerOrder.length && good && !win) {
      turn++;
      playerOrder = [];
      compTurn = true;
      flash = 0;
      turnCounter.innerHTML = turn;
      intervalId = setInterval(gameTurn, 800);
  }
}



function updateUI() {
  if (currentPlayer) {
      logoutBtn.style.display = 'block';
      startButton.disabled = false;
      document.querySelector('.scoreboard h2').textContent = `Top Players (${allPlayers.length} total)`;
  } else {
      logoutBtn.style.display = 'none';
      startButton.disabled = true;
  }
  updateScoreboard();
}


function winGame() {
  flashColor();
  turnCounter.innerHTML = "WIN!";
  
  // Actualiza el score
  currentPlayer.score += turn * 10;
  if (noise) {
    let audio = document.getElementById("winSound");
    audio.play();
  }
  
  // actualiza al player en el allPlayers array
  const playerIndex = allPlayers.findIndex(p => p.id === currentPlayer.id);
  if (playerIndex > -1) {
    allPlayers[playerIndex] = currentPlayer;
  }
  
  // Guarda en localStorage
  localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
  localStorage.setItem('players', JSON.stringify(allPlayers)); // Add this line
  
  updateScoreboard();
  showRankMessage();

  setTimeout(() => {
    win = true;
    clearColor();
    play();
  }, 3000);
}

function showRankMessage() {
  const sorted = [...allPlayers].sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex(p => p.id === currentPlayer.id) + 1;
  
  if (rank === 1) {
      alert("🏆 New High Score! You're #1!");
  } else if (rank <= 3) {
      alert(`🎉 Congratulations! You're in the top ${rank}!`);
  } else {
      alert(`👍 Good job! You're ranked #${rank} out of ${sorted.length}`);
  }
}

//MODULO DE SEGURIDAD
// Funciones para el helper
async function hashPassword(password) {
  try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
      console.error('Hashing error:', error);
      throw new Error('Password hashing failed');
  }
}

function toggleAuthMode() {
  const isLogin = modalTitle.textContent.includes('Login');
  modalTitle.textContent = isLogin ? 'Register Player' : 'Login';
  submitAuth.textContent = isLogin ? 'Register' : 'Login';
  document.getElementById('confirmPasswordGroup').style.display = isLogin ? 'none' : 'block';
  authToggle.innerHTML = isLogin ? 
      'Already have an account? <a href="#" onclick="toggleAuthMode()">Login instead</a>' :
      'Don\'t have an account? <a href="#" onclick="toggleAuthMode()">Register instead</a>';
}

