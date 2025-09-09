// Esperar a que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  // --- INICIO: Implementación de Sonidos ---
  let isSoundEnabled = false;
  const toggleSoundBtn = document.getElementById("toggle-sound-btn");

  // 🎵 Cargar audios
  const audioClick = new Audio('assets/sounds/mouse-click-290204.mp3');
  const audioWin = new Audio('assets/sounds/you-win-sequence-2-183949.mp3');
  const audioLose = new Audio('assets/sounds/fiasco-154915.mp3');
  const audioBackground = new Audio('assets/sounds/running-night-393139.mp3');
  audioBackground.volume = 0.2; // 20%
  audioBackground.loop = true;

  // ✅ Función para desbloquear audio (truco garantizado)
  async function unlockAudio() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
      await ctx.resume();
    } catch (e) {
      console.log("No se pudo desbloquear AudioContext:", e);
    }
  }

  // ✅ Función segura para reproducir cualquier audio
  function playAudio(audio) {
    if (!isSoundEnabled) return;
    audio.currentTime = 0; // Reiniciar en caso de estar pausado
    audio.play().catch(e => {
      console.log("Audio bloqueado. Intentando desbloquear...", e);
      unlockAudio().then(() => {
        audio.play().catch(e2 => console.log("Sigue bloqueado:", e2));
      });
    });
  }

  // ✅ Función para activar/desactivar sonido
  async function toggleSound() {
    if (isSoundEnabled) {
      audioBackground.pause();
      toggleSoundBtn.textContent = "🔊 Activar música de fondo";
      toggleSoundBtn.classList.remove("playing");
      isSoundEnabled = false;
    } else {
      try {
        await unlockAudio();
        await audioBackground.play();
        isSoundEnabled = true;
        toggleSoundBtn.textContent = "🔇 Desactivar música";
        toggleSoundBtn.classList.add("playing");
      } catch (e) {
        console.log("Error al activar música:", e);
        alert("Haz clic en cualquier parte de la pantalla para habilitar el sonido.");
      }
    }
  }

  // Asignar evento al botón
  if (toggleSoundBtn) {
    toggleSoundBtn.onclick = toggleSound;
  }
  // --- FIN: Implementación de Sonidos ---

  const cells = document.querySelectorAll(".cell");
  const playerTurn = document.getElementById("player-turn");
  const restartButton = document.getElementById("restart-button");

  let currentTurn = "X";
  let gameBoard = Array(9).fill(null);
  let gameId = null;

  // 🆕 Variables para modo IA
  let gameMode = null; // 'ai' o 'online'

  // 🤖 IA INTELIGENTE (Modo Difícil) - Verdadero 3 en raya
  function makeAIMove() {
    if (gameMode !== 'ai') return;

    setTimeout(() => {
      // 1. Si la IA puede ganar, lo hace
      const winMove = findWinningMove("O");
      if (winMove !== null) {
        gameBoard[winMove] = "O";
        playAudio(audioClick);
        updateBoardUI();
        endGameWithMessage("¡Perdiste! La IA fue mejor esta vez.");
        return;
      }

      // 2. Si el jugador puede ganar en el siguiente turno, lo bloquea
      const blockMove = findWinningMove("X");
      if (blockMove !== null) {
        gameBoard[blockMove] = "O";
        playAudio(audioClick);
        updateBoardUI();
        checkGameStatusAfterAIMove();
        return;
      }

      // 3. Si el centro está libre, lo toma
      if (gameBoard[4] === null) {
        gameBoard[4] = "O";
        playAudio(audioClick);
        updateBoardUI();
        checkGameStatusAfterAIMove();
        return;
      }

      // 4. Toma una esquina si está libre
      const corners = [0, 2, 6, 8];
      const availableCorners = corners.filter(i => gameBoard[i] === null);
      if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        gameBoard[randomCorner] = "O";
        playAudio(audioClick);
        updateBoardUI();
        checkGameStatusAfterAIMove();
        return;
      }

      // 5. Toma cualquier casilla disponible
      const availableMoves = gameBoard.map((cell, index) => cell === null ? index : null).filter(i => i !== null);
      if (availableMoves.length > 0) {
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        gameBoard[randomMove] = "O";
        playAudio(audioClick);
        updateBoardUI();
        checkGameStatusAfterAIMove();
      }
    }, 400); // Pequeña demora para que sea más natural
  }

  // 🔍 Encuentra un movimiento ganador para el jugador dado ('X' o 'O')
  function findWinningMove(player) {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];

    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      // Si dos casillas son del jugador y la tercera está vacía → ¡movimiento ganador!
      if (gameBoard[a] === player && gameBoard[b] === player && gameBoard[c] === null) return c;
      if (gameBoard[a] === player && gameBoard[c] === player && gameBoard[b] === null) return b;
      if (gameBoard[b] === player && gameBoard[c] === player && gameBoard[a] === null) return a;
    }
    return null;
  }

  // ✅ Verifica estado del juego después del movimiento de la IA
  function checkGameStatusAfterAIMove() {
    const winPatterns = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];

    // Verificar si la IA ganó
    for (let pattern of winPatterns) {
      const [a,b,c] = pattern;
      if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
        if (gameBoard[a] === "O") {
          endGameWithMessage("¡Perdiste! La IA fue mejor esta vez.");
          return;
        }
      }
    }

    // Verificar empate
    if (!gameBoard.includes(null)) {
      endGameWithMessage("¡Empate! Nadie gana, nadie pierde.");
      return;
    }
  }

  // 🎯 Mostrar mensaje personalizado y detener el juego
  function endGameWithMessage(message) {
    playerTurn.textContent = message;

    // Sonidos según resultado
    if (message.includes("Felicidades")) {
      playAudio(audioWin);
    } else if (message.includes("Perdiste")) {
      playAudio(audioLose);
    } else {
      playAudio(audioLose); // Empate usa sonido de derrota (o cambia si tienes uno neutro)
    }

    // Desactivar clicks
    cells.forEach(cell => cell.onclick = null);

    // Reiniciar automáticamente después de 3 segundos (solo en modo IA)
    if (gameMode === 'ai') {
      setTimeout(() => {
        gameBoard = Array(9).fill(null);
        currentTurn = "X";
        updateBoardUI();
        playerTurn.textContent = "Tu turno (X)";
        setupBoardClicksForAI();
      }, 3000);
    }
  }

  // 🔄 Seleccionar modo de juego
  function selectMode(mode) {
    gameMode = mode;
    document.getElementById('mode-ai').classList.toggle('active', mode === 'ai');
    document.getElementById('mode-online').classList.toggle('active', mode === 'online');

    // Reiniciar tablero y variables
    gameId = null;
    clearBoard();
    gameBoard = Array(9).fill(null);
    currentTurn = "X";

    if (mode === 'ai') {
      playerTurn.textContent = "Tu turno (X)";
      setupBoardClicksForAI();
    } else if (mode === 'online') {
      playerTurn.textContent = "Buscando partida...";
      createOrJoinGame();
      setupGameListener();
    }
  }

  // 🖱️ Configurar clicks para modo IA
  function setupBoardClicksForAI() {
    cells.forEach((cell, index) => {
      cell.onclick = () => {
        if (gameBoard[index] !== null) return;

        gameBoard[index] = "X";
        playAudio(audioClick);
        updateBoardUI();

        // Verificar si el jugador ya ganó
        const winPatterns = [
          [0,1,2], [3,4,5], [6,7,8],
          [0,3,6], [1,4,7], [2,5,8],
          [0,4,8], [2,4,6]
        ];

        for (let pattern of winPatterns) {
          const [a,b,c] = pattern;
          if (gameBoard[a] === "X" && gameBoard[b] === "X" && gameBoard[c] === "X") {
            endGameWithMessage("🎉 ¡Felicidades, ganaste!");
            return;
          }
        }

        // Verificar empate
        if (!gameBoard.includes(null)) {
          endGameWithMessage("🤝 ¡Empate! Nadie gana, nadie pierde.");
          return;
        }

        // Si no ha terminado, la IA juega
        makeAIMove();
      };
    });
  }

  // 🎯 Botón: Jugar contra jugador aleatorio
  function playRandom() {
    if (gameMode === 'online') return; // Ya estás en modo online

    selectMode('online'); // Cambia a modo online
    playerTurn.textContent = "Buscando oponente...";
    createOrJoinGame();
    setupGameListener();
  }

  // Hacer startGame accesible globalmente
  window.startGame = () => {
    clearBoard();
    playerTurn.textContent = "Selecciona modo de juego";
    
    // Asignar eventos a los botones de modo
    document.getElementById('mode-ai').onclick = () => selectMode('ai');
    document.getElementById('mode-online').onclick = () => selectMode('online');

    // Asignar evento al botón "Jugar contra jugador aleatorio"
    const playRandomBtn = document.getElementById("play-random-btn");
    if (playRandomBtn) {
      playRandomBtn.onclick = playRandom;
    }
  };

  // Limpiar tablero
  function clearBoard() {
    cells.forEach(cell => {
      cell.textContent = "";
    });
  }

  // Buscar o crear partida
  async function createOrJoinGame() {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, where("status", "==", "waiting"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty && !gameId) {
        const game = snapshot.docs[0];
        updateDoc(doc(db, "games", game.id), {
          playerO: currentUser.uid,
          status: "active",
          updatedAt: Date.now()
        });
        gameId = game.id;
        unsubscribe(); // Dejar de escuchar
        playerTurn.textContent = "Tu turno (O)"; // Eres el jugador O
      }
    });

    // Si no hay juegos en espera, crear uno nuevo
    if (!gameId) {
      const docRef = await addDoc(gamesRef, {
        playerX: currentUser.uid,
        playerO: null,
        board: Array(9).fill(null),
        turn: "X",
        status: "waiting",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      gameId = docRef.id;
      playerTurn.textContent = "Esperando oponente..."; // Esperas como jugador X
    }
  }

  // Escuchar cambios en la partida
  function setupGameListener() {
    if (!gameId) return;
    const gameDocRef = doc(db, "games", gameId);
    
    // Escuchar cambios en la partida
    onSnapshot(gameDocRef, (snapshot) => {
      const data = snapshot.data();
      
      // Actualizar el tablero
      gameBoard = data.board;
      currentTurn = data.turn;
      updateBoardUI();

      // Verificar si es tu turno
      if (data.playerX === currentUser.uid && data.turn === "X") {
        playerTurn.textContent = "Tu turno (X)";
      } else if (data.playerO === currentUser.uid && data.turn === "O") {
        playerTurn.textContent = "Tu turno (O)";
      } else {
        playerTurn.textContent = `Esperando turno de ${data.turn}`;
      }

      // Verificar estado del juego
      checkGameStatus(data);
    });
  }

  // Hacer un movimiento
  async function makeMove(index) {
    if (gameBoard[index] || !gameId) return;

    const gameDocRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameDocRef);
    const data = gameSnap.data();

    const isPlayerX = currentUser.uid === data.playerX;
    const expectedTurn = isPlayerX ? "X" : "O";

    if (currentTurn !== expectedTurn) {
      alert("No es tu turno");
      return;
    }

    gameBoard[index] = currentTurn;
    const nextTurn = currentTurn === "X" ? "O" : "X";

    // --- SONIDO CLICK ---
    playAudio(audioClick);

    updateDoc(gameDocRef, {
      board: gameBoard,
      turn: nextTurn,
      updatedAt: Date.now()
    });
  }

  // Actualizar interfaz
  function updateBoardUI() {
    cells.forEach((cell, index) => {
      cell.textContent = gameBoard[index];
      if (gameMode === 'online') {
        cell.onclick = () => makeMove(index);
      }
      // En modo IA, el onclick ya fue asignado por setupBoardClicksForAI
    });
  }

  // Verificar ganador
  function checkGameStatus(data) {
    const board = data.board || gameBoard;
    const winPatterns = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (let pattern of winPatterns) {
      const [a,b,c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        if (board[a] === "X" && gameMode === 'ai') {
          endGameWithMessage("🎉 ¡Felicidades, ganaste!");
        } else if (board[a] === "O" && gameMode === 'online') {
          playerTurn.textContent = `¡${board[a]} gana!`;
          playAudio(audioWin);
          endGame(board[a]);
        } else if (board[a] === "X" && gameMode === 'online') {
          playerTurn.textContent = `¡${board[a]} gana!`;
          playAudio(audioWin);
          endGame(board[a]);
        }
        return;
      }
    }

    if (!board.includes(null)) {
      if (gameMode === 'ai') {
        endGameWithMessage("🤝 ¡Empate! Nadie gana, nadie pierde.");
      } else if (gameMode === 'online') {
        playerTurn.textContent = "¡Empate!";
        playAudio(audioLose);
        endGame(null);
      }
    }
  }

  // Finalizar juego
  async function endGame(winner) {
    const gameDocRef = doc(db, "games", gameId);
    const data = (await getDoc(gameDocRef)).data();

    await updateDoc(gameDocRef, { status: "finished", winner });

    if (winner === "X") {
      await updateStats(data.playerX, "wins", data.playerO, "losses");
    } else if (winner === "O") {
      await updateStats(data.playerO, "wins", data.playerX, "losses");
    } else {
      await updateStats(data.playerX, "draws", data.playerO, "draws");
    }
  }

  // Actualizar estadísticas
  async function updateStats(winnerId, winStat, loserId, loseStat) {
    if (!winnerId || !loserId) return;

    const winnerRef = doc(db, "users", winnerId);
    const loserRef = doc(db, "users", loserId);

    const winnerSnap = await getDoc(winnerRef);
    const loserSnap = await getDoc(loserRef);

    if (winnerSnap.exists()) {
      await updateDoc(winnerRef, { [winStat]: increment(1) });
    } else {
      await setDoc(winnerRef, { [winStat]: 1, losses: 0, draws: 0 });
    }

    if (loserSnap.exists()) {
      await updateDoc(loserRef, { [loseStat]: increment(1) });
    } else {
      const newDoc = { wins: 0, draws: 0, losses: 0 };
      newDoc[loseStat] = 1;
      await setDoc(loserRef, newDoc);
    }
  }

  // Reiniciar partida
  restartButton.onclick = () => {
    if (gameMode === 'online' && gameId) {
      updateDoc(doc(db, "games", gameId), {
        board: Array(9).fill(null),
        turn: "X",
        status: "active",
        updatedAt: Date.now()
      });
      playerTurn.textContent = "Tu turno (X)";
    } else if (gameMode === 'ai') {
      gameBoard = Array(9).fill(null);
      currentTurn = "X";
      updateBoardUI();
      playerTurn.textContent = "Tu turno (X)";
      setupBoardClicksForAI();
    }
  };

  // Simular increment() de Firebase
  window.increment = (n) => {
    return { ".sv": "increment", "value": n };
  };

  // Precargar audios (mejora la experiencia)
  [audioClick, audioWin, audioLose, audioBackground].forEach(audio => {
    audio.load();
  });
});