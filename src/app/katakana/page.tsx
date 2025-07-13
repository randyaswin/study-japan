import React from 'react';
import Head from 'next/head';

// Data Katakana + mnemonic (urut baris a, ka, sa, dst)
const katakanaTable = [
  [
    { char: 'ア', romaji: 'a', mnemonic: 'Seperti tenda A yang berdiri tegak.' },
    { char: 'イ', romaji: 'i', mnemonic: 'Dua garis seperti huruf I kecil.' },
    { char: 'ウ', romaji: 'u', mnemonic: 'Seperti burung yang terbang ke atas, "u" untuk "up".' },
    { char: 'エ', romaji: 'e', mnemonic: 'Seperti huruf E terbalik.' },
    { char: 'オ', romaji: 'o', mnemonic: 'Seperti orang yang mengangkat tangan, "O" untuk "orang".' },
  ],
  [
    { char: 'カ', romaji: 'ka', mnemonic: 'Seperti pisau (katana) yang tajam.' },
    { char: 'キ', romaji: 'ki', mnemonic: 'Dua garis seperti kunci (key).' },
    { char: 'ク', romaji: 'ku', mnemonic: 'Seperti paruh burung KUku.' },
    { char: 'ケ', romaji: 'ke', mnemonic: 'Seperti huruf K dan E digabung.' },
    { char: 'コ', romaji: 'ko', mnemonic: 'Dua garis, KOlon.' },
  ],
  [
    { char: 'サ', romaji: 'sa', mnemonic: 'Seperti ikan SAkura.' },
    { char: 'シ', romaji: 'shi', mnemonic: 'Tiga garis seperti SHIri (pantat).' },
    { char: 'ス', romaji: 'su', mnemonic: 'Seperti pancing SUngai.' },
    { char: 'セ', romaji: 'se', mnemonic: 'SEperti kursi.' },
    { char: 'ソ', romaji: 'so', mnemonic: 'SOmbong, dua garis ke atas.' },
  ],
  [
    { char: 'タ', romaji: 'ta', mnemonic: 'TAngan dan kaki.' },
    { char: 'チ', romaji: 'chi', mnemonic: 'CHIkal bakal angka 5.' },
    { char: 'ツ', romaji: 'tsu', mnemonic: 'TSUnami, dua ombak.' },
    { char: 'テ', romaji: 'te', mnemonic: 'TEngah, garis di tengah.' },
    { char: 'ト', romaji: 'to', mnemonic: 'TOmbak.' },
  ],
  [
    { char: 'ナ', romaji: 'na', mnemonic: 'NAik tangga.' },
    { char: 'ニ', romaji: 'ni', mnemonic: 'Dua garis, NI.' },
    { char: 'ヌ', romaji: 'nu', mnemonic: 'NUansa angka 7 dan 1.' },
    { char: 'ネ', romaji: 'ne', mnemonic: 'NEk, seperti kucing tidur.' },
    { char: 'ノ', romaji: 'no', mnemonic: 'NO, satu garis miring.' },
  ],
  [
    { char: 'ハ', romaji: 'ha', mnemonic: 'HA, dua daun.' },
    { char: 'ヒ', romaji: 'hi', mnemonic: 'HIlang, dua garis.' },
    { char: 'フ', romaji: 'fu', mnemonic: 'FUku, seperti paruh burung.' },
    { char: 'ヘ', romaji: 'he', mnemonic: 'HE, seperti atap rumah.' },
    { char: 'ホ', romaji: 'ho', mnemonic: 'HO, dua garis dan satu tiang.' },
  ],
  [
    { char: 'マ', romaji: 'ma', mnemonic: 'MAta kail.' },
    { char: 'ミ', romaji: 'mi', mnemonic: 'MI, tiga garis.' },
    { char: 'ム', romaji: 'mu', mnemonic: 'MUlut terbuka.' },
    { char: 'メ', romaji: 'me', mnemonic: 'MErah, seperti mata.' },
    { char: 'モ', romaji: 'mo', mnemonic: 'MOtor, dua roda.' },
  ],
  [
    { char: 'ヤ', romaji: 'ya', mnemonic: 'YA, seperti ketapel.' },
    null,
    { char: 'ユ', romaji: 'yu', mnemonic: 'YUk, seperti ikan.' },
    null,
    { char: 'ヨ', romaji: 'yo', mnemonic: 'YOyo, dua lingkaran.' },
  ],
  [
    { char: 'ラ', romaji: 'ra', mnemonic: 'RAntai.' },
    { char: 'リ', romaji: 'ri', mnemonic: 'RIang, dua garis.' },
    { char: 'ル', romaji: 'ru', mnemonic: 'RUang, seperti angka 3.' },
    { char: 'レ', romaji: 're', mnemonic: 'REbah, satu garis.' },
    { char: 'ロ', romaji: 'ro', mnemonic: 'ROti, kotak.' },
  ],
  [
    { char: 'ワ', romaji: 'wa', mnemonic: 'WAjan, seperti panci.' },
    null,
    null,
    null,
    { char: 'ヲ', romaji: 'wo', mnemonic: 'WOw, seperti orang jongkok.' },
  ],
  [
    null, null, { char: 'ン', romaji: 'n', mnemonic: 'N, seperti kait.' }, null, null,
  ],
];

// Data Katakana gabungan + mnemonic (tabel per baris: kya, sha, cha, nya, hya, mya, rya, gya, ja, bya, pya)
const katakanaComboTable = [
  [
    { char: 'キャ', romaji: 'kya', mnemonic: 'KI + YA: suara “kya” seperti “Kyary Pamyu Pamyu”.' },
    null,
    { char: 'キュ', romaji: 'kyu', mnemonic: 'KI + YU: “kyu” seperti “cute” dengan aksen Jepang.' },
    null,
    { char: 'キョ', romaji: 'kyo', mnemonic: 'KI + YO: “kyo” seperti “Kyoto”.' },
  ],
  [
    { char: 'シャ', romaji: 'sha', mnemonic: 'SHI + YA: “sha” seperti “shampoo”.' },
    null,
    { char: 'シュ', romaji: 'shu', mnemonic: 'SHI + YU: “shu” seperti “shuu cream”.' },
    null,
    { char: 'ショ', romaji: 'sho', mnemonic: 'SHI + YO: “sho” seperti “show”.' },
  ],
  [
    { char: 'チャ', romaji: 'cha', mnemonic: 'CHI + YA: “cha” seperti “cha-cha”.' },
    null,
    { char: 'チュ', romaji: 'chu', mnemonic: 'CHI + YU: “chu” seperti suara ciuman.' },
    null,
    { char: 'チョ', romaji: 'cho', mnemonic: 'CHI + YO: “cho” seperti “chocolate”.' },
  ],
  [
    { char: 'ニャ', romaji: 'nya', mnemonic: 'NI + YA: suara kucing “nyaa”.' },
    null,
    { char: 'ニュ', romaji: 'nyu', mnemonic: 'NI + YU: “nyu” seperti “new” dengan aksen Jepang.' },
    null,
    { char: 'ニョ', romaji: 'nyo', mnemonic: 'NI + YO: “nyo” seperti “nyonya”.' },
  ],
  [
    { char: 'ヒャ', romaji: 'hya', mnemonic: 'HI + YA: “hya” seperti “hyaku” (seratus).' },
    null,
    { char: 'ヒュ', romaji: 'hyu', mnemonic: 'HI + YU: “hyu” seperti suara angin “hyuu”.' },
    null,
    { char: 'ヒョ', romaji: 'hyo', mnemonic: 'HI + YO: “hyo” seperti “hyojin”.' },
  ],
  [
    { char: 'ミャ', romaji: 'mya', mnemonic: 'MI + YA: “mya” seperti suara kucing “myaa”.' },
    null,
    { char: 'ミュ', romaji: 'myu', mnemonic: 'MI + YU: “myu” seperti “music”.' },
    null,
    { char: 'ミョ', romaji: 'myo', mnemonic: 'MI + YO: “myo” seperti “myopia”.' },
  ],
  [
    { char: 'リャ', romaji: 'rya', mnemonic: 'RI + YA: “rya” seperti “ryan”.' },
    null,
    { char: 'リュ', romaji: 'ryu', mnemonic: 'RI + YU: “ryu” seperti “ryuu” (naga).' },
    null,
    { char: 'リョ', romaji: 'ryo', mnemonic: 'RI + YO: “ryo” seperti “ryokan”.' },
  ],
  [
    { char: 'ギャ', romaji: 'gya', mnemonic: 'GI + YA: “gya” seperti “gyaru”.' },
    null,
    { char: 'ギュ', romaji: 'gyu', mnemonic: 'GI + YU: “gyu” seperti “gyuudon”.' },
    null,
    { char: 'ギョ', romaji: 'gyo', mnemonic: 'GI + YO: “gyo” seperti “gyoza”.' },
  ],
  [
    { char: 'ジャ', romaji: 'ja', mnemonic: 'JI + YA: “ja” seperti “japan”.' },
    null,
    { char: 'ジュ', romaji: 'ju', mnemonic: 'JI + YU: “ju” seperti “juice”.' },
    null,
    { char: 'ジョ', romaji: 'jo', mnemonic: 'JI + YO: “jo” seperti “jojo”.' },
  ],
  [
    { char: 'ビャ', romaji: 'bya', mnemonic: 'BI + YA: “bya” seperti “byakuya”.' },
    null,
    { char: 'ビュ', romaji: 'byu', mnemonic: 'BI + YU: “byu” seperti “byuu” (suara angin).' },
    null,
    { char: 'ビョ', romaji: 'byo', mnemonic: 'BI + YO: “byo” seperti “byouin” (rumah sakit).' },
  ],
  [
    { char: 'ピャ', romaji: 'pya', mnemonic: 'PI + YA: “pya” seperti “pyari”.' },
    null,
    { char: 'ピュ', romaji: 'pyu', mnemonic: 'PI + YU: “pyu” seperti suara peluit “pyuu”.' },
    null,
    { char: 'ピョ', romaji: 'pyo', mnemonic: 'PI + YO: “pyo” seperti “pyon” (suara meloncat).' },
  ],
  // Tambahan gabungan vokal dan selain ki, shi, chi, hi, mi, ri, ji, bi, pi
  [
    { char: 'ファ', romaji: 'fa', mnemonic: 'FU + A: “fa” seperti “family”.' },
    { char: 'フィ', romaji: 'fi', mnemonic: 'FU + I: “fi” seperti “film”.' },
    { char: 'フュ', romaji: 'fyu', mnemonic: 'FU + YU: “fyu” seperti “future”.' },
    { char: 'フェ', romaji: 'fe', mnemonic: 'FU + E: “fe” seperti “festival”.' },
    { char: 'フォ', romaji: 'fo', mnemonic: 'FU + O: “fo” seperti “fork”.' },
  ],
  [
    { char: 'ウァ', romaji: 'wa', mnemonic: 'U + small A: “wa” untuk suara asing.' },
    { char: 'ウィ', romaji: 'wi', mnemonic: 'U + I: “wi” seperti “window”.' },
    { char: 'ウェ', romaji: 'we', mnemonic: 'U + E: “we” seperti “web”.' },
    { char: 'ウォ', romaji: 'wo', mnemonic: 'U + O: “wo” seperti “wonder”.' },
    null,
  ],
  [
    { char: 'ヴァ', romaji: 'va', mnemonic: 'VU + A: “va” seperti “van”.' },
    { char: 'ヴィ', romaji: 'vi', mnemonic: 'VU + I: “vi” seperti “violin”.' },
    { char: 'ヴ', romaji: 'vu', mnemonic: 'VU: “vu” seperti “vuvuzela”.' },
    { char: 'ヴェ', romaji: 've', mnemonic: 'VU + E: “ve” seperti “vegetable”.' },
    { char: 'ヴォ', romaji: 'vo', mnemonic: 'VU + O: “vo” seperti “voice”.' },
  ],
  [
    { char: 'ツァ', romaji: 'tsa', mnemonic: 'TSU + A: “tsa” seperti “tsar”.' },
    { char: 'ツィ', romaji: 'tsi', mnemonic: 'TSU + I: “tsi” seperti “tsingtao”.' },
    { char: 'ツェ', romaji: 'tse', mnemonic: 'TSU + E: “tse” seperti “tsetse”.' },
    { char: 'ツォ', romaji: 'tso', mnemonic: 'TSU + O: “tso” seperti “tsonga”.' },
    null,
  ],
  [
    { char: 'チェ', romaji: 'che', mnemonic: 'CHI + E: “che” seperti “cheese”.' },
    { char: 'シェ', romaji: 'she', mnemonic: 'SHI + E: “she” seperti “shell”.' },
    { char: 'ジェ', romaji: 'je', mnemonic: 'JI + E: “je” seperti “jet”.' },
    null,
    null,
  ],
  [
    { char: 'ティ', romaji: 'ti', mnemonic: 'TE + I: “ti” seperti “ticket”.' },
    { char: 'ディ', romaji: 'di', mnemonic: 'DE + I: “di” seperti “digital”.' },
    { char: 'トゥ', romaji: 'tu', mnemonic: 'TO + U: “tu” seperti “tune”.' },
    { char: 'ドゥ', romaji: 'du', mnemonic: 'DO + U: “du” seperti “duty”.' },
    null,
  ],
  [
    { char: 'グァ', romaji: 'gwa', mnemonic: 'GU + A: “gwa” seperti “Guam”.' },
    { char: 'クァ', romaji: 'kwa', mnemonic: 'KU + A: “kwa” seperti “kwanzaa”.' },
    null,
    null,
    null,
  ],
];

// Warna per baris (background) dan per kolom (teks)
const rowBgColors = [
  'bg-blue-50 dark:bg-blue-900',
  'bg-cyan-50 dark:bg-cyan-900',
  'bg-teal-50 dark:bg-teal-900',
  'bg-green-50 dark:bg-green-900',
  'bg-lime-50 dark:bg-lime-900',
  'bg-yellow-50 dark:bg-yellow-900',
  'bg-orange-50 dark:bg-orange-900',
  'bg-pink-50 dark:bg-pink-900',
  'bg-purple-50 dark:bg-purple-900',
  'bg-fuchsia-50 dark:bg-fuchsia-900',
  'bg-gray-50 dark:bg-gray-800',
];
const colTextColors = [
  'text-blue-600 dark:text-blue-300',
  'text-cyan-600 dark:text-cyan-300',
  'text-green-600 dark:text-green-300',
  'text-yellow-600 dark:text-yellow-300',
  'text-pink-600 dark:text-pink-300',
];

// Warna per kolom (background dan teks)
const colBgColors = [
  'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  'bg-cyan-50 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
  'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300',
  'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  'bg-pink-50 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
];

export default function KatakanaPage() {
  // Hitung jumlah kolom (5) dan tentukan width dinamis agar tabel selalu full width
  // Gunakan 100% / 5 = 20% per kolom
  const colWidth = "w-[20%] min-w-[120px]";

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8 font-sans">
        <div className="mb-4 flex justify-start">
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <span>←</span> Back to Home
          </a>
        </div>
        <Head>
          <title>Katakana - Jembatan Keledai & Mnemonic</title>
          <meta name="description" content="Belajar Katakana dengan jembatan keledai dan mnemonic visual" />
        </Head>
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Katakana</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Jembatan Keledai & Mnemonic Visual</p>
        </header>
        {/* Tabel Katakana */}
        <section className="mb-12 overflow-x-auto">
          <div className="inline-block w-full">
            <table className="border-separate border-spacing-2 text-center w-full table-fixed">
              <colgroup>
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
              </colgroup>
              <thead>
                <tr>
                  {['A', 'I', 'U', 'E', 'O'].map((col, idx) => (
                    <th key={col} className={`px-2 py-2 ${colBgColors[idx % colBgColors.length]} text-lg rounded-lg ${colWidth}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {katakanaTable.map((row, ridx) => (
                  <tr key={ridx}>
                    {row.map((cell, cidx) => (
                      <td
                        key={cidx}
                        className={`align-top border border-blue-100 dark:border-blue-900 px-2 py-2 ${colBgColors[cidx % colBgColors.length]} rounded-xl ${colWidth}`}
                      >
                        {cell ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-3xl font-bold jp-font`}>{cell.char}</span>
                            <span className="text-base font-semibold text-gray-800 dark:text-gray-100 uppercase">{cell.romaji}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300 text-center">{cell.mnemonic}</span>
                          </div>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {/* Katakana Gabungan */}
        <section className="mb-12 overflow-x-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 border-l-8 border-blue-400 pl-4 text-blue-700 dark:text-blue-300">Katakana Gabungan</h2>
          <div className="inline-block w-full">
            <table className="border-separate border-spacing-2 text-center w-full table-fixed">
              <colgroup>
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
                <col className="w-1/5" />
              </colgroup>
              <thead>
                <tr>
                  {['A', 'I', 'U', 'E', 'O'].map((col, idx) => (
                    <th key={col} className={`px-2 py-2 ${colBgColors[idx % colBgColors.length]} text-lg rounded-lg ${colWidth}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {katakanaComboTable.map((row, ridx) => (
                  <tr key={ridx}>
                    {row.map((cell, cidx) => (
                      <td
                        key={cidx}
                        className={`align-top border border-blue-100 dark:border-blue-900 px-2 py-2 ${colBgColors[cidx % colBgColors.length]} rounded-xl ${colWidth}`}
                      >
                        {cell ? (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold jp-font">{cell.char}</span>
                            <span className="text-base font-semibold text-gray-800 dark:text-gray-100 uppercase">{cell.romaji}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300 text-center">{cell.mnemonic}</span>
                          </div>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <a
        href="#"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-blue-500 dark:bg-blue-700 text-white font-semibold hover:bg-blue-600 dark:hover:bg-blue-600 transition"
        aria-label="Back to Top"
      >
        <span>↑</span> Back to Top
      </a>
    </div>
  );
}
