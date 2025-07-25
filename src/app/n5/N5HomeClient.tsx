"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSettings, useN5, useFlipMode, useMultipleChoice } from '@/lib/StudyContext';
import Furigana from '@/components/Furigana';
import BushuPosition from '@/components/BushuPosition';



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
    kanji_bushu?: string[];
    level?: string;
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
    const [selectedBushu, setSelectedBushu] = useState<string>('all');
    const [sortByBushu, setSortByBushu] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'kanji' | 'vocabulary' | 'grammar' | 'kanji-diagram'>('kanji');
    const [isTabsFloating, setIsTabsFloating] = useState(false);
    const [selectedKanjiBushu, setSelectedKanjiBushu] = useState<string>('all');

    const allBushu = React.useMemo(() => {
        const bushuSet = new Set<string>();
        kanjiData.forEach(item => {
            if (item.bushu) {
                bushuSet.add(item.bushu);
            }
        });
        return ['all', ...Array.from(bushuSet).sort()];
    }, [kanjiData]);

    // Get all kanji bushu from vocabulary data
    const allKanjiBushu = useMemo(() => {
        const kanjiBushuSet = new Set<string>();
        vocabData.forEach(item => {
            if (item.kanji_bushu && item.kanji_bushu.length > 0) {
                item.kanji_bushu.forEach(kanji => {
                    kanjiBushuSet.add(kanji);
                });
            }
        });
        return ['all', ...Array.from(kanjiBushuSet).sort()];
    }, [vocabData]);

    // Calculate current page data based on settings and current page
    const getCurrentPageData = useCallback((): SprintData => {
        const currentPage = n5Data.currentPage;
        
        const filteredKanji = selectedBushu === 'all' 
            ? [...kanjiData] 
            : kanjiData.filter(k => k.bushu === selectedBushu);

        if (sortByBushu) {
            filteredKanji.sort((a, b) => {
                if (a.bushu && b.bushu) {
                    return a.bushu.localeCompare(b.bushu);
                }
                if (a.bushu) return -1;
                if (b.bushu) return 1;
                return 0;
            });
        }

        // Get paginated data for each section
        const kanjiStartIndex = (currentPage - 1) * settings.kanjiPerPage;
        const kanjiEndIndex = kanjiStartIndex + settings.kanjiPerPage;
        const paginatedKanji = filteredKanji.slice(kanjiStartIndex, kanjiEndIndex);
        
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
    }, [n5Data.currentPage, settings.kanjiPerPage, settings.vocabularyPerPage, settings.grammarPerPage, kanjiData, vocabData, grammarData, selectedBushu, sortByBushu]);

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

    // Set initial active tab based on available data
    useEffect(() => {
        const currentPageData = getCurrentPageData();
        if (currentPageData.kanji && currentPageData.kanji.length > 0) {
            setActiveTab('kanji');
        } else if (currentPageData.vocabulary && currentPageData.vocabulary.length > 0) {
            setActiveTab('vocabulary');
        } else if (currentPageData.grammar && currentPageData.grammar.length > 0) {
            setActiveTab('grammar');
        }
    }, [n5Data.currentPage, getCurrentPageData]);

    // Handle scroll for floating tabs
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const threshold = 200; // Adjust this value as needed
            setIsTabsFloating(scrollPosition > threshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Get filtered vocabulary data for the diagram
    const getFilteredVocabData = useCallback(() => {
        if (selectedKanjiBushu === 'all') {
            return vocabData;
        }
        return vocabData.filter(item => 
            item.kanji_bushu && item.kanji_bushu.includes(selectedKanjiBushu)
        );
    }, [selectedKanjiBushu, vocabData]);

    // Function to navigate to a specific kanji
    const navigateToKanji = useCallback((targetKanji: string) => {
        // First, switch to kanji tab
        setActiveTab('kanji');
        
        // Find the kanji in the data (considering current filter)
        const filteredKanji = selectedBushu === 'all' 
            ? [...kanjiData] 
            : kanjiData.filter(k => k.bushu === selectedBushu);

        if (sortByBushu) {
            filteredKanji.sort((a, b) => {
                if (a.bushu && b.bushu) {
                    return a.bushu.localeCompare(b.bushu);
                }
                if (a.bushu) return -1;
                if (b.bushu) return 1;
                return 0;
            });
        }

        // Find the index of the target kanji
        const kanjiIndex = filteredKanji.findIndex(k => k.kanji === targetKanji);
        
        if (kanjiIndex !== -1) {
            // Calculate which page contains this kanji
            const targetPage = Math.floor(kanjiIndex / settings.kanjiPerPage) + 1;
            
            // Navigate to that page
            setN5CurrentPage(targetPage);
            
            // Scroll to top of kanji section after a short delay to ensure page change is processed
            setTimeout(() => {
                const kanjiSection = document.getElementById('kanji-section');
                if (kanjiSection) {
                    kanjiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            // If kanji not found in current filter, reset filter to 'all' and try again
            if (selectedBushu !== 'all') {
                setSelectedBushu('all');
                // The kanji should be found on the next render with 'all' filter
                // We'll navigate on the next effect
                setTimeout(() => {
                    navigateToKanji(targetKanji);
                }, 100);
            }
        }
    }, [selectedBushu, kanjiData, sortByBushu, settings.kanjiPerPage, setN5CurrentPage]);

    // Enhanced kanji select handler for diagram
    const handleKanjiSelectFromDiagram = useCallback((kanji: string) => {
        if (kanji === 'all') {
            setSelectedKanjiBushu(kanji);
        } else {
            // Check if this kanji exists in our kanji data
            const kanjiExists = kanjiData.some(k => k.kanji === kanji);
            
            if (kanjiExists) {
                // Navigate to the kanji section
                navigateToKanji(kanji);
            } else {
                // Just update the diagram view if kanji not in our main data
                setSelectedKanjiBushu(kanji);
            }
        }
    }, [kanjiData, navigateToKanji]);

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

                    {/* Tabs Navigation */}
                    <div className={`tabs-floating-transition ${isTabsFloating ? 'fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-lg' : 'relative'}`}>
                        <div className="container mx-auto px-4">
                            <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
                                {sprintData.kanji && sprintData.kanji.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('kanji')}
                                        className={`px-4 py-3 font-semibold text-sm sm:text-base transition-colors relative ${
                                            activeTab === 'kanji'
                                                ? 'text-orange-500 border-b-2 border-orange-500'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-orange-500'
                                        }`}
                                    >
                                        <span className="text-orange-500 mr-1">🟠</span>
                                        Kanji ({sprintData.kanji.length})
                                    </button>
                                )}
                                {sprintData.vocabulary && sprintData.vocabulary.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('vocabulary')}
                                        className={`px-4 py-3 font-semibold text-sm sm:text-base transition-colors relative ${
                                            activeTab === 'vocabulary'
                                                ? 'text-blue-500 border-b-2 border-blue-500'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                                        }`}
                                    >
                                        <span className="text-blue-500 mr-1">🔵</span>
                                        Kosakata ({sprintData.vocabulary.length})
                                    </button>
                                )}
                                {sprintData.grammar && sprintData.grammar.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('grammar')}
                                        className={`px-4 py-3 font-semibold text-sm sm:text-base transition-colors relative ${
                                            activeTab === 'grammar'
                                                ? 'text-yellow-500 border-b-2 border-yellow-500'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-yellow-500'
                                        }`}
                                    >
                                        <span className="text-yellow-500 mr-1">🟡</span>
                                        Tata Bahasa ({sprintData.grammar.length})
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('kanji-diagram')}
                                    className={`px-4 py-3 font-semibold text-sm sm:text-base transition-colors relative ${
                                        activeTab === 'kanji-diagram'
                                            ? 'text-purple-500 border-b-2 border-purple-500'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-purple-500'
                                    }`}
                                >
                                    <span className="text-purple-500 mr-1">🔗</span>
                                    Diagram Kanji ({allKanjiBushu.length - 1})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add padding when tabs are floating */}
                    {isTabsFloating && <div className="h-16"></div>}

                    {/* Tab Content */}
                    <div className="mt-8">
                    {/* Kanji Tab */}
                    {activeTab === 'kanji' && sprintData.kanji && sprintData.kanji.length > 0 && (
                        <section id="kanji-section" className="animate-fade-in">
                            <div className="mb-6">
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
                                                                        <BushuPosition 
                                                                            position={item.bushu_position} 
                                                                            className="w-5 h-5"
                                                                        />
                                                                        <span className="text-xs text-orange-500 dark:text-orange-400">({item.bushu_position})</span>
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
                                                                    <BushuPosition 
                                                                        position={item.bushu_position} 
                                                                        className="w-5 h-5"
                                                                    />
                                                                    <span className="text-xs text-orange-500 dark:text-orange-400">({item.bushu_position})</span>
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

                    {/* Vocabulary Tab */}
                    {activeTab === 'vocabulary' && sprintData.vocabulary && sprintData.vocabulary.length > 0 && (
                        <section className="animate-fade-in">
                            <div className="mb-6">
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
                                    } else if (item.type === '🟤') {
                                        borderColor = 'border-brown-400';
                                        typeLabel = 'Kata Ganti Orang';
                                        typeLabelColor = 'bg-brown-100 text-brown-700';
                                        textColor = 'text-brown-700 dark:text-brown-300';
                                    } else if (item.type === '🟡') {
                                        borderColor = 'border-yellow-400';
                                        typeLabel = 'Kata Keterangan';
                                        typeLabelColor = 'bg-yellow-100 text-yellow-700';
                                        textColor = 'text-yellow-700 dark:text-yellow-300';
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
                                                                className={'text-2xl sm:text-3xl' } 
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

                    {/* Grammar Tab */}
                    {activeTab === 'grammar' && sprintData.grammar && sprintData.grammar.length > 0 && (
                        <section className="animate-fade-in">
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

                    {/* Kanji Diagram Tab */}
                    {activeTab === 'kanji-diagram' && (
                        <section className="animate-fade-in">
                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <h3 className="text-xl font-bold text-purple-600">
                                        🔗 Diagram Hubungan Kanji-Kosakata
                                    </h3>
                                    <select
                                        value={selectedKanjiBushu}
                                        onChange={(e) => setSelectedKanjiBushu(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    >
                                        {allKanjiBushu.map(kanji => (
                                            <option key={kanji} value={kanji}>
                                                {kanji === 'all' ? 'Semua Kanji (Overview)' : kanji}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedKanjiBushu !== 'all' && (
                                    <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-purple-700 dark:text-purple-300">
                                            <strong>Legenda:</strong> Diagram menunjukkan kanji <span className="font-bold">{selectedKanjiBushu}</span> di tengah, 
                                            dikelompokkan berdasarkan jenis kata (verba, nomina, adjektiva, dll.), 
                                            dan kosakata yang menggunakan kanji tersebut.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                                <KanjiVocabDiagram 
                                    selectedKanji={selectedKanjiBushu}
                                    allKanji={allKanjiBushu}
                                    vocabData={vocabData}
                                    getFilteredData={getFilteredVocabData}
                                    onKanjiSelect={handleKanjiSelectFromDiagram}
                                />
                            </div>
                        </section>
                    )}
                    </div>
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
                                            Urutkan Bushu:
                                        </label>
                                        <input
                                            type="checkbox"
                                            checked={sortByBushu}
                                            onChange={(e) => setSortByBushu(e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Filter Bushu:
                                        </label>
                                        <select
                                            value={selectedBushu}
                                            onChange={(e) => setSelectedBushu(e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            {allBushu.map(bushu => (
                                                <option key={bushu} value={bushu}>
                                                    {bushu === 'all' ? 'Semua Bushu' : bushu}
                                                </option>
                                            ))}
                                        </select>
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

// Kanji Vocabulary Diagram Component
interface KanjiVocabDiagramProps {
    selectedKanji: string;
    allKanji: string[];
    vocabData: VocabItem[];
    getFilteredData: () => VocabItem[];
    onKanjiSelect: (kanji: string) => void;
}

const KanjiVocabDiagram: React.FC<KanjiVocabDiagramProps> = ({ 
    selectedKanji, 
    allKanji, 
    vocabData, 
    getFilteredData,
    onKanjiSelect
}) => {
    const filteredVocab = getFilteredData();

    // Color mapping for vocabulary types
    const typeColors = {
        '🟢': { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-400', text: 'text-green-700 dark:text-green-300', name: 'Verba' },
        '🔵': { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300', name: 'Nomina' },
        '🟠': { bg: 'bg-orange-100 dark:bg-orange-900', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300', name: 'Adjektiva' },
        '🟣': { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300', name: 'Adverbia' },
        '🟡': { bg: 'bg-yellow-100 dark:bg-yellow-900', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300', name: 'Lainnya' }
    };

    if (selectedKanji === 'all') {
        // Overview of all kanji
        return (
            <div className="p-6">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">
                    📊 Overview Semua Kanji
                </h4>
                <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    Klik pada kanji untuk melihat detail kosakata yang menggunakan kanji tersebut.
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {allKanji.slice(1).map((kanji) => {
                        const kanjiVocabCount = vocabData.filter(item => 
                            item.kanji_bushu && item.kanji_bushu.includes(kanji)
                        ).length;
                        
                        // Group by type for this kanji
                        const kanjiVocabByType = vocabData
                            .filter(item => item.kanji_bushu && item.kanji_bushu.includes(kanji))
                            .reduce((acc, item) => {
                                const type = item.type;
                                if (!acc[type]) acc[type] = 0;
                                acc[type]++;
                                return acc;
                            }, {} as Record<string, number>);
                        
                        return (
                            <div 
                                key={kanji}
                                className="bg-white dark:bg-gray-700 border-2 border-orange-300 rounded-lg p-4 text-center hover:shadow-lg hover:border-orange-400 transition-all cursor-pointer group"
                                onClick={() => onKanjiSelect(kanji)}
                            >
                                <div className="text-3xl font-bold text-orange-500 mb-2 group-hover:scale-110 transition-transform">{kanji}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {kanjiVocabCount} kosakata
                                </div>
                                
                                {/* Mini type breakdown */}
                                <div className="flex flex-wrap justify-center gap-1 mt-2">
                                    {Object.entries(kanjiVocabByType).map(([type, count]) => (
                                        <span 
                                            key={type}
                                            className="text-xs px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                        >
                                            {type}{count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                            {vocabData.length}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-300">Total Kosakata</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                            {allKanji.length - 1}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-300">Total Kanji</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                            {Math.round((vocabData.filter(item => item.kanji_bushu && item.kanji_bushu.length > 0).length / vocabData.length) * 100)}%
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-300">Menggunakan Kanji</div>
                    </div>
                </div>
            </div>
        );
    }

    // Detailed view for selected kanji
    const vocabByType = filteredVocab.reduce((acc, item) => {
        const type = item.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {} as Record<string, VocabItem[]>);

    return (
        <div className="p-6">
            {/* Central Kanji */}
            <div className="text-center mb-8">
                <div className="inline-block bg-orange-100 dark:bg-orange-900 border-4 border-orange-400 rounded-xl p-6">
                    <div className="text-6xl font-bold text-orange-500 mb-2">{selectedKanji}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        漢字 ({filteredVocab.length} kosakata)
                    </div>
                </div>
            </div>

            {/* Vocabulary grouped by type */}
            <div className="space-y-8">
                {Object.entries(vocabByType).map(([type, vocabs]) => {
                    const typeColor = typeColors[type as keyof typeof typeColors] || typeColors['🟡'];
                    
                    return (
                        <div key={type} className="space-y-4">
                            {/* Type Header */}
                            <div className="flex items-center gap-3">
                                <div className={`${typeColor.bg} ${typeColor.border} border-2 rounded-lg px-4 py-2`}>
                                    <span className="text-2xl mr-2">{type}</span>
                                    <span className={`font-bold ${typeColor.text}`}>
                                        {typeColor.name} ({vocabs.length})
                                    </span>
                                </div>
                                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                            </div>

                            {/* Vocabulary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {vocabs.map((vocab, index) => {
                                    const meaning = (() => {
                                        const match = vocab.reading_meaning.match(/\((.*)\)/);
                                        return match ? match[1] : vocab.reading_meaning;
                                    })();

                                    return (
                                        <div 
                                            key={index}
                                            className={`${typeColor.bg} ${typeColor.border} border-l-4 rounded-lg p-4 space-y-3`}
                                        >
                                            {/* Vocabulary Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div 
                                                        className={`text-xl font-bold ${typeColor.text} jp-font leading-tight`}
                                                        dangerouslySetInnerHTML={{ __html: vocab.vocab }}
                                                    />
                                                    <div className={`text-lg ${typeColor.text} mt-1`}>
                                                        {meaning}
                                                    </div>
                                                </div>
                                                <span className="text-lg">{type}</span>
                                            </div>

                                            {/* Mnemonic */}
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                <span className={`text-sm font-bold ${typeColor.text} block mb-1`}>
                                                    💡 Mnemonic:
                                                </span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {vocab.mnemonic}
                                                </span>
                                            </div>

                                            {/* Example */}
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                <span className={`text-sm font-bold ${typeColor.text} block mb-1`}>
                                                    📝 Contoh:
                                                </span>
                                                <div className="jp-font text-gray-700 dark:text-gray-300 leading-tight">
                                                    <Furigana 
                                                        htmlString={vocab.example.jp} 
                                                        className="text-base" 
                                                        rtClass="furigana-bold" 
                                                        boldMain={true} 
                                                    />
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {vocab.example.romaji}
                                                </div>
                                                {vocab.example.id && (
                                                    <div className="text-sm text-green-700 dark:text-green-400 mt-1 italic">
                                                        {vocab.example.id}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Kanji Used */}
                                            {vocab.kanji_bushu && vocab.kanji_bushu.length > 0 && (
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                    <span className={`text-sm font-bold ${typeColor.text} block mb-1`}>
                                                        🔤 Kanji yang digunakan:
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {vocab.kanji_bushu.map((kanji, kanjiIndex) => (
                                                            <span 
                                                                key={kanjiIndex}
                                                                className={`inline-block px-2 py-1 rounded cursor-pointer hover:scale-105 transition-transform ${
                                                                    kanji === selectedKanji 
                                                                        ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 font-bold' 
                                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
                                                                }`}
                                                                onClick={() => onKanjiSelect(kanji)}
                                                                title={`Klik untuk lihat kosakata dengan kanji ${kanji}`}
                                                            >
                                                                {kanji}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
