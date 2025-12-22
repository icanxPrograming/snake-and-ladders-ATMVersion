Berikut adalah draf `README.md` yang profesional, informatif, dan terstruktur untuk proyek GitHub Anda. Saya telah menyertakan semua fitur yang telah kita bahas (Peluang, Statistik, BGM, Storm, dll.) serta bagian kredit khusus.

---

# 🐍 Petualangan Probabilitas: Ular & Tangga (Math Edition)

Sebuah permainan edukasi interaktif berbasis web yang menggabungkan mekanisme klasik Ular Tangga dengan tantangan Matematika (Materi Peluang). Proyek ini dirancang untuk membuat belajar probabilitas menjadi lebih seru dan kompetitif.

## ✨ Fitur Utama

* **Tantangan Matematika Tematik**: Pemain harus menjawab soal peluang untuk bisa melangkah.
* 🟢 **Kotak Hijau**: Soal Mudah (Maju 1 langkah).
* 🟡 **Kotak Kuning**: Soal Standar (Maju 1 langkah).
* 🔴 **Kotak Merah**: Soal Sulit (Maju 1 langkah).
* 🟣 **Kotak Misteri**: Hadiah maju 3 langkah atau hukuman mundur 1 langkah.


* **Probability Storm (Badai Probabilitas)**: Event otomatis setiap 3 menit di mana semua pemain berkompetisi menjawab satu soal yang sama.
* **Guardian Gate**: Ular dan tangga yang berada di kotak berwarna membutuhkan jawaban benar agar pemain bisa naik atau selamat.
* **Sistem Statistik & Gelar**: Melacak jawaban benar, *streak* tertinggi, dan jumlah tangga/ular yang dilewati.
* **Sertifikat Digital**: Pemenang mendapatkan sertifikat otomatis yang bisa diunduh dalam format PNG.
* **BGM & Audio Ducking**: Musik latar yang otomatis mengecil saat modal soal muncul agar pemain tetap fokus.
* **Responsive UI**: Tampilan yang menyesuaikan otomatis untuk Desktop, Tablet, maupun Smartphone.

## 🛠️ Teknologi yang Digunakan

* **HTML5 & CSS3**: Struktur dan desain responsif menggunakan Flexbox/Grid.
* **JavaScript (Vanilla)**: Logika permainan, sistem statistik, dan manipulasi DOM.
* **MathLive**: Library interaktif untuk pengetikan notasi matematika (LaTeX).
* **html2canvas**: Digunakan untuk fitur ekspor sertifikat menjadi gambar.
* **Font Awesome & Google Material Symbols**: Untuk ikonografi UI.

## 🚀 Cara Menjalankan

1. *Clone* repository ini:
```bash
git clone https://github.com/icanxPrograming/snake-and-ladders-ATMVersion.git

```


2. Buka folder project.
3. Jalankan file `index.html` di browser pilihan Anda.
* *Catatan: Sangat disarankan menggunakan Live Server (VS Code Extension) agar fitur fetch JSON soal berjalan lancar.*



## 📂 Struktur Folder Soal

Soal dimuat secara dinamis melalui file JSON di folder `question/`:

* `easyQuestion.json`
* `standarQuestion.json`
* `hardQuestion.json`
* `mysteryQuestion.json`

## 📜 Lisensi & Kredit

Proyek ini dikembangkan untuk tujuan edukasi.

### 🙏 Catatan Terima Kasih

Proyek ini merupakan hasil modifikasi dan pengembangan lebih lanjut. Saya ingin menyampaikan terima kasih yang tulus kepada **[Yashksaini](https://github.com/yashksaini)** karena telah menyediakan *base project* originalnya. Proyek tersebut telah saya modifikasi secara signifikan dengan konsep, logika permainan baru (Materi Peluang), sistem statistik, dan fitur-fitur interaktif lainnya sesuai visi saya.

---

**Dibuat dengan ❤️ untuk pendidikan Matematika yang lebih menyenangkan.**

---
