import React from 'react';
import Head from 'next/head';

// Warna untuk baris
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

const timeUnits = [
  { jp: '秒', kana: 'びょう', romaji: 'byou', arti: 'Detik' },
  { jp: '分', kana: 'ふん/ぷん', romaji: 'fun/pun', arti: 'Menit' },
  { jp: '時', kana: 'じ', romaji: 'ji', arti: 'Jam (waktu)' },
  { jp: '時間', kana: 'じかん', romaji: 'jikan', arti: 'Jam (durasi)' },
  { jp: '日', kana: 'にち/ひ', romaji: 'nichi/hi', arti: 'Hari' },
  { jp: '週', kana: 'しゅう', romaji: 'shuu', arti: 'Minggu' },
  { jp: '月', kana: 'がつ/つき', romaji: 'gatsu/tsuki', arti: 'Bulan (nama bulan/bulan kalender)' },
  { jp: 'ヶ月', kana: 'かげつ', romaji: 'kagetsu', arti: 'Bulan (durasi)' },
  { jp: '年', kana: 'ねん', romaji: 'nen', arti: 'Tahun' },
];

const months = [
  { num: 1, jp: '一月', kana: 'いちがつ', romaji: 'ichigatsu', arti: 'Januari' },
  { num: 2, jp: '二月', kana: 'にがつ', romaji: 'nigatsu', arti: 'Februari' },
  { num: 3, jp: '三月', kana: 'さんがつ', romaji: 'sangatsu', arti: 'Maret' },
  { num: 4, jp: '四月', kana: 'しがつ', romaji: 'shigatsu', arti: 'April' },
  { num: 5, jp: '五月', kana: 'ごがつ', romaji: 'gogatsu', arti: 'Mei' },
  { num: 6, jp: '六月', kana: 'ろくがつ', romaji: 'rokugatsu', arti: 'Juni' },
  { num: 7, jp: '七月', kana: 'しちがつ', romaji: 'shichigatsu', arti: 'Juli' },
  { num: 8, jp: '八月', kana: 'はちがつ', romaji: 'hachigatsu', arti: 'Agustus' },
  { num: 9, jp: '九月', kana: 'くがつ', romaji: 'kugatsu', arti: 'September' },
  { num: 10, jp: '十月', kana: 'じゅうがつ', romaji: 'juugatsu', arti: 'Oktober' },
  { num: 11, jp: '十一月', kana: 'じゅういちがつ', romaji: 'juuichigatsu', arti: 'November' },
  { num: 12, jp: '十二月', kana: 'じゅうにがつ', romaji: 'juunigatsu', arti: 'Desember' },
];

const daysOfWeek = [
  { jp: '日曜日', kana: 'にちようび', romaji: 'nichiyoubi', arti: 'Minggu' },
  { jp: '月曜日', kana: 'げつようび', romaji: 'getsuyoubi', arti: 'Senin' },
  { jp: '火曜日', kana: 'かようび', romaji: 'kayoubi', arti: 'Selasa' },
  { jp: '水曜日', kana: 'すいようび', romaji: 'suiyoubi', arti: 'Rabu' },
  { jp: '木曜日', kana: 'もくようび', romaji: 'mokuyoubi', arti: 'Kamis' },
  { jp: '金曜日', kana: 'きんようび', romaji: 'kinyoubi', arti: 'Jumat' },
  { jp: '土曜日', kana: 'どようび', romaji: 'doyoubi', arti: 'Sabtu' },
];

const relativeTime = [
  { jp: '今日', kana: 'きょう', romaji: 'kyou', arti: 'Hari ini' },
  { jp: '昨日', kana: 'きのう', romaji: 'kinou', arti: 'Kemarin' },
  { jp: '明日', kana: 'あした', romaji: 'ashita', arti: 'Besok' },
  { jp: '今週', kana: 'こんしゅう', romaji: 'konshuu', arti: 'Minggu ini' },
  { jp: '先週', kana: 'せんしゅう', romaji: 'senshuu', arti: 'Minggu lalu' },
  { jp: '来週', kana: 'らいしゅう', romaji: 'raishuu', arti: 'Minggu depan' },
  { jp: '今年', kana: 'ことし', romaji: 'kotoshi', arti: 'Tahun ini' },
  { jp: '去年', kana: 'きょねん', romaji: 'kyonen', arti: 'Tahun lalu' },
  { jp: '来年', kana: 'らいねん', romaji: 'rainen', arti: 'Tahun depan' },
];

export default function TimePage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8 font-sans">
        <div className="mb-4 flex justify-start">
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <span>←</span> Back to Home
          </a>
        </div>
        <Head>
          <title>Waktu Jepang</title>
          <meta name="description" content="Tabel waktu Jepang: detik, menit, jam, hari, minggu, bulan, tahun, dll" />
        </Head>
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Waktu dalam Bahasa Jepang</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Tabel detik, menit, jam, hari, minggu, bulan, tahun, nama bulan, hari, dll</p>
        </header>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">Satuan Waktu</h2>
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
                {timeUnits.map((n, i) => (
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
              <span className="inline-block"><span className="jp-font font-bold text-pink-700">Arti</span> = Bahasa Indonesia</span>
            </div>
          </div>
        </section>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">Nama Bulan</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-2 text-center mb-4">
              <thead>
                <tr>
                  <th className="px-2 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg">No</th>
                  <th className="px-2 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg">Kanji</th>
                  <th className="px-2 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg">Kana</th>
                  <th className="px-2 py-2 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-lg">Romaji</th>
                  <th className="px-2 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg">Arti</th>
                </tr>
              </thead>
              <tbody>
                {months.map((n, i) => (
                  <tr key={i} className={rowBgColors[i % rowBgColors.length]}>
                    <td className="py-2">{n.num}</td>
                    <td className="py-2 font-bold text-xl jp-font">
                      <span className="inline-block px-2 py-1 rounded bg-white dark:bg-gray-800 shadow text-green-700 dark:text-green-300">{n.jp}</span>
                    </td>
                    <td className="py-2">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300">{n.kana}</span>
                    </td>
                    <td className="py-2 uppercase">
                      <span className="inline-block px-2 py-1 rounded bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300">{n.romaji}</span>
                    </td>
                    <td className="py-2">
                      <span className="inline-block px-2 py-1 rounded bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300">{n.arti}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-purple-700 dark:text-purple-300">Hari dalam Seminggu</h2>
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
                {daysOfWeek.map((n, i) => (
                  <tr key={i} className={rowBgColors[i % rowBgColors.length]}>
                    <td className="py-2 font-bold text-xl jp-font">
                      <span className="inline-block px-2 py-1 rounded bg-white dark:bg-gray-800 shadow text-blue-500 dark:text-blue-300">{n.jp}</span>
                    </td>
                    <td className="py-2">
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">{n.kana}</span>
                    </td>
                    <td className="py-2 uppercase">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300">{n.romaji}</span>
                    </td>
                    <td className="py-2">
                      <span className="inline-block px-2 py-1 rounded bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300">{n.arti}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-orange-700 dark:text-orange-300">Kata Waktu Relatif</h2>
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
                {relativeTime.map((n, i) => (
                  <tr key={i} className={rowBgColors[i % rowBgColors.length]}>
                    <td className="py-2 font-bold text-xl jp-font">
                      <span className="inline-block px-2 py-1 rounded bg-white dark:bg-gray-800 shadow text-orange-500 dark:text-orange-300">{n.jp}</span>
                    </td>
                    <td className="py-2">
                      <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300">{n.kana}</span>
                    </td>
                    <td className="py-2 uppercase">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300">{n.romaji}</span>
                    </td>
                    <td className="py-2">
                      <span className="inline-block px-2 py-1 rounded bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-300">{n.arti}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-left">
              <span className="inline-block mr-4"><span className="jp-font font-bold text-orange-500">Kanji</span> = Tulisan Jepang</span>
              <span className="inline-block mr-4"><span className="jp-font font-bold text-green-700">Kana</span> = Cara baca Jepang</span>
              <span className="inline-block mr-4"><span className="jp-font font-bold text-yellow-700">Romaji</span> = Latinisasi</span>
              <span className="inline-block"><span className="jp-font font-bold text-pink-700">Arti</span> = Bahasa Indonesia</span>
            </div>
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
