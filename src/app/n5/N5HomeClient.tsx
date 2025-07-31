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
    bushu?: string[];
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
    const [activeTab, setActiveTab] = useState<'kanji' | 'vocabulary' | 'grammar' | 'kanji-diagram' | 'bushu-diagram'>('kanji');
    const [isTabsFloating, setIsTabsFloating] = useState(false);
    const [selectedKanjiBushu, setSelectedKanjiBushu] = useState<string>('all');
    const [selectedBushuForDiagram, setSelectedBushuForDiagram] = useState<string>('all');
    
    // Home tab state for the main homepage
    const [homeActiveTab, setHomeActiveTab] = useState<'semua-materi' | 'diagram-kanji' | 'diagram-bushu'>('semua-materi');

    // Mobile detection hook
    const [isMobile, setIsMobile] = useState(false);
    

    // Bushu diagram specific states (moved here to avoid conditional hooks)
    const [bushuExpandedCard, setBushuExpandedCard] = useState<string | null>(null);
    const [bushuCardPositions, setBushuCardPositions] = useState<Record<string, { x: number; y: number }>>({});
    const [bushuDragState, setBushuDragState] = useState<{ 
        isDragging: boolean; 
        cardId: string | null; 
        offset: { x: number; y: number };
        hasMoved: boolean;
        startPosition: { x: number; y: number };
    }>({
        isDragging: false,
        cardId: null,
        offset: { x: 0, y: 0 },
        hasMoved: false,
        startPosition: { x: 0, y: 0 }
    });

    // Bushu Pan/zoom state for entire diagram
    const [bushuPanZoomState, setBushuPanZoomState] = useState({
        scale: 1,
        translateX: 0,
        translateY: 0,
        isPanning: false,
        startPanPosition: { x: 0, y: 0 },
        lastPanPosition: { x: 0, y: 0 }
    });
    
    // Bushu Touch state for mobile interactions
    const [bushuTouchState, setBushuTouchState] = useState({
        isTouching: false,
        touchStartTime: 0,
        touchTarget: null as string | null,
        initialTouchPos: { x: 0, y: 0 },
        lastTouchPos: { x: 0, y: 0 },
        touchCardId: null as string | null,
        initialDistance: 0,
        initialScale: 1,
        initialTouchCenter: { x: 0, y: 0 }
    });

    const allBushu = React.useMemo(() => {
        const bushuSet = new Set<string>();
        kanjiData.forEach(item => {
            if (item.bushu && item.bushu.length > 0) {
                item.bushu.forEach(b => bushuSet.add(b));
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

    // Mobile detection effect
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Calculate current page data based on settings and current page
    const getCurrentPageData = useCallback((): SprintData => {
        const currentPage = n5Data.currentPage;
        
        const filteredKanji = selectedBushu === 'all' 
            ? [...kanjiData] 
            : kanjiData.filter(k => k.bushu && k.bushu.includes(selectedBushu));

        if (sortByBushu) {
            filteredKanji.sort((a, b) => {
                if (a.bushu && b.bushu) {
                    const bushuA = a.bushu[0];
                    const bushuB = b.bushu[0];
                    return bushuA.localeCompare(bushuB);
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

    // Function to navigate to a specific kanji
    const navigateToKanji = useCallback((targetKanji: string) => {
        // First, switch to kanji tab
        setActiveTab('kanji');
        
        // Find the kanji in the data (considering current filter)
        const filteredKanji = selectedBushu === 'all' 
            ? [...kanjiData] 
            : kanjiData.filter(k => k.bushu && k.bushu.includes(selectedBushu));

        if (sortByBushu) {
            filteredKanji.sort((a, b) => {
                if (a.bushu && b.bushu) {
                    const bushuA = a.bushu[0];
                    const bushuB = b.bushu[0];
                    return bushuA.localeCompare(bushuB);
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
                                                                {item.bushu && item.bushu.length > 0 && item.bushu_position && (
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Bushu:</span>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {item.bushu.map((bushu, bushuIndex) => (
                                                                                <span key={bushuIndex} className="font-mono text-sm px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{bushu}</span>
                                                                            ))}
                                                                        </div>
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

                {/* Home Page Tab Navigation */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-lg shadow">
                        <button
                            onClick={() => setHomeActiveTab('semua-materi')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                homeActiveTab === 'semua-materi'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            📚 Semua Materi
                        </button>
                        <button
                            onClick={() => setHomeActiveTab('diagram-kanji')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                homeActiveTab === 'diagram-kanji'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            🔤 Diagram Kanji
                        </button>
                        <button
                            onClick={() => setHomeActiveTab('diagram-bushu')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                homeActiveTab === 'diagram-bushu'
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            📊 Diagram Kosakata
                        </button>
                    </div>

                    {/* Tab Content */}
                    {homeActiveTab === 'semua-materi' && (
                        <div>
                            {/* Settings Section */}
                            <div className="mb-8">
                                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                                    <button
                                        onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                                        className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 rounded-lg p-4"
                                    >
                                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                                            <span className="text-orange-500">⚙️</span> Pengaturan
                                        </h2>
                                        <span className={`transform transition-transform duration-200 text-gray-500 dark:text-gray-400 ${isSettingsCollapsed ? 'rotate-0' : 'rotate-180'}`}>
                                            ▼
                                        </span>
                                    </button>
                                    
                                    {!isSettingsCollapsed && (
                                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Kanji per Halaman:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        max="20"
                                                        step="5"
                                                        value={settings.kanjiPerPage}
                                                        onChange={(e) => updateSettings({ kanjiPerPage: parseInt(e.target.value) || 5 })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Kosakata per Halaman:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        max="50"
                                                        step="5"
                                                        value={settings.vocabularyPerPage}
                                                        onChange={(e) => updateSettings({ vocabularyPerPage: parseInt(e.target.value) || 5 })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Tata Bahasa per Halaman:
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        max="10"
                                                        step="1"
                                                        value={settings.grammarPerPage}
                                                        onChange={(e) => updateSettings({ grammarPerPage: parseInt(e.target.value) || 2 })}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                    />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Filter Bushu:
                                                    </label>
                                                    <select
                                                        value={selectedBushu}
                                                        onChange={(e) => setSelectedBushu(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    >
                                                        {allBushu.map(bushu => (
                                                            <option key={bushu} value={bushu}>
                                                                {bushu === 'all' ? 'Semua Bushu' : bushu}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="sortByBushu"
                                                        checked={sortByBushu}
                                                        onChange={(e) => setSortByBushu(e.target.checked)}
                                                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                    />
                                                    <label htmlFor="sortByBushu" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                                        Urutkan berdasarkan Bushu
                                                    </label>
                                                </div>
                                                
                                                <div className="flex items-end">
                                                    <button
                                                        onClick={resetSettings}
                                                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
                                                    >
                                                        🔄 Reset Pengaturan
                                                    </button>
                                                </div>
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
                    )}

                    {homeActiveTab === 'diagram-kanji' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            {/* Header with selector and back button */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-purple-600">
                                        📊 Diagram Kanji Berdasarkan Bushu
                                    </h3>
                                    {selectedBushuForDiagram !== 'all' && (
                                        <button
                                            onClick={() => setSelectedBushuForDiagram('all')}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                        >
                                            <span>←</span> Kembali ke Overview
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Pilih Bushu:
                                    </label>
                                    <select
                                        value={selectedBushuForDiagram}
                                        onChange={(e) => setSelectedBushuForDiagram(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    >
                                        {allBushu.map(bushu => (
                                            <option key={bushu} value={bushu}>
                                                {bushu === 'all' ? 'Semua Bushu (Overview)' : `Bushu: ${bushu}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {selectedBushuForDiagram !== 'all' && (
                                    <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-purple-700 dark:text-purple-300">
                                            <strong>Legenda:</strong> Diagram menunjukkan bushu <span className="font-bold">{selectedBushuForDiagram}</span> di tengah, 
                                            dengan kanji-kanji yang menggunakan bushu tersebut dikelompokkan dalam diagram interaktif.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <BushuKanjiDiagram
                                selectedBushu={selectedBushuForDiagram}
                                allBushu={allBushu}
                                kanjiData={kanjiData}
                                getFilteredData={() => 
                                    selectedBushuForDiagram === 'all' 
                                        ? kanjiData 
                                        : kanjiData.filter(k => k.bushu && k.bushu.includes(selectedBushuForDiagram))
                                }
                                onBushuSelect={setSelectedBushuForDiagram}
                                expandedCard={bushuExpandedCard}
                                setExpandedCard={setBushuExpandedCard}
                                cardPositions={bushuCardPositions}
                                setCardPositions={setBushuCardPositions}
                                dragState={bushuDragState}
                                setDragState={setBushuDragState}
                                panZoomState={bushuPanZoomState}
                                setPanZoomState={setBushuPanZoomState}
                                isMobile={isMobile}
                                touchState={bushuTouchState}
                                setTouchState={setBushuTouchState}
                            />
                        </div>
                    )}

                    {homeActiveTab === 'diagram-bushu' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                            {/* Header with selector and back button */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-orange-600">
                                        🔗 Diagram Hubungan Kanji-Kosakata
                                    </h3>
                                    {selectedKanjiBushu !== 'all' && (
                                        <button
                                            onClick={() => setSelectedKanjiBushu('all')}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                        >
                                            <span>←</span> Kembali ke Overview
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Pilih Kanji:
                                    </label>
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
                                    <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-orange-700 dark:text-orange-300">
                                            <strong>Legenda:</strong> Diagram menunjukkan kanji <span className="font-bold">{selectedKanjiBushu}</span> di tengah, 
                                            dikelompokkan berdasarkan jenis kata (verba, nomina, adjektiva, dll.), 
                                            dan kosakata yang menggunakan kanji tersebut.
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <KanjiVocabDiagram
                                selectedKanji={selectedKanjiBushu}
                                allKanji={allKanjiBushu}
                                vocabData={vocabData}
                                getFilteredData={() => 
                                    selectedKanjiBushu === 'all' 
                                        ? vocabData 
                                        : vocabData.filter(v => v.kanji_bushu && v.kanji_bushu.includes(selectedKanjiBushu))
                                }
                                onKanjiSelect={setSelectedKanjiBushu}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Bushu Kanji Diagram Component
interface BushuKanjiDiagramProps {
    selectedBushu: string;
    allBushu: string[];
    kanjiData: KanjiItem[];
    getFilteredData: () => KanjiItem[];
    onBushuSelect: (bushu: string) => void;
    // Pass diagram states as props to avoid conditional hooks
    expandedCard: string | null;
    setExpandedCard: (card: string | null) => void;
    cardPositions: Record<string, { x: number; y: number }>;
    setCardPositions: (positions: Record<string, { x: number; y: number }>) => void;
    dragState: { 
        isDragging: boolean; 
        cardId: string | null; 
        offset: { x: number; y: number };
        hasMoved: boolean;
        startPosition: { x: number; y: number };
    };
    setDragState: (state: any) => void;
    panZoomState: {
        scale: number;
        translateX: number;
        translateY: number;
        isPanning: boolean;
        startPanPosition: { x: number; y: number };
        lastPanPosition: { x: number; y: number };
    };
    setPanZoomState: (state: any) => void;
    isMobile: boolean;
    touchState: any;
    setTouchState: (state: any) => void;
}

const BushuKanjiDiagram: React.FC<BushuKanjiDiagramProps> = ({ 
    selectedBushu, 
    allBushu, 
    kanjiData, 
    getFilteredData,
    onBushuSelect
}) => {
    const filteredKanji = getFilteredData();
    
    // Early return for empty data
    if (!kanjiData || kanjiData.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Kanji</h3>
                <p className="text-sm">Data kanji belum tersedia untuk membuat diagram.</p>
            </div>
        );
    }
    
    if (!allBushu || allBushu.length <= 1) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">🔤</div>
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Bushu</h3>
                <p className="text-sm">Data bushu belum tersedia untuk membuat diagram.</p>
            </div>
        );
    }
    
    // Enhanced state for drag functionality and better positioning
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({});
    const [dragState, setDragState] = useState<{ 
        isDragging: boolean; 
        cardId: string | null; 
        offset: { x: number; y: number };
        hasMoved: boolean;
        startPosition: { x: number; y: number };
    }>({
        isDragging: false,
        cardId: null,
        offset: { x: 0, y: 0 },
        hasMoved: false,
        startPosition: { x: 0, y: 0 }
    });

    // Pan/zoom state for entire diagram
    const [panZoomState, setPanZoomState] = useState({
        scale: 1,
        translateX: 0,
        translateY: 0,
        isPanning: false,
        startPanPosition: { x: 0, y: 0 },
        lastPanPosition: { x: 0, y: 0 }
    });

    // Mobile detection hook
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [touchState, setTouchState] = useState({
        isTouching: false,
        touchStartTime: 0,
        touchTarget: null as string | null,
        initialTouchPos: { x: 0, y: 0 },
        lastTouchPos: { x: 0, y: 0 },
        touchCardId: null as string | null,
        touchCardOffset: { x: 0, y: 0 },
        hasTouchMoved: false,
        isPinching: false,
        initialDistance: 0,
        initialScale: 1,
        pinchCenter: { x: 0, y: 0 }
    });

    // Helper function to calculate distance between two touches
    const getTouchDistance = (touch1: React.Touch | Touch, touch2: React.Touch | Touch) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Helper function to get center point between two touches
    const getTouchCenter = (touch1: React.Touch | Touch, touch2: React.Touch | Touch) => {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    };

    // Handle card click - expand/collapse (only if not dragging/touching)
    const handleCardClick = (kanjiId: string) => {
        if (!dragState.hasMoved && !touchState.hasTouchMoved) {
            setExpandedCard(expandedCard === kanjiId ? null : kanjiId);
        }
    };

    // Touch event handlers for cards with improved coordinate calculation
    const handleTouchStart = (e: React.TouchEvent, cardId: string) => {
        e.stopPropagation();
        const touch = e.touches[0];
        const container = document.querySelector('[data-diagram-container]');
        
        if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Get current card position in the transformed space
            const currentPosition = cardPositions[cardId];
            let cardX, cardY;
            
            if (currentPosition) {
                cardX = currentPosition.x;
                cardY = currentPosition.y;
            } else {
                // Calculate default position if not previously set
                const pos = positions.find(p => p.id === cardId);
                cardX = pos ? pos.x : centerX;
                cardY = pos ? pos.y : centerY;
            }
            
            // Calculate touch offset relative to card center in diagram space
            const touchX = (touch.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
            const touchY = (touch.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
            
            const offsetX = touchX - cardX;
            const offsetY = touchY - cardY;
            
            setTouchState({
                isTouching: true,
                touchStartTime: Date.now(),
                touchTarget: 'card',
                initialTouchPos: { x: touch.clientX, y: touch.clientY },
                lastTouchPos: { x: touch.clientX, y: touch.clientY },
                touchCardId: cardId,
                touchCardOffset: { x: offsetX, y: offsetY },
                hasTouchMoved: false,
                isPinching: false,
                initialDistance: 0,
                initialScale: panZoomState.scale,
                pinchCenter: { x: 0, y: 0 }
            });
        }
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!touchState.isTouching) return;
        
        e.preventDefault(); // Prevent scrolling
        
        // Handle two-finger pinch zoom
        if (e.touches.length === 2 && touchState.touchTarget === 'diagram') {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = getTouchDistance(touch1, touch2);
            const center = getTouchCenter(touch1, touch2);
            
            if (!touchState.isPinching) {
                setTouchState(prev => ({
                    ...prev,
                    isPinching: true,
                    initialDistance: distance,
                    initialScale: panZoomState.scale,
                    pinchCenter: center
                }));
            } else {
                const scaleChange = distance / touchState.initialDistance;
                const newScale = Math.max(0.5, Math.min(3, touchState.initialScale * scaleChange));
                
                setPanZoomState(prev => ({
                    ...prev,
                    scale: newScale
                }));
            }
            return;
        }
        
        // Single touch handling
        const touch = e.touches[0];
        
        // Calculate movement distance
        const distance = Math.sqrt(
            Math.pow(touch.clientX - touchState.initialTouchPos.x, 2) + 
            Math.pow(touch.clientY - touchState.initialTouchPos.y, 2)
        );
        
        // Mark as moved if distance > 10 pixels
        if (distance > 10 && !touchState.hasTouchMoved) {
            setTouchState(prev => ({ ...prev, hasTouchMoved: true }));
        }
        
        if (touchState.touchTarget === 'card' && touchState.touchCardId && !touchState.isPinching) {
            // Move card with improved coordinate calculation
            const container = document.querySelector('[data-diagram-container]');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                // Transform touch coordinates to diagram space
                const touchX = (touch.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
                const touchY = (touch.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
                
                // Apply offset to get card center position
                const newX = touchX - touchState.touchCardOffset.x;
                const newY = touchY - touchState.touchCardOffset.y;
                
                // Constraint to diagram bounds
                const margin = 80;
                const diagramWidth = 800;
                const diagramHeight = 600;
                
                const constrainedX = Math.max(margin, Math.min(diagramWidth - margin, newX));
                const constrainedY = Math.max(margin, Math.min(diagramHeight - margin, newY));
                
                setCardPositions(prev => ({
                    ...prev,
                    [touchState.touchCardId!]: { x: constrainedX, y: constrainedY }
                }));
            }
        } else if (touchState.touchTarget === 'diagram' && !touchState.isPinching) {
            // Pan diagram
            const deltaX = touch.clientX - touchState.lastTouchPos.x;
            const deltaY = touch.clientY - touchState.lastTouchPos.y;
            
            setPanZoomState(prev => ({
                ...prev,
                translateX: prev.translateX + deltaX,
                translateY: prev.translateY + deltaY
            }));
        }
        
        setTouchState(prev => ({
            ...prev,
            lastTouchPos: { x: touch.clientX, y: touch.clientY }
        }));
    }, [touchState, setCardPositions, panZoomState.scale, panZoomState.translateX, panZoomState.translateY, getTouchDistance, getTouchCenter]);

    const handleTouchEnd = useCallback(() => {
        if (!touchState.isTouching) return;
        
        const touchDuration = Date.now() - touchState.touchStartTime;
        const wasTap = !touchState.hasTouchMoved && touchDuration < 300;
        
        // If it was a tap on a card, handle click
        if (wasTap && touchState.touchTarget === 'card' && touchState.touchCardId) {
            handleCardClick(touchState.touchCardId);
        }
        
        // Reset touch state
        setTouchState({
            isTouching: false,
            touchStartTime: 0,
            touchTarget: null,
            initialTouchPos: { x: 0, y: 0 },
            lastTouchPos: { x: 0, y: 0 },
            touchCardId: null,
            touchCardOffset: { x: 0, y: 0 },
            hasTouchMoved: false,
            isPinching: false,
            initialDistance: 0,
            initialScale: 1,
            pinchCenter: { x: 0, y: 0 }
        });
        
        // Reset panning state
        setPanZoomState(prev => ({ ...prev, isPanning: false }));
    }, [touchState, handleCardClick]);

    // Touch event handlers for diagram panning and zooming
    const handleDiagramTouchStart = (e: React.TouchEvent) => {
        // Only handle if no card is being touched
        if (touchState.isTouching) return;
        
        const touch = e.touches[0];
        
        // Check if it's a pinch gesture (2 fingers)
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = getTouchDistance(touch1, touch2);
            const center = getTouchCenter(touch1, touch2);
            
            setTouchState({
                isTouching: true,
                touchStartTime: Date.now(),
                touchTarget: 'diagram',
                initialTouchPos: center,
                lastTouchPos: center,
                touchCardId: null,
                touchCardOffset: { x: 0, y: 0 },
                hasTouchMoved: false,
                isPinching: true,
                initialDistance: distance,
                initialScale: panZoomState.scale,
                pinchCenter: center
            });
        } else {
            // Single touch for panning
            setTouchState({
                isTouching: true,
                touchStartTime: Date.now(),
                touchTarget: 'diagram',
                initialTouchPos: { x: touch.clientX, y: touch.clientY },
                lastTouchPos: { x: touch.clientX, y: touch.clientY },
                touchCardId: null,
                touchCardOffset: { x: 0, y: 0 },
                hasTouchMoved: false,
                isPinching: false,
                initialDistance: 0,
                initialScale: panZoomState.scale,
                pinchCenter: { x: 0, y: 0 }
            });
            
            setPanZoomState(prev => ({ ...prev, isPanning: true }));
        }
    };

    // Add global touch event listeners
    useEffect(() => {
        if (touchState.isTouching) {
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            
            return () => {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [touchState.isTouching, handleTouchMove, handleTouchEnd]);

    // Drag functionality for desktop with improved coordinate calculation
    const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const container = document.querySelector('[data-diagram-container]');
        
        if (container) {
            const containerRect = container.getBoundingClientRect();
            // Get current card position in the transformed space
            const currentPosition = cardPositions[cardId];
            let cardX, cardY;
            
            if (currentPosition) {
                cardX = currentPosition.x;
                cardY = currentPosition.y;
            } else {
                // Calculate default position if not previously set
                const pos = positions.find(p => p.id === cardId);
                cardX = pos ? pos.x : centerX;
                cardY = pos ? pos.y : centerY;
            }
            
            // Calculate click offset relative to card center in diagram space
            const clickX = (e.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
            const clickY = (e.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
            
            const offsetX = clickX - cardX;
            const offsetY = clickY - cardY;
            
            setDragState({
                isDragging: true,
                cardId: cardId,
                offset: { x: offsetX, y: offsetY },
                hasMoved: false,
                startPosition: { x: e.clientX, y: e.clientY }
            });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (dragState.isDragging && dragState.cardId) {
            const distance = Math.sqrt(
                Math.pow(e.clientX - dragState.startPosition.x, 2) + 
                Math.pow(e.clientY - dragState.startPosition.y, 2)
            );
            
            if (distance > 5 && !dragState.hasMoved) {
                setDragState(prev => ({ ...prev, hasMoved: true }));
            }
            
            const container = document.querySelector('[data-diagram-container]');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                // Transform mouse coordinates to diagram space
                const mouseX = (e.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
                const mouseY = (e.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
                
                // Apply offset to get card center position
                const newX = mouseX - dragState.offset.x;
                const newY = mouseY - dragState.offset.y;
                
                // Constraint to diagram bounds
                const margin = 80;
                const diagramWidth = 800;
                const diagramHeight = 600;
                
                const constrainedX = Math.max(margin, Math.min(diagramWidth - margin, newX));
                const constrainedY = Math.max(margin, Math.min(diagramHeight - margin, newY));
                
                setCardPositions(prev => ({
                    ...prev,
                    [dragState.cardId!]: { x: constrainedX, y: constrainedY }
                }));
            }
        }
    }, [dragState, panZoomState.scale, panZoomState.translateX, panZoomState.translateY]);

    const handleMouseUp = useCallback(() => {
        if (dragState.isDragging) {
            setTimeout(() => {
                setDragState({
                    isDragging: false,
                    cardId: null,
                    offset: { x: 0, y: 0 },
                    hasMoved: false,
                    startPosition: { x: 0, y: 0 }
                });
            }, 100);
        }
    }, [dragState.isDragging]);

    // Add global mouse event listeners
    useEffect(() => {
        if (dragState.isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

    // Pan functionality for diagram
    const handleDiagramMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'line' || (e.target as HTMLElement).tagName === 'circle') {
            setPanZoomState(prev => ({
                ...prev,
                isPanning: true,
                startPanPosition: { x: e.clientX, y: e.clientY },
                lastPanPosition: { x: prev.translateX, y: prev.translateY }
            }));
        }
    };

    const handleDiagramMouseMove = useCallback((e: MouseEvent) => {
        if (panZoomState.isPanning) {
            const deltaX = e.clientX - panZoomState.startPanPosition.x;
            const deltaY = e.clientY - panZoomState.startPanPosition.y;
            
            setPanZoomState(prev => ({
                ...prev,
                translateX: prev.lastPanPosition.x + deltaX,
                translateY: prev.lastPanPosition.y + deltaY
            }));
        }
    }, [panZoomState.isPanning, panZoomState.startPanPosition, panZoomState.lastPanPosition]);

    const handleDiagramMouseUp = useCallback(() => {
        setPanZoomState(prev => ({ ...prev, isPanning: false }));
    }, []);

    // Add global diagram pan event listeners
    useEffect(() => {
        if (panZoomState.isPanning) {
            document.addEventListener('mousemove', handleDiagramMouseMove);
            document.addEventListener('mouseup', handleDiagramMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleDiagramMouseMove);
                document.removeEventListener('mouseup', handleDiagramMouseUp);
            };
        }
    }, [panZoomState.isPanning, handleDiagramMouseMove, handleDiagramMouseUp]);

    // Zoom functionality
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        
        const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(3, panZoomState.scale * scaleChange));
        
        setPanZoomState(prev => ({
            ...prev,
            scale: newScale
        }));
    };

    // Reset zoom and pan
    const resetView = () => {
        setPanZoomState({
            scale: 1,
            translateX: 0,
            translateY: 0,
            isPanning: false,
            startPanPosition: { x: 0, y: 0 },
            lastPanPosition: { x: 0, y: 0 }
        });
        setCardPositions({});
    };

    // Color mapping for bushu positions
    const positionColors = {
        'hen': { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300', name: 'Hen (左)', color: '#3b82f6' },
        'tsukuri': { bg: 'bg-red-100 dark:bg-red-900', border: 'border-red-400', text: 'text-red-700 dark:text-red-300', name: 'Tsukuri (右)', color: '#ef4444' },
        'kanmuri': { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-400', text: 'text-green-700 dark:text-green-300', name: 'Kanmuri (上)', color: '#10b981' },
        'ashi': { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300', name: 'Ashi (下)', color: '#8b5cf6' },
        'kamae': { bg: 'bg-orange-100 dark:bg-orange-900', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300', name: 'Kamae (囲)', color: '#f97316' },
        'tare': { bg: 'bg-yellow-100 dark:bg-yellow-900', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300', name: 'Tare (垂)', color: '#eab308' },
        'nyou': { bg: 'bg-pink-100 dark:bg-pink-900', border: 'border-pink-400', text: 'text-pink-700 dark:text-pink-300', name: 'Nyou (繞)', color: '#ec4899' }
    };

    if (selectedBushu === 'all') {
        // Overview of all bushu
        return (
            <div className="p-6">
                <div className="mb-6 text-center">
                    <h4 className="text-2xl font-bold text-green-600 mb-2">
                        📊 Overview Semua Bushu
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Klik pada bushu mana pun untuk melihat diagram detail kanji yang menggunakan bushu tersebut
                    </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    {allBushu.filter(b => b !== 'all').map(bushu => {
                        const kanjiCount = kanjiData.filter(k => k.bushu && k.bushu.includes(bushu)).length;
                        return (
                            <button
                                key={bushu}
                                onClick={() => onBushuSelect(bushu)}
                                className="p-4 rounded-lg border-2 border-green-300 hover:border-green-500 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900 transition text-center group"
                            >
                                <div className="text-3xl font-bold text-green-500 group-hover:text-green-600 mb-2 jp-font">
                                    {bushu}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {kanjiCount} kanji
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <h5 className="font-bold text-green-700 dark:text-green-300 mb-2">Cara Menggunakan:</h5>
                    <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                        <li>• Klik pada bushu mana pun untuk melihat diagram detail</li>
                        <li>• Setiap bushu menunjukkan jumlah kanji yang menggunakannya</li>
                        <li>• Diagram detail akan menampilkan kanji-kanji yang terhubung dengan bushu tersebut</li>
                    </ul>
                </div>
            </div>
        );
    }

    // Detailed view for selected bushu with visual diagram
    const kanjiByPosition = filteredKanji.reduce((acc, item) => {
        const position = item.bushu_position || 'kamae';
        if (!acc[position]) acc[position] = [];
        acc[position].push(item);
        return acc;
    }, {} as Record<string, KanjiItem[]>);

    // Calculate positions for circular diagram layout with collision detection
    const getKanjiPositions = () => {
        const centerX = 400;
        const centerY = 300;
        const baseRadius = 220; // Increased base radius for better distribution
        const minCardDistance = isMobile ? 160 : 180; // Minimum distance between card centers
        
        const positions: Array<{
            kanji: KanjiItem;
            position: string;
            x: number;
            y: number;
            color: string;
            id: string;
        }> = [];

        const positionEntries = Object.entries(kanjiByPosition);
        const totalPositions = positionEntries.length;

        // Helper function to check if position collides with existing positions
        const checkCollision = (newX: number, newY: number, existingPositions: Array<{x: number, y: number}>) => {
            return existingPositions.some(pos => {
                const distance = Math.sqrt(Math.pow(newX - pos.x, 2) + Math.pow(newY - pos.y, 2));
                return distance < minCardDistance;
            });
        };

        // Helper function to find non-colliding position
        const findNonCollidingPosition = (baseX: number, baseY: number, radius: number, angle: number, existingPositions: Array<{x: number, y: number}>) => {
            let attempts = 0;
            let currentRadius = radius;
            let currentAngle = angle;
            
            while (attempts < 20) { // Maximum 20 attempts
                const x = centerX + Math.cos(currentAngle) * currentRadius;
                const y = centerY + Math.sin(currentAngle) * currentRadius;
                
                if (!checkCollision(x, y, existingPositions)) {
                    return { x, y };
                }
                
                // Try different strategies to avoid collision
                if (attempts < 5) {
                    // First, try slightly different angles
                    currentAngle += (Math.PI / 8) * (attempts % 2 === 0 ? 1 : -1);
                } else if (attempts < 10) {
                    // Then try increasing radius
                    currentRadius += 40;
                    currentAngle = angle;
                } else {
                    // Finally, try random positions in a wider area
                    currentRadius = radius + (attempts - 10) * 30;
                    currentAngle = angle + (Math.random() - 0.5) * Math.PI;
                }
                
                attempts++;
            }
            
            // Fallback: return original position if no non-colliding position found
            return { x: baseX, y: baseY };
        };

        positionEntries.forEach(([position, kanjis], positionIndex) => {
            const positionAngle = (positionIndex / totalPositions) * 2 * Math.PI;
            const basePositionRadius = baseRadius + (positionIndex % 2) * 40; // Alternate radius for each position group
            
            kanjis.forEach((kanji, kanjiIndex) => {
                // Calculate layer (concentric circles)
                const layer = Math.floor(kanjiIndex / 3); // 3 cards per layer
                const layerRadius = basePositionRadius + (layer * 80);
                
                // Calculate angle within the layer
                const cardsInLayer = Math.min(3, kanjis.length - layer * 3);
                const angleSpread = Math.min(Math.PI / 2, cardsInLayer * 0.6); // Max 90 degrees spread
                const angleOffset = ((kanjiIndex % 3) - (cardsInLayer - 1) / 2) * (angleSpread / Math.max(1, cardsInLayer - 1));
                const finalAngle = positionAngle + angleOffset;
                
                const baseX = centerX + Math.cos(finalAngle) * layerRadius;
                const baseY = centerY + Math.sin(finalAngle) * layerRadius;
                
                // Check if position is already set by user drag, if not, find non-colliding position
                let finalX, finalY;
                if (cardPositions[kanji.kanji]) {
                    finalX = cardPositions[kanji.kanji].x;
                    finalY = cardPositions[kanji.kanji].y;
                } else {
                    const existingPositions = positions.map(p => ({ x: p.x, y: p.y }));
                    const nonCollidingPos = findNonCollidingPosition(baseX, baseY, layerRadius, finalAngle, existingPositions);
                    finalX = nonCollidingPos.x;
                    finalY = nonCollidingPos.y;
                }
                
                const positionColor = positionColors[position as keyof typeof positionColors] || positionColors.kamae;
                
                positions.push({
                    kanji,
                    position,
                    x: finalX,
                    y: finalY,
                    color: positionColor.color,
                    id: kanji.kanji
                });
            });
        });

        return { positions, centerX, centerY };
    };

    const { positions, centerX, centerY } = getKanjiPositions();

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <button 
                    onClick={() => onBushuSelect('all')}
                    className="hover:text-green-600 dark:hover:text-green-400 transition"
                >
                    📊 Overview Semua Bushu
                </button>
                <span>›</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                    Bushu: <span className="jp-font text-lg">{selectedBushu}</span>
                </span>
            </div>

            {/* Current Bushu Info */}
            <div className="mb-6 text-center">
                <h4 className="text-2xl font-bold text-green-600 mb-2">
                    📊 Diagram Bushu: <span className="jp-font text-4xl">{selectedBushu}</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kanji yang menggunakan bushu ini: <span className="font-semibold">{filteredKanji.length} kanji</span>
                </p>
            </div>

            {/* Legend */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-gray-700 dark:text-gray-300">Legenda Posisi Bushu:</h5>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPanZoomState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale * 0.8) }))}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                            title="Zoom Out"
                        >
                            🔍−
                        </button>
                        <button
                            onClick={() => setPanZoomState(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                            title="Zoom In"
                        >
                            🔍+
                        </button>
                        <button
                            onClick={resetView}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition"
                            title="Reset View"
                        >
                            Reset View
                        </button>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span>Zoom: {Math.round(panZoomState.scale * 100)}%</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                    {Object.entries(positionColors).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${config.bg} ${config.border} border`}></div>
                            <span className="text-gray-600 dark:text-gray-400">{config.name}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    💡 Tips Desktop: Mouse wheel untuk zoom, drag background untuk pan, drag kartu untuk pindah posisi
                    <br />
                    📱 Tips Mobile: Pinch untuk zoom, satu jari drag untuk pan, drag kartu untuk pindah posisi
                </div>
            </div>

            {/* Interactive Diagram */}
            <div 
                className={`diagram-container ${isMobile ? 'diagram-container-mobile' : ''} ${panZoomState.isPanning ? 'panning' : ''} relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden`}
                style={{ 
                    height: isMobile ? '600px' : '700px',
                    cursor: panZoomState.isPanning ? 'grabbing' : (dragState.isDragging ? 'grabbing' : 'grab')
                }}
                data-diagram-container
                onMouseDown={handleDiagramMouseDown}
                onTouchStart={handleDiagramTouchStart}
                onWheel={handleWheel}
            >
                {/* Transform wrapper for consistent coordinate system */}
                <div 
                    className="absolute inset-0"
                    style={{
                        transform: `scale(${panZoomState.scale}) translate(${panZoomState.translateX}px, ${panZoomState.translateY}px)`,
                        transformOrigin: 'center center',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <svg 
                        width="100%" 
                        height="100%" 
                        className="absolute inset-0 pointer-events-none"
                    >
                        {/* Connection lines from center to kanji */}
                        {positions.map((pos) => {
                            // Use actual card position if it has been moved, otherwise use calculated position
                            const actualPosition = cardPositions[pos.id] || { x: pos.x, y: pos.y };
                            
                            return (
                                <g key={`connection-${pos.id}`}>
                                    <line
                                        x1={centerX}
                                        y1={centerY}
                                        x2={actualPosition.x}
                                        y2={actualPosition.y}
                                        stroke={pos.color}
                                        strokeWidth="2"
                                        strokeOpacity="0.6"
                                        strokeDasharray="5,5"
                                        className="diagram-connection diagram-connection-flow"
                                    />
                                    <circle
                                        cx={actualPosition.x}
                                        cy={actualPosition.y}
                                        r="4"
                                        fill={pos.color}
                                        className="connection-point"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Central Bushu */}
                    <div 
                        className={`absolute kanji-central ${isMobile ? 'kanji-central-mobile' : ''} bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center font-bold cursor-pointer transition-all duration-300 hover:scale-110 pointer-events-auto`}
                        style={{ 
                            left: `${centerX}px`, 
                            top: `${centerY}px`,
                            width: isMobile ? '80px' : '100px',
                            height: isMobile ? '80px' : '100px',
                            transform: 'translate(-50%, -50%)',
                            transformOrigin: 'center center'
                        }}
                    >
                        <span className={`jp-font ${isMobile ? 'text-3xl' : 'text-5xl'}`}>{selectedBushu}</span>
                    </div>

                    {/* Kanji Cards */}
                    {positions.map((pos) => {
                        const isExpanded = expandedCard === pos.id;
                        const positionConfig = positionColors[pos.position as keyof typeof positionColors] || positionColors.kamae;
                        
                        // Use actual card position if it has been moved, otherwise use calculated position
                        const actualPosition = cardPositions[pos.id] || { x: pos.x, y: pos.y };
                        
                        return (
                            <div
                                key={pos.id}
                                className={`absolute vocab-card-mobile touch-draggable ${isExpanded ? 'expanded' : ''} ${positionConfig.bg} ${positionConfig.border} border-2 rounded-lg shadow-lg p-3 cursor-pointer transition-all duration-300 hover:shadow-xl pointer-events-auto`}
                                style={{
                                    left: `${actualPosition.x}px`,
                                    top: `${actualPosition.y}px`,
                                    transform: 'translate(-50%, -50%)',
                                    transformOrigin: 'center center',
                                    zIndex: isExpanded ? 60 : 30,
                                    minWidth: isExpanded ? (isMobile ? '300px' : '350px') : (isMobile ? '120px' : '140px'),
                                    maxWidth: isExpanded ? (isMobile ? '350px' : '400px') : (isMobile ? '140px' : '160px'),
                                    minHeight: isExpanded ? 'auto' : (isMobile ? '100px' : '120px')
                                }}
                                onClick={() => handleCardClick(pos.id)}
                                onMouseDown={(e) => handleMouseDown(e, pos.id)}
                                onTouchStart={(e) => handleTouchStart(e, pos.id)}
                            >
                                {/* Drag Handle */}
                                <div className={`drag-handle-mobile absolute top-1 right-1 w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50 hover:opacity-80 cursor-move flex items-center justify-center text-xs`}>
                                    ⋮⋮
                                </div>

                                <div className="card-content">
                                    {/* Minimized view - Kanji and Meaning */}
                                    {!isExpanded ? (
                                        <div className="text-center flex flex-col justify-center h-full">
                                            <div className={`jp-font font-bold mb-1 ${positionConfig.text} ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                                                {pos.kanji.kanji}
                                            </div>
                                            <div className={`text-xs font-medium ${positionConfig.text} opacity-90 mb-1 px-2 leading-tight`}>
                                                {pos.kanji.arti}
                                            </div>
                                            <div className="text-xs opacity-60 text-gray-500 dark:text-gray-400">
                                                {pos.position}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Expanded content */
                                        <div className="space-y-2">
                                            {/* Kanji Header */}
                                            <div className={`jp-font font-bold text-center mb-3 ${positionConfig.text}`}>
                                                <div className={`${isMobile ? 'text-2xl' : 'text-3xl'}`}>{pos.kanji.kanji}</div>
                                                <div className="text-sm font-medium mt-1">{pos.kanji.arti}</div>
                                                <div className="text-xs opacity-70">({pos.position})</div>
                                            </div>

                                            {/* Reading Information */}
                                            <div className="space-y-1">
                                                <div className="text-sm">
                                                    <strong>Onyomi:</strong> <span className="jp-font text-blue-600 dark:text-blue-400">{pos.kanji.onyomi}</span>
                                                </div>
                                                <div className="text-sm">
                                                    <strong>Kunyomi:</strong> <span className="jp-font text-green-600 dark:text-green-400">{pos.kanji.kunyomi}</span>
                                                </div>
                                            </div>

                                            {/* Mnemonic */}
                                            {pos.kanji.mnemonic && (
                                                <div className="text-sm">
                                                    <strong>Mnemonic:</strong> <span className="italic text-gray-600 dark:text-gray-400">{pos.kanji.mnemonic}</span>
                                                </div>
                                            )}

                                            {/* Example with Furigana */}
                                            {pos.kanji.example && (
                                                <div className="text-sm border-t pt-2">
                                                    <strong>Contoh:</strong>
                                                    <div className="mt-1 diagram-furigana">
                                                        <Furigana 
                                                            htmlString={pos.kanji.example.jp} 
                                                            className="text-base jp-font text-gray-700 dark:text-gray-300" 
                                                            rtClass="furigana-sm" 
                                                            boldMain={true}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {pos.kanji.example.romaji}
                                                    </div>
                                                    {pos.kanji.example.id && (
                                                        <div className="text-xs text-green-600 dark:text-green-400 italic mt-1">
                                                            {pos.kanji.example.id}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Expand/Collapse button */}
                                    <button 
                                        className={`expand-button ${isExpanded ? 'mt-2' : 'mt-1'} w-full py-1 px-2 rounded text-xs font-semibold transition-colors ${positionConfig.bg} ${positionConfig.text} hover:opacity-80`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardClick(pos.id);
                                        }}
                                    >
                                        {isExpanded ? '▲ Tutup' : '▼ Detail'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-green-600">{filteredKanji.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Kanji</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-blue-600">{Object.keys(kanjiByPosition).length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Posisi Berbeda</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-purple-600">{Math.max(...Object.values(kanjiByPosition).map(arr => arr.length))}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Terbanyak</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow">
                    <div className="text-2xl font-bold text-orange-600">{selectedBushu}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Bushu Aktif</div>
                </div>
            </div>
        </div>
    );
};

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
    
    // Early return for empty data
    if (!vocabData || vocabData.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Kosakata</h3>
                <p className="text-sm">Data kosakata belum tersedia untuk membuat diagram.</p>
            </div>
        );
    }
    
    if (!allKanji || allKanji.length <= 1) {
        return (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">🔤</div>
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Kanji</h3>
                <p className="text-sm">Data kanji belum tersedia untuk membuat diagram.</p>
            </div>
        );
    }
    
    // Enhanced state for drag functionality and better positioning
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({});
    const [dragState, setDragState] = useState<{ 
        isDragging: boolean; 
        cardId: string | null; 
        offset: { x: number; y: number };
        hasMoved: boolean;
        startPosition: { x: number; y: number };
    }>({
        isDragging: false,
        cardId: null,
        offset: { x: 0, y: 0 },
        hasMoved: false,
        startPosition: { x: 0, y: 0 }
    });

    // Pan/zoom state for entire diagram
    const [panZoomState, setPanZoomState] = useState({
        scale: 1,
        translateX: 0,
        translateY: 0,
        isPanning: false,
        startPanPosition: { x: 0, y: 0 },
        lastPanPosition: { x: 0, y: 0 }
    });

    // Mobile detection hook
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const [touchState, setTouchState] = useState({
        isTouching: false,
        touchStartTime: 0,
        touchTarget: null as string | null, // 'card' | 'diagram' | null
        initialTouchPos: { x: 0, y: 0 },
        lastTouchPos: { x: 0, y: 0 },
        touchCardId: null as string | null,
        touchCardOffset: { x: 0, y: 0 },
        hasTouchMoved: false,
        // Pinch zoom state
        isPinching: false,
        initialDistance: 0,
        initialScale: 1,
        pinchCenter: { x: 0, y: 0 }
    });

    // Helper function to calculate distance between two touches
    const getTouchDistance = (touch1: React.Touch | Touch, touch2: React.Touch | Touch) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Helper function to get center point between two touches
    const getTouchCenter = (touch1: React.Touch | Touch, touch2: React.Touch | Touch) => {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    };

    // Handle card click - expand/collapse (only if not dragging/touching)
    const handleCardClick = (vocabId: string) => {
        // Only expand/collapse if the card wasn't being dragged or touched
        if (!dragState.hasMoved && !touchState.hasTouchMoved) {
            setExpandedCard(expandedCard === vocabId ? null : vocabId);
        }
    };

    // Touch event handlers for cards
    const handleTouchStart = (e: React.TouchEvent, cardId: string) => {
        e.stopPropagation();
        const touch = e.touches[0];
        const card = e.currentTarget as HTMLElement;
        const cardRect = card.getBoundingClientRect();
        const container = document.querySelector('[data-diagram-container]');
        
        if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Account for current pan/zoom transform when calculating offset
            const transformedX = (touch.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
            const transformedY = (touch.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
            
            // Get card's current position in the transformed space
            const currentPosition = cardPositions[cardId];
            const cardX = currentPosition ? currentPosition.x : cardRect.left - containerRect.left;
            const cardY = currentPosition ? currentPosition.y : cardRect.top - containerRect.top;
            
            const offsetX = transformedX - cardX;
            const offsetY = transformedY - cardY;
            
            setTouchState({
                isTouching: true,
                touchStartTime: Date.now(),
                touchTarget: 'card',
                initialTouchPos: { x: touch.clientX, y: touch.clientY },
                lastTouchPos: { x: touch.clientX, y: touch.clientY },
                touchCardId: cardId,
                touchCardOffset: { x: offsetX, y: offsetY },
                hasTouchMoved: false,
                isPinching: false,
                initialDistance: 0,
                initialScale: 1,
                pinchCenter: { x: 0, y: 0 }
            });
        }
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!touchState.isTouching) return;
        
        e.preventDefault(); // Prevent scrolling
        
        // Handle two-finger pinch zoom
        if (e.touches.length === 2 && touchState.touchTarget === 'diagram') {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = getTouchDistance(touch1, touch2);
            const currentCenter = getTouchCenter(touch1, touch2);
            
            if (!touchState.isPinching) {
                // Start pinch
                setTouchState(prev => ({
                    ...prev,
                    isPinching: true,
                    initialDistance: currentDistance,
                    initialScale: panZoomState.scale,
                    pinchCenter: currentCenter,
                    hasTouchMoved: true
                }));
                return;
            }
            
            // Calculate scale change
            const scaleChange = currentDistance / touchState.initialDistance;
            const newScale = Math.max(0.5, Math.min(3, touchState.initialScale * scaleChange));
            
            // Calculate translation to keep pinch center in place
            const container = document.querySelector('[data-diagram-container]');
            if (container) {
                setPanZoomState(prev => ({
                    ...prev,
                    scale: newScale,
                    isPanning: false
                }));
            }
            return;
        }
        
        // Single touch handling
        const touch = e.touches[0];
        
        // Calculate movement distance
        const distance = Math.sqrt(
            Math.pow(touch.clientX - touchState.initialTouchPos.x, 2) + 
            Math.pow(touch.clientY - touchState.initialTouchPos.y, 2)
        );
        
        // Mark as moved if distance > 10 pixels
        if (distance > 10 && !touchState.hasTouchMoved) {
            setTouchState(prev => ({ ...prev, hasTouchMoved: true }));
        }
        
        if (touchState.touchTarget === 'card' && touchState.touchCardId && !touchState.isPinching) {
            // Handle card dragging - account for current transform
            const container = document.querySelector('[data-diagram-container]');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                
                // Transform touch coordinates to diagram space
                const transformedX = (touch.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
                const transformedY = (touch.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
                
                // Calculate new position accounting for offset
                const newX = transformedX - touchState.touchCardOffset.x;
                const newY = transformedY - touchState.touchCardOffset.y;
                
                // Constrain to reasonable bounds in diagram space
                const margin = 75;
                const diagramWidth = 800; // Approximate diagram width
                const diagramHeight = 600; // Approximate diagram height
                const maxX = diagramWidth - margin;
                const maxY = diagramHeight - margin;
                const minX = margin;
                const minY = margin;
                
                setCardPositions(prev => ({
                    ...prev,
                    [touchState.touchCardId!]: {
                        x: Math.max(minX, Math.min(newX, maxX)),
                        y: Math.max(minY, Math.min(newY, maxY))
                    }
                }));
            }
        } else if (touchState.touchTarget === 'diagram' && !touchState.isPinching) {
            // Handle diagram panning (single finger)
            const deltaX = touch.clientX - touchState.lastTouchPos.x;
            const deltaY = touch.clientY - touchState.lastTouchPos.y;
            
            setPanZoomState(prev => ({
                ...prev,
                translateX: prev.translateX + deltaX,
                translateY: prev.translateY + deltaY,
                isPanning: true
            }));
        }
        
        setTouchState(prev => ({
            ...prev,
            lastTouchPos: { x: touch.clientX, y: touch.clientY }
        }));
    }, [touchState, setCardPositions, panZoomState.scale, panZoomState.translateX, panZoomState.translateY, getTouchDistance, getTouchCenter]);

    const handleTouchEnd = useCallback(() => {
        if (!touchState.isTouching) return;
        
        const touchDuration = Date.now() - touchState.touchStartTime;
        const wasTap = !touchState.hasTouchMoved && touchDuration < 300;
        
        // If it was a tap on a card, handle click
        if (wasTap && touchState.touchTarget === 'card' && touchState.touchCardId) {
            setTimeout(() => {
                handleCardClick(touchState.touchCardId!);
            }, 10);
        }
        
        // Reset touch state
        setTouchState({
            isTouching: false,
            touchStartTime: 0,
            touchTarget: null,
            initialTouchPos: { x: 0, y: 0 },
            lastTouchPos: { x: 0, y: 0 },
            touchCardId: null,
            touchCardOffset: { x: 0, y: 0 },
            hasTouchMoved: false,
            isPinching: false,
            initialDistance: 0,
            initialScale: 1,
            pinchCenter: { x: 0, y: 0 }
        });
        
        // Reset panning state
        setPanZoomState(prev => ({ ...prev, isPanning: false }));
    }, [touchState, handleCardClick]);


    // Add global touch event listeners
    useEffect(() => {
        if (touchState.isTouching) {
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd, { passive: false });
            
            return () => {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [touchState.isTouching, handleTouchMove, handleTouchEnd]);

    // Drag functionality
    const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const card = e.currentTarget as HTMLElement;
        const cardRect = card.getBoundingClientRect();
        const container = document.querySelector('[data-diagram-container]');
        
        if (container) {
            const containerRect = container.getBoundingClientRect();
            
            // Account for current pan/zoom transform when calculating offset
            const transformedX = (e.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
            const transformedY = (e.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
            
            // Get card's current position in the transformed space
            const currentPosition = cardPositions[cardId];
            const cardX = currentPosition ? currentPosition.x : cardRect.left - containerRect.left;
            const cardY = currentPosition ? currentPosition.y : cardRect.top - containerRect.top;
            
            const offsetX = transformedX - cardX;
            const offsetY = transformedY - cardY;
            
            setDragState({
                isDragging: true,
                cardId,
                offset: {
                    x: offsetX,
                    y: offsetY
                },
                hasMoved: false,
                startPosition: {
                    x: e.clientX,
                    y: e.clientY
                }
            });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (dragState.isDragging && dragState.cardId) {
            // Calculate movement distance to determine if user is dragging
            const distance = Math.sqrt(
                Math.pow(e.clientX - dragState.startPosition.x, 2) + 
                Math.pow(e.clientY - dragState.startPosition.y, 2)
            );
            
            // If moved more than 5 pixels, consider it a drag
            if (distance > 5 && !dragState.hasMoved) {
                setDragState(prev => ({ ...prev, hasMoved: true }));
            }
            
            const container = document.querySelector('[data-diagram-container]');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                
                // Transform mouse coordinates to diagram space
                const transformedX = (e.clientX - containerRect.left - panZoomState.translateX) / panZoomState.scale;
                const transformedY = (e.clientY - containerRect.top - panZoomState.translateY) / panZoomState.scale;
                
                // Calculate new position accounting for offset
                const newX = transformedX - dragState.offset.x;
                const newY = transformedY - dragState.offset.y;
                
                // Constrain to reasonable bounds in diagram space
                const margin = 75;
                const diagramWidth = 800; // Approximate diagram width
                const diagramHeight = 600; // Approximate diagram height
                const maxX = diagramWidth - margin;
                const maxY = diagramHeight - margin;
                const minX = margin;
                const minY = margin;
                
                setCardPositions(prev => ({
                    ...prev,
                    [dragState.cardId!]: {
                        x: Math.max(minX, Math.min(newX, maxX)),
                        y: Math.max(minY, Math.min(newY, maxY))
                    }
                }));
            }
        }
    }, [dragState]);

    const handleMouseUp = useCallback(() => {
        if (dragState.isDragging) {
            setTimeout(() => {
                setDragState({
                    isDragging: false,
                    cardId: null,
                    offset: { x: 0, y: 0 },
                    hasMoved: false,
                    startPosition: { x: 0, y: 0 }
                });
            }, 100); // Small delay to prevent click event
        }
    }, [dragState.isDragging]);

    // Add global mouse event listeners
    useEffect(() => {
        if (dragState.isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

    // Pan functionality for diagram
    const handleDiagramMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'line' || (e.target as HTMLElement).tagName === 'circle') {
            setPanZoomState(prev => ({
                ...prev,
                isPanning: true,
                startPanPosition: { x: e.clientX, y: e.clientY },
                lastPanPosition: { x: prev.translateX, y: prev.translateY }
            }));
        }
    };

    const handleDiagramMouseMove = useCallback((e: MouseEvent) => {
        if (panZoomState.isPanning) {
            const deltaX = e.clientX - panZoomState.startPanPosition.x;
            const deltaY = e.clientY - panZoomState.startPanPosition.y;
            
            setPanZoomState(prev => ({
                ...prev,
                translateX: prev.lastPanPosition.x + deltaX,
                translateY: prev.lastPanPosition.y + deltaY
            }));
        }
    }, [panZoomState.isPanning, panZoomState.startPanPosition, panZoomState.lastPanPosition]);

    const handleDiagramMouseUp = useCallback(() => {
        setPanZoomState(prev => ({ ...prev, isPanning: false }));
    }, []);

    // Add global diagram pan event listeners
    useEffect(() => {
        if (panZoomState.isPanning) {
            document.addEventListener('mousemove', handleDiagramMouseMove);
            document.addEventListener('mouseup', handleDiagramMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleDiagramMouseMove);
                document.removeEventListener('mouseup', handleDiagramMouseUp);
            };
        }
    }, [panZoomState.isPanning, handleDiagramMouseMove, handleDiagramMouseUp]);

    // Zoom functionality
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        
        const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(3, panZoomState.scale * scaleChange));
        
        setPanZoomState(prev => ({
            ...prev,
            scale: newScale
        }));
    };

    // Touch event handlers for vocab diagram panning and zooming
    const handleVocabDiagramTouchStart = (e: React.TouchEvent) => {
        // Only handle if no card is being touched
        if (touchState.isTouching) return;
        
        const touch = e.touches[0];
        
        // Check if it's a pinch gesture (2 fingers)
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = getTouchDistance(touch1, touch2);
            const center = getTouchCenter(touch1, touch2);
            
            setTouchState({
                isTouching: true,
                touchStartTime: Date.now(),
                touchTarget: 'diagram',
                initialTouchPos: center,
                lastTouchPos: center,
                touchCardId: null,
                touchCardOffset: { x: 0, y: 0 },
                hasTouchMoved: false,
                isPinching: true,
                initialDistance: distance,
                initialScale: panZoomState.scale,
                pinchCenter: center
            });
        } else {
            // Single touch for panning
            setTouchState({
                isTouching: true,
                touchStartTime: Date.now(),
                touchTarget: 'diagram',
                initialTouchPos: { x: touch.clientX, y: touch.clientY },
                lastTouchPos: { x: touch.clientX, y: touch.clientY },
                touchCardId: null,
                touchCardOffset: { x: 0, y: 0 },
                hasTouchMoved: false,
                isPinching: false,
                initialDistance: 0,
                initialScale: panZoomState.scale,
                pinchCenter: { x: 0, y: 0 }
            });
            
            setPanZoomState(prev => ({ ...prev, isPanning: true }));
        }
    };

    // Add global touch event listeners for KanjiVocabDiagram
    useEffect(() => {
        if (touchState.isTouching) {
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            
            return () => {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };
        }
    }, [touchState.isTouching, handleTouchMove, handleTouchEnd]);

    // Color mapping for vocabulary types
    const typeColors = {
        '🟢': { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-400', text: 'text-green-700 dark:text-green-300', name: 'Verba', color: '#10b981' },
        '🔵': { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300', name: 'Nomina', color: '#3b82f6' },
        '🟠': { bg: 'bg-orange-100 dark:bg-orange-900', border: 'border-orange-400', text: 'text-orange-700 dark:text-orange-300', name: 'Adjektiva', color: '#f97316' },
        '🟣': { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300', name: 'Adverbia', color: '#8b5cf6' },
        '🟡': { bg: 'bg-yellow-100 dark:bg-yellow-900', border: 'border-yellow-400', text: 'text-yellow-700 dark:text-yellow-300', name: 'Lainnya', color: '#eab308' }
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

    // Detailed view for selected kanji with visual diagram and connecting lines
    const vocabByType = filteredVocab.reduce((acc, item) => {
        const type = item.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {} as Record<string, VocabItem[]>);

    // Calculate positions for circular diagram layout
    const getVocabPositions = () => {
        const centerX = 400;
        const centerY = 300;
        const baseRadius = 200;
        
        const positions: Array<{
            vocab: VocabItem;
            type: string;
            x: number;
            y: number;
            color: string;
            id: string;
        }> = [];

        const typeEntries = Object.entries(vocabByType);
        const totalTypes = typeEntries.length;

        typeEntries.forEach(([type, vocabs], typeIndex) => {
            const typeColor = typeColors[type as keyof typeof typeColors] || typeColors['🟡'];
            const anglePerType = (2 * Math.PI) / totalTypes;
            const typeStartAngle = anglePerType * typeIndex - Math.PI / 2; // Start from top
            
            vocabs.forEach((vocab, vocabIndex) => {
                const radius = baseRadius + (vocabIndex % 3) * 60; // Stagger in rings
                const angleOffset = (vocabIndex / vocabs.length) * anglePerType;
                const angle = typeStartAngle + angleOffset;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                positions.push({
                    vocab,
                    type,
                    x,
                    y,
                    color: typeColor.color,
                    id: `${type}-${vocabIndex}`
                });
            });
        });

        return { positions, centerX, centerY };
    };

    const { positions, centerX, centerY } = getVocabPositions();

    return (
        <div className="p-6">
            {/* Legend */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-gray-700 dark:text-gray-300">Legenda Jenis Kosakata:</h5>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPanZoomState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale * 0.8) }))}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                            title="Zoom Out"
                        >
                            🔍−
                        </button>
                        <button
                            onClick={() => setPanZoomState(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                            title="Zoom In"
                        >
                            🔍+
                        </button>
                        <button
                            onClick={() => {
                                setCardPositions({});
                                setPanZoomState({
                                    scale: 1,
                                    translateX: 0,
                                    translateY: 0,
                                    isPanning: false,
                                    startPanPosition: { x: 0, y: 0 },
                                    lastPanPosition: { x: 0, y: 0 }
                                });
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition"
                            title="Reset View"
                        >
                            Reset View
                        </button>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <span>Zoom: {Math.round(panZoomState.scale * 100)}%</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border border-blue-400"></div>
                        <span className="text-gray-600 dark:text-gray-400">Kata Benda</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900 border border-green-400"></div>
                        <span className="text-gray-600 dark:text-gray-400">Kata Kerja</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900 border border-purple-400"></div>
                        <span className="text-gray-600 dark:text-gray-400">Kata Sifat-na</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900 border border-orange-400"></div>
                        <span className="text-gray-600 dark:text-gray-400">Kata Sifat-i</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-400"></div>
                        <span className="text-gray-600 dark:text-gray-400">Kata Keterangan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700 border border-gray-400"></div>
                        <span className="text-gray-600 dark:text-gray-400">Lainnya</span>
                    </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    💡 Tips Desktop: Mouse wheel untuk zoom, drag background untuk pan, drag kartu untuk pindah posisi
                    <br />
                    📱 Tips Mobile: Pinch untuk zoom, satu jari drag untuk pan, drag kartu untuk pindah posisi
                </div>
            </div>

            {/* Diagram Container */}
            <div 
                data-diagram-container 
                className={`relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 min-h-[700px] overflow-hidden diagram-container ${
                    panZoomState.isPanning ? 'pan-zoom-container dragging' : 'pan-zoom-container'
                } ${isMobile ? 'diagram-container-mobile' : ''}`}
                onTouchStart={handleVocabDiagramTouchStart}
                onMouseDown={handleDiagramMouseDown}
                onWheel={handleWheel}
                style={{ 
                    height: isMobile ? '600px' : '700px',
                    cursor: panZoomState.isPanning ? 'grabbing' : (dragState.isDragging ? 'grabbing' : 'grab')
                }}
            >
                {/* Diagram Content Wrapper - this is what gets transformed */}
                <div 
                    className="diagram-content-wrapper relative w-full h-full"
                    style={{
                        transform: `translate(${panZoomState.translateX}px, ${panZoomState.translateY}px) scale(${panZoomState.scale})`,
                        transformOrigin: 'center center'
                    }}
                >
                
                {/* SVG for connection lines */}
                <svg 
                    className="absolute inset-0 pointer-events-none z-10" 
                    style={{ 
                        zIndex: 1,
                        width: '800px',
                        height: '600px',
                        left: 0,
                        top: 0
                    }}
                >
                    {/* Connection lines from kanji to vocabulary */}
                    {positions.map((pos, index) => {
                        const finalPosition = cardPositions[pos.id] || { x: pos.x, y: pos.y };
                        return (
                            <g key={index}>
                                <line
                                    x1={centerX}
                                    y1={centerY}
                                    x2={finalPosition.x}
                                    y2={finalPosition.y}
                                    stroke={pos.color}
                                    strokeWidth="2"
                                    strokeDasharray="8,4"
                                    className="diagram-connection"
                                    opacity="0.6"
                                />
                                <circle
                                    cx={finalPosition.x}
                                    cy={finalPosition.y}
                                    r="3"
                                    fill={pos.color}
                                    className="connection-point"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Central Kanji */}
                <div 
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 ${isMobile ? 'kanji-central-mobile' : ''}`}
                    style={{ left: centerX, top: centerY }}
                >
                    <div className="bg-orange-100 dark:bg-orange-900 border-4 border-orange-400 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all kanji-central">
                        <div className="text-5xl font-bold text-orange-500 text-center mb-2">{selectedKanji}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            漢字 ({filteredVocab.length})
                        </div>
                    </div>
                </div>

                {/* Vocabulary Cards positioned around the kanji */}
                {positions.map((pos, index) => {
                    const meaning = (() => {
                        const match = pos.vocab.reading_meaning.match(/\((.*)\)/);
                        return match ? match[1] : pos.vocab.reading_meaning;
                    })();

                    const typeColor = typeColors[pos.type as keyof typeof typeColors] || typeColors['🟡'];
                    const isExpanded = expandedCard === pos.id;
                    const isDraggedCard = dragState.cardId === pos.id && dragState.isDragging;
                    
                    // Use dragged position if available, otherwise use calculated position
                    const finalPosition = cardPositions[pos.id] || { x: pos.x, y: pos.y };

                    return (
                        <div
                            key={index}
                            className={`absolute z-30 transition-all duration-200 select-none touch-draggable ${
                                isDraggedCard || touchState.touchCardId === pos.id ? 'cursor-grabbing z-50 scale-105 touch-feedback' : 'cursor-grab hover:scale-105'
                            } ${
                                // Add mobile-specific classes
                                isMobile ? 'vocab-card-mobile' : ''
                            } ${
                                isExpanded && isMobile ? 'expanded' : ''
                            }`}
                            style={{ 
                                left: finalPosition.x, 
                                top: finalPosition.y,
                                transform: `translate(-50%, -50%) ${isExpanded ? 'scale(1.15)' : 'scale(1)'}`,
                                zIndex: isDraggedCard || touchState.touchCardId === pos.id ? 1000 : (isExpanded ? 50 : 30),
                                transition: isDraggedCard || touchState.touchCardId === pos.id ? 'none' : 'all 0.2s ease'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, pos.id)}
                            onTouchStart={(e) => handleTouchStart(e, pos.id)}
                            onMouseUp={() => {
                                // Handle click only if card wasn't dragged
                                setTimeout(() => {
                                    if (!dragState.hasMoved) {
                                        handleCardClick(pos.id);
                                    }
                                }, 10);
                            }}
                        >
                            <div className={`${typeColor.bg} ${typeColor.border} border-2 rounded-lg shadow-lg hover:shadow-xl transition-all ${
                                isExpanded ? 'min-w-[300px] max-w-[350px]' : 'min-w-[120px] max-w-[150px]'
                            } ${isDraggedCard ? 'shadow-2xl scale-105' : ''}`}>
                                
                                {/* Drag handle indicator */}
                                <div className={`absolute top-1 right-1 transition-opacity ${
                                    isDraggedCard || touchState.touchCardId === pos.id ? 'opacity-100' : 'opacity-30 hover:opacity-70'
                                } ${isMobile ? 'drag-handle-mobile' : ''}`}>
                                    <svg width={isMobile ? "20" : "14"} height={isMobile ? "20" : "14"} viewBox="0 0 14 14" className="text-gray-500">
                                        <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                                        <circle cx="10" cy="3" r="1.5" fill="currentColor"/>
                                        <circle cx="3" cy="10" r="1.5" fill="currentColor"/>
                                        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                                        <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor"/>
                                    </svg>
                                </div>
                                
                                {/* Compact view - always visible */}
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-lg">{pos.type}</span>
                                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: pos.color }}></div>
                                    </div>
                                    
                                    {/* Vocabulary with furigana */}
                                    <div className={`text-sm font-bold ${typeColor.text} jp-font leading-tight mb-1`}>
                                        <Furigana 
                                            htmlString={pos.vocab.vocab} 
                                            className="text-base" 
                                            rtClass="furigana-bold" 
                                            boldMain={true} 
                                        />
                                    </div>
                                    
                                    {/* Meaning */}
                                    <div className={`text-xs ${typeColor.text} mb-2`}>
                                        {meaning}
                                    </div>

                                    {/* Expand indicator */}
                                    <div className="text-center">
                                        <svg 
                                            className={`w-4 h-4 mx-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded details - conditional */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 dark:border-gray-600 p-3 space-y-3 animate-fade-in">
                                        {/* Mnemonic */}
                                        <div className="bg-white dark:bg-gray-800 rounded p-2">
                                            <div className={`text-xs font-bold ${typeColor.text} mb-1`}>💡 Mnemonic:</div>
                                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                                {pos.vocab.mnemonic}
                                            </div>
                                        </div>

                                        {/* Example */}
                                        <div className="bg-white dark:bg-gray-800 rounded p-2">
                                            <div className={`text-xs font-bold ${typeColor.text} mb-1`}>📝 Contoh:</div>
                                            <div className="jp-font text-gray-700 dark:text-gray-300 leading-tight text-xs">
                                                <Furigana 
                                                    htmlString={pos.vocab.example.jp} 
                                                    className="text-sm" 
                                                    rtClass="furigana-bold" 
                                                    boldMain={true} 
                                                />
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {pos.vocab.example.romaji}
                                            </div>
                                            {pos.vocab.example.id && (
                                                <div className="text-xs text-green-700 dark:text-green-400 mt-1 italic">
                                                    {pos.vocab.example.id}
                                                </div>
                                            )}
                                        </div>

                                        {/* Kanji used */}
                                        {pos.vocab.kanji_bushu && pos.vocab.kanji_bushu.length > 0 && (
                                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                                <div className={`text-xs font-bold ${typeColor.text} mb-1`}>🔤 Kanji:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {pos.vocab.kanji_bushu.map((kanji, kanjiIndex) => (
                                                        <span 
                                                            key={kanjiIndex}
                                                            className={`inline-block px-1 py-0.5 rounded text-xs cursor-pointer hover:scale-110 transition-transform ${
                                                                kanji === selectedKanji 
                                                                    ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 font-bold' 
                                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onKanjiSelect(kanji);
                                                            }}
                                                        >
                                                            {kanji}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                

                {/* Connection info */}
                <div className="absolute bottom-4 right-4 z-40">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Koneksi:</div>
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <svg width="20" height="8" viewBox="0 0 20 8">
                                    <line x1="2" y1="4" x2="18" y2="4" stroke="#f97316" strokeWidth="2" strokeDasharray="3,2"/>
                                </svg>
                                <span>Kanji → Kosakata</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                </div> {/* Close diagram-content-wrapper */}
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(vocabByType).map(([type, vocabs]) => {
                    const typeColor = typeColors[type as keyof typeof typeColors] || typeColors['🟡'];
                    return (
                        <div key={type} className={`${typeColor.bg} ${typeColor.border} border-2 rounded-lg p-3 text-center hover:shadow-md transition-shadow`}>
                            <div className="text-2xl mb-1">{type}</div>
                            <div className={`text-sm font-bold ${typeColor.text}`}>{typeColor.name}</div>
                            <div className={`text-lg font-bold ${typeColor.text}`}>{vocabs.length}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
