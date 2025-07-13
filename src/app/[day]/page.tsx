import React from 'react';
import Head from 'next/head';
import { notFound } from 'next/navigation';
import path from 'path';
import fs from 'fs';

// Komponen untuk me-render furigana dengan benar
// Membuat furigana (rt) di atas kanji (rb) berwarna merah dan bisa diperbesar
const Furigana = ({ htmlString, className = '', rtClass = '', boldMain = false }: { htmlString: string | undefined; className?: string; rtClass?: string; mainClass?: string; boldMain?: boolean }) => {
    if (typeof htmlString !== 'string') return null;
    let html = htmlString;
    if (rtClass) {
        html = html.replace(/<rt>(.*?)<\/rt>/g, `<rt style=\"color:rgb(156 163 175);font-weight:normal;\" class='${rtClass} dark:text-gray-400'>$1</rt>`);
    } else {
        html = html.replace(/<rt>(.*?)<\/rt>/g, '<rt style="color:red" class="dark:text-red-400">$1</rt>');
    }
    // Improved: wrap all content before <rt> inside <ruby> with span for boldMain (handles tags, spaces, punctuation)
    if (boldMain) {
        html = html.replace(/<ruby>([\s\S]*?)(<rt>)/g, '<ruby><span style="color:#111 !important;font-weight:bold;" class="dark:!text-gray-100">$1</span>$2');
    }
    return (
        <span
            className={`font-[\'Noto Sans JP\'], jp-font font-bold ${className}`}
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

const getHeaderBgColor = (type: string) => {
    switch (type) {
        case 'kanji': return `bg-${colors.kanji}-100 dark:bg-${colors.kanji}-900`;
        case 'vocabulary': return `bg-${colors.noun}-100 dark:bg-${colors.noun}-900`;
        case 'grammar': return `bg-${colors.grammar}-100 dark:bg-${colors.grammar}-900`;
        default: return 'bg-gray-100 dark:bg-gray-800';
    }
};

interface ExampleObj {
    jp: string;
    romaji: string;
    id?: string;
}

interface KanjiItem {
    kanji: string;
    onyomi: string;
    kunyomi: string;
    arti: string;
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
    short_explanation?: string; // Penjelasan singkat
    explanation: string;
    visual?: string; // Tambahkan field visual opsional
    visualLabels?: GrammarVisualLabel[];
    examples: ExampleObj[];
}

interface SprintData {
    day: number;
    type: string; // N5, N4, N3, N2, N1
    kanji: KanjiItem[];
    vocabulary: VocabItem[];
    grammar: GrammarItem[];
}


export async function generateStaticParams() {
    // List all sprint_day*.json in ../data
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const files = fs.readdirSync(dataDir);
    return files
        .filter(f => f.startsWith('sprint_day') && f.endsWith('.json'))
        .map(f => {
            const match = f.match(/sprint_day(\d+)\.json/);
            return match ? { day: match[1] } : null;
        })
        .filter(Boolean);
}

export default async function DailySprintPage({ params }: { params: Promise<{ day: string }> }) {
    const { day } = await params;
    // Dynamic import of JSON data based on day param
    let sprintData: SprintData | null = null;
    try {
        const dataDir = path.join(process.cwd(), 'src', 'data');
        const filePath = path.join(dataDir, `sprint_day${day}.json`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        sprintData = JSON.parse(fileContent);
    } catch {
        notFound();
    }
    if (!sprintData) {
        notFound();
    }
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="container mx-auto p-4 sm:p-8 font-sans">
                <Head>
                    <title>Belajar Harian: Hari {sprintData.day}</title>
                    <meta name="description" content={`Materi belajar Jepang untuk hari ke-${sprintData.day}`} />
                </Head>

                {/* Navigation */}
                <nav className="mb-8 flex gap-2 flex-wrap justify-center">
                    {/* Dynamically generate navigation based on available files */}
                    {(() => {
                        const dataDir = path.join(process.cwd(), 'src', 'data');
                        const files = fs.readdirSync(dataDir);
                        const days = files
                            .filter(f => f.startsWith('sprint_day') && f.endsWith('.json'))
                            .map(f => {
                                const match = f.match(/sprint_day(\d+)\.json/);
                                return match ? match[1] : null;
                            })
                            .filter(Boolean);
                        return days.map(n => (
                            <a key={n} href={`/${n}`} className={`px-4 py-2 rounded font-bold border ${day==n ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-gray-800 text-orange-500 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-gray-700'}`}>Hari {n}</a>
                        ));
                    })()}
                </nav>

                <header className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Belajar Harian</h1>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Hari {sprintData.day} - Membangun Fondasi JLPT {sprintData.type}</p>
                </header>

                {/* Kanji */}
                <section id="kanji" className="mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 border-l-8 border-orange-500 pl-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-orange-500 text-2xl">🟠</span> Kanji
                    </h2>
                    <div className="flex flex-col gap-6">
                        {sprintData.kanji.map((item, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col sm:flex-row p-5 border-l-8 border-orange-400">
                                <div className="flex-shrink-0 flex flex-col items-center justify-center mr-6 mb-4 sm:mb-0">
                                    <div className="text-orange-500 text-5xl font-bold jp-font mb-1">{item.kanji}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="mb-1 flex-col flex-wrap gap-2 items-center">
                                        <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Onyomi:
                                            <span className="ml-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-sm">{item.onyomi}</span>
                                        </span>
                                        <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Kunyomi:
                                            <span className="ml-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-mono text-sm">{item.kunyomi}</span>
                                        </span>
                                        <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Arti:
                                            <span className="ml-1 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-mono text-sm">{item.arti}</span>
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="block text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">Jembatan Keledai Visual:</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.mnemonic}</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                        <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Contoh:</span>
                                        <div className="text-lg jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight">
                                            <Furigana htmlString={item.example.jp} className="text-base" rtClass="furigana-bold" boldMain={true} />
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.example.romaji}</div>
                                        {item.example.id && (
                                            <div className="text-xs text-green-700 dark:text-green-400 mt-1 italic">{item.example.id}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Kosakata */}
                <section id="vocabulary" className={`mb-12 rounded-xl p-4 sm:p-6 ${getHeaderBgColor('vocabulary')} dark:bg-gray-800`}> 
                    <h2 className={`text-2xl sm:text-3xl font-bold mb-4 border-l-8 border-${colors.noun}-500 pl-4 text-gray-700 dark:text-gray-300`}>🔵🟢 Kosakata</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {sprintData.vocabulary.map((item, index) => {
                            let borderColor = '';
                            let typeLabel = '';
                            let typeLabelColor = '';
                            if (item.type === '🔵') {
                                borderColor = 'border-blue-400';
                                typeLabel = 'Kata Benda';
                                typeLabelColor = 'bg-blue-100 text-blue-700';
                            } else if (item.type === '🟢') {
                                borderColor = 'border-green-400';
                                typeLabel = 'Kata Kerja';
                                typeLabelColor = 'bg-green-100 text-green-700';
                            } else if (item.type === '🟣') {
                                borderColor = 'border-purple-400';
                                typeLabel = 'Kata Sifat';
                                typeLabelColor = 'bg-purple-100 text-purple-700';
                            } else {
                                borderColor = 'border-gray-300';
                                typeLabel = 'Lainnya';
                                typeLabelColor = 'bg-gray-100 text-gray-700';
                            }
                            return (
                                <div key={index} className={`relative border-l-8 ${borderColor} bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col min-h-[260px]`}>
                                    <span className={`absolute right-4 top-4 px-3 py-1 rounded-full text-xs font-semibold ${typeLabelColor} dark:bg-gray-700 dark:text-gray-300`}>{typeLabel}</span>
                                    <div className="mb-2">
                                        <div className="text-lg jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight">
                                            <Furigana htmlString={item.vocab} className="text-base" rtClass="furigana-bold" boldMain={true} />
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-1"><Furigana htmlString={item.reading_meaning} /></div>
                                        <div className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Arti: {item.reading_meaning.replace(/\(.+\)/, '').trim()}</div>
                                    </div>
                                    <div className="mb-2">
                                        <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Visual:</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.mnemonic}</span>
                                    </div>
                                    <div className="mt-auto">
                                        <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Contoh:</span>
                                        <div className="text-lg jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight">
                                            <Furigana htmlString={item.example.jp} className="text-base" rtClass="furigana-bold" boldMain={true} />
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.example.romaji}</div>
                                        {item.example.id && (
                                            <div className="text-xs text-green-700 dark:text-green-400 mt-1 italic">{item.example.id}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Tata Bahasa */}
                <section id="grammar" className="mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 border-l-8 border-yellow-400 pl-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-yellow-400 text-2xl">🟡</span> Tata Bahasa
                    </h2>
                    <div className="flex flex-col gap-8">
                        {sprintData.grammar.map((item, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-t-4 border-yellow-300">
                                <div className="mb-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">{item.pattern}</h3>
                                    {item.short_explanation ? (
                                        <div className="text-base text-gray-700 dark:text-gray-300 mb-2 font-semibold">{item.short_explanation}</div>
                                    ) : null}
                                </div>
                                <div className="bg-yellow-50 dark:bg-gray-700 border border-yellow-200 dark:border-gray-600 rounded p-4 mb-4">
                                    <span className="block text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-2">Penjelasan:</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{__html: item.explanation}} />
                                </div>
                                <div className="bg-yellow-50 dark:bg-gray-700 border border-yellow-200 dark:border-gray-600 rounded p-4 mb-4">
                                    <span className="block text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-2">Visual:</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{__html: item.visual || ''}} />
                                    <div className="flex gap-2 mt-3">
                                        {item.visualLabels && item.visualLabels.map((v, idx) => {
                                            let colorClass = '';
                                            if (v.color === 'blue') colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
                                            else if (v.color === 'green') colorClass = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
                                            else if (v.color === 'yellow') colorClass = 'text-yellow-500 dark:text-yellow-400 text-2xl font-bold bg-transparent px-0 py-0';
                                            else if (v.color === 'purple') colorClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
                                            else if (v.color === 'orange') colorClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
                                            else colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                                            // Untuk simbol (を, へ), tampilkan lebih besar dan tanpa background
                                            const isSymbol = v.label === 'を' || v.label === 'へ';
                                            return isSymbol ? (
                                                <span key={idx} className={colorClass}>{v.label}</span>
                                            ) : (
                                                <span key={idx} className={`px-3 py-1 rounded font-semibold text-sm ${colorClass}`}>{v.label}</span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contoh Kalimat:</span>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                        {item.examples.map((ex, i) => (
                                            <li key={i}>
                                                <Furigana htmlString={ex.jp} className="text-base" rtClass="furigana-bold" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">({ex.romaji})</span>
                                                {ex.id && (
                                                    <span className="text-xs text-green-700 dark:text-green-400 ml-2 italic">- {ex.id}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}