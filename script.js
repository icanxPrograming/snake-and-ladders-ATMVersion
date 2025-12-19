const board = document.querySelector("#board");

// Warna pot untuk masing-masing player
const colorsPots = ["redPot", "bluePot", "greenPot", "yellowPot"];

// Audio
const drop = document.querySelector("#drop");
const ladder = document.querySelector("#ladder");
const snake = document.querySelector("#snake");
const diceAudio = document.querySelector("#diceAudio");
const success = document.querySelector("#success");

// Modal winner
const modal = document.querySelector("#modal");
const wname = document.querySelector("#wname");
const wimg = document.querySelector("#wimg");

// Ladders & Snakes
let ladders = [
  [4, 16, 17, 25],
  [21, 39],
  [29, 32, 33, 48, 53, 67, 74],
  [43, 57, 64, 76],
  [63, 62, 79, 80],
  [71, 89],
];
let snakes = [
  [30, 12, 13, 7],
  [47, 46, 36, 35, 27, 15],
  [56, 44, 38, 23, 19],
  [73, 69, 51],
  [82, 79, 62, 59, 42],
  [92, 88, 75],
  [98, 97, 83, 84, 85, 77, 64, 76, 65, 55],
];

// Dice
const diceArray = [1, 2, 3, 4, 5, 6];
const diceIcons = [
  "fa-dice-one",
  "fa-dice-two",
  "fa-dice-three",
  "fa-dice-four",
  "fa-dice-five",
  "fa-dice-six",
];

// Players
let playersCount = 2;
const players = [
  { name: "Player1", image: 1, lastDice: 0, score: 0, canPlay: true },
  { name: "Player2", image: 0, lastDice: 0, score: 0, canPlay: true },
  { name: "Player3", image: 3, lastDice: 0, score: 0, canPlay: true },
  { name: "Player4", image: 4, lastDice: 0, score: 0, canPlay: true },
];

// Screens
const screen1 = document.querySelector("#screen1");
const screen2 = document.querySelector("#screen2");
const screen3 = document.querySelector("#screen3");

// ===== Load pertanyaan dari JSON =====
let questionPool = {
  easy: { multiple_choice: [], true_false: [], essay: [] },
  standard: { multiple_choice: [], true_false: [], essay: [] },
  hard: { multiple_choice: [], true_false: [], essay: [] },
  mystery: { multiple_choice: [], true_false: [], what_if: [] },
};

let questionsLoaded = false;

const loadQuestions = async () => {
  try {
    const paths = {
      easy: "question/easyQuestion.json",
      standard: "question/standarQuestion.json",
      hard: "question/hardQuestion.json",
      mystery: "question/mysteryQuestion.json",
    };

    const loadPromises = Object.entries(paths).map(async ([key, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        const data = await response.json();

        // Normalize data structure
        questionPool[key] = {
          multiple_choice: data.multiple_choice || [],
          true_false: data.true_false || [],
          essay: data.essay || [],
          what_if: data.what_if || [],
        };

        console.log(`Loaded ${key}:`, {
          mc: questionPool[key].multiple_choice.length,
          tf: questionPool[key].true_false.length,
          es: questionPool[key].essay.length,
          wi: questionPool[key].what_if?.length || 0,
        });
      } catch (error) {
        console.error(`Error loading ${key}:`, error);
        // Provide fallback questions if file fails to load
        questionPool[key] = getFallbackQuestions(key);
      }
    });

    await Promise.all(loadPromises);
    questionsLoaded = true;
    console.log("All questions loaded successfully");
  } catch (error) {
    console.error("Error loading questions:", error);
    // Initialize with fallback questions
    questionPool = {
      easy: getFallbackQuestions("easy"),
      standard: getFallbackQuestions("standard"),
      hard: getFallbackQuestions("hard"),
      mystery: getFallbackQuestions("mystery"),
    };
    questionsLoaded = true;
  }
};

// Fallback questions jika file tidak tersedia
const getFallbackQuestions = (difficulty) => {
  const fallbacks = {
    easy: {
      multiple_choice: [
        {
          question: "Banyak ruang sampel pelemparan satu dadu adalah...",
          options: ["3", "4", "6"],
          answer: 2,
          explanation: "Ruang sampel: {1,2,3,4,5,6}",
        },
      ],
      true_false: [
        {
          question: "Peluang muncul angka ganjil pada dadu adalah 1/2.",
          answer: true,
          explanation: "Angka ganjil {1,3,5} = 3/6",
        },
      ],
      essay: [
        {
          question: "Tuliskan ruang sampel pelemparan satu koin!",
          answer: "{angka, gambar}",
        },
      ],
    },
    standard: {
      multiple_choice: [
        {
          question: "Peluang muncul angka prima pada dadu adalah...",
          options: ["1/6", "1/3", "1/2"],
          answer: 2,
          explanation: "Bilangan prima {2,3,5} = 3/6",
        },
      ],
      true_false: [
        {
          question: "Frekuensi harapan selalu sama dengan hasil percobaan.",
          answer: false,
          explanation: "Frekuensi harapan hanya perkiraan",
        },
      ],
      essay: [
        {
          question: "Tuliskan ruang sampel pelemparan dua koin!",
          answer: "{AA, AG, GA, GG}",
        },
      ],
    },
    hard: {
      multiple_choice: [
        {
          question: "Dua dadu dilempar. Peluang jumlah mata dadu 9 adalah...",
          options: ["1/12", "1/9", "1/6"],
          answer: 0,
          explanation: "Pasangan: (3,6),(4,5),(5,4),(6,3) = 4/36",
        },
      ],
      true_false: [
        {
          question: "Pada dua dadu, kejadian jumlah 7 dan 11 saling lepas.",
          answer: true,
          explanation: "Tidak mungkin terjadi bersamaan",
        },
      ],
      essay: [
        {
          question: "Dua dadu dilempar. Tentukan peluang jumlah 8!",
          answer: "5/36",
        },
      ],
    },
    mystery: {
      multiple_choice: [
        {
          question: "Peluang TIDAK muncul angka genap pada dadu adalah...",
          options: ["1/6", "1/3", "1/2"],
          answer: 2,
          explanation: "Tidak genap = ganjil = 3/6",
        },
      ],
      true_false: [
        {
          question:
            "Dalam ruangan misteri, peluang muncul angka 7 pada dadu adalah 1/6.",
          answer: false,
          explanation: "Dadu tidak memiliki angka 7",
        },
      ],
      what_if: [
        {
          question:
            "Jika suatu kejadian tidak mustahil dan tidak pasti, nilai peluangnya...",
          answer: "0 < P < 1",
        },
      ],
    },
  };
  return fallbacks[difficulty] || fallbacks.easy;
};

// Panggil load questions saat awal
loadQuestions();

// ===== Random Question =====
const getRandomQuestion = () => {
  if (!questionsLoaded) {
    console.log("Questions not loaded yet, using fallback");
    const fallback = getFallbackQuestions("easy");
    return {
      ...fallback.multiple_choice[0],
      type: "multiple_choice",
      difficulty: "easy",
    };
  }

  // Distribusi kesulitan
  const rand = Math.random();
  let difficulty = "easy";
  if (rand < 0.05) difficulty = "mystery";
  else if (rand < 0.4) difficulty = "hard";
  else if (rand < 0.7) difficulty = "standard";

  const pool = questionPool[difficulty];
  if (!pool) {
    console.error(`No pool for difficulty: ${difficulty}`);
    const fallback = getFallbackQuestions("easy");
    return {
      ...fallback.multiple_choice[0],
      type: "multiple_choice",
      difficulty: "easy",
    };
  }

  // Dapatkan semua tipe yang tersedia
  const availableTypes = Object.keys(pool).filter(
    (type) => pool[type] && pool[type].length > 0
  );

  if (availableTypes.length === 0) {
    console.error(`No questions available for ${difficulty}`);
    const fallback = getFallbackQuestions("easy");
    return {
      ...fallback.multiple_choice[0],
      type: "multiple_choice",
      difficulty: "easy",
    };
  }

  // Pilih tipe acak
  const selectedType =
    availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const questions = pool[selectedType];

  if (!questions || questions.length === 0) {
    console.error(`No questions of type ${selectedType} for ${difficulty}`);
    const fallback = getFallbackQuestions("easy");
    return {
      ...fallback.multiple_choice[0],
      type: "multiple_choice",
      difficulty: "easy",
    };
  }

  // Pilih soal acak
  const question = questions[Math.floor(Math.random() * questions.length)];

  return {
    ...question,
    type: selectedType,
    difficulty: difficulty,
  };
};

// ===== Variabel global untuk soal aktif =====
let currentQuestion = null;
let currentDiceValue = 0;
let currentPlayerTemp = 0;
let isRolling = false;
let questionTimer = null;
let currentTurnPlayer = 1;
let isProcessingAnswer = false; // Flag baru untuk mencegah double processing

// ===== Fungsi tanya soal sebelum move =====
const askQuestionBeforeMove = (playerNo, diceNumber) => {
  console.log(`askQuestionBeforeMove: player ${playerNo}, dice ${diceNumber}`);

  if (isRolling || isProcessingAnswer) {
    console.log("Already rolling or processing answer, skipping");
    return;
  }

  isRolling = true;
  isProcessingAnswer = false; // Reset flag

  currentDiceValue = diceNumber;
  currentPlayerTemp = playerNo;

  // Nonaktifkan dadu sementara
  disableAllDices();

  // Dapatkan soal
  const q = getRandomQuestion();
  if (!q) {
    console.log("No question available, moving directly");
    movePot(diceNumber, playerNo);
    isRolling = false;
    enableCurrentPlayerDice();
    return;
  }

  currentQuestion = q;

  // Tampilkan modal
  const modal = document.querySelector("#questionModal");
  const difficultyBadge = document.getElementById("difficultyBadge");
  const questionText = document.getElementById("questionText");
  const timerEl = document.getElementById("timer");

  modal.classList.remove("hide");

  // Set difficulty badge
  difficultyBadge.textContent = q.difficulty;
  difficultyBadge.className = `difficulty-badge ${q.difficulty}`;

  // Set question text
  questionText.textContent = q.question || "Pertanyaan tidak tersedia";

  // Reset semua tipe
  ["mcOptions", "tfOptions", "essayInput", "whatIfInput"].forEach(
    (id) => (document.getElementById(id).style.display = "none")
  );

  // Reset penjelasan
  document.getElementById("explanation").style.display = "none";

  // Timer
  const timeLimit = q.time_limit || 30;
  let timeLeft = timeLimit;
  timerEl.textContent = timeLeft;
  timerEl.classList.remove("warning");

  // Clear timer sebelumnya
  if (questionTimer) clearInterval(questionTimer);

  questionTimer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 10) {
      timerEl.classList.add("warning");
    }

    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      handleTimeout();
    }
  }, 1000);

  // Setup berdasarkan tipe soal
  setupQuestionByType(q);
};

const setupQuestionByType = (q) => {
  // Multiple Choice
  if (q.type === "multiple_choice" && q.options) {
    const mc = document.getElementById("mcOptions");
    mc.style.display = "block";
    const optionEls = mc.querySelectorAll(".option");

    optionEls.forEach((opt, idx) => {
      if (idx < q.options.length) {
        opt.style.display = "flex";
        // Perbaikan: Ambil span kedua di dalam option
        const optionTextSpan = opt.querySelector("span:nth-child(2)");
        if (optionTextSpan) {
          optionTextSpan.textContent = q.options[idx];
        }
        opt.onclick = () => selectAnswer(idx);
        opt.classList.remove("selected");
      } else {
        opt.style.display = "none";
      }
    });
  }
  // True/False
  else if (q.type === "true_false") {
    const tf = document.getElementById("tfOptions");
    tf.style.display = "block";
    const tfOpts = tf.querySelectorAll(".option");

    tfOpts[0].onclick = () => selectAnswer(true);
    tfOpts[1].onclick = () => selectAnswer(false);
    tfOpts.forEach((opt) => opt.classList.remove("selected"));
  }
  // Essay
  else if (q.type === "essay") {
    const es = document.getElementById("essayInput");
    es.style.display = "block";
    const essayAnswer = document.getElementById("essayAnswer");
    if (essayAnswer) essayAnswer.value = "";

    // Setup submit button
    const submitBtn = es.querySelector(".submit-btn");
    if (submitBtn) {
      submitBtn.onclick = () => {
        const answer = document.getElementById("essayAnswer").value.trim();
        if (answer && currentQuestion) {
          submitAnswer(currentQuestion, answer);
        }
      };
    }
  }
  // What If
  else if (q.type === "what_if") {
    const wi = document.getElementById("whatIfInput");
    wi.style.display = "block";
    const whatIfAnswer = document.getElementById("whatIfAnswer");
    if (whatIfAnswer) whatIfAnswer.value = "";

    // Setup submit button
    const submitBtn = wi.querySelector(".submit-btn");
    if (submitBtn) {
      submitBtn.onclick = () => {
        const answer = document.getElementById("whatIfAnswer").value.trim();
        if (answer && currentQuestion) {
          submitAnswer(currentQuestion, answer);
        }
      };
    }
  }
};

const selectAnswer = (answerIndex) => {
  console.log(`selectAnswer: ${answerIndex}`);

  // Highlight selected option
  if (currentQuestion.type === "multiple_choice") {
    document.querySelectorAll("#mcOptions .option").forEach((opt, idx) => {
      opt.classList.toggle("selected", idx === answerIndex);
    });
  } else if (currentQuestion.type === "true_false") {
    document.querySelectorAll("#tfOptions .option").forEach((opt, idx) => {
      opt.classList.toggle(
        "selected",
        (idx === 0 && answerIndex === true) ||
          (idx === 1 && answerIndex === false)
      );
    });
  }

  // Auto submit setelah 500ms
  setTimeout(() => {
    if (currentQuestion && !isProcessingAnswer) {
      submitAnswer(currentQuestion, answerIndex);
    }
  }, 500);
};

const handleTimeout = () => {
  console.log("handleTimeout called");

  if (currentQuestion) {
    showAnswerResult(false, "Waktu habis!");
    setTimeout(() => {
      if (!isProcessingAnswer) {
        handleMoveAfterQuestion(false);
        document.querySelector("#questionModal").classList.add("hide");
      }
    }, 1500);
  } else {
    // Jika tidak ada soal, langsung lanjut
    console.log("No question on timeout, resetting state");
    isRolling = false;
    isProcessingAnswer = false;
    enableCurrentPlayerDice();
  }
};

// ===== Submit jawaban =====
const submitAnswer = (question, answer) => {
  console.log(`submitAnswer called, isProcessingAnswer: ${isProcessingAnswer}`);

  // Cegah double submission
  if (isProcessingAnswer) {
    console.log("Already processing answer, skipping");
    return;
  }

  isProcessingAnswer = true;

  if (questionTimer) clearInterval(questionTimer);

  let correct = false;
  let message = "";

  if (!question) {
    correct = false;
    message = "Soal tidak valid";
  } else if (question.type === "multiple_choice") {
    correct = answer === question.answer;
    message = correct ? "Jawaban benar!" : "Jawaban salah!";
  } else if (question.type === "true_false") {
    correct = answer === question.answer;
    message = correct ? "Jawaban benar!" : "Jawaban salah!";
  } else if (question.type === "essay" || question.type === "what_if") {
    // Untuk essay dan what_if, kita bandingkan lowercase
    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = (question.answer || "").toLowerCase().trim();
    correct = userAnswer === correctAnswer;
    message = correct ? "Jawaban benar!" : "Jawaban salah!";
  }

  // Tampilkan hasil
  showAnswerResult(correct, message);

  // Tampilkan penjelasan jika ada
  if (question.explanation) {
    const explanationDiv = document.getElementById("explanation");
    if (explanationDiv) {
      const explanationText = document.getElementById("explanationText");
      if (explanationText) {
        explanationText.textContent = question.explanation;
        explanationDiv.style.display = "block";
      }
    }
  }

  // Tunggu sebentar lalu lanjutkan
  setTimeout(() => {
    const questionModal = document.querySelector("#questionModal");
    if (questionModal) questionModal.classList.add("hide");

    const resultModal = document.getElementById("resultModal");
    if (resultModal) resultModal.classList.add("hide");

    handleMoveAfterQuestion(correct);
  }, 2000);
};

// ===== Handle pergerakan setelah soal =====
const handleMoveAfterQuestion = (isCorrect) => {
  console.log(
    `handleMoveAfterQuestion: isCorrect=${isCorrect}, player=${currentPlayerTemp}, dice=${currentDiceValue}`
  );

  // Tentukan nilai pergerakan
  let moveValue = 0;
  let shouldMove = false;

  if (currentQuestion?.difficulty === "mystery") {
    moveValue = isCorrect ? 3 : -1;
    shouldMove = true;
    console.log(`Mystery question: moving ${moveValue} steps`);
  } else {
    if (isCorrect) {
      moveValue = currentDiceValue;
      shouldMove = true;
      console.log(`Correct answer: moving ${moveValue} steps`);
    } else {
      // Jawaban salah, tidak bergerak
      console.log(
        `Player ${currentPlayerTemp} answered wrong, staying in place`
      );

      // Tunggu sebentar lalu ganti giliran
      setTimeout(() => {
        isRolling = false;
        isProcessingAnswer = false;
        console.log(`Moving to next turn from player ${currentPlayerTemp}`);
        nextTurn();
      }, 1000);
      return;
    }
  }

  // Jika harus bergerak
  if (shouldMove) {
    console.log(
      `Calling movePot: value=${moveValue}, player=${currentPlayerTemp}`
    );
    movePot(moveValue, currentPlayerTemp);

    // Hitung durasi animasi
    const moveDuration = Math.abs(moveValue) * 400 + 800; // 400ms per langkah + buffer

    // Tunggu animasi selesai lalu ganti giliran
    setTimeout(() => {
      isRolling = false;
      isProcessingAnswer = false;
      console.log(`Animation complete, moving to next turn`);
      nextTurn();
    }, moveDuration);
  }
};

// ===== Tampilkan hasil jawaban =====
const showAnswerResult = (isCorrect, message) => {
  const resultModal = document.getElementById("resultModal");
  const resultIcon = document.getElementById("resultIcon");
  const resultTitle = document.getElementById("resultTitle");
  const resultMessage = document.getElementById("resultMessage");

  if (resultModal && resultIcon && resultTitle && resultMessage) {
    if (isCorrect) {
      resultIcon.textContent = "✓";
      resultIcon.style.color = "#2ecc71";
      resultTitle.textContent = "Benar!";
      resultTitle.style.color = "#2ecc71";
    } else {
      resultIcon.textContent = "✗";
      resultIcon.style.color = "#e74c3c";
      resultTitle.textContent = "Salah";
      resultTitle.style.color = "#e74c3c";
    }

    resultMessage.textContent = message;
    resultModal.classList.remove("hide");
  }
};

const closeResultModal = () => {
  const resultModal = document.getElementById("resultModal");
  if (resultModal) resultModal.classList.add("hide");
};

// ===== Tutup modal soal =====
const closeQuestionModal = () => {
  console.log("closeQuestionModal called");

  if (questionTimer) clearInterval(questionTimer);
  const questionModal = document.querySelector("#questionModal");
  if (questionModal) questionModal.classList.add("hide");

  // Reset state
  isRolling = false;
  isProcessingAnswer = false;

  // Kembalikan kontrol ke pemain yang sama
  enableCurrentPlayerDice();
};

// ===== Board =====
const drawBoard = () => {
  let content = "";
  let boxCount = 101;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (i % 2 === 0) boxCount--;
      content += `<div class="box" id="potBox${boxCount}"></div>`;
      if (i % 2 != 0) boxCount++;
    }
    boxCount -= 10;
  }
  board.innerHTML = content;
};

const resetBoard = () => {
  for (let i = 1; i <= 100; i++) {
    const potBox = document.getElementById("potBox" + i);
    if (potBox) potBox.innerHTML = "";
  }
};

const updateBoard = () => {
  resetBoard();
  for (let i = 0; i < playersCount; i++) {
    if (players[i].score != 0 && players[i].score <= 100) {
      let x = "potBox" + players[i].score;
      const potBox = document.getElementById(x);
      if (potBox) {
        potBox.innerHTML += `<div class="pot ${colorsPots[i]}"></div>`;
      }
    }
  }
};

// ===== Move Pot =====
const movePot = (value, playerNumber) => {
  console.log(
    `movePot START: Player ${playerNumber} moving ${value} steps from ${
      players[playerNumber - 1].score
    }`
  );

  if (playerNumber < 1 || playerNumber > playersCount) {
    console.error(`Invalid player number: ${playerNumber}`);
    return;
  }

  let player = players[playerNumber - 1];
  let end = player.score + value;

  if (end > 100) end = 100;
  if (end < 0) end = 0;

  if (end === 100) {
    console.log(`Player ${playerNumber} reached 100!`);
    setTimeout(() => {
      if (modal) modal.className = "modal";
      if (success) success.play();
      const baseURL = "images/avatars/";
      if (wimg) wimg.src = baseURL + player.image + ".png";
      if (wname) wname.innerHTML = player.name;
    }, Math.abs(value) * 400);
  }

  let i = player.score;
  const direction = value > 0 ? 1 : -1;
  const steps = Math.abs(value);

  const t = setInterval(() => {
    if ((direction > 0 && i < end) || (direction < 0 && i > end)) {
      i += direction;
      player.score = i;
      if (drop) {
        drop.currentTime = 0;
        drop.play();
      }
      updateBoard();
    } else {
      clearInterval(t);
      console.log(`movePot END: Player ${playerNumber} now at position ${i}`);
    }
  }, 400);

  setTimeout(() => {
    if (value > 0 && player.score > 0) {
      checkLadder(player.score, playerNumber);
      checkSnake(player.score, playerNumber);
    }
  }, 400 * steps);
};

// ===== Roll Dice =====
const rollDice = (playerNo) => {
  console.log(
    `rollDice: Player ${playerNo} trying to roll. Current turn: ${currentTurnPlayer}, isRolling: ${isRolling}, isProcessingAnswer: ${isProcessingAnswer}`
  );

  if (playerNo !== currentTurnPlayer) {
    console.log(
      `Not player ${playerNo}'s turn. Current turn: ${currentTurnPlayer}`
    );
    return;
  }

  if (isRolling || isProcessingAnswer) {
    console.log(
      `Cannot roll: isRolling=${isRolling}, isProcessingAnswer=${isProcessingAnswer}`
    );
    return;
  }

  // Play dice sound
  if (diceAudio) {
    diceAudio.play();
  }

  // Add rolling animation
  const diceElement = document.getElementById("dice" + playerNo);
  if (diceElement) {
    diceElement.classList.add("dice-rolling");

    // Generate random dice number
    const diceNumber = diceArray[Math.floor(Math.random() * 6)];

    setTimeout(() => {
      // Update dice display
      diceElement.innerHTML = `<i class="diceImg fas ${
        diceIcons[diceNumber - 1]
      }"></i>`;
      diceElement.classList.remove("dice-rolling");

      // Ask question
      console.log(
        `Rolled ${diceNumber}, asking question for player ${playerNo}`
      );
      askQuestionBeforeMove(playerNo, diceNumber);
    }, 500);
  }
};

// ===== Manage turns =====
const nextTurn = () => {
  const previousPlayer = currentTurnPlayer;

  // Cari pemain berikutnya
  let attempts = 0;
  let nextPlayer = currentTurnPlayer;

  do {
    nextPlayer = (nextPlayer % playersCount) + 1;
    attempts++;

    // Safety check untuk infinite loop
    if (attempts > playersCount) {
      console.error("Infinite loop detected in nextTurn!");
      break;
    }
  } while (nextPlayer === previousPlayer); // Sebenarnya tidak perlu loop karena selalu akan berbeda

  console.log(`TURN CHANGE: Player ${previousPlayer} -> Player ${nextPlayer}`);

  currentTurnPlayer = nextPlayer;

  // Reset processing flags
  isProcessingAnswer = false;

  // Update UI
  updateTurnIndicator();
  enableCurrentPlayerDice();
};

const updateTurnIndicator = () => {
  // Remove current-turn class from all
  document.querySelectorAll(".playerCard").forEach((card) => {
    card.classList.remove("current-turn");
  });

  // Add to current player
  const currentCard = document.getElementById(`playerCard${currentTurnPlayer}`);
  if (currentCard) {
    currentCard.classList.add("current-turn");
    console.log(`Turn indicator: Player ${currentTurnPlayer} highlighted`);
  }
};

const disableAllDices = () => {
  console.log("Disabling all dices");
  for (let i = 1; i <= playersCount; i++) {
    const diceEl = document.getElementById("dice" + i);
    if (diceEl) {
      diceEl.classList.add("disabled");
      diceEl.style.cursor = "not-allowed";
    }
  }
};

const enableCurrentPlayerDice = () => {
  console.log(`Enabling dices: currentTurnPlayer=${currentTurnPlayer}`);

  // Reset semua dadu
  for (let i = 1; i <= playersCount; i++) {
    const diceEl = document.getElementById("dice" + i);
    if (diceEl) {
      const isCurrentPlayer = i === currentTurnPlayer;
      diceEl.classList.remove("disabled");
      diceEl.style.cursor = isCurrentPlayer ? "pointer" : "not-allowed";
      diceEl.style.opacity = isCurrentPlayer ? "1" : "0.5";
    }
  }

  // Update turn indicator
  updateTurnIndicator();
};

// ===== Ladder & Snake =====
const checkLadder = (value, playerNumber) => {
  ladders.forEach((lad, idx) => {
    if (lad[0] === value) specialMove(idx, playerNumber);
  });
};

const checkSnake = (value, playerNumber) => {
  snakes.forEach((snk, idx) => {
    if (snk[0] === value) specialMoveSnake(idx, playerNumber);
  });
};

const specialMove = (idx, playerNumber) => {
  let i = 0;
  if (ladder) ladder.play();
  const t = setInterval(() => {
    if (i < ladders[idx].length) {
      players[playerNumber - 1].score = ladders[idx][i];
      updateBoard();
      i++;
    } else {
      clearInterval(t);
    }
  }, 400);
};

const specialMoveSnake = (idx, playerNumber) => {
  let i = 0;
  if (snake) snake.play();
  const t = setInterval(() => {
    if (i < snakes[idx].length) {
      players[playerNumber - 1].score = snakes[idx][i];
      updateBoard();
      i++;
    } else {
      clearInterval(t);
    }
  }, 400);
};

// ===== Player screens =====
const selectPlayers = (value) => {
  const selectBoxes = document.getElementsByClassName("selectBox");
  for (let i = 0; i < selectBoxes.length; i++) {
    selectBoxes[i].className = "selectBox";
  }
  if (selectBoxes[value - 2]) {
    selectBoxes[value - 2].className = "selectBox selected";
  }
  playersCount = value;
};

const start = () => {
  screen1.style.display = "none";
  screen2.style.display = "block";
  hideUnwantedPlayers();
};

const back = () => {
  screen2.style.display = "none";
  screen1.style.display = "block";
  resetPlayersCount();
};

const next = () => {
  screen2.style.display = "none";
  screen3.style.display = "block";
  hideFinalPlayers();
  displayNames();
  updateTurnIndicator();
  enableCurrentPlayerDice();
  updateBoard();

  console.log(
    `Game started with ${playersCount} players. First turn: Player ${currentTurnPlayer}`
  );
};

const resetPlayersCount = () => {
  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById("card" + i);
    if (card) card.style.display = "flex";
  }
};

const hideUnwantedPlayers = () => {
  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById("card" + i);
    if (card) {
      card.style.display = i <= playersCount ? "flex" : "none";
    }
  }
};

const hideFinalPlayers = () => {
  for (let i = 1; i <= 4; i++) {
    const playerCard = document.getElementById("playerCard" + i);
    if (playerCard) {
      playerCard.style.display = i <= playersCount ? "flex" : "none";
    }
  }
};

const displayNames = () => {
  for (let i = 1; i <= playersCount; i++) {
    const displayName = document.getElementById("displayName" + i);
    const avatar = document.getElementById("avatar" + i);

    if (displayName) {
      displayName.innerHTML = players[i - 1].name;
    }

    if (avatar) {
      avatar.src = "images/avatars/" + players[i - 1].image + ".png";
    }
  }
};

const updateUserProfile = (playerNo, value) => {
  if (playerNo < 1 || playerNo > 4) return;

  if (value === 1) {
    players[playerNo - 1].image = (players[playerNo - 1].image + 1) % 8;
  } else {
    players[playerNo - 1].image =
      players[playerNo - 1].image === 0 ? 7 : players[playerNo - 1].image - 1;
  }

  const profileImg = document.getElementById("profile" + playerNo);
  if (profileImg) {
    profileImg.src = "images/avatars/" + players[playerNo - 1].image + ".png";
  }
};

const changeName = (playerNo) => {
  const nameInput = document.getElementById("name" + playerNo);
  if (nameInput) {
    let val = nameInput.value.trim();
    players[playerNo - 1].name = val.length > 0 ? val : "Player" + playerNo;
  }
};

// Fungsi yang hilang dari HTML
const updateValue = (playerNo) => {
  // Fungsi ini dipanggil dari HTML onblur
  changeName(playerNo);
};

// ===== Event Listeners dengan debouncing =====
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", () => {
  // Setup event listeners untuk tombol submit dengan debouncing
  const essaySubmitBtn = document.querySelector("#essayInput .submit-btn");
  const whatIfSubmitBtn = document.querySelector("#whatIfInput .submit-btn");

  const createDebouncedHandler = (callback) => {
    return () => {
      if (isSubmitting || isProcessingAnswer) {
        console.log("Already submitting or processing, please wait...");
        return;
      }
      isSubmitting = true;
      setTimeout(() => {
        isSubmitting = false;
      }, 1000);
      callback();
    };
  };

  if (essaySubmitBtn) {
    essaySubmitBtn.addEventListener(
      "click",
      createDebouncedHandler(() => {
        const answer = document.getElementById("essayAnswer")?.value.trim();
        if (answer && currentQuestion) {
          submitAnswer(currentQuestion, answer);
        }
      })
    );
  }

  if (whatIfSubmitBtn) {
    whatIfSubmitBtn.addEventListener(
      "click",
      createDebouncedHandler(() => {
        const answer = document.getElementById("whatIfAnswer")?.value.trim();
        if (answer && currentQuestion) {
          submitAnswer(currentQuestion, answer);
        }
      })
    );
  }

  // Enter key untuk textarea
  const essayTextarea = document.getElementById("essayAnswer");
  const whatIfTextarea = document.getElementById("whatIfAnswer");

  const handleEnterKey = (callback) => {
    return (e) => {
      if (e.key === "Enter" && !e.shiftKey && currentQuestion) {
        e.preventDefault();
        if (isSubmitting || isProcessingAnswer) return;

        isSubmitting = true;
        setTimeout(() => {
          isSubmitting = false;
        }, 1000);

        callback();
      }
    };
  };

  if (essayTextarea) {
    essayTextarea.addEventListener(
      "keypress",
      handleEnterKey(() => {
        const answer = essayTextarea.value.trim();
        if (answer) {
          submitAnswer(currentQuestion, answer);
        }
      })
    );
  }

  if (whatIfTextarea) {
    whatIfTextarea.addEventListener(
      "keypress",
      handleEnterKey(() => {
        const answer = whatIfTextarea.value.trim();
        if (answer) {
          submitAnswer(currentQuestion, answer);
        }
      })
    );
  }
});

// ===== Initial =====
const initialState = () => {
  console.log("Game initializing...");

  drawBoard();
  screen2.style.display = "none";
  screen3.style.display = "none";

  // Check if questions are loaded after a delay
  setTimeout(() => {
    if (!questionsLoaded) {
      console.warn("Questions still loading, using fallback...");
    } else {
      console.log("Questions loaded successfully");
    }
  }, 2000);

  console.log(
    `Initial state: playersCount=${playersCount}, currentTurnPlayer=${currentTurnPlayer}`
  );
};

initialState();
