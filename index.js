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
//bromita interna
let motorSound = document.getElementById("motorSound");
let motorAttempts = 0;


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

    motorSound.currentTime = 0;
    motorSound.play();
  } else {
    on = false;
    turnCounter.innerHTML = "";
    clearColor();
    clearInterval(intervalId);
    motorSound.pause();
    motorSound.currentTime = 0;
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

//MODULO REGISTRO/LOGIN
// Actualiza el registration/login handler
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
          // logica del logeo
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
          // Logica del registro
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
      showPostLoginMenu();
      playerNameInput.value = "";
      document.getElementById('password').value = "";
      document.getElementById('confirmPassword').value = "";
      
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
  document.getElementById('postLoginMenu').style.display = 'none';
  document.getElementById('fullScoreboard').style.display = 'none';
  
  currentPlayer = null;
  on = false;
  win = false;
  clearInterval(intervalId);
  clearColor();
  turnCounter.innerHTML = "";
  onButton.checked = false;  
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

//MODULO PUNTUACION
/**
 * Actualiza el scoreboard con los top players en función de sus scores.
 *
 * @function updateScoreboard
 * @returns {void}
 *
 * @description
 * Esta función ordena a los players por sus scores en orden descendente.
 * Luego, actualiza los nombres y los scores de los 3 top players en el scoreboard.
 * También actualiza el rank del player y la muestra.
 *
 * @param {Array} sorted - Array de players sorted por sus scores en orden descendiente.
 * @param {NodeList} entries - NodeList de las entradas del scoreboard.
 * @param {Object} player - Object representando al player.
 * @param {HTMLElement} rankElement - HTML element mostrando el rank del player.
 */
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

//MODULO DEL JUEGO
/**
 * Comienza un new game de Simon Says.
 *
 * @function play
 * @returns {void}
 *
 * @description
 * Esta función inicializa el estado del game, genera una nueva secuencia aleatoria
 * e inicia el bucle del game.
 *
 * @param {boolean} [win=false] - indica si la ronda se ganó.
 * @param {Array} [order=[]] - La secuencia de colores generada por la computadora.
 * @param {Array} [playerOrder=[]] - La secuencia de colores introducida por el jugador.
 * @param {number} [flash=0] - Index del color actual que se está mostrando.
 * @param {number} [intervalId=0] - ID del temporizador de intervalo para el bucle del game.
 * @param {number} [turn=1] - Número de turno actual.
 * @param {boolean} [good=true] - Indica si la secuencia del jugador coincide con la secuencia de la computadora.
 * @param {boolean} [compTurn=true] - Indica si es el turno de la computadora de hacer parpadear los colores.
 */
function play() {
  document.getElementById('postLoginMenu').style.display = 'none';
  document.getElementById('fullScoreboard').style.display = 'none';  
  win = false;
  order = [];
  playerOrder = [];
  flash = 0;
  intervalId = 0;
  turn = 1;
  good = true;
  compTurn = true;
  
  // Genera la secuencia inicial
  for (let i = 0; i < 50; i++) { // genera una secuencia inicial mas larga
      order.push(Math.floor(Math.random() * 4) + 1);
  }
  
  // Reinicia
  turnCounter.innerHTML = "1";
  clearColor();
  
  // empieza
  intervalId = setInterval(gameTurn, 800);
  updateScoreboard();
}

//MODULO LOGICA
/**
 * Maneja la lógica de turnos del game.
 * Esta función es responsable de cambiar el estado del game en función del turno actual.
 * Borra los botones del game, actualiza el estado del game y reproduce los sonidos asociados a cada botón.
 *
 * @function gameTurn
 * @returns {void}
 */
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


/**
 * Reproduce el sonido asociado con el cuarto(fourth) botón y cambia su color de fondo.
 *
 * @function four
 * @returns {void}
 */
function four() {
  // Comprueba si el ruido está habilitado
  if (noise) {
    // Obteniene el elemento de audio asociado con el cuarto botón
    let audio = document.getElementById("clip4");
    // Reproduce el sonido
    audio.play();
  }
  // Establece el ruido en verdadero para permitir reproducir el sonido nuevamente
  noise = true;
  // Cambia el color de fondo del cuarto botón
  bottomRight.style.backgroundColor = "lightskyblue";
}


/**
 * Limpia el color de fondo de los botones del juego.
 *
 * @function clearColor
 * @returns {void}
 */
function clearColor() {
  topLeft.style.backgroundColor = "darkgreen";
  topRight.style.backgroundColor = "darkred";
  bottomLeft.style.backgroundColor = "goldenrod";
  bottomRight.style.backgroundColor = "darkblue";
}


/**
 * Genera un flash del color de fondo de los botones del game en sus respectivos colores.
 *
 * @function flashColor
 * @returns {void}
 *
 * @example
 * flashColor();
 * // Los colores de fondo de los botones del game se establecerán de la siguiente manera:
 * // topLeft: lightgreen
 * // topRight: tomato
 * // bottomLeft: yellow
 * // bottomRight: lightskyblue
 */
function flashColor() {
  topLeft.style.backgroundColor = "lightgreen";
  topRight.style.backgroundColor = "tomato";
  bottomLeft.style.backgroundColor = "yellow";
  bottomRight.style.backgroundColor = "lightskyblue";
}


/**
 * Detector de eventos para el evento de clic del botón superior izquierdo.
 * Esta función maneja la lógica del game cuando se hace clic en el botón superior izquierdo.
 *
 * @param {Event} event 
 *
 * @returns {void}
 */
topLeft.addEventListener('click', (event) => {
  // Revisa si el game se activo
  if (on) {
    // Añade el número del botón al orden del player
    playerOrder.push(1);
    // Revisa el orden del player
    check();
    // Reproducir el sonido y cambiar el color del botón topLeft
    one();
    // Si no se gana el game, borra el color después de un delay.
    if(!win) {
      setTimeout(() => {
        clearColor();
      }, 300);
    }
  }
});

/**
 * Event listener para el boton topRight cuando le de click.
 * Esta función maneja la lógica del game cuando se hace clic en el botón topRight.
 *
 * @param {Event} event
 *
 * @returns {void}
 */
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
});

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
});

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
//MODULO DEL INGAME FUNCTIONS
/**
 * Comprueba el orden del player con el orden de la computadora.
 * Actualiza el estado del game según la comparación.
 *
 * @function check
 * @returns {void}
 */
function check() {
  if (playerOrder[playerOrder.length - 1] !== order[playerOrder.length - 1]) {
    good = false;
    if(on) {
      motorAttempts++;
      motorSound.currentTime = 0.3 * (motorAttempts % 3); // Vary start point
      motorSound.playbackRate = 1 + (motorAttempts * 0.1);
      motorSound.play();
    }    
  }

  // Actualiza el winning condition a (5 rounds = 50 points)
  if (turn % 5 === 0 && good && !win) { // !win check
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

//MODULO VICTORIAS DEL GAME
/**
 * Maneja la condición de victoria del game.
 * Actualiza el puntaje del player, reproduce un sonido de victoria, actualiza al player en el array allPlayers,
 * guarda los datos actualizados del jugador y de allPlayers en localStorage, actualiza el scoreboard,
 * y muestra un mensaje del rank/rango al player.
 * Después de una demora de 3 segundos, el game continúa con la siguiente ronda.
 *
 * @function winGame
 * @returns {void}
 */
function winGame() {
  win = true;
  flashColor();
  turnCounter.innerHTML = "WIN!";

  // Actualiza el score
  currentPlayer.score += 5 * 10;
  if (noise) {
    let audio = document.getElementById("winSound");
    audio.play();
  }

  // Actualiza al player en el array de allPlayers
  const playerIndex = allPlayers.findIndex(p => p.id === currentPlayer.id);
  if (playerIndex > -1) {
      allPlayers[playerIndex] = currentPlayer;
  }
  
  localStorage.setItem('players', JSON.stringify(allPlayers));
  localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
  updateScoreboard();
  showRankMessage();
  
  setTimeout(() => {
      win = false;
      turn++; // Incrementa siguiente round
      turnCounter.innerHTML = turn;
      playerOrder = [];
      compTurn = true;
      flash = 0;
      clearColor();
      
      // extiende la sequencia
      if (turn > order.length) {
          order.push(Math.floor(Math.random() * 4) + 1);
      }
      
      intervalId = setInterval(gameTurn, 800);
  }, 1500);
}


/**
 * Maneja la condición de victoria del game.
 * Actualiza el puntaje del player, reproduce un sonido de victoria, actualiza al player en el array allPlayers,
 * guarda los datos actualizados del player y de allPlayers en localStorage, actualiza el marcador,
 * y muestra un mensaje de clasificación al player.
 * Después de una demora de 3 segundos, el game continúa con la siguiente ronda.
 *
 * @function winGame
 * @returns {void}
 */
function showRankMessage() {
  // Ordena a los players por puntuación en orden descendente.
  const sorted = [...allPlayers].sort((a, b) => b.score - a.score);

  // Encuentra el ranking del player actual
  const rank = sorted.findIndex(p => p.id === currentPlayer.id) + 1;

  // Mostrar diferentes mensajes según el ranking del player.
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

/**
 * Activa el modo de autenticación entre inicio de sesión y registro.
 * Actualiza el título del modal, el texto del botón de envío y la visibilidad del campo de confirmación de contraseña.
 * También actualiza el texto del enlace para alternar entre inicio de sesión y registro.
 * Borra el campo de confirmación de contraseña al cambiar al modo de inicio de sesión.
 *
 * @returns {void}
 */
function toggleAuthMode() {
  const isLogin = modalTitle.textContent.includes('Login');
  const confirmPasswordInput = document.getElementById('confirmPassword'); 

  modalTitle.textContent = isLogin ? 'Register Player' : 'Login';
  submitAuth.textContent = isLogin ? 'Register' : 'Login';
  // Mostrar/ocultar el campo de confirmación de contraseña
  document.getElementById('confirmPasswordGroup').style.display = isLogin ? 'block' : 'none';
  confirmPasswordInput.required = isLogin;
  authToggle.innerHTML = isLogin ? 
      'Already have an account? <a href="#" onclick="toggleAuthMode()">Login instead</a>' :
      'Don\'t have an account? <a href="#" onclick="toggleAuthMode()">Register instead</a>';

  // Borrar el campo de confirmación de contraseña al cambiar al inicio de sesión
  if (!isLogin) {
      document.getElementById('confirmPassword').value = "";
  }
}


// Funciones para el login y registro
function showPostLoginMenu() {
  document.getElementById('menuPlayerName').textContent = currentPlayer.name;
  document.getElementById('postLoginMenu').style.display = 'block';
}

function continuePlaying() {
  document.getElementById('postLoginMenu').style.display = 'none';
  startButton.click();
}

function showFullScoreboard() {
  const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
  const scoresList = document.getElementById('fullScoresList');
  scoresList.innerHTML = '';
  
  sortedPlayers.forEach((player, index) => {
      const entry = document.createElement('div');
      entry.className = 'full-score-entry';
      entry.innerHTML = `
          <span>${index + 1}. ${player.name}</span>
          <span>${player.score}</span>
      `;
      scoresList.appendChild(entry);
  });
  
  document.getElementById('postLoginMenu').style.display = 'none';
  document.getElementById('fullScoreboard').style.display = 'block';
}

function closeFullScoreboard() {
  document.getElementById('fullScoreboard').style.display = 'none';
  showPostLoginMenu();
  
}

/**
 * Retorna el game al main menu.
 *
 * @function returnToMainMenu
 * @returns {void}
 *
 * @description
 * Esta función detiene el game, borra el estado del game, oculta otros elementos
 * y muestra el menú o modal posterior al inicio de sesión en función de si el player ha iniciado sesión o no.
 *
 * @param {boolean} on
 * @param {boolean} win
 * @param {number} intervalId
 * @param {HTMLElement} turnCounter
 * @param {HTMLElement} onButton
 * @param {Object} currentPlayer
 * @param {HTMLElement} fullScoreboard
 */
function returnToMainMenu() {
  // Detener el game
  on = false;
  win = false;
  clearInterval(intervalId);
  clearColor();
  turnCounter.innerHTML = "";
  onButton.checked = false;

  // Mostrar menú post-login
  if(currentPlayer) {
      showPostLoginMenu();
  } else {
      showModal();
  }

  // Ocultar otros elementos
  document.getElementById('fullScoreboard').style.display = 'none';
}

