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

// Membuka info kesulitan
const openDifficultyInfo = () => {
  const modal = document.getElementById("difficultyInfoModal");
  if (modal) modal.classList.remove("hide");
};

// Menutup info kesulitan
const closeDifficultyInfo = () => {
  const modal = document.getElementById("difficultyInfoModal");
  if (modal) modal.classList.add("hide");
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
  // 1. Bagi zona papan
  const z1 = Array.from({ length: 29 }, (_, i) => i + 2).sort(
    () => 0.5 - Math.random()
  ); // 2-30
  const z2 = Array.from({ length: 30 }, (_, i) => i + 31).sort(
    () => 0.5 - Math.random()
  ); // 31-60
  const z3 = Array.from({ length: 39 }, (_, i) => i + 61).sort(
    () => 0.5 - Math.random()
  ); // 61-99

  // Reset semua tiles
  specialTiles.easy = [];
  specialTiles.standard = [];
  specialTiles.hard = [];
  specialTiles.mystery = [];

  // Helper filter 10 kotak pertama (2-11) untuk keamanan Standard Mode
  const first10 = z1.filter((n) => n <= 11);
  const restOfZ1 = z1.filter((n) => n > 11);

  if (globalGameDifficulty === "easy") {
    // TAHAP AWAL (Dominan Easy, tapi ada 1-2 kejutan)
    specialTiles.easy.push(...z1.slice(0, 12));
    specialTiles.standard.push(z1[12]);
    specialTiles.hard.push(z1[13]); // Ada 1 hard agar tetap waspada
    specialTiles.mystery.push(z1[14]);

    // TAHAP TENGAH (Easy & Standard seimbang)
    specialTiles.easy.push(...z2.slice(0, 8));
    specialTiles.standard.push(...z2.slice(8, 14));
    specialTiles.hard.push(...z2.slice(14, 16)); // Mulai ada 2 hard
    specialTiles.mystery.push(...z2.slice(16, 18));

    // TAHAP AKHIR (Lengkap, tapi tetap bersahabat)
    specialTiles.easy.push(...z3.slice(0, 10));
    specialTiles.standard.push(...z3.slice(10, 16));
    specialTiles.hard.push(...z3.slice(16, 20)); // Ada 4 hard di akhir
    specialTiles.mystery.push(...z3.slice(20, 23));
  } else if (globalGameDifficulty === "standard") {
    // TAHAP AWAL (10 Pertama aman, sisanya mulai campur)
    specialTiles.easy.push(...first10.slice(0, 5));
    specialTiles.easy.push(...restOfZ1.slice(0, 4));
    specialTiles.standard.push(...restOfZ1.slice(4, 7));
    specialTiles.hard.push(restOfZ1[7]);
    specialTiles.mystery.push(restOfZ1[8]);

    // TAHAP TENGAH (Standard mendominasi)
    specialTiles.easy.push(...z2.slice(0, 4));
    specialTiles.standard.push(...z2.slice(4, 15));
    specialTiles.hard.push(...z2.slice(15, 20)); // Hard mulai terasa
    specialTiles.mystery.push(...z2.slice(20, 23));

    // TAHAP AKHIR (Hard & Standard kuat, Easy tipis)
    specialTiles.easy.push(...z3.slice(0, 2)); // Tetap ada 2 easy sebagai bonus
    specialTiles.standard.push(...z3.slice(2, 12));
    specialTiles.hard.push(...z3.slice(12, 25)); // Dominasi Hard
    specialTiles.mystery.push(...z3.slice(25, 30));
  } else if (globalGameDifficulty === "hard") {
    // TAHAP AWAL (Sudah mulai panas)
    specialTiles.easy.push(...z1.slice(0, 4));
    specialTiles.standard.push(...z1.slice(4, 9));
    specialTiles.hard.push(...z1.slice(9, 14)); // 5 Hard di awal!
    specialTiles.mystery.push(...z1.slice(14, 16));

    // TAHAP TENGAH (Hard & Mystery mendominasi)
    specialTiles.easy.push(z2[0]); // Hanya 1 Easy
    specialTiles.standard.push(...z2.slice(1, 8));
    specialTiles.hard.push(...z2.slice(8, 20));
    specialTiles.mystery.push(...z2.slice(20, 25));

    // TAHAP AKHIR (Ujian sesungguhnya)
    specialTiles.easy.push(z3[0]); // Tetap 1 easy (keajaiban)
    specialTiles.standard.push(...z3.slice(1, 6));
    specialTiles.hard.push(...z3.slice(6, 28)); // Sangat banyak Hard
    specialTiles.mystery.push(...z3.slice(28, 36));
  }
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

// Fungsi untuk memotong nama jika terlalu panjang
const truncateName = (name, limit = 12) => {
  if (name.length > limit) {
    // Memotong nama dan menambahkan titik-titik
    return name.substring(0, limit - 2) + "...";
  }
  return name;
};

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
      mysterySolved: 0,
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
      mysterySolved: 0,
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
      mysterySolved: 0,
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
      mysterySolved: 0,
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
      mysterySolved: 0,
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
const countdownAudio = document.getElementById("countdownAudio");
const sirineAudio = document.getElementById("sirineAudio");
let isMusicPlaying = false;

// Set volume rendah (0.1 atau 0.05 sesuai permintaan)
if (countdownAudio) countdownAudio.volume = 0.1;
if (sirineAudio) sirineAudio.volume = 0.1;
if (bgm) bgm.volume = 0.1;

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
  if (bgm) bgm.volume = 0.05;
};

// Fungsi untuk mengembalikan volume ke normal
const restoreBGM = () => {
  if (bgm) bgm.volume = 0.1;
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
    if (currentQuestion.tileType === "mystery") {
      players[pIdx].stats.mysterySolved =
        (players[pIdx].stats.mysterySolved || 0) + 1;
    }
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
        // TRIGGER MUSIK: Beri jeda 100ms agar modal muncul dulu baru musik fade out
        setTimeout(() => {
          resetToSundaBGM();
        }, 100);
        isProcessingAnswer = true;
        setTimeout(() => {
          finishStorm(true);
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
            // setTimeout(() => nextTurn(), 2500);
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
            // setTimeout(() => nextTurn(), 2500);
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
  if (s.snakes === 0 && s.score === 100) return "Pembawa Hoki - Anti Ular";

  // 3. Julukan Kegigihan
  if (s.wrong > 10) return "Pejuang Angka yang Pantang Menyerah";
  if (s.correct > 15) return "Sang Profesor Probabilitas";

  // 4. Gelar Khusus: Pemecah Misteri (Gelar Keren)
  if (s.mysterySolved >= 5) return "Sang Pemecah Misteri Terhebat";

  // 5. Julukan Probability Storm
  if (s.stormWins >= 3) return "Sang Penakluk Badai Probabilitas";

  // Default
  return "Juara Ular Tangga";
};

// Fungsi utama menampilkan sertifikat
const showCertificate = (winner) => {
  const certModal = document.getElementById("certificateModal");
  const statsBody = document.getElementById("allPlayersStatsBody");

  // 1. Kosongkan isi tabel klasemen terlebih dahulu
  statsBody.innerHTML = "";

  // 2. Ambil semua pemain yang ikut bermain dan urutkan berdasarkan skor tertinggi
  const sortedPlayers = [...players.slice(0, playersCount)].sort(
    (a, b) => b.score - a.score
  );

  // 3. Masukkan data ke dalam tabel klasemen
  sortedPlayers.forEach((p) => {
    const isWinner = p.name === winner.name;
    const displayNameInTable = truncateName(p.name, 15);
    const row = `
      <tr style="${
        isWinner ? "background: #fff9c4;" : ""
      } border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${isWinner ? "👑 " : ""}${p.name}</td>
        <td style="padding: 12px;">${p.score}</td>
        <td style="padding: 12px;">${p.stats.correct}</td>
        <td style="padding: 12px;">${p.stats.maxStreak}</td>
        <td style="padding: 12px;">🪜${p.stats.ladders} / 🐍${
      p.stats.snakes
    }</td>
      </tr>
    `;
    statsBody.innerHTML += row;
  });

  // 4. Isi Konten Sertifikat (Khusus Pemenang)
  document.getElementById("certName").textContent = truncateName(
    winner.name,
    25
  );
  document.getElementById("certTitle").textContent =
    getAchievementTitle(winner);

  // Isi statistik detail pemenang di kotak sertifikat
  document.getElementById("winnerCorrect").textContent = winner.stats.correct;
  document.getElementById("winnerStreak").textContent = winner.stats.maxStreak;
  document.getElementById("winnerLadders").textContent = winner.stats.ladders;
  document.getElementById("winnerSnakes").textContent = winner.stats.snakes;

  // 5. Atur tampilan awal: Tampilkan Leaderboard, Sembunyikan Sertifikat
  toggleToLeaderboard();

  // 6. Munculkan Modal Utama
  certModal.classList.remove("hide");
};

// Fungsi untuk pindah ke tampilan Sertifikat
const toggleToCertificate = () => {
  document.getElementById("leaderboardSection").classList.add("hide");
  document.getElementById("certificateSection").classList.remove("hide");
};

// Fungsi untuk kembali ke tampilan Klasemen
const toggleToLeaderboard = () => {
  document.getElementById("certificateSection").classList.add("hide");
  document.getElementById("leaderboardSection").classList.remove("hide");
};

// ===== Handle pergerakan setelah soal =====
const handleMoveAfterQuestion = (isCorrect) => {
  let moveValue = 0;
  const tileType = currentQuestion.tileType;

  if (tileType === "mystery") {
    if (isCorrect) {
      // --- LOGIKA RANDOM BONUS MISTERI ---
      const rewards = [
        { name: "Bonus 3 Langkah", value: 3 },
        { name: "Bonus 5 Langkah!", value: 5 },
        { name: "Lompatan Besar (4 Langkah)", value: 4 },
        { name: "Bonus 2 Langkah", value: 2 },
      ];

      const selectedReward =
        rewards[Math.floor(Math.random() * rewards.length)];

      // Tampilkan pesan hadiah khusus
      showAnswerResult(
        true,
        `Misteri Terpecahkan! \n Hadiah: ${selectedReward.name}`
      );

      isProcessingAnswer = false;
      setTimeout(() => {
        closeResultModal();
        movePot(selectedReward.value, currentPlayerTemp, true);
      }, 2000);
      return; // Berhenti di sini agar tidak menjalankan movePot di bawah lagi
    } else {
      moveValue = -1; // Hukuman jika salah
      showAnswerResult(false, "Gagal memecahkan misteri. Mundur 1 langkah!");
    }
  } else {
    // Logika kotak biasa
    moveValue = isCorrect ? 1 : 0;
  }

  isProcessingAnswer = false;

  if (moveValue !== 0) {
    movePot(moveValue, currentPlayerTemp, true);
  } else {
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
  isRolling = true;

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

      // --- 1. CEK PEMENANG ---
      if (player.score === 100) {
        setTimeout(() => {
          if (success) success.play();
          showCertificate(player);
        }, 500);
        return; // BERHENTI: Jangan cek tangga/ular lagi
      }

      const ladderIdx = ladders.findIndex((lad) => lad[0] === player.score);
      const snakeIdx = snakes.findIndex((snk) => snk[0] === player.score);
      const isSpecialTile =
        specialTiles.easy.includes(player.score) ||
        specialTiles.standard.includes(player.score) ||
        specialTiles.hard.includes(player.score) ||
        specialTiles.mystery.includes(player.score);

      // --- 2. LOGIKA GUARDIAN GATE (Tangga/Ular di Kotak Soal) ---
      if ((ladderIdx !== -1 || snakeIdx !== -1) && isSpecialTile) {
        pendingFate = {
          type: ladderIdx !== -1 ? "LADDER" : "SNAKE",
          index: ladderIdx !== -1 ? ladderIdx : snakeIdx,
          playerNo: playerNumber,
        };

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

        return; // PENTING: Berhenti di sini agar tidak memicu nextTurn di bawah
      }

      // --- 3. TANGGA / ULAR NORMAL (Kotak Putih/Free) ---
      if (ladderIdx !== -1 || snakeIdx !== -1) {
        pendingFate = null;
        checkSnakeAndLadder(player.score, playerNumber);
        // Kita tidak memanggil nextTurn di sini karena akan di-handle oleh
        // specialMove/specialMoveSnake setelah animasi meluncur selesai.
        return; // PENTING: Berhenti di sini
      }

      // --- 4. KOTAK BIASA (Tidak ada Tangga/Ular) ---
      const actionDelay = 800;
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
  players[playerNumber - 1].stats.ladders++;
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
      const finalScore = ladders[idx][ladders[idx].length - 1];
      players[playerNumber - 1].score = finalScore;
      updateBoard();

      // KUNCI: Reset status dan pindah giliran
      isRolling = false;
      isProcessingAnswer = false;
      setTimeout(() => {
        nextTurn();
      }, 800);
    }
  }, 300);
};

const specialMoveSnake = (idx, playerNumber) => {
  let i = 0;
  if (snake) {
    snake.currentTime = 0;
    snake.play();
  }
  players[playerNumber - 1].stats.snakes++;
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
      const finalScore = snakes[idx][snakes[idx].length - 1];
      players[playerNumber - 1].score = finalScore;
      updateBoard();

      isRolling = false;
      isProcessingAnswer = false;
      setTimeout(() => {
        nextTurn();
      }, 800);
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
      displayName.innerHTML = truncateName(players[i - 1].name, 12);
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

// Variabel tambahan untuk UI (Disesuaikan menjadi 50 detik untuk pengujian)
let stormTimeRemaining = 50;
const TOTAL_STORM_TIME = 50; // Total waktu siklus badai dalam detik
const STORM_INTERVAL = 50 * 1000; // Dalam milidetik

const fadeAudio = (audioElement, targetVolume, duration = 1000) => {
  if (!audioElement) return;

  const startVolume = audioElement.volume;
  const diff = targetVolume - startVolume;
  const steps = 20; // Jumlah perubahan volume
  const stepTime = duration / steps;
  let currentStep = 0;

  const fadeInterval = setInterval(() => {
    currentStep++;
    audioElement.volume = startVolume + diff * (currentStep / steps);

    if (currentStep >= steps) {
      audioElement.volume = targetVolume;
      clearInterval(fadeInterval);
    }
  }, stepTime);
};

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
    // Tepat saat 30 detik menuju badai
    if (stormTimeRemaining === 30 && !isStormActive) {
      if (countdownAudio && countdownAudio.paused) {
        countdownAudio.currentTime = 0;
        countdownAudio.play().catch((e) => console.log("Audio play blocked"));
      }
      // Opsional: Kecilkan sedikit BGM Sunda saat countdown dimulai
      if (bgm) bgm.volume = 0.03;
    }

    if (stormTimeRemaining <= 30 && stormTimeRemaining > 0) {
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

  // Matikan countdown
  if (countdownAudio) {
    countdownAudio.pause();
    countdownAudio.currentTime = 0;
  }

  // 1. Mainkan Sirine (Volume 0.1)
  if (sirineAudio) {
    sirineAudio.volume = 0.1;
    sirineAudio.currentTime = 0;
    sirineAudio.play();

    // Buat sirine memudar (fade out) setelah 2 detik
    setTimeout(() => {
      fadeAudio(sirineAudio, 0, 1000);
    }, 2000);

    // Stop total sirine setelah 3 detik
    setTimeout(() => {
      sirineAudio.pause();
    }, 3000);
  }

  // 2. Mainkan Sabilulungan SETELAH sirine berjalan (delay 2 detik)
  if (bgm) {
    // Fade out lagu lama (Sunda)
    fadeAudio(bgm, 0, 500);

    setTimeout(() => {
      bgm.src = "audio/Sabilulungan.mp3";
      bgm.load();
      bgm.volume = 0; // Mulai dari 0
      bgm.play().catch((e) => console.log("Play blocked"));

      // Masuk perlahan (Fade In) tepat saat sirine meredup
      fadeAudio(bgm, 0.1, 1500);
    }, 2000); // Jeda 2 detik agar pas dengan sirine
  }

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

  badge.textContent = `STORM: ${truncateName(
    players[currentPlayerID - 1].name,
    10
  )}`;
  badge.className = `difficulty-badge mystery`;
  document.getElementById("questionText").textContent = q.question;

  lowerBGM();
  modal.classList.remove("hide");
  setupQuestionByType(currentQuestion);

  startStormQuestionTimer();
};

const startStormQuestionTimer = () => {
  const timerEl = document.getElementById("timer");
  let timeLeft = 30; // Waktu lebih singkat untuk storm
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

const resetToSundaBGM = () => {
  if (bgm) {
    // 1. Fade Out Sabilulungan (600ms) - lebih terasa "melenyap"
    fadeAudio(bgm, 0, 600);

    setTimeout(() => {
      bgm.src = "audio/Sunda.mp3";
      bgm.load();
      bgm.volume = 0;
      bgm
        .play()
        .then(() => {
          // 2. Fade In Sunda (800ms) - masuk perlahan dengan cantik
          fadeAudio(bgm, 0.1, 800);
        })
        .catch((e) => console.log("Audio play blocked"));
    }, 650); // Jeda sedikit lebih lama dari durasi fade out
  }
};

const finishStorm = (isSuccess) => {
  isStormActive = false;
  isProcessingAnswer = false;
  isRolling = false;
  if (questionTimer) clearInterval(questionTimer);

  // Jika badai berakhir karena waktu habis atau semua salah, baru ganti musik di sini
  if (!isSuccess) {
    showAnswerResult(
      false,
      "Badai berakhir. Tidak ada yang berhasil menjawab."
    );
    resetToSundaBGM();
  }

  const container = document.getElementById("stormTimerContainer");
  if (container) container.classList.remove("storm-warning");

  setTimeout(() => {
    closeResultModal();
    enableCurrentPlayerDice();
    stormTimeRemaining = TOTAL_STORM_TIME;
  }, 2000);
};

initialState();
