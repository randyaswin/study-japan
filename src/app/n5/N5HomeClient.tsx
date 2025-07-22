"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSettings, useN5, useFlipMode, useMultipleChoice } from '@/lib/StudyContext';
import Furigana from '@/components/Furigana';
import BushuPosition from '@/components/BushuPosition';


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
    bushu?: string;
    bushu_position?: 'hen' | 'tsukuri' | 'kanmuri' | 'ashi' | 'kamae' | 'tare' | 'nyou';
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
    short_explanation?: string;
    explanation: string;
    visual?: string;
    visualLabels?: GrammarVisualLabel[];
    examples: ExampleObj[];
}

interface SprintData {
    day: number;
    type: string;
    kanji: KanjiItem[];
    vocabulary: VocabItem[];
    grammar: GrammarItem[];
    kanjiNote?: string;
    vocabNote?: string;
    grammarNote?: string;
}

interface N5HomeClientProps {
    kanjiData: KanjiItem[];
    vocabData: VocabItem[];
    grammarData: GrammarItem[];
}

export default function N5HomeClient({ kanjiData, vocabData, grammarData }: N5HomeClientProps) {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { n5Data, setN5CurrentPage, goToStudyPage, goToHomePage } = useN5();
    const { 
        kanjiFlipMode, vocabFlipMode, flippedKanjiCards, flippedVocabCards,
        toggleKanjiFlipMode, toggleVocabFlipMode, toggleKanjiCard, toggleVocabCard,
        resetFlipModes
    } = useFlipMode();
    const {
        kanjiMultipleChoice, vocabMultipleChoice, kanjiAnswers, vocabAnswers,
        showKanjiResults, showVocabResults,
        toggleKanjiMultipleChoice, toggleVocabMultipleChoice,
        setKanjiAnswer, setVocabAnswer, resetKanjiAnswers, resetVocabAnswers
    } = useMultipleChoice();
    
    const [kanjiOptions, setKanjiOptions] = useState<{[key: number]: string[]}>({});
    const [vocabOptions, setVocabOptions] = useState<{[key: number]: string[]}>({});
    const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);

    // Calculate current page data based on settings and current page
    const getCurrentPageData = useCallback((): SprintData => {
        const currentPage = n5Data.currentPage;
        
        // Get paginated data for each section
        const kanjiStartIndex = (currentPage - 1) * settings.kanjiPerPage;
        const kanjiEndIndex = kanjiStartIndex + settings.kanjiPerPage;
        const paginatedKanji = kanjiData.slice(kanjiStartIndex, kanjiEndIndex);
        
        const vocabularyStartIndex = (currentPage - 1) * settings.vocabularyPerPage;
        const vocabularyEndIndex = vocabularyStartIndex + settings.vocabularyPerPage;
        const paginatedVocab = vocabData.slice(vocabularyStartIndex, vocabularyEndIndex);
        
        const grammarStartIndex = (currentPage - 1) * settings.grammarPerPage;
        const grammarEndIndex = grammarStartIndex + settings.grammarPerPage;
        const paginatedGrammar = grammarData.slice(grammarStartIndex, grammarEndIndex);
        
        return {
            day: currentPage,
            type: "N5",
            kanji: paginatedKanji,
            vocabulary: paginatedVocab,
            grammar: paginatedGrammar
        };
    }, [n5Data.currentPage, settings.kanjiPerPage, settings.vocabularyPerPage, settings.grammarPerPage, kanjiData, vocabData, grammarData]);

    // Helper function to generate multiple choice options for kanji
    const generateKanjiOptions = (correctItem: KanjiItem, allKanjiMeanings: string[]) => {
        const options = [correctItem.arti];
        // Use all kanji meanings for incorrect options for increased difficulty (lightweight approach)
        const otherMeanings = allKanjiMeanings.filter(meaning => meaning !== correctItem.arti);
        
        // Shuffle and pick 3 random incorrect options
        const shuffled = [...otherMeanings].sort(() => 0.5 - Math.random());
        const incorrectOptions = shuffled.slice(0, 3);
        
        options.push(...incorrectOptions);
        return options.sort(() => 0.5 - Math.random()); // Shuffle the final options
    };

    // Helper function to generate multiple choice options for vocabulary
    const generateVocabOptions = (correctItem: VocabItem, allVocabMeanings: string[]) => {
        // Extract meaning from reading_meaning field
        const correctMeaning = (() => {
            const match = correctItem.reading_meaning.match(/\((.*)\)/);
            return match ? match[1] : '';
        })();
        
        const options = [correctMeaning];
        // Use all vocab meanings for incorrect options for increased difficulty (lightweight approach)
        const otherMeanings = allVocabMeanings.filter(meaning => meaning !== correctMeaning);
        
        // Shuffle and pick 3 random incorrect options
        const shuffled = [...otherMeanings].sort(() => 0.5 - Math.random());
        const incorrectOptions = shuffled.slice(0, 3);
        
        options.push(...incorrectOptions);
        return options.sort(() => 0.5 - Math.random()); // Shuffle the final options
    };

    // Generate options when multiple choice mode is activated
    useEffect(() => {
        if (kanjiMultipleChoice) {
            const currentPageData = getCurrentPageData();
            const newKanjiOptions: {[key: number]: string[]} = {};
            const allKanjiMeanings = kanjiData.map(item => item.arti);
            currentPageData.kanji.forEach((item, index) => {
                newKanjiOptions[index] = generateKanjiOptions(item, allKanjiMeanings);
            });
            setKanjiOptions(newKanjiOptions);
        }
    }, [kanjiMultipleChoice, n5Data.currentPage, settings.kanjiPerPage, getCurrentPageData, kanjiData]);

    useEffect(() => {
        if (vocabMultipleChoice) {
            const currentPageData = getCurrentPageData();
            const newVocabOptions: {[key: number]: string[]} = {};
            const allVocabMeanings = vocabData.map(item => {
                const match = item.reading_meaning.match(/\((.*)\)/);
                return match ? match[1] : '';
            }).filter(meaning => meaning);
            currentPageData.vocabulary.forEach((item, index) => {
                newVocabOptions[index] = generateVocabOptions(item, allVocabMeanings);
            });
            setVocabOptions(newVocabOptions);
        }
    }, [vocabMultipleChoice, n5Data.currentPage, settings.vocabularyPerPage, getCurrentPageData, vocabData]);

    // Reset modes when changing pages
    useEffect(() => {
        resetFlipModes();
        resetKanjiAnswers();
        resetVocabAnswers();
    }, [n5Data.currentPage, resetFlipModes, resetKanjiAnswers, resetVocabAnswers]);

    if (n5Data.viewMode === 'study') {
        const sprintData = getCurrentPageData();
        return (
            <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="container mx-auto p-4 sm:p-8 font-sans">
                    {/* Back to Home navigation */}
                    <div className="mb-6 flex justify-start">
                        <button 
                            onClick={goToHomePage}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            <span>←</span> Back
                        </button>
                    </div>
                    {/* Navigation */}
                    <nav className="mb-8 flex gap-2 flex-wrap justify-center">
                        {(() => {
                            const days = n5Data.availableDays;
                            const currentDay = n5Data.currentPage;
                            const total = days.length;

                            // Always show first, current, last
                            // Show up to 2 before and after current (if available)
                            // Insert ellipsis where needed
                            const navSet = new Set<number>();
                            navSet.add(days[0]);
                            navSet.add(currentDay);
                            navSet.add(days[total - 1]);
                            for (let offset = -2; offset <= 2; offset++) {
                                const n = currentDay + offset;
                                if (n > 0 && days.includes(n)) {
                                    navSet.add(n);
                                }
                            }
                            const uniquePages = Array.from(navSet).sort((a, b) => a - b);

                            // Insert ellipsis where needed
                            const navItems: (number | 'ellipsis')[] = [];
                            for (let i = 0; i < uniquePages.length; i++) {
                                navItems.push(uniquePages[i]);
                                if (
                                    i < uniquePages.length - 1 &&
                                    uniquePages[i + 1] - uniquePages[i] > 1
                                ) {
                                    navItems.push('ellipsis');
                                }
                            }

                            return navItems.map((n, idx) =>
                                n === 'ellipsis' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-500">...</span>
                                ) : (
                                    <button
                                        key={n}
                                        onClick={() => setN5CurrentPage(n)}
                                        className={`px-4 py-2 rounded font-bold border ${
                                            n5Data.currentPage === n
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white dark:bg-gray-800 text-orange-500 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        Halaman {n}
                                    </button>
                                )
                            );
                        })()}
                    </nav>
                    <header className="text-center mb-10">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Belajar JLPT N5</h1>
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Halaman {sprintData.day} - Membangun Fondasi JLPT {sprintData.type}</p>
                    </header>
                    {/* Kanji Section */}
                    {sprintData.kanji && sprintData.kanji.length > 0 && (
                        <section id="kanji" className="mb-12">
                            <div className="mb-4">
                                <h2 className="text-2xl sm:text-3xl font-bold border-l-8 border-orange-500 pl-4 text-gray-700 dark:text-gray-300 mb-4">
                                    <span className="text-orange-500 text-2xl">🟠</span> Kanji
                                </h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Mode Hafalan:</span>
                                        <button
                                            onClick={() => {
                                                toggleKanjiFlipMode();
                                                toggleKanjiMultipleChoice(false); // Turn off multiple choice when switching to flip mode
                                                resetKanjiAnswers();
                                                setKanjiOptions({});
                                            }}
                                            className={`px-3 py-2 rounded-lg font-semibold transition text-sm ${
                                                kanjiFlipMode
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <span className="sm:hidden">🔄 </span>
                                            {kanjiFlipMode ? 'Hafalan ON' : 'Hafalan OFF'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Pilihan Ganda:</span>
                                        <button
                                            onClick={() => {
                                                toggleKanjiMultipleChoice();
                                                toggleKanjiFlipMode(false); // Turn off flip mode when switching to multiple choice
                                                resetKanjiAnswers();
                                                setKanjiOptions({});
                                            }}
                                            className={`px-3 py-2 rounded-lg font-semibold transition text-sm ${
                                                kanjiMultipleChoice
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <span className="sm:hidden">📝 </span>
                                            {kanjiMultipleChoice ? 'Quiz ON' : 'Quiz OFF'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                {sprintData.kanji.map((item, index) => {
                                    const multipleChoiceOptions = kanjiOptions[index] || [];
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={`bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col sm:flex-row p-5 border-l-8 border-orange-400 ${
                                                kanjiFlipMode ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
                                            }`}
                                            onClick={() => {
                                                if (kanjiFlipMode) {
                                                    toggleKanjiCard(index);
                                                }
                                            }}
                                        >
                                            {kanjiMultipleChoice && multipleChoiceOptions.length > 0 ? (
                                                // Multiple Choice Mode
                                                <>
                                                    <div className="flex-shrink-0 flex flex-col items-center justify-center mr-6 mb-4 sm:mb-0">
                                                        <div className="text-orange-500 text-5xl font-bold jp-font mb-1">{item.kanji}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Pilih arti yang benar</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-4">
                                                            <span className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Apa arti dari kanji ini?</span>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {multipleChoiceOptions.map((option, optionIndex) => {
                                                                    const isSelected = kanjiAnswers[index] === option;
                                                                    const isCorrect = option === item.arti;
                                                                    const showResult = showKanjiResults[index];
                                                                    
                                                                    let buttonClass = 'w-full text-left p-3 rounded-lg border transition-all ';
                                                                    if (!showResult) {
                                                                        buttonClass += isSelected 
                                                                            ? 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300' 
                                                                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600';
                                                                    } else {
                                                                        if (isCorrect) {
                                                                            buttonClass += 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300';
                                                                        } else if (isSelected) {
                                                                            buttonClass += 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300';
                                                                        } else {
                                                                            buttonClass += 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
                                                                        }
                                                                    }
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={optionIndex}
                                                                            className={buttonClass}
                                                                            disabled={showResult}
                                                                            onClick={() => setKanjiAnswer(index, option)}
                                                                        >
                                                                            {option}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        {showKanjiResults[index] && (
                                                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                                                <div className="mb-1 flex-col flex-wrap gap-2">
                                                                    <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Onyomi: <span className="ml-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-sm">{item.onyomi}</span></span>
                                                                    <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Kunyomi: <span className="ml-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-mono text-sm">{item.kunyomi}</span></span>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <span className="block text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">Jembatan Keledai Visual:</span>
                                                                    <span className="text-xs text-gray-700 dark:text-gray-300">{item.mnemonic}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : !kanjiFlipMode || !flippedKanjiCards.has(index) ? (
                                                // Front side - Kanji (Normal mode)
                                                <>
                                                    <div className="flex-shrink-0 flex flex-col items-center justify-center mr-6 mb-4 sm:mb-0">
                                                        <div className="text-orange-500 text-5xl font-bold jp-font mb-1">{item.kanji}</div>
                                                        {kanjiFlipMode && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Klik untuk lihat jawaban</div>
                                                        )}
                                                    </div>
                                                    {!kanjiFlipMode && (
                                                        <div className="flex-1">
                                                            <div className="mb-1 flex-col flex-wrap gap-2 items-center">
                                                                <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Onyomi: <span className="ml-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-sm">{item.onyomi}</span></span>
                                                                <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Kunyomi: <span className="ml-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-mono text-sm">{item.kunyomi}</span></span>
                                                                <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Arti: <span className="ml-1 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-mono text-sm">{item.arti}</span></span>
                                                                {item.bushu && item.bushu_position && (
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Bushu:</span>
                                                                        <span className="font-mono text-sm px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{item.bushu}</span>
                                                                        <BushuPosition position={item.bushu_position} className="w-5 h-5 text-gray-500" />
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">({item.bushu_position})</span>
                                                                    </div>
                                                                )}
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
                                                    )}
                                                </>
                                            ) : (
                                                // Back side - Answer (keep original layout)
                                                <>
                                                    <div className="flex-shrink-0 flex flex-col items-center justify-center mr-6 mb-4 sm:mb-0">
                                                        <div className="text-orange-500 text-3xl font-bold jp-font mb-1">{item.kanji}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Klik lagi untuk kembali</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-1 flex-col flex-wrap gap-2 items-center">
                                                            <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Onyomi: <span className="ml-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-sm">{item.onyomi}</span></span>
                                                            <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Kunyomi: <span className="ml-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-mono text-sm">{item.kunyomi}</span></span>
                                                            <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Arti: <span className="ml-1 px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-mono text-sm">{item.arti}</span></span>
                                                            {item.bushu && item.bushu_position && (
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Bushu:</span>
                                                                    <span className="font-mono text-sm px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{item.bushu}</span>
                                                                    <BushuPosition position={item.bushu_position} className="w-5 h-5 text-gray-500" />
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">({item.bushu_position})</span>
                                                                </div>
                                                            )}
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
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    {/* Vocabulary Section */}
                    {sprintData.vocabulary && sprintData.vocabulary.length > 0 && (
                        <section id="vocabulary" className={`mb-12 rounded-xl p-4 sm:p-6 ${getHeaderBgColor('vocabulary')} dark:bg-gray-800`}>
                            <div className="mb-4">
                                <h2 className={`text-2xl sm:text-3xl font-bold border-l-8 border-${colors.noun}-500 pl-4 text-gray-700 dark:text-gray-300 mb-4`}>🔵🟢 Kosakata</h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Mode Hafalan:</span>
                                        <button
                                            onClick={() => {
                                                toggleVocabFlipMode();
                                                toggleVocabMultipleChoice(false); // Turn off multiple choice when switching to flip mode
                                                resetVocabAnswers();
                                                setVocabOptions({});
                                            }}
                                            className={`px-3 py-2 rounded-lg font-semibold transition text-sm ${
                                                vocabFlipMode
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <span className="sm:hidden">🔄 </span>
                                            {vocabFlipMode ? 'Hafalan ON' : 'Hafalan OFF'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">Pilihan Ganda:</span>
                                        <button
                                            onClick={() => {
                                                toggleVocabMultipleChoice();
                                                toggleVocabFlipMode(false); // Turn off flip mode when switching to multiple choice
                                                resetVocabAnswers();
                                                setVocabOptions({});
                                            }}
                                            className={`px-3 py-2 rounded-lg font-semibold transition text-sm ${
                                                vocabMultipleChoice
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <span className="sm:hidden">📝 </span>
                                            {vocabMultipleChoice ? 'Quiz ON' : 'Quiz OFF'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {sprintData.vocabulary.map((item, index) => {
                                    let borderColor = '';
                                    let typeLabel = '';
                                    let typeLabelColor = '';
                                    let textColor = 'text-gray-700 dark:text-gray-300';
                                    if (item.type === '🔵') {
                                        borderColor = 'border-blue-400';
                                        typeLabel = 'Kata Benda';
                                        typeLabelColor = 'bg-blue-100 text-blue-700';
                                        textColor = 'text-blue-700 dark:text-blue-300';
                                    } else if (item.type === '🟢') {
                                        borderColor = 'border-green-400';
                                        typeLabel = 'Kata Kerja';
                                        typeLabelColor = 'bg-green-100 text-green-700';
                                        textColor = 'text-green-700 dark:text-green-300';
                                    } else if (item.type === '🟣') {
                                        borderColor = 'border-purple-400';
                                        typeLabel = 'Kata Sifat-na';
                                        typeLabelColor = 'bg-purple-100 text-purple-700';
                                        textColor = 'text-purple-700 dark:text-purple-300';
                                    } else if (item.type === '🟠') {
                                        borderColor = 'border-orange-400';
                                        typeLabel = 'Kata Sifat-i';
                                        typeLabelColor = 'bg-orange-100 text-orange-700';
                                        textColor = 'text-orange-700 dark:text-orange-300';
                                    } else {
                                        borderColor = 'border-gray-300';
                                        typeLabel = 'Lainnya';
                                        typeLabelColor = 'bg-gray-100 text-gray-700';
                                        textColor = 'text-gray-700 dark:text-gray-300';
                                    }
                                    
                                    const multipleChoiceOptions = vocabOptions[index] || [];
                                    const correctMeaning = (() => {
                                        const match = item.reading_meaning.match(/\((.*)\)/);
                                        return match ? match[1] : '';
                                    })();
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            className={`relative border-l-8 ${borderColor} bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col min-h-[260px] ${vocabFlipMode ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                                            onClick={() => { if (vocabFlipMode) { toggleVocabCard(index); } }}
                                        >
                                            {vocabMultipleChoice && multipleChoiceOptions.length > 0 ? (
                                                // Multiple Choice Mode
                                                <>
                                                    <span className={`absolute right-4 top-4 px-3 py-1 rounded-full text-xs font-semibold ${typeLabelColor} `}>{typeLabel}</span>
                                                    <div className="mb-2">
                                                        <div className={`jp-font ${textColor} leading-tight text-2xl sm:text-3xl font-bold w-full mb-2 mt-6`}> 
                                                            <Furigana 
                                                                htmlString={item.vocab} 
                                                                className={'text-2xl sm:text-3xl' } 
                                                                rtClass="furigana-bold" 
                                                                boldMain={true} 
                                                            />
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Pilih arti yang benar</div>
                                                    </div>
                                                    <div className="flex-1 flex flex-col">
                                                        <span className="block text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Apa arti dari kosakata ini?</span>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {multipleChoiceOptions.map((option, optionIndex) => {
                                                                const isSelected = vocabAnswers[index] === option;
                                                                const isCorrect = option === correctMeaning;
                                                                const showResult = showVocabResults[index];
                                                                let buttonClass = 'w-full text-left p-3 rounded-lg border transition-all ';
                                                                if (!showResult) {
                                                                    buttonClass += isSelected 
                                                                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' 
                                                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600';
                                                                } else {
                                                                    if (isCorrect) {
                                                                        buttonClass += 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300';
                                                                    } else if (isSelected) {
                                                                        buttonClass += 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300';
                                                                    } else {
                                                                        buttonClass += 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50';
                                                                    }
                                                                }
                                                                return (
                                                                    <button
                                                                        key={optionIndex}
                                                                        className={buttonClass}
                                                                        disabled={showResult}
                                                                        onClick={() => setVocabAnswer(index, option)}
                                                                    >
                                                                        {option}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : !vocabFlipMode || !flippedVocabCards.has(index) ? (
                                                // Front side - Vocabulary (Normal mode)
                                                <>
                                                    <span className={`absolute right-4 top-4 px-3 py-1 rounded-full text-xs font-semibold ${typeLabelColor} `}>{typeLabel}</span>
                                                    
                                                    {!vocabFlipMode ? (
                                                        <>
                                                        <div className={`jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight text-base`}> 
                                                            <Furigana 
                                                                htmlString={item.vocab} 
                                                                className={ 'text-base'} 
                                                                rtClass="furigana-bold" 
                                                                boldMain={true} 
                                                            />
                                                        </div>
                                                        <div className="flex-1 mt-2">
                                                            <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Arti: <span className={`ml-1 px-2 py-0.5 rounded ${typeLabelColor}  font-mono text-sm`}>{correctMeaning}</span></span>
                                                          
                                                            <div className="mb-2">
                                                                <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Visual:</span>
                                                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.mnemonic}</span>
                                                            </div>
                                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                                                <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Contoh:</span>
                                                                <div className={`jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight text-base`}> 
                                                                    <Furigana 
                                                                        htmlString={item.vocab} 
                                                                        className={ 'text-base'} 
                                                                        rtClass="furigana-bold" 
                                                                        boldMain={true} 
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.example.romaji}</div>
                                                                {item.example.id && (
                                                                    <div className="text-xs text-green-700 dark:text-green-400 mt-1 italic">{item.example.id}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                    ) : (
                                                        <div className="mp-2 flex flex-1 flex-col items-center justify-center min-h-[200px]">
                                                            <div className={`jp-font ${textColor} leading-tight text-3xl sm:text-4xl md:text-5xl  font-bold text-center w-full`}> 
                                                                <Furigana 
                                                                    htmlString={item.vocab} 
                                                                    className={'text-3xl sm:text-4xl md:text-5xl' } 
                                                                    rtClass="furigana-bold" 
                                                                    boldMain={true} 
                                                                />
                                                            </div>
                                                            
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Klik untuk lihat jawaban</div>
                                                        </div>

                                                    )}
                                                </>
                                            ) : (
                                                // Back side - Answer (keep original layout)
                                                <>
                                                    <span className={`absolute right-4 top-4 px-3 py-1 rounded-full text-xs font-semibold ${typeLabelColor} `}>{typeLabel}</span>
                                                    <div className={`jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight text-base`}> 
                                                        <Furigana 
                                                            htmlString={item.vocab} 
                                                            className={ 'text-base'} 
                                                            rtClass="furigana-bold" 
                                                            boldMain={true} 
                                                        />
                                                    </div>
                                                    <div className="flex-1 mt-2">
                                                        <span className="block text-base font-bold text-gray-800 dark:text-gray-200">Arti: <span className={`ml-1 px-2 py-0.5 rounded ${typeLabelColor}  font-mono text-sm`}>{correctMeaning}</span></span>
                                                        <div className="mb-2">
                                                            <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Visual:</span>
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
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    {/* Tata Bahasa */}
                    {sprintData.grammar && sprintData.grammar.length > 0 && (
                        <section id="grammar" className="mb-12">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-4 border-l-8 border-yellow-400 pl-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <span className="text-yellow-400 text-2xl">🟡</span> Tata Bahasa
                            </h2>
                            <div className="flex flex-col gap-8">
                                {sprintData.grammar.map((item, index) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-t-4 border-yellow-300">
                                       <h3
                                            className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 mb-1"
                                            dangerouslySetInnerHTML={{ __html: item.pattern }}
                                        />
                                        {item.short_explanation && (
                                            <span className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{__html: item.explanation}} />
                                        )}
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
                                        {item.visualLabels && item.visualLabels.length > 0 && (
                                            <div className="mb-2 flex gap-2 flex-wrap">
                                                {item.visualLabels.map((label, labelIdx) => (
                                                    <span key={labelIdx} className={`px-2 py-1 rounded text-xs font-semibold bg-${label.color}-100 text-${label.color}-700`}>{label.label}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                            <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Contoh:</span>
                                            {item.examples.map((example, exampleIdx) => (
                                                <div key={exampleIdx} className="mb-2">
                                                    <div className="text-lg jp-font text-gray-500 dark:text-gray-400 font-normal leading-tight">
                                                        <Furigana htmlString={example.jp} className="text-base" rtClass="furigana-bold" boldMain={true} />
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{example.romaji}</div>
                                                    {example.id && (
                                                        <div className="text-xs text-green-700 dark:text-green-400 mt-1 italic">{example.id}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
                {/* Floating Back to Top Button */}
                <a
                    href="#"
                    className="fixed z-50 bottom-6 right-6 sm:bottom-10 sm:right-10 inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-orange-500 dark:bg-orange-700 text-white font-semibold hover:bg-orange-600 dark:hover:bg-orange-600 transition"
                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                    aria-label="Back to Top"
                >
                    <span className="text-lg">↑</span>
                    <span className="hidden sm:inline">Back to Top</span>
                </a>
            </div>
        );
    }

    // Home view - page selection and settings
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            
            <div className="container mx-auto p-4 sm:p-8 font-sans">
                <header className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">Belajar JLPT N5</h1>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Pilih halaman dan pengaturan untuk mulai belajar</p>
                </header>
                {/* Back to Home navigation */}
                <div className="mb-6 flex justify-start">
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    <span>←</span> Back to Home
                </Link>
                </div>

                {/* Settings Section */}
                <div className="mb-8 flex justify-left">
                    <div className="bg-white dark:bg-gray-800 shadow p-2 w-2xs">
                        <button
                            onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                            className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 rounded-lg p-2 -m-2"
                        >
                            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                                <span className="text-orange-500">⚙️</span> Pengaturan
                            </h2>
                            <span className={`transform transition-transform duration-200 text-gray-500 dark:text-gray-400 ${isSettingsCollapsed ? 'rotate-270' : ''}`}>
                                ▼
                            </span>
                        </button>
                        
                        {!isSettingsCollapsed && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col gap-6 items-left justify-center">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Kanji:
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="20"
                                            step="5"
                                            value={settings.kanjiPerPage}
                                            onChange={(e) => updateSettings({ kanjiPerPage: parseInt(e.target.value) || 5 })}
                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Kosakata:
                                        </label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="50"
                                            step="5"
                                            value={settings.vocabularyPerPage}
                                            onChange={(e) => updateSettings({ vocabularyPerPage: parseInt(e.target.value) || 5 })}
                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Tata Bahasa:
                                        </label>
                                        <input
                                            type="number"
                                            min="2"
                                            max="10"
                                            step="1"
                                            value={settings.grammarPerPage}
                                            onChange={(e) => updateSettings({ grammarPerPage: parseInt(e.target.value) || 2 })}
                                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                    <button
                                        onClick={resetSettings}
                                        className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Selection */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                        <span className="text-blue-500">📚</span> Pilih Halaman
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {n5Data.availableDays.map((day) => (
                            <button
                                key={day}
                                onClick={() => goToStudyPage(day)}
                                className="p-4 rounded-lg border-2 border-orange-300 hover:border-orange-500 bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900 transition text-center group"
                            >
                                <div className="text-2xl font-bold text-orange-500 group-hover:text-orange-600 mb-1">
                                    {day}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Halaman {day}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-l-4 border-orange-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Kanji</p>
                                <p className="text-2xl font-bold text-orange-500">{kanjiData.length}</p>
                            </div>
                            <div className="text-3xl">🟠</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-l-4 border-blue-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Kosakata</p>
                                <p className="text-2xl font-bold text-blue-500">{vocabData.length}</p>
                            </div>
                            <div className="text-3xl">🔵</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-l-4 border-yellow-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tata Bahasa</p>
                                <p className="text-2xl font-bold text-yellow-500">{grammarData.length}</p>
                            </div>
                            <div className="text-3xl">🟡</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
