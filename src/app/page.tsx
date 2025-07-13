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
                    {/* Link ke halaman Hiragana */}
                    <a
                        href="/hiragana"
                        className="block bg-pink-50 dark:bg-pink-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-pink-200 dark:border-pink-600 hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-100 dark:hover:bg-pink-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-pink-500 dark:text-pink-300 mb-2">Hiragana</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Jembatan Keledai & Mnemonic</span>
                    </a>
                    {/* Link ke halaman Katakana */}
                    <a
                        href="/katakana"
                        className="block bg-blue-50 dark:bg-blue-900 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-blue-200 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 transition-all"
                    >
                        <span className="block text-2xl font-bold text-blue-500 dark:text-blue-300 mb-2">Katakana</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">Jembatan Keledai & Mnemonic</span>
                    </a>
                    {days.length === 0 ? (
                        <div className="text-gray-500 dark:text-gray-400">Belum ada data hari tersedia.</div>
                    ) : (
                        days.map(day => (
                            <Link key={day} href={`/${day}`} className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-orange-200 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 transition-all">
                                <span className="block text-2xl font-bold text-orange-500 dark:text-orange-400 mb-2">Hari {day}</span>
                                <span className="text-gray-700 dark:text-gray-300 text-sm">Sprint JLPT</span>
                            </Link>
                        ))
                    )}
                </div>
            </main>
            <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">&copy; {new Date().getFullYear()} Study Japan Journey</footer>
            <InstallPrompt />
        </div>
    );
}