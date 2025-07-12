import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import fs from 'fs';

// Komponen untuk me-render furigana dengan benar
// Membuat furigana (rt) di atas kanji (rb) berwarna merah dan bisa diperbesar
const Furigana = ({ htmlString, className = '', rtClass = '', mainClass = '', boldMain = false }: { htmlString: string | undefined; className?: string; rtClass?: string; mainClass?: string; boldMain?: boolean }) => {
    if (typeof htmlString !== 'string') return null;
    let html = htmlString;
    if (rtClass) {
        html = html.replace(/<rt>(.*?)<\/rt>/g, `<rt style=\"color:black;font-weight:normal;\" class='${rtClass}'>$1</rt>`);
    } else {
        html = html.replace(/<rt>(.*?)<\/rt>/g, '<rt style="color:red">$1</rt>');
    }
    // Improved: wrap all content before <rt> inside <ruby> with span for boldMain (handles tags, spaces, punctuation)
    if (boldMain) {
        html = html.replace(/<ruby>([\s\S]*?)(<rt>)/g, '<ruby><span style="color:#111 !important;font-weight:bold;">$1</span>$2');
    }
    return (
        <span
            className={`font-[\'Noto Sans JP\'], jp-font ${className}`}
            dangerouslySetInnerHTML={{
                __html: html,
            }}
        />
    );
};

// Palet warna untuk konsistensi
const colors = {
    kanji: 'orange',
    noun: 'blue',
    verb: 'green',
    adjective: 'purple',
    grammar: 'yellow',
};

const getBorderColor = (type: string) => {
    switch (type) {
        case '🔵': return `border-${colors.noun}-500`;
        case '🟢': return `border-${colors.verb}-500`;
        case '🟣': return `border-${colors.adjective}-500`;
        default: return 'border-gray-500';
    }
};

const getHeaderBgColor = (type: string) => {
    switch (type) {
        case 'kanji': return `bg-${colors.kanji}-100`;
        case 'vocabulary': return `bg-${colors.noun}-100`;
        case 'grammar': return `bg-${colors.grammar}-100`;
        default: return 'bg-gray-100';
    }
};

interface ExampleObj {
    jp: string;
    romaji: string;
    id?: string;
}

interface KanjiItem {
    kanji: string;
    reading_meaning: string;
    mnemonic: string;
    example: ExampleObj;
}

interface VocabItem {
    vocab: string;
    reading_meaning: string;
    type: string;
    mnemonic: string;
    example: ExampleObj;
}

interface GrammarVisualLabel {
    label: string;
    color: 'blue' | 'yellow' | 'green' | 'purple' | 'orange' | string;
}

interface GrammarItem {
    pattern: string;
    explanation: string;
    visual?: string; // Tambahkan field visual opsional
    visualLabels?: GrammarVisualLabel[];
    examples: ExampleObj[];
}

interface SprintData {
    day: number;
    kanji: KanjiItem[];
    vocabulary: VocabItem[];
    grammar: GrammarItem[];
}

interface DailySprintPageProps {
    sprintData: SprintData;
}

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
    } catch (e) {
        // fallback: tampilkan kosong
    }

    return (
        <div className="bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 min-h-screen flex flex-col">
            <Head>
                <title>Study Japan Journey - JLPT Sprint</title>
                <meta name="description" content="Landing page belajar JLPT harian" />
                <script src="https://cdn.tailwindcss.com"></script>
            </Head>
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-4 text-center drop-shadow">Study Japan Journey</h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 text-center max-w-2xl">Selamat datang di Sprint Belajar Harian JLPT! Pilih hari untuk mulai belajar kanji, kosakata, dan tata bahasa dengan visualisasi dan contoh kalimat lengkap.</p>
                <div className="flex flex-wrap gap-6 justify-center">
                    {days.length === 0 ? (
                        <div className="text-gray-500">Belum ada data hari tersedia.</div>
                    ) : (
                        days.map(day => (
                            <Link key={day} href={`/${day}`} className="block bg-white rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all">
                                <span className="block text-2xl font-bold text-orange-500 mb-2">Hari {day}</span>
                                <span className="text-gray-700 text-sm">Sprint JLPT</span>
                            </Link>
                        ))
                    )}
                </div>
            </main>
            <footer className="text-center text-xs text-gray-400 py-4">&copy; {new Date().getFullYear()} Study Japan Journey</footer>
        </div>
    );
}