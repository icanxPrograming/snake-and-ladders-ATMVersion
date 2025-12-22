let globalGameDifficulty = "standard"; // Default
let specialTiles = {
  easy: [],
  standard: [],
  hard: [],
  mystery: [],
};

let pendingFate = null; // Menyimpan data nasib (ular/tangga)

// ===== Variabel Probability Storm =====
let isStormActive = false;
let stormTimer = null;
let stormPlayerIndex = 0; // Untuk melacak siapa yang sedang menjawab di dalam Storm
let stormQueue = []; // Antrean pemain dalam Storm

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
  {
    name: "Player1",
    image: 1,
    lastDice: 0,
    score: 0,
    canPlay: true,
    stats: {
      correct: 0,
      wrong: 0,
      ladders: 0,
      snakes: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalMoves: 0, // Untuk menghitung berapa kali kocok dadu sampai finish
      stormWins: 0, // Untuk menghitung berapa kali menjawab benar saat Probability Storm
    },
  },
  {
    name: "Player2",
    image: 0,
    lastDice: 0,
    score: 0,
    canPlay: true,
    stats: {
      correct: 0,
      wrong: 0,
      ladders: 0,
      snakes: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalMoves: 0, // Untuk menghitung berapa kali kocok dadu sampai finish
      stormWins: 0, // Untuk menghitung berapa kali menjawab benar saat Probability Storm
    },
  },
  {
    name: "Player3",
    image: 3,
    lastDice: 0,
    score: 0,
    canPlay: true,
    stats: {
      correct: 0,
      wrong: 0,
      ladders: 0,
      snakes: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalMoves: 0, // Untuk menghitung berapa kali kocok dadu sampai finish
      stormWins: 0, // Untuk menghitung berapa kali menjawab benar saat Probability Storm
    },
  },
  {
    name: "Player4",
    image: 4,
    lastDice: 0,
    score: 0,
    canPlay: true,
    stats: {
      correct: 0,
      wrong: 0,
      ladders: 0,
      snakes: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalMoves: 0, // Untuk menghitung berapa kali kocok dadu sampai finish
      stormWins: 0, // Untuk menghitung berapa kali menjawab benar saat Probability Storm
    },
  },
];

const resetAllPlayerStats = () => {
  console.log("Resetting all players stats and game states...");

  players.forEach((player, index) => {
    player.score = 0;
    player.lastDice = 0;
    player.canPlay = true;
    player.stats = {
      correct: 0,
      wrong: 0,
      ladders: 0,
      snakes: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalMoves: 0, // Pastikan ini ada jika Anda memakainya di julukan
      stormWins: 0, // Pastikan ini ada jika Anda memakainya di julukan
    };
  });

  // Reset State Global Game
  currentTurnPlayer = 1;
  isRolling = false;
  isProcessingAnswer = false;
  pendingFate = null;

  // Reset Probability Storm
  isStormActive = false;
  if (stormTimer) clearInterval(stormTimer);
  stormTimeRemaining = TOTAL_STORM_TIME;
};

const downloadCertificate = () => {
  const element = document.getElementById("certificateExportArea");
  const playerName =
    document.getElementById("certName").textContent || "Player";

  // Gunakan html2canvas untuk mengambil screenshot elemen
  html2canvas(element, {
    scale: 2, // Meningkatkan resolusi gambar (HD)
    useCORS: true, // Izinkan resource dari luar jika ada
    backgroundColor: "#ffffff", // Pastikan background putih
  }).then((canvas) => {
    // Ubah canvas menjadi URL Gambar
    const imageData = canvas.toDataURL("image/png");

    // Buat link download otomatis
    const link = document.createElement("a");
    link.download = `Sertifikat_MathGame_${playerName}.png`;
    link.href = imageData;
    link.click();

    console.log("Certificate downloaded successfully!");
  });
};

// Fungsi membuka modal panduan
const openGuideModal = () => {
  const guideModal = document.getElementById("guideModal");
  if (guideModal) {
    guideModal.classList.remove("hide");
  }
};

// Fungsi menutup modal panduan
const closeGuideModal = () => {
  const guideModal = document.getElementById("guideModal");
  if (guideModal) {
    guideModal.classList.add("hide");
  }
};

// Ambil elemen BGM
const bgm = document.getElementById("bgmAudio");
const musicIcon = document.getElementById("musicIcon");
let isMusicPlaying = false;

// Atur volume BGM agar tidak menabrak sound effect lain (0.3 = 30% volume)
bgm.volume = 0.1;

const toggleMusic = () => {
  if (isMusicPlaying) {
    bgm.pause();
    musicIcon.textContent = "music_off";
  } else {
    bgm
      .play()
      .catch((error) => console.log("User interaction required to play audio"));
    musicIcon.textContent = "music_note";
  }
  isMusicPlaying = !isMusicPlaying;
};

// Fungsi untuk mengecilkan volume saat ada soal (Ducking)
const lowerBGM = () => {
  if (bgm) bgm.volume = 0.1;
};

// Fungsi untuk mengembalikan volume ke normal
const restoreBGM = () => {
  if (bgm) bgm.volume = 0.2;
};

// Panggil fungsi ini di dalam fungsi next() agar musik mulai saat game dimulai
const startBGM = () => {
  if (!isMusicPlaying) {
    bgm
      .play()
      .then(() => {
        isMusicPlaying = true;
        musicIcon.textContent = "music_note";
      })
      .catch((e) => console.log("Menunggu interaksi user..."));
  }
};

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

const submitAnswer = (question, answer) => {
  console.log(`submitAnswer called, isProcessingAnswer: ${isProcessingAnswer}`);

  if (isProcessingAnswer) return;
  isProcessingAnswer = true;
  if (questionTimer) clearInterval(questionTimer);

  let correct = false;
  let message = "";

  if (!question) {
    correct = false;
    message = "Soal tidak valid";
  } else if (
    question.type === "multiple_choice" ||
    question.type === "true_false"
  ) {
    correct = answer === question.answer;
    message = correct ? "Jawaban benar!" : "Jawaban salah!";
  } else if (question.type === "essay" || question.type === "what_if") {
    correct = checkEssayAnswer(answer, question.answer, question.input_type);
    message = correct ? "Jawaban benar!" : "Jawaban kurang tepat!";
  }

  // --- LOGIKA PENCATATAN STATISTIK (TAMBAHAN BARU) ---
  const pIdx = currentPlayerTemp - 1;
  if (correct) {
    players[pIdx].stats.correct++;
    players[pIdx].stats.currentStreak++;
    // Update rekor streak tertinggi
    if (players[pIdx].stats.currentStreak > players[pIdx].stats.maxStreak) {
      players[pIdx].stats.maxStreak = players[pIdx].stats.currentStreak;
    }
  } else {
    players[pIdx].stats.wrong++;
    players[pIdx].stats.currentStreak = 0; // Streak putus jika salah
  }
  // --------------------------------------------------

  showAnswerResult(correct, message);

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

  setTimeout(() => {
    const questionModal = document.querySelector("#questionModal");
    if (questionModal) questionModal.classList.add("hide");

    const resultModal = document.getElementById("resultModal");
    if (resultModal) resultModal.classList.add("hide");

    if (currentQuestion && currentQuestion.isStorm) {
      if (correct) {
        // --- TAMBAHAN STATS ---
        players[currentPlayerTemp - 1].stats.stormWins++; // Catat kemenangan badai
        // ----------------------
        showAnswerResult(
          true,
          `${players[currentPlayerTemp - 1].name} BERHASIL! Maju 3 Langkah.`
        );
        isProcessingAnswer = true;
        setTimeout(() => {
          closeResultModal();
          movePot(3, currentPlayerTemp, true);
        }, 2000);
      } else {
        isProcessingAnswer = false;
        stormPlayerIndex++;
        processNextStormPlayer();
      }
    } else if (pendingFate) {
      const type = pendingFate.type;
      const idx = pendingFate.index;
      const pNo = pendingFate.playerNo;
      pendingFate = null;

      if (correct) {
        if (type === "LADDER") {
          showAnswerResult(true, "BENAR! Kamu berhak naik tangga!");
          setTimeout(() => {
            closeResultModal();
            specialMove(idx, pNo);
            setTimeout(() => nextTurn(), 2500);
          }, 2000);
        } else {
          showAnswerResult(true, "BENAR! Kamu selamat dari ular!");
          setTimeout(() => {
            closeResultModal();
            nextTurn();
          }, 2000);
        }
      } else {
        if (type === "LADDER") {
          showAnswerResult(false, "SALAH! Kamu gagal naik tangga.");
          setTimeout(() => {
            closeResultModal();
            nextTurn();
          }, 2000);
        } else {
          showAnswerResult(false, "SALAH! Kamu gagal menyelamatkan diri!");
          setTimeout(() => {
            closeResultModal();
            specialMoveSnake(idx, pNo);
            setTimeout(() => nextTurn(), 2500);
          }, 2000);
        }
      }
    } else {
      handleMoveAfterQuestion(correct);
    }
  }, 3000);
};

// Fungsi untuk menentukan gelar berdasarkan statistik
const getAchievementTitle = (player) => {
  const s = player.stats;
  const totalQuestions = s.correct + s.wrong;
  const accuracy = totalQuestions > 0 ? (s.correct / totalQuestions) * 100 : 0;

  // 1. Julukan Akurasi & Jenius
  if (accuracy === 100 && s.correct >= 10) return "Sang Arsitek Angka Sempurna";
  if (s.maxStreak >= 10) return "Legenda Matematika Tak Terhentikan";
  if (s.maxStreak >= 5) return "Pakar Logika Cerdas";

  // 2. Julukan Keberuntungan & Papan
  if (s.snakes >= 5) return "Penyintas Ular yang Tangguh";
  if (s.ladders >= 5) return "Penakluk Tangga Tertinggi";
  if (s.snakes === 0 && s.score === 100)
    return "Pejalan Cahaya Tanpa Rintangan";

  // 3. Julukan Kegigihan
  if (s.wrong > 10) return "Pejuang Angka yang Pantang Menyerah";
  if (s.correct > 15) return "Sang Profesor Probabilitas";

  // Default
  return "Pemenang Tantangan Matematika";
};

// Fungsi utama menampilkan sertifikat
const showCertificate = (player) => {
  const certModal = document.getElementById("certificateModal");

  // Mengisi konten sertifikat
  document.getElementById("certName").textContent = player.name;
  document.getElementById("certTitle").textContent =
    getAchievementTitle(player);

  // Mengisi statistik detail
  document.getElementById("statCorrect").textContent = player.stats.correct;
  document.getElementById("statStreak").textContent = player.stats.maxStreak;
  document.getElementById("statLadders").textContent = player.stats.ladders;
  document.getElementById("statSnakes").textContent = player.stats.snakes;

  // Menampilkan modal sertifikat
  certModal.classList.remove("hide");
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

  restoreBGM();

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
    askQuestionOnTile(playerNo, tileDifficulty);
  } else {
    // Hanya ganti turn jika TIDAK ada ular/tangga yang tertunda
    if (!pendingFate) {
      checkSnakeAndLadder(currentScore, playerNo);
      setTimeout(() => nextTurn(), 800);
    }
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
  lowerBGM(); // Musik mengecil
  modal.classList.remove("hide");
  setupQuestionByType(currentQuestion);
};

const movePot = (value, playerNumber, isBonusMove = false) => {
  console.log(`movePot START: Player ${playerNumber} moving ${value}`);
  if (playerNumber < 1 || playerNumber > playersCount) return;

  let player = players[playerNumber - 1];
  let startScore = player.score;
  let targetScore = startScore + value;

  let isBouncing = targetScore > 100;
  let finalEnd = isBouncing ? 100 - (targetScore - 100) : targetScore;
  if (finalEnd < 0) finalEnd = 0;

  let i = startScore;
  let phase = "forward";
  isRolling = true; // Kunci dadu agar tidak diklik saat pion jalan

  const t = setInterval(() => {
    let moved = false;
    if (phase === "forward") {
      if (i < (isBouncing ? 100 : targetScore)) {
        i++;
        moved = true;
      } else {
        phase = isBouncing ? "backward" : "finish";
      }
    } else if (phase === "backward") {
      if (i > finalEnd) {
        i--;
        moved = true;
      } else {
        phase = "finish";
      }
    }

    if (moved) {
      player.score = i;
      if (drop) {
        drop.currentTime = 0;
        drop.play();
      }
      updateBoard();
    }

    if (phase === "finish") {
      clearInterval(t);
      player.score = finalEnd;
      updateBoard();

      // --- 1. CEK PEMENANG & TAMPILKAN SERTIFIKAT ---
      if (player.score === 100) {
        setTimeout(() => {
          if (success) success.play();
          showCertificate(player); // Panggil fungsi sertifikat
        }, 500);
        return;
      }

      const ladderIdx = ladders.findIndex((lad) => lad[0] === player.score);
      const snakeIdx = snakes.findIndex((snk) => snk[0] === player.score);
      const isSpecialTile =
        specialTiles.easy.includes(player.score) ||
        specialTiles.standard.includes(player.score) ||
        specialTiles.hard.includes(player.score) ||
        specialTiles.mystery.includes(player.score);

      // --- 2. LOGIKA GUARDIAN GATE ---
      if ((ladderIdx !== -1 || snakeIdx !== -1) && isSpecialTile) {
        pendingFate = {
          type: ladderIdx !== -1 ? "LADDER" : "SNAKE",
          index: ladderIdx !== -1 ? ladderIdx : snakeIdx,
          playerNo: playerNumber,
        };

        // Pesan yang lebih menarik dalam Bahasa Indonesia
        const msg =
          pendingFate.type === "LADDER"
            ? "KESEMPATAN EMAS! Jawab benar untuk naik tangga!"
            : "BAHAYA! Jawab benar untuk menyelamatkan diri dari ular!";

        showAnswerResult(true, msg);
        const resultIcon = document.getElementById("resultIcon");
        if (resultIcon)
          resultIcon.innerHTML = pendingFate.type === "LADDER" ? "🪜" : "🐍";

        setTimeout(() => {
          closeResultModal();
          checkTileTrigger(player.score, playerNumber);
        }, 2000);
      } else {
        // --- 3. KOTAK BIASA / TANGGA NORMAL ---
        pendingFate = null;

        // PENTING: Jalankan animasi ular/tangga normal
        checkSnakeAndLadder(player.score, playerNumber);

        // Beri jeda sedikit agar animasi ular/tangga (jika ada) selesai
        const actionDelay = ladderIdx !== -1 || snakeIdx !== -1 ? 1500 : 800;

        setTimeout(() => {
          if (isBonusMove) {
            isRolling = false;
            if (isStormActive) {
              finishStorm(true);
            } else {
              nextTurn();
            }
          } else {
            // Cek apakah mendarat di kotak soal biasa
            checkTileTrigger(player.score, playerNumber);
          }
        }, actionDelay);
      }
    }
  }, 300);
};

const rollDice = (playerNo) => {
  // 1. Validasi giliran dan status jalan
  if (playerNo !== currentTurnPlayer || isRolling || isProcessingAnswer) {
    console.log("Blokir klik dadu: Sedang proses...");
    return;
  }

  // --- TAMBAHAN STATS ---
  players[playerNo - 1].stats.totalMoves++; // Catat total lemparan dadu
  // ----------------------

  // 2. Kunci status agar tidak bisa diklik ganda
  isRolling = true;
  disableAllDices();

  if (diceAudio) {
    diceAudio.currentTime = 0;
    diceAudio.play();
  }

  const diceElement = document.getElementById("dice" + playerNo);
  diceElement.classList.add("dice-rolling");

  // Ambil angka dadu acak
  const diceNumber = diceArray[Math.floor(Math.random() * 6)];

  // FASE 1: Selesaikan animasi putar dadu (500ms)
  setTimeout(() => {
    diceElement.innerHTML = `<i class="diceImg fas ${
      diceIcons[diceNumber - 1]
    }"></i>`;
    diceElement.classList.remove("dice-rolling");

    // FASE 2: Beri jeda agar pemain bisa melihat angka dadu dengan jelas (1000ms)
    // Baru setelah jeda ini, pion mulai bergerak
    setTimeout(() => {
      console.log(`Dadu berhenti di angka ${diceNumber}. Pion mulai jalan...`);
      movePot(diceNumber, playerNo);
    }, 1000);
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
  if (ladder) {
    ladder.currentTime = 0;
    ladder.play();
  }

  // --- TAMBAHAN UNTUK STATS ---
  // Catat bahwa pemain ini berhasil naik tangga
  players[playerNumber - 1].stats.ladders++;
  // ----------------------------

  isRolling = true;

  const t = setInterval(() => {
    if (i < ladders[idx].length) {
      players[playerNumber - 1].score = ladders[idx][i];
      updateBoard();
      i++;
      if (drop) {
        drop.currentTime = 0;
        drop.play();
      }
    } else {
      clearInterval(t);
      isRolling = false;
      const finalScore = ladders[idx][ladders[idx].length - 1];
      players[playerNumber - 1].score = finalScore;
      updateBoard();
      console.log(`Ladder movement finished at ${finalScore}`);
    }
  }, 300);
};

const specialMoveSnake = (idx, playerNumber) => {
  let i = 0;
  if (snake) {
    snake.currentTime = 0;
    snake.play();
  }

  // --- TAMBAHAN UNTUK STATS ---
  // Catat bahwa pemain ini terkena ular
  players[playerNumber - 1].stats.snakes++;
  // ----------------------------

  isRolling = true;

  const t = setInterval(() => {
    if (i < snakes[idx].length) {
      players[playerNumber - 1].score = snakes[idx][i];
      updateBoard();
      i++;
      if (drop) {
        drop.currentTime = 0;
        drop.play();
      }
    } else {
      clearInterval(t);
      isRolling = false;
      const finalScore = snakes[idx][snakes[idx].length - 1];
      players[playerNumber - 1].score = finalScore;
      updateBoard();
      console.log(`Snake movement finished at ${finalScore}`);
    }
  }, 300);
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
  startBGM();
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
  resetAllPlayerStats();
  startBGM();
  drawBoard();
  hideFinalPlayers();
  displayNames();
  // ATUR LAYOUT DI SINI
  adjustPlayerLayout();
  updateTurnIndicator();
  enableCurrentPlayerDice();
  updateBoard();

  startStormCountdown(); // MULAI COUNTDOWN BADAI DI SINI

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

// Variabel tambahan untuk UI
// Ganti bagian ini agar interval menjadi 3 menit (180 detik)
let stormTimeRemaining = 180;
const TOTAL_STORM_TIME = 180; // 3 menit dalam detik
const STORM_INTERVAL = 3 * 60 * 1000; // Dalam milidetik (Opsional, untuk logika interval lain)

const startStormCountdown = () => {
  if (stormTimer) clearInterval(stormTimer);

  // Reset variabel waktu
  stormTimeRemaining = TOTAL_STORM_TIME;
  updateStormUI();

  stormTimer = setInterval(() => {
    // Jika badai sedang aktif, jangan kurangi waktu global
    if (isStormActive) return;

    stormTimeRemaining--;

    updateStormUI();

    if (stormTimeRemaining <= 0) {
      // Cek apakah pemain sedang sibuk (lagi jalan/lagi jawab soal biasa)
      // Jika sibuk, badai ditunda 1 detik sampai kondisi aman
      if (!isRolling && !isProcessingAnswer) {
        triggerProbabilityStorm();
        stormTimeRemaining = TOTAL_STORM_TIME; // Reset setelah badai dipicu
      } else {
        stormTimeRemaining = 1; // Tunggu 1 detik lagi
      }
    }
  }, 1000);
};

const updateStormUI = () => {
  const minutes = Math.floor(stormTimeRemaining / 60);
  const seconds = stormTimeRemaining % 60;
  const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  // Update Teks
  const timerDisplay = document.getElementById("stormCountdown");
  if (timerDisplay) timerDisplay.textContent = timeString;

  // Update Progress Bar
  const progressBar = document.getElementById("stormProgressBar");
  if (progressBar) {
    const percentage = (stormTimeRemaining / TOTAL_STORM_TIME) * 100;
    progressBar.style.width = `${percentage}%`;
  }

  // Beri efek warning jika waktu < 30 detik
  const container = document.getElementById("stormTimerContainer");
  if (container) {
    if (stormTimeRemaining <= 30) {
      container.classList.add("storm-warning");
    } else {
      container.classList.remove("storm-warning");
    }
  }
};

const triggerProbabilityStorm = () => {
  console.log("PROBABILITY STORM STARTED!");
  isStormActive = true;
  disableAllDices();

  // Buat antrean pemain (mulai dari player yang sedang giliran saat ini)
  stormQueue = [];
  for (let i = 0; i < playersCount; i++) {
    let pIdx = (currentTurnPlayer - 1 + i) % playersCount;
    stormQueue.push(pIdx + 1);
  }

  stormPlayerIndex = 0;
  showStormStartNotification();
};

const showStormStartNotification = () => {
  // Gunakan result modal untuk pemberitahuan
  showAnswerResult(
    true,
    "PROBABILITY STORM! Semua pemain bersiap menjawab secara bergantian!"
  );
  const resultIcon = document.getElementById("resultIcon");
  resultIcon.innerHTML = "⚡";
  resultIcon.style.color = "#9b59b6";

  setTimeout(() => {
    closeResultModal();
    processNextStormPlayer();
  }, 3000);
};

const processNextStormPlayer = () => {
  if (stormPlayerIndex >= stormQueue.length) {
    finishStorm(false);
    return;
  }

  const currentPlayerID = stormQueue[stormPlayerIndex];
  currentPlayerTemp = currentPlayerID;

  // RESET SEMUA STATE SEBELUM PLAYER MENJAWAB
  isProcessingAnswer = false;
  document.getElementById("explanation").style.display = "none";
  document.getElementById("explanationText").textContent = "";

  const q = getRandomQuestion();
  // Pastikan currentQuestion diupdate dengan tanda isStorm
  currentQuestion = { ...q, isStorm: true };

  const modal = document.querySelector("#questionModal");
  const badge = document.getElementById("difficultyBadge");

  badge.textContent = `STORM: ${players[currentPlayerID - 1].name}`;
  badge.className = `difficulty-badge mystery`;
  document.getElementById("questionText").textContent = q.question;

  lowerBGM();
  modal.classList.remove("hide");
  setupQuestionByType(currentQuestion);

  startStormQuestionTimer();
};

const startStormQuestionTimer = () => {
  const timerEl = document.getElementById("timer");
  let timeLeft = 20; // Waktu lebih singkat untuk storm
  timerEl.textContent = timeLeft;

  if (questionTimer) clearInterval(questionTimer);
  questionTimer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(questionTimer);
      handleStormTimeout();
    }
  }, 1000);
};

const handleStormTimeout = () => {
  if (questionTimer) clearInterval(questionTimer);

  document.querySelector("#questionModal").classList.add("hide");
  showAnswerResult(
    false,
    `Waktu ${players[stormQueue[stormPlayerIndex] - 1].name} habis!`
  );

  // Pastikan status dipulihkan agar pemain berikutnya bisa menjawab
  isProcessingAnswer = false;

  setTimeout(() => {
    closeResultModal();
    stormPlayerIndex++;
    processNextStormPlayer();
  }, 2000);
};

const finishStorm = (isSuccess) => {
  isStormActive = false;
  isProcessingAnswer = false;
  isRolling = false; // Buka kunci rolling
  if (questionTimer) clearInterval(questionTimer);

  if (!isSuccess) {
    showAnswerResult(
      false,
      "Badai berakhir. Tidak ada yang berhasil menjawab."
    );
  }

  const container = document.getElementById("stormTimerContainer");
  if (container) container.classList.remove("storm-warning");

  setTimeout(() => {
    closeResultModal();
    // Kembalikan dadu ke currentTurnPlayer (pemain asli sebelum badai)
    enableCurrentPlayerDice();
    stormTimeRemaining = TOTAL_STORM_TIME;
  }, 2000);
};

initialState();
