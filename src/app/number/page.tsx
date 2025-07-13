import React from 'react';
import Head from 'next/head';

// Warna untuk baris angka
const rowBgColors = [
  'bg-blue-50 dark:bg-blue-900',
  'bg-green-50 dark:bg-green-900',
  'bg-yellow-50 dark:bg-yellow-900',
  'bg-pink-50 dark:bg-pink-900',
  'bg-purple-50 dark:bg-purple-900',
  'bg-orange-50 dark:bg-orange-900',
  'bg-cyan-50 dark:bg-cyan-900',
  'bg-lime-50 dark:bg-lime-900',
  'bg-fuchsia-50 dark:bg-fuchsia-900',
  'bg-red-50 dark:bg-red-900',
  'bg-teal-50 dark:bg-teal-900',
  'bg-gray-50 dark:bg-gray-800',
];

const numbers = [
  { jp: '一', kana: 'いち', romaji: 'ichi', arti: '1' },
  { jp: '二', kana: 'に', romaji: 'ni', arti: '2' },
  { jp: '三', kana: 'さん', romaji: 'san', arti: '3' },
  { jp: '四', kana: 'よん/し', romaji: 'yon/shi', arti: '4' },
  { jp: '五', kana: 'ご', romaji: 'go', arti: '5' },
  { jp: '六', kana: 'ろく', romaji: 'roku', arti: '6' },
  { jp: '七', kana: 'なな/しち', romaji: 'nana/shichi', arti: '7' },
  { jp: '八', kana: 'はち', romaji: 'hachi', arti: '8' },
  { jp: '九', kana: 'きゅう/く', romaji: 'kyuu/ku', arti: '9' },
  { jp: '十', kana: 'じゅう', romaji: 'juu', arti: '10' },
  { jp: '百', kana: 'ひゃく', romaji: 'hyaku', arti: '100' },
  { jp: '千', kana: 'せん', romaji: 'sen', arti: '1000' },
  { jp: '万', kana: 'まん', romaji: 'man', arti: '10.000' },
  { jp: '十万', kana: 'じゅうまん', romaji: 'juuman', arti: '100.000' },
  { jp: '百万', kana: 'ひゃくまん', romaji: 'hyakuman', arti: '1.000.000' },
];

const counters = [
    {
        label: 'Orang',
        suffix: '人',
        pattern: [
            { num: 1, jp: '一人', kana: 'ひとり', romaji: 'hitori' },
            { num: 2, jp: '二人', kana: 'ふたり', romaji: 'futari' },
            { num: 3, jp: '三人', kana: 'さんにん', romaji: 'sannin' },
            { num: 4, jp: '四人', kana: 'よにん', romaji: 'yonin' },
            { num: 5, jp: '五人', kana: 'ごにん', romaji: 'gonin' },
            { num: 6, jp: '六人', kana: 'ろくにん', romaji: 'rokunin' },
            { num: 7, jp: '七人', kana: 'しちにん/ななにん', romaji: 'shichinin/nananin' },
            { num: 8, jp: '八人', kana: 'はちにん', romaji: 'hachinin' },
            { num: 9, jp: '九人', kana: 'きゅうにん', romaji: 'kyuunin' },
            { num: 10, jp: '十人', kana: 'じゅうにん', romaji: 'juunin' },
        ],
        contoh: '家族は四人です。 (Keluarga ada 4 orang)'
    },
    {
        label: 'Barang (benda kecil, umum)',
        suffix: 'つ',
        pattern: [
            { num: 1, jp: '一つ', kana: 'ひとつ', romaji: 'hitotsu' },
            { num: 2, jp: '二つ', kana: 'ふたつ', romaji: 'futatsu' },
            { num: 3, jp: '三つ', kana: 'みっつ', romaji: 'mittsu' },
            { num: 4, jp: '四つ', kana: 'よっつ', romaji: 'yottsu' },
            { num: 5, jp: '五つ', kana: 'いつつ', romaji: 'itsutsu' },
            { num: 6, jp: '六つ', kana: 'むっつ', romaji: 'muttsu' },
            { num: 7, jp: '七つ', kana: 'ななつ', romaji: 'nanatsu' },
            { num: 8, jp: '八つ', kana: 'やっつ', romaji: 'yattsu' },
            { num: 9, jp: '九つ', kana: 'ここのつ', romaji: 'kokonotsu' },
            { num: 10, jp: '十', kana: 'とお', romaji: 'too' },
            { num: 20, jp: '二十', kana: 'はたち', romaji: 'hatachi' },
            { num: 50, jp: '五十', kana: 'ごじゅう', romaji: 'gojuu' }
        ],
        contoh: 'りんごを三つください。 (Tolong tiga apel)'
    },
    {
        label: 'Lembar',
        suffix: '枚',
        pattern: [
            { num: 1, jp: '一枚', kana: 'いちまい', romaji: 'ichimai' },
            { num: 2, jp: '二枚', kana: 'にまい', romaji: 'nimai' },
            { num: 3, jp: '三枚', kana: 'さんまい', romaji: 'sanmai' },
            { num: 4, jp: '四枚', kana: 'よんまい', romaji: 'yonmai' },
            { num: 5, jp: '五枚', kana: 'ごまい', romaji: 'gomai' },
            { num: 6, jp: '六枚', kana: 'ろくまい', romaji: 'rokumai' },
            { num: 7, jp: '七枚', kana: 'ななまい', romaji: 'nanamai' },
            { num: 8, jp: '八枚', kana: 'はちまい', romaji: 'hachimai' },
            { num: 9, jp: '九枚', kana: 'きゅうまい', romaji: 'kyuumai' },
            { num: 10, jp: '十枚', kana: 'じゅうまい', romaji: 'juumai' },
        ],
        contoh: '紙を二枚ください。 (Tolong dua lembar kertas)'
    },
    {
        label: 'Ekor (hewan kecil)',
        suffix: '匹',
        pattern: [
            { num: 1, jp: '一匹', kana: 'いっぴき', romaji: 'ippiki' },
            { num: 2, jp: '二匹', kana: 'にひき', romaji: 'nihiki' },
            { num: 3, jp: '三匹', kana: 'さんびき', romaji: 'sanbiki' },
            { num: 4, jp: '四匹', kana: 'よんひき', romaji: 'yonhiki' },
            { num: 5, jp: '五匹', kana: 'ごひき', romaji: 'gohiki' },
            { num: 6, jp: '六匹', kana: 'ろっぴき', romaji: 'roppiki' },
            { num: 7, jp: '七匹', kana: 'ななひき', romaji: 'nanahiki' },
            { num: 8, jp: '八匹', kana: 'はっぴき', romaji: 'happiki' },
            { num: 9, jp: '九匹', kana: 'きゅうひき', romaji: 'kyuuhiki' },
            { num: 10, jp: '十匹', kana: 'じゅっぴき', romaji: 'juppiki' },
        ],
        contoh: '猫が三匹います。 (Ada tiga ekor kucing)'
    },
    {
        label: 'Umur',
        suffix: '歳',
        pattern: [
            { num: 1, jp: '一歳', kana: 'いっさい', romaji: 'issai' },
            { num: 2, jp: '二歳', kana: 'にさい', romaji: 'nisai' },
            { num: 3, jp: '三歳', kana: 'さんさい', romaji: 'sansai' },
            { num: 4, jp: '四歳', kana: 'よんさい', romaji: 'yonsai' },
            { num: 5, jp: '五歳', kana: 'ごさい', romaji: 'gosai' },
            { num: 6, jp: '六歳', kana: 'ろくさい', romaji: 'rokusai' },
            { num: 7, jp: '七歳', kana: 'ななさい', romaji: 'nanasai' },
            { num: 8, jp: '八歳', kana: 'はっさい', romaji: 'hassai' },
            { num: 9, jp: '九歳', kana: 'きゅうさい', romaji: 'kyuusai' },
            { num: 10, jp: '十歳', kana: 'じゅっさい', romaji: 'jussai' },
            { num: 20, jp: '二十歳', kana: 'はたち', romaji: 'hatachi' },
        ],
        contoh: '私は二十歳です。 (Saya berumur 20 tahun)'
    },
];

export default function NumberPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8 font-sans">
        <div className="mb-4 flex justify-start">
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <span>←</span> Back to Home
          </a>
        </div>
        <Head>
          <title>Angka & Counter Jepang</title>
          <meta name="description" content="Tabel angka Jepang, counter orang, barang, lembar, ekor, umur, dll" />
        </Head>
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Angka & Counter Jepang</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Tabel angka, jumlah orang, barang, lembar, ekor, umur, dll</p>
        </header>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">Angka Dasar</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-2 text-center mb-4">
              <thead>
                <tr>
                  <th className="px-2 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg">Kanji</th>
                  <th className="px-2 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">Kana</th>
                  <th className="px-2 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg">Romaji</th>
                  <th className="px-2 py-2 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-lg">Arti</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((n, i) => (
                  <tr key={i} className={rowBgColors[i % rowBgColors.length]}>
                    <td className="py-2 font-bold text-2xl jp-font">
                      <span className="inline-block px-3 py-1 rounded-lg bg-white dark:bg-gray-800 shadow text-blue-500 dark:text-blue-300">{n.jp}</span>
                    </td>
                    <td className="py-2 text-lg">
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">{n.kana}</span>
                    </td>
                    <td className="py-2 text-lg uppercase">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300">{n.romaji}</span>
                    </td>
                    <td className="py-2 text-lg">
                      <span className="inline-block px-2 py-1 rounded bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300">{n.arti}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-left">
              <span className="inline-block mr-4"><span className="jp-font font-bold text-blue-500">Kanji</span> = Tulisan Jepang</span>
              <span className="inline-block mr-4"><span className="jp-font font-bold text-green-700">Kana</span> = Cara baca Jepang</span>
              <span className="inline-block mr-4"><span className="jp-font font-bold text-yellow-700">Romaji</span> = Latinisasi</span>
              <span className="inline-block"><span className="jp-font font-bold text-pink-700">Arti</span> = Angka Indonesia</span>
            </div>
          </div>
        </section>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">Counter (Penghitung)</h2>
          <div className="flex flex-col gap-8">
            {counters.map((counter, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-8 border-green-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">{counter.label}</span>
                  <span className="text-base font-mono bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">{counter.suffix}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[320px] border-separate border-spacing-2 text-center mb-2">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg">Angka</th>
                        <th className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">Kanji</th>
                        <th className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg">Kana</th>
                        <th className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-lg">Romaji</th>
                      </tr>
                    </thead>
                    <tbody>
                      {counter.pattern.map((row, i) => (
                        <tr key={i} className={rowBgColors[i % rowBgColors.length]}>
                          <td className="py-1">{row.num}</td>
                          <td className="py-1 font-bold text-xl jp-font">
                            <span className="inline-block px-2 py-1 rounded bg-white dark:bg-gray-800 shadow text-blue-500 dark:text-blue-300">{row.jp}</span>
                          </td>
                          <td className="py-1">
                            <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">{row.kana}</span>
                          </td>
                          <td className="py-1 uppercase">
                            <span className="inline-block px-2 py-1 rounded bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300">{row.romaji}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Contoh: <span className="jp-font">{counter.contoh}</span></div>
              </div>
            ))}
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
