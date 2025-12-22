let globalGameDifficulty = "standard"; // Default
let specialTiles = {
  easy: [],
  standard: [],
  hard: [],
  mystery: [],
};

// Bobot probabilitas pengambilan soal berdasarkan tingkat kesulitan game yang dipilih
const difficultyWeights = {
  easy: { easy: 0.6, standard: 0.25, hard: 0.1, mystery: 0.05 },
  standard: { easy: 0.25, standard: 0.5, hard: 0.15, mystery: 0.1 },
  hard: { easy: 0.1, standard: 0.2, hard: 0.4, mystery: 0.3 },
};

// Fungsi untuk memilih tingkat kesulitan (Memperbaiki tombol yang tidak bisa diklik)
const setGameDifficulty = (level) => {
  // 1. Simpan ke variabel global
  globalGameDifficulty = level;
  console.log("Memilih kesulitan:", level);

  // 2. Ambil semua tombol difficulty
  const easyBtn = document.getElementById("diff-easy");
  const stdBtn = document.getElementById("diff-standard");
  const hardBtn = document.getElementById("diff-hard");

  // 3. Hapus class selected dari semuanya secara manual (paling aman)
  if (easyBtn) easyBtn.classList.remove("selected");
  if (stdBtn) stdBtn.classList.remove("selected");
  if (hardBtn) hardBtn.classList.remove("selected");

  // 4. Tambahkan ke yang diklik
  const currentBtn = document.getElementById(`diff-${level}`);
  if (currentBtn) {
    currentBtn.classList.add("selected");
  }
};

// Fungsi untuk mengatur urutan visual kartu pemain
const adjustPlayerLayout = () => {
  const isDesktop = window.innerWidth > 768;

  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById(`playerCard${i}`);
    if (!card) continue;

    if (playersCount === 4 && isDesktop) {
      // DESKTOP BESAR (2x2 Clockwise)
      // Baris 1: P1(order 1), P2(order 2)
      // Baris 2: P4(order 3), P3(order 4)
      if (i === 1) card.style.order = "1";
      if (i === 2) card.style.order = "2";
      if (i === 4) card.style.order = "3";
      if (i === 3) card.style.order = "4";

      card.style.flex = "0 1 45%";
    } else {
      // MOBILE atau Player < 4 (Linear / Normal)
      card.style.order = i.toString();
      card.style.flex = isDesktop ? "0 1 45%" : "1 1 100%";

      // Jika hanya 2 player di desktop, biarkan 2 kolom sejajar
      if (playersCount <= 2 && isDesktop) {
        card.style.flex = "0 1 45%";
      }
    }
  }
};

// Jalankan saat resize
window.addEventListener("resize", adjustPlayerLayout);

const generateSpecialTiles = () => {
  const allNumbers = Array.from({ length: 98 }, (_, i) => i + 2); // Kotak 2-99
  const shuffled = allNumbers.sort(() => 0.5 - Math.random());

  // Tentukan jumlah kotak berdasarkan globalGameDifficulty
  let counts = { easy: 10, standard: 10, hard: 10, mystery: 10 };

  if (globalGameDifficulty === "easy") {
    counts = { easy: 20, standard: 10, hard: 5, mystery: 5 };
  } else if (globalGameDifficulty === "standard") {
    counts = { easy: 10, standard: 15, hard: 10, mystery: 5 };
  } else if (globalGameDifficulty === "hard") {
    counts = { easy: 5, standard: 10, hard: 15, mystery: 10 };
  }

  specialTiles.easy = shuffled.slice(0, counts.easy);
  specialTiles.standard = shuffled.slice(
    counts.easy,
    counts.easy + counts.standard
  );
  specialTiles.hard = shuffled.slice(
    counts.easy + counts.standard,
    counts.easy + counts.standard + counts.hard
  );
  specialTiles.mystery = shuffled.slice(
    counts.easy + counts.standard + counts.hard,
    counts.easy + counts.standard + counts.hard + counts.mystery
  );
};

// Fungsi untuk membuka modal informasi
const openInfoModal = () => {
  const infoModal = document.getElementById("infoModal");
  if (infoModal) {
    infoModal.classList.remove("hide");
  }
};

// Fungsi untuk menutup modal informasi
const closeInfoModal = () => {
  const infoModal = document.getElementById("infoModal");
  if (infoModal) {
    infoModal.classList.add("hide");
  }
};

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
  [4, 18, 24, 38],
  [13, 32],
  [44, 63],
  [53, 73],
  [56, 65, 75, 86, 95],
];
let snakes = [
  [36, 25, 26, 15, 27],
  [60, 42, 39, 22],
  [71, 69, 52, 68, 53],
  [99, 82, 83, 78, 77],
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
  // Ambil semua elemen input essay
  const es = document.getElementById("essayInput");
  const mathField = document.getElementById("mathAnswerField");
  const textField = document.getElementById("textAnswerField");
  const leftBrace = document.getElementById("leftBrace");
  const rightBrace = document.getElementById("rightBrace");
  const instruction = document.getElementById("essayInstruction");

  // Sembunyikan semua opsi terlebih dahulu
  document.getElementById("mcOptions").style.display = "none";
  document.getElementById("tfOptions").style.display = "none";
  document.getElementById("essayInput").style.display = "none";
  document.getElementById("whatIfInput").style.display = "none";

  // --- LOGIK MULTIPLE CHOICE ---
  if (q.type === "multiple_choice" && q.options) {
    const mc = document.getElementById("mcOptions");
    mc.style.display = "block";
    const optionEls = mc.querySelectorAll(".option");
    optionEls.forEach((opt, idx) => {
      if (idx < q.options.length) {
        opt.style.display = "flex";
        const optionTextSpan = opt.querySelector("span:nth-child(2)");
        if (optionTextSpan) optionTextSpan.textContent = q.options[idx];
        opt.onclick = () => selectAnswer(idx);
        opt.classList.remove("selected");
      } else {
        opt.style.display = "none";
      }
    });
  }

  // --- LOGIK TRUE / FALSE ---
  else if (q.type === "true_false") {
    const tf = document.getElementById("tfOptions");
    tf.style.display = "block";
    const tfOpts = tf.querySelectorAll(".option");
    tfOpts[0].onclick = () => selectAnswer(true);
    tfOpts[1].onclick = () => selectAnswer(false);
    tfOpts.forEach((opt) => opt.classList.remove("selected"));
  }

  // --- LOGIK ESSAY (MODIFIKASI BARU) ---
  else if (q.type === "essay") {
    es.style.display = "block";

    // Reset visibilitas elemen internal essay
    mathField.style.display = "none";
    textField.style.display = "none";
    leftBrace.style.display = "none";
    rightBrace.style.display = "none";

    // Cek tipe input dari JSON
    if (q.input_type === "math" || q.input_type === "set") {
      // Tampilkan MathField (MathLive)
      mathField.style.display = "block";
      mathField.value = "";
      mathField.readOnly = false;
      instruction.textContent = "Tuliskan jawaban matematika Anda:";

      // Jika tipe set, tampilkan kurung kurawal { }
      if (q.input_type === "set") {
        leftBrace.style.display = "block";
        rightBrace.style.display = "block";
        instruction.textContent = "Lengkapi isi himpunan berikut:";
      }

      setTimeout(() => mathField.focus(), 300);
    } else {
      // Tipe Text (Keyboard Biasa)
      textField.style.display = "block";
      textField.value = "";
      instruction.textContent = "Jelaskan jawaban Anda secara singkat:";
      setTimeout(() => textField.focus(), 300);
    }

    // Handle Tombol Submit Essay
    const submitBtn = es.querySelector(".submit-btn");
    if (submitBtn) {
      submitBtn.onclick = () => {
        let answer = "";
        if (q.input_type === "math" || q.input_type === "set") {
          answer = mathField.value.trim(); // Hasil berupa LaTeX
        } else {
          answer = textField.value.trim(); // Hasil teks biasa
        }

        if (answer && currentQuestion) {
          submitAnswer(currentQuestion, answer);
        }
      };
    }
  }

  // --- LOGIK WHAT IF ---
  else if (q.type === "what_if") {
    const wi = document.getElementById("whatIfInput");
    const wiMathField = document.getElementById("whatIfMathField");
    const wiTextField = document.getElementById("whatIfAnswer");
    const wiInstruction = document.getElementById("whatIfInstruction");

    wi.style.display = "block";

    // Reset tampilan input dalam What If
    wiMathField.style.display = "none";
    wiTextField.style.display = "none";

    // Cek tipe input dari JSON Mystery
    if (q.input_type === "math") {
      wiMathField.style.display = "block";
      mathField.readOnly = false;
      wiMathField.value = "";
      wiInstruction.textContent = "Berikan nilai peluang yang tepat:";
      setTimeout(() => wiMathField.focus(), 300);
    } else {
      wiTextField.style.display = "block";
      wiTextField.value = "";
      wiInstruction.textContent = "Apa yang terjadi jika...";
      setTimeout(() => wiTextField.focus(), 300);
    }

    const submitBtn = wi.querySelector(".submit-btn");
    if (submitBtn) {
      submitBtn.onclick = () => {
        let answer = "";
        if (q.input_type === "math") {
          answer = wiMathField.value.trim(); // Ambil dari MathLive
        } else {
          answer = wiTextField.value.trim(); // Ambil dari Textarea
        }

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

const checkEssayAnswer = (userAns, correctAns, type) => {
  if (!userAns || !correctAns) return false;

  const clean = (s) =>
    s
      .toString()
      .toLowerCase()
      .replace(/[\s\\{}()]/g, "") // Hapus spasi, backslash, kurung
      .replace(/n\(s\)=/g, "") // Hapus format n(S)
      .replace(/p=/g, "") // Hapus format P =
      .replace(/fh=/g, "") // Hapus format Fh =
      .replace(/frac/g, "") // Hapus simbol LaTeX frac
      .replace(/times/g, "x") // Normalisasi perkalian
      .replace(/×/g, "x")
      .replace(/=/g, "") // Hapus sama dengan sisanya
      .trim();

  let u = clean(userAns);
  let c = clean(correctAns);

  // Jika jawaban kosong setelah dibersihkan, anggap salah
  if (u === "") return false;

  if (type === "math" || type === "set") {
    // 1. Cek apakah sama persis setelah dibersihkan
    if (u === c) return true;

    // 2. Jika kunci punya beberapa tahap (misal 3/6=1/2), pecah berdasarkan '='
    // Kita cek apakah jawaban user cocok dengan salah satu bagian
    if (correctAns.includes("=")) {
      const parts = correctAns.split("=").map((p) => clean(p));
      return parts.some((part) => part === u && u !== "");
    }

    return u === c;
  }

  // --- Tipe Text (Penjelasan) ---
  // Gunakan perbandingan yang sedikit lebih longgar untuk kalimat
  if (type === "text") {
    // Jika jawaban user hampir sama panjangnya dan terkandung di kunci, atau sebaliknya
    // Tapi minimal 5 karakter agar tidak asal menebak satu huruf
    if (u.length < 3) return u === c;
    return (
      (c.includes(u) || u.includes(c)) && Math.abs(u.length - c.length) < 20
    );
  }

  return u === c;
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
  }
  // Untuk pilihan ganda dan benar/salah, perbandingan tetap kaku (exact match)
  else if (
    question.type === "multiple_choice" ||
    question.type === "true_false"
  ) {
    correct = answer === question.answer;
    message = correct ? "Jawaban benar!" : "Jawaban salah!";
  }
  // Untuk essay dan what_if, gunakan fungsi helper checkEssayAnswer
  else if (question.type === "essay" || question.type === "what_if") {
    // Kita kirim 'answer' (dari user), 'question.answer' (dari JSON),
    // dan 'question.input_type' (text/math/set)
    correct = checkEssayAnswer(answer, question.answer, question.input_type);
    message = correct ? "Jawaban benar!" : "Jawaban kurang tepat!";
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
  }, 3000);
};

// ===== Handle pergerakan setelah soal =====
const handleMoveAfterQuestion = (isCorrect) => {
  let moveValue = 0;
  const tileType = currentQuestion.tileType;

  if (tileType === "mystery") {
    moveValue = isCorrect ? 3 : -1;
  } else {
    moveValue = isCorrect ? 1 : 0;
  }

  // Set flag agar sistem tahu proses jawaban sudah selesai
  isProcessingAnswer = false;

  if (moveValue !== 0) {
    // Jalankan movePot dengan isBonusMove = true
    // isBonusMove = true akan memicu nextTurn() di dalam fungsi movePot itu sendiri
    movePot(moveValue, currentPlayerTemp, true);
  } else {
    // Jika jawaban salah di kotak biasa (moveValue 0),
    // langsung selesaikan giliran tanpa menunggu animasi
    finalizeTurn(currentPlayerTemp);
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
  generateSpecialTiles(); // Acak kotak setiap mulai
  let content = "";
  let boxCount = 101;
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (i % 2 === 0) boxCount--;

      let tileClass = "";
      if (specialTiles.easy.includes(boxCount)) tileClass = "tile-easy";
      else if (specialTiles.standard.includes(boxCount))
        tileClass = "tile-standard";
      else if (specialTiles.hard.includes(boxCount)) tileClass = "tile-hard";
      else if (specialTiles.mystery.includes(boxCount))
        tileClass = "tile-mystery";

      content += `<div class="box ${tileClass}" id="potBox${boxCount}">${boxCount}</div>`;
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

const checkTileTrigger = (currentScore, playerNo) => {
  let tileDifficulty = null;

  if (specialTiles.easy.includes(currentScore)) tileDifficulty = "easy";
  else if (specialTiles.standard.includes(currentScore))
    tileDifficulty = "standard";
  else if (specialTiles.hard.includes(currentScore)) tileDifficulty = "hard";
  else if (specialTiles.mystery.includes(currentScore))
    tileDifficulty = "mystery";

  if (tileDifficulty) {
    // Pemain menginjak kotak khusus! Berikan soal.
    askQuestionOnTile(playerNo, tileDifficulty);
  } else {
    // Kotak biasa, cek tangga/ular
    checkSnakeAndLadder(currentScore, playerNo);

    // PENTING: Tambahkan nextTurn() agar giliran berganti jika kotak biasa
    // Beri sedikit delay agar animasi ular/tangga (jika ada) selesai dulu
    setTimeout(() => {
      console.log("Kotak biasa, pindah giliran...");
      nextTurn();
    }, 800);
  }
};

const finalizeTurn = (playerNo) => {
  isRolling = false;
  isProcessingAnswer = false;
  checkSnakeAndLadder(players[playerNo - 1].score, playerNo);
  nextTurn();
};

const checkSnakeAndLadder = (score, playerNo) => {
  checkLadder(score, playerNo);
  checkSnake(score, playerNo);
};

const askQuestionOnTile = (playerNo, tileType) => {
  // tileType adalah 'easy', 'standard', 'hard', atau 'mystery' (berasal dari warna kotak)

  isProcessingAnswer = false;
  currentPlayerTemp = playerNo;
  disableAllDices();

  // 1. Sembunyikan penjelasan soal sebelumnya
  const explanationDiv = document.getElementById("explanation");
  if (explanationDiv) explanationDiv.style.display = "none";

  // 2. Ambil soal LANGSUNG dari pool yang sesuai dengan warna kotak
  // Ini memastikan: Kotak Hijau = Soal Easy, Kotak Merah = Soal Hard, dst.
  const pool = questionPool[tileType];

  // Validasi jika pool soal tersedia
  const availableTypes = Object.keys(pool).filter(
    (type) => pool[type] && pool[type].length > 0
  );

  if (availableTypes.length === 0) {
    console.error(`Pool soal untuk ${tileType} kosong!`);
    finalizeTurn(playerNo); // Skip jika tidak ada soal
    return;
  }

  // Pilih tipe soal acak (multiple_choice, essay, dll)
  const selectedType =
    availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const questions = pool[selectedType];
  const q = questions[Math.floor(Math.random() * questions.length)];

  // Simpan data soal aktif
  currentQuestion = {
    ...q,
    difficulty: tileType, // Tingkat kesulitan soal disamakan dengan tipe kotak
    tileType: tileType, // Untuk menentukan bonus langkah nanti (3 langkah jika mystery)
    type: selectedType,
  };

  // 3. Update UI Modal
  const modal = document.querySelector("#questionModal");
  const badge = document.getElementById("difficultyBadge");

  // Ubah teks dan warna badge sesuai tipe kotak
  badge.textContent = `${tileType.toUpperCase()} TILE`;
  badge.className = `difficulty-badge ${tileType}`; // Pastikan CSS punya class .easy, .hard, dll

  document.getElementById("questionText").textContent = q.question;

  // 4. Timer Reset
  const timerEl = document.getElementById("timer");
  let timeLeft = q.time_limit || 30;
  timerEl.textContent = timeLeft;
  timerEl.classList.remove("warning");

  if (questionTimer) clearInterval(questionTimer);
  questionTimer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 10) timerEl.classList.add("warning");

    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      handleTimeout();
    }
  }, 1000);

  // 5. Munculkan Modal & Setup Input
  modal.classList.remove("hide");
  setupQuestionByType(currentQuestion);
};

// ===== Move Pot yang Disesuaikan =====
// ===== Move Pot yang Disesuaikan =====
const movePot = (value, playerNumber, isBonusMove = false) => {
  console.log(
    `movePot START: Player ${playerNumber} moving ${value} (Bonus: ${isBonusMove})`
  );

  if (playerNumber < 1 || playerNumber > playersCount) return;

  let player = players[playerNumber - 1];
  let end = player.score + value;

  // Batas papan 0-100
  if (end > 100) end = 100;
  if (end < 0) end = 0;

  let i = player.score;
  const direction = value > 0 ? 1 : -1;
  const steps = Math.abs(value);

  // Animasi pergerakan pion langkah demi langkah
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

      // 1. Cek Pemenang
      if (player.score === 100) {
        setTimeout(() => {
          if (modal) modal.className = "modal";
          if (success) success.play();
          wimg.src = `images/avatars/${player.image}.png`;
          wname.innerHTML = player.name;
        }, 400);
        return;
      }

      // 2. Deteksi apakah pion menginjak kepala ular atau kaki tangga
      const isOnLadder = ladders.some((lad) => lad[0] === player.score);
      const isOnSnake = snakes.some((snk) => snk[0] === player.score);

      // Jalankan animasi ular/tangga
      checkSnakeAndLadder(player.score, playerNumber);

      // 3. Tentukan delay berdasarkan apakah ada animasi ular/tangga atau tidak
      // Jika ada ular/tangga, beri delay lebih lama (misal 1200ms) agar animasi selesai
      const actionDelay = isOnLadder || isOnSnake ? 1200 : 600;
      setTimeout(() => {
        if (!isBonusMove) {
          checkTileTrigger(player.score, playerNumber);
        } else {
          console.log("Bonus move finished, next turn...");
          nextTurn();
        }
      }, actionDelay);
    }
  }, 400);
};

const rollDice = (playerNo) => {
  // 1. Validasi super ketat: pastikan giliran benar dan TIDAK sedang dalam proses jalan/jawab
  if (playerNo !== currentTurnPlayer || isRolling || isProcessingAnswer) {
    console.log("Blokir klik dadu: Sedang proses...");
    return;
  }

  // 2. Kunci status segera
  isRolling = true;

  // 3. Matikan semua dadu secara visual dan fungsional
  disableAllDices();

  if (diceAudio) {
    diceAudio.currentTime = 0;
    diceAudio.play();
  }

  const diceElement = document.getElementById("dice" + playerNo);
  diceElement.classList.add("dice-rolling");

  const diceNumber = diceArray[Math.floor(Math.random() * 6)];

  setTimeout(() => {
    diceElement.innerHTML = `<i class="diceImg fas ${
      diceIcons[diceNumber - 1]
    }"></i>`;
    diceElement.classList.remove("dice-rolling");

    // 4. Jalankan pergerakan pion
    movePot(diceNumber, playerNo);
  }, 500);
};

// ===== Manage turns =====
const nextTurn = () => {
  const previousPlayer = currentTurnPlayer;

  // Reset semua flag status di awal perpindahan giliran
  isRolling = false;
  isProcessingAnswer = false;

  // Logika ganti pemain yang simpel dan aman
  currentTurnPlayer = (currentTurnPlayer % playersCount) + 1;

  console.log(
    `TURN CHANGE: Player ${previousPlayer} -> Player ${currentTurnPlayer}`
  );

  // Update UI dan Aktifkan Dadu
  updateTurnIndicator();
  enableCurrentPlayerDice();
};

const updateTurnIndicator = () => {
  console.log(`Menyalakan indikator untuk Player: ${currentTurnPlayer}`);

  // 1. Hapus class turn dari SEMUA kartu tanpa kecuali
  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById(`playerCard${i}`);
    if (card) {
      card.classList.remove("current-turn");
      // Opsional: Pastikan opacity dadu pemain lain redup
      const dice = document.getElementById(`dice${i}`);
      if (dice) dice.style.opacity = "0.3";
    }
  }

  // 2. Tambahkan class turn HANYA ke player yang sedang aktif (berdasarkan ID)
  const activeCard = document.getElementById(`playerCard${currentTurnPlayer}`);
  const activeDice = document.getElementById(`dice${currentTurnPlayer}`);

  if (activeCard) {
    activeCard.classList.add("current-turn");
    console.log(`Indikator menyala di ID: playerCard${currentTurnPlayer}`);
  }

  if (activeDice) {
    activeDice.style.opacity = "1";
  }
};

const disableAllDices = () => {
  console.log("Disabling all dices");
  // Kunci status secara logika
  isRolling = true;

  for (let i = 1; i <= 4; i++) {
    const diceEl = document.getElementById("dice" + i);
    if (diceEl) {
      diceEl.classList.add("disabled");
      diceEl.style.cursor = "not-allowed";
      diceEl.style.pointerEvents = "none"; // Paling ampuh mencegah double click
      diceEl.style.opacity = "0.3";
    }
  }
};

const enableCurrentPlayerDice = () => {
  console.log(`Enabling dices for current player: ${currentTurnPlayer}`);

  // Pastikan status rolling sudah mati
  isRolling = false;

  for (let i = 1; i <= 4; i++) {
    const diceEl = document.getElementById("dice" + i);
    if (diceEl) {
      const isCurrent = i === currentTurnPlayer;

      if (isCurrent) {
        diceEl.classList.remove("disabled");
        diceEl.style.cursor = "pointer";
        diceEl.style.pointerEvents = "auto"; // Izinkan klik
        diceEl.style.opacity = "1";
      } else {
        diceEl.classList.add("disabled");
        diceEl.style.cursor = "not-allowed";
        diceEl.style.pointerEvents = "none"; // Tetap kunci yang lain
        diceEl.style.opacity = "0.3";
      }
    }
  }
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
  // Set default secara programatis agar UI konsisten
  setGameDifficulty("standard");
  hideUnwantedPlayers();
};

const back = () => {
  screen2.style.display = "none";
  screen1.style.display = "block";
  // Bersihkan pilihan agar tidak ambigu saat masuk lagi
  document
    .querySelectorAll(".difficultyBox")
    .forEach((b) => b.classList.remove("selected"));
  resetPlayersCount();
};

const next = () => {
  screen2.style.display = "none";
  screen3.style.display = "block";
  drawBoard();
  hideFinalPlayers();
  displayNames();
  // ATUR LAYOUT DI SINI
  adjustPlayerLayout();
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
  // Fungsi Helper untuk mengambil jawaban berdasarkan input yang sedang aktif
  const getActiveAnswer = () => {
    if (!currentQuestion) return "";

    if (currentQuestion.type === "essay") {
      // Jika soal matematika/set, ambil dari MathField
      if (
        currentQuestion.input_type === "math" ||
        currentQuestion.input_type === "set"
      ) {
        return document.getElementById("mathAnswerField").value;
      }
      // Jika soal penjelasan, ambil dari Textarea
      else {
        return document.getElementById("textAnswerField").value;
      }
    } else if (currentQuestion.type === "what_if") {
      if (currentQuestion.input_type === "math") {
        return document.getElementById("whatIfMathField").value;
      } else {
        return document.getElementById("whatIfAnswer").value;
      }
    }
    return "";
  };

  const createDebouncedHandler = (callback) => {
    return () => {
      if (isSubmitting || isProcessingAnswer) return;
      isSubmitting = true;
      setTimeout(() => {
        isSubmitting = false;
      }, 1000);
      callback();
    };
  };

  // 1. Listeners untuk tombol Submit
  const essaySubmitBtn = document.querySelector("#essayInput .submit-btn");
  const whatIfSubmitBtn = document.querySelector("#whatIfInput .submit-btn");

  if (essaySubmitBtn) {
    essaySubmitBtn.addEventListener(
      "click",
      createDebouncedHandler(() => {
        const answer = getActiveAnswer();
        if (answer) submitAnswer(currentQuestion, answer);
      })
    );
  }

  if (whatIfSubmitBtn) {
    whatIfSubmitBtn.addEventListener(
      "click",
      createDebouncedHandler(() => {
        const answer = getActiveAnswer();
        if (answer) submitAnswer(currentQuestion, answer);
      })
    );
  }

  // 2. Listeners untuk Tombol Enter pada Keyboard Fisik
  const handleEnterKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && currentQuestion) {
      if (isSubmitting || isProcessingAnswer) return;

      // Untuk MathField, Enter biasanya sudah dihandle MathLive,
      // tapi kita tambahkan manual agar konsisten
      const answer = getActiveAnswer();
      if (answer) {
        e.preventDefault();
        isSubmitting = true;
        setTimeout(() => {
          isSubmitting = false;
        }, 1000);
        submitAnswer(currentQuestion, answer);
      }
    }
  };

  // Tambahkan listener Enter ke semua field input
  document
    .getElementById("textAnswerField")
    ?.addEventListener("keypress", handleEnterKey);
  document
    .getElementById("whatIfAnswer")
    ?.addEventListener("keypress", handleEnterKey);
  document
    .getElementById("mathAnswerField")
    ?.addEventListener("keypress", handleEnterKey);
  document
    .getElementById("whatIfMathField")
    ?.addEventListener("keypress", handleEnterKey);
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
