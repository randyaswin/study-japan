import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Data Hiragana + mnemonic (urut baris a, ka, sa, dst)
const hiraganaTable = [
  [
    { char: 'あ', romaji: 'a', mnemonic: 'Seperti mulut yang terbuka mengucap "a".' },
    { char: 'い', romaji: 'i', mnemonic: 'Dua garis seperti dua orang berdiri, "ii" (baik).' },
    { char: 'う', romaji: 'u', mnemonic: 'Seperti burung yang terbang ke atas, "u" untuk "up".' },
    { char: 'え', romaji: 'e', mnemonic: 'Seperti ekor ikan, "e" untuk "ekor".' },
    { char: 'お', romaji: 'o', mnemonic: 'Seperti orang membungkuk, "o" untuk "orang".' },
  ],
  [
    { char: 'か', romaji: 'ka', mnemonic: 'Seperti pisau (katana) dan mulut.' },
    { char: 'き', romaji: 'ki', mnemonic: 'Seperti kunci (key).' },
    { char: 'く', romaji: 'ku', mnemonic: 'Seperti paruh burung KUku.' },
    { char: 'け', romaji: 'ke', mnemonic: 'Seperti huruf K dan E digabung.' },
    { char: 'こ', romaji: 'ko', mnemonic: 'Dua garis, KOlon.' },
  ],
  [
    { char: 'さ', romaji: 'sa', mnemonic: 'Seperti ikan SAkura.' },
    { char: 'し', romaji: 'shi', mnemonic: 'Seperti SHIri (pantat).' },
    { char: 'す', romaji: 'su', mnemonic: 'Seperti pancing SUngai.' },
    { char: 'せ', romaji: 'se', mnemonic: 'SEperti kursi.' },
    { char: 'そ', romaji: 'so', mnemonic: 'SOmbong, dua garis ke atas.' },
  ],
  [
    { char: 'た', romaji: 'ta', mnemonic: 'TAngan dan kaki.' },
    { char: 'ち', romaji: 'chi', mnemonic: 'CHIkal bakal angka 5.' },
    { char: 'つ', romaji: 'tsu', mnemonic: 'TSUnami, ombak kecil.' },
    { char: 'て', romaji: 'te', mnemonic: 'TEngah, garis di tengah.' },
    { char: 'と', romaji: 'to', mnemonic: 'TOmbak.' },
  ],
  [
    { char: 'な', romaji: 'na', mnemonic: 'NAik tangga.' },
    { char: 'に', romaji: 'ni', mnemonic: 'Dua garis, NI.' },
    { char: 'ぬ', romaji: 'nu', mnemonic: 'NUansa angka 7 dan 1.' },
    { char: 'ね', romaji: 'ne', mnemonic: 'NEk, seperti kucing tidur.' },
    { char: 'の', romaji: 'no', mnemonic: 'NO, satu lingkaran.' },
  ],
  [
    { char: 'は', romaji: 'ha', mnemonic: 'HA, dua daun.' },
    { char: 'ひ', romaji: 'hi', mnemonic: 'HIlang, dua garis.' },
    { char: 'ふ', romaji: 'fu', mnemonic: 'FUku, seperti paruh burung.' },
    { char: 'へ', romaji: 'he', mnemonic: 'HE, seperti atap rumah.' },
    { char: 'ほ', romaji: 'ho', mnemonic: 'HO, dua garis dan satu tiang.' },
  ],
  [
    { char: 'ま', romaji: 'ma', mnemonic: 'MAta kail.' },
    { char: 'み', romaji: 'mi', mnemonic: 'MI, tiga garis.' },
    { char: 'む', romaji: 'mu', mnemonic: 'MUlut terbuka.' },
    { char: 'め', romaji: 'me', mnemonic: 'MErah, seperti mata.' },
    { char: 'も', romaji: 'mo', mnemonic: 'MOtor, dua roda.' },
  ],
  [
    { char: 'や', romaji: 'ya', mnemonic: 'YA, seperti ketapel.' },
    null,
    { char: 'ゆ', romaji: 'yu', mnemonic: 'YUk, seperti ikan.' },
    null,
    { char: 'よ', romaji: 'yo', mnemonic: 'YOyo, dua lingkaran.' },
  ],
  [
    { char: 'ら', romaji: 'ra', mnemonic: 'RAntai.' },
    { char: 'り', romaji: 'ri', mnemonic: 'RIang, dua garis.' },
    { char: 'る', romaji: 'ru', mnemonic: 'RUang, seperti angka 3.' },
    { char: 'れ', romaji: 're', mnemonic: 'REbah, satu garis.' },
    { char: 'ろ', romaji: 'ro', mnemonic: 'ROti, kotak.' },
  ],
  [
    { char: 'わ', romaji: 'wa', mnemonic: 'WAjan, seperti panci.' },
    null,
    null,
    null,
    { char: 'を', romaji: 'wo', mnemonic: 'WOw, seperti orang jongkok.' },
  ],
  [
    null, null, { char: 'ん', romaji: 'n', mnemonic: 'N, seperti kait.' }, null, null,
  ],
];

// Data Hiragana gabungan + mnemonic (tabel per baris: kya, sha, cha, nya, hya, mya, rya, gya, ja, bya, pya)
const hiraganaComboTable = [
  [
    { char: 'きゃ', romaji: 'kya', mnemonic: 'KI + YA: suara “kya” seperti “Kyary Pamyu Pamyu”.' },
    null,
    { char: 'きゅ', romaji: 'kyu', mnemonic: 'KI + YU: “kyu” seperti “cute” dengan aksen Jepang.' },
    null,
    { char: 'きょ', romaji: 'kyo', mnemonic: 'KI + YO: “kyo” seperti “Kyoto”.' },
  ],
  [
    { char: 'しゃ', romaji: 'sha', mnemonic: 'SHI + YA: “sha” seperti “shampoo”.' },
    null,
    { char: 'しゅ', romaji: 'shu', mnemonic: 'SHI + YU: “shu” seperti “shuu cream”.' },
    null,
    { char: 'しょ', romaji: 'sho', mnemonic: 'SHI + YO: “sho” seperti “show”.' },
  ],
  [
    { char: 'ちゃ', romaji: 'cha', mnemonic: 'CHI + YA: “cha” seperti “cha-cha”.' },
    null,
    { char: 'ちゅ', romaji: 'chu', mnemonic: 'CHI + YU: “chu” seperti suara ciuman.' },
    null,
    { char: 'ちょ', romaji: 'cho', mnemonic: 'CHI + YO: “cho” seperti “chocolate”.' },
  ],
  [
    { char: 'にゃ', romaji: 'nya', mnemonic: 'NI + YA: suara kucing “nyaa”.' },
    null,
    { char: 'にゅ', romaji: 'nyu', mnemonic: 'NI + YU: “nyu” seperti “new” dengan aksen Jepang.' },
    null,
    { char: 'にょ', romaji: 'nyo', mnemonic: 'NI + YO: “nyo” seperti “nyonya”.' },
  ],
  [
    { char: 'ひゃ', romaji: 'hya', mnemonic: 'HI + YA: “hya” seperti “hyaku” (seratus).' },
    null,
    { char: 'ひゅ', romaji: 'hyu', mnemonic: 'HI + YU: “hyu” seperti suara angin “hyuu”.' },
    null,
    { char: 'ひょ', romaji: 'hyo', mnemonic: 'HI + YO: “hyo” seperti “hyojin”.' },
  ],
  [
    { char: 'みゃ', romaji: 'mya', mnemonic: 'MI + YA: “mya” seperti suara kucing “myaa”.' },
    null,
    { char: 'みゅ', romaji: 'myu', mnemonic: 'MI + YU: “myu” seperti “music”.' },
    null,
    { char: 'みょ', romaji: 'myo', mnemonic: 'MI + YO: “myo” seperti “myopia”.' },
  ],
  [
    { char: 'りゃ', romaji: 'rya', mnemonic: 'RI + YA: “rya” seperti “ryan”.' },
    null,
    { char: 'りゅ', romaji: 'ryu', mnemonic: 'RI + YU: “ryu” seperti “ryuu” (naga).' },
    null,
    { char: 'りょ', romaji: 'ryo', mnemonic: 'RI + YO: “ryo” seperti “ryokan”.' },
  ],
  [
    { char: 'ぎゃ', romaji: 'gya', mnemonic: 'GI + YA: “gya” seperti “gyaru”.' },
    null,
    { char: 'ぎゅ', romaji: 'gyu', mnemonic: 'GI + YU: “gyu” seperti “gyuudon”.' },
    null,
    { char: 'ぎょ', romaji: 'gyo', mnemonic: 'GI + YO: “gyo” seperti “gyoza”.' },
  ],
  [
    { char: 'じゃ', romaji: 'ja', mnemonic: 'JI + YA: “ja” seperti “japan”.' },
    null,
    { char: 'じゅ', romaji: 'ju', mnemonic: 'JI + YU: “ju” seperti “juice”.' },
    null,
    { char: 'じょ', romaji: 'jo', mnemonic: 'JI + YO: “jo” seperti “jojo”.' },
  ],
  [
    { char: 'びゃ', romaji: 'bya', mnemonic: 'BI + YA: “bya” seperti “byakuya”.' },
    null,
    { char: 'びゅ', romaji: 'byu', mnemonic: 'BI + YU: “byu” seperti “byuu” (suara angin).' },
    null,
    { char: 'びょ', romaji: 'byo', mnemonic: 'BI + YO: “byo” seperti “byouin” (rumah sakit).' },
  ],
  [
    { char: 'ぴゃ', romaji: 'pya', mnemonic: 'PI + YA: “pya” seperti “pyari”.' },
    null,
    { char: 'ぴゅ', romaji: 'pyu', mnemonic: 'PI + YU: “pyu” seperti suara peluit “pyuu”.' },
    null,
    { char: 'ぴょ', romaji: 'pyo', mnemonic: 'PI + YO: “pyo” seperti “pyon” (suara meloncat).' },
  ],
];

const colBgColors = [
  'bg-pink-50 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  'bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300',
  'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
];

export default function HiraganaPage() {
  // Hitung jumlah kolom (5) dan tentukan width dinamis agar tabel selalu full width
  // Gunakan 100% / 5 = 20% per kolom
  const colWidth = "w-[20%] min-w-[120px]";

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8 font-sans">
        <div className="mb-4 flex justify-start">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <span>←</span> Back to Home
          </Link>
        </div>
        <Head>
          <title>Hiragana - Jembatan Keledai & Mnemonic</title>
          <meta name="description" content="Belajar Hiragana dengan jembatan keledai dan mnemonic visual" />
        </Head>
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Hiragana</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Jembatan Keledai & Mnemonic Visual</p>
        </header>
        {/* Tabel Hiragana */}
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
                {hiraganaTable.map((row, ridx) => (
                  <tr key={ridx}>
                    {row.map((cell, cidx) => (
                      <td
                        key={cidx}
                        className={`align-top border border-pink-100 dark:border-pink-900 px-2 py-2 ${colBgColors[cidx % colBgColors.length]} rounded-xl ${colWidth}`}
                      >
                        {cell ? (
                          <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold jp-font">{cell.char}</span>
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
        {/* Hiragana Gabungan */}
        <section className="mb-12 overflow-x-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 border-l-8 border-pink-400 pl-4 text-pink-700 dark:text-pink-300">Hiragana Gabungan</h2>
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
                {hiraganaComboTable.map((row, ridx) => (
                  <tr key={ridx}>
                    {row.map((cell, cidx) => (
                      <td
                        key={cidx}
                        className={`align-top border border-pink-100 dark:border-pink-900 px-2 py-2 ${colBgColors[cidx % colBgColors.length]} rounded-xl ${colWidth}`}
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
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-pink-500 dark:bg-pink-700 text-white font-semibold hover:bg-pink-600 dark:hover:bg-pink-600 transition"
        aria-label="Back to Top"
      >
        <span>↑</span> Back to Top
      </a>
    </div>
  );
}
