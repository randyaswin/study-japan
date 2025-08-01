import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';
import InstallPrompt from '@/components/InstallPrompt';


export default function HomePage() {
    // Cari semua file sprint_dayX.json di src/data
    const dataDir = path.join(process.cwd(), 'src', 'data');
    let days: string[] = [];
    try {
        const files = fs.readdirSync(dataDir);
        days = files
            .filter(f => f.startsWith('sprint_day') && f.endsWith('.json'))
            .map(f => {
                const match = f.match(/sprint_day(\d+)\.json/);
                return match ? match[1] : null;
            })
            .filter(Boolean) as string[];
        days.sort((a, b) => Number(a) - Number(b));
    } catch {
        // fallback: tampilkan kosong
    }

    return (
        <div className="bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen flex flex-col">
            <Head>
                <title>Study Japan Journey - JLPT Sprint</title>
                <meta name="description" content="Landing page belajar JLPT harian" />
            </Head>
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center drop-shadow">Study Japan Journey</h1>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">Selamat datang di Sprint Belajar Harian JLPT! Pilih hari untuk mulai belajar kanji, kosakata, dan tata bahasa dengan visualisasi dan contoh kalimat lengkap.</p>
                <div className="flex flex-wrap gap-6 justify-center">
                    {/* Link ke halaman Angka */}
                    <Link
                        href="/number"
                        className="block bg-green-50 dark:bg-green-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-green-200 dark:border-green-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-100 dark:hover:bg-green-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-green-600 dark:text-green-300 mb-2">Angka</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Angka, Counter, Jumlah</span>
                    </Link>
                    {/* Link ke halaman Waktu */}
                    <Link
                        href="/time"
                        className="block bg-purple-50 dark:bg-purple-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-purple-600 dark:text-purple-300 mb-2">Waktu</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Jam, Hari, Bulan, Tahun</span>
                    </Link>
                    {/* Link ke halaman Hiragana */}
                    <Link
                        href="/hiragana"
                        className="block bg-pink-50 dark:bg-pink-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-pink-200 dark:border-pink-600 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-100 dark:hover:bg-pink-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-pink-500 dark:text-pink-300 mb-2">Hiragana</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Jembatan Keledai & Mnemonic</span>
                    </Link>
                    {/* Link ke halaman Katakana */}
                    <Link
                        href="/katakana"
                        className="block bg-blue-50 dark:bg-blue-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-blue-500 dark:text-blue-300 mb-2">Katakana</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Jembatan Keledai & Mnemonic</span>
                    </Link>
                    <Link
                        href="/kaiwa"
                        className="block bg-teal-50 dark:bg-teal-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-teal-200 dark:border-teal-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-100 dark:hover:bg-teal-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-teal-600 dark:text-teal-300 mb-2">Kaiwa</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">会話 - Percakapan</span>
                    </Link>
                    <Link
                        href="/n5"
                        className="block bg-yellow-50 dark:bg-yellow-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-yellow-200 dark:border-yellow-600 hover:border-yellow-400 dark:hover:border-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-yellow-600 dark:text-yellow-300 mb-2">JLPT N5</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Materi JLPT N5</span>
                    </Link>
                    {/* Link ke halaman Quiz */}
                    <Link
                        href="/quiz"
                        className="block bg-red-50 dark:bg-red-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-red-200 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-100 dark:hover:bg-red-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-red-600 dark:text-red-300 mb-2">Simulasi Tes JLPT</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Simulasi Tes JLPT N1-N5</span>
                    </Link>
                </div>
            </main>
            <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">&copy; {new Date().getFullYear()} M. Randy Aswin</footer>
            <InstallPrompt />
        </div>
    );
}