"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface IradoriVocabItem {
    id: number;
    order: number;
    word: string;
    reading: string;
    accent: string;
    romanji: string;
    english: string;
    partOfSpeech: string;
    section: string; // 部
    lesson: string;  // 課
    activity: string; // 活動
}

interface FilterState {
    section: string;
    lesson: string;
    activities: string[];
}

type StudyMode = 'flipcard' | 'multiple-choice';
type DisplayMode = 'kana' | 'romanji' | 'both';

export default function IradoriClient() {
    const [vocabData, setVocabData] = useState<IradoriVocabItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Translations
    const translations = {
        // Header
        title: '🌸 いらどり語彙暗記ツール (Iradori Vocabulary Memorization Tool)',
        subtitle: 'フィルターを選択して学習を開始してください (Please select filters to start studying)',
        progress: '語彙 (vocabulary)',
        
        // Study mode
        studyModeFlipcard: 'フリップカード (Flipcard)',
        studyModeMultipleChoice: '多肢選択 (Multiple Choice)',
        
        // Display mode
        displayBoth: 'かな + ローマ字 (Kana + Romaji)',
        displayKana: 'かなのみ (Kana only)',
        displayRomaji: 'ローマ字のみ (Romaji only)',
        
        // Filters
        filterSettings: 'フィルター設定 (Filter Settings)',
        section: '部 (Section)',
        lesson: '課 (Lesson)',
        activity: '活動 (Activity)',
        selectAll: 'すべて選択 (Select All)',
        deselectAll: 'すべて解除 (Deselect All)',
        resetFilters: 'フィルターリセット (Reset Filters)',
        
        // Controls
        settings: '設定 (Settings)',
        previous: '前へ (Previous)',
        next: '次へ (Next)',
        flipCard: 'カードをめくる (Flip Card)',
        showAnswer: '答えを見る (Show Answer)',
        correct: '正解 (Correct)',
        incorrect: '不正解 (Incorrect)',
        
        // Study session
        correctAnswer: '正解！ (Correct!)',
        wrongAnswer: '不正解 (Wrong!)',
        score: 'スコア (Score)',
        
        // Error messages
        noData: 'データが見つかりません (No data found)',
        loadingError: 'データの読み込みに失敗しました (Failed to load data)',
        noVocabulary: '条件に合う語彙が見つかりません (No vocabulary found matching criteria)',
        
        // Navigation
        close: '閉じる (Close)',
        shuffleData: 'データをシャッフル (Shuffle Data)',
        
        // Grammar
        partOfSpeech: '品詞 (Part of Speech)',
        accent: 'アクセント (Accent)',
        reading: '読み (Reading)',
        meaning: '意味 (Meaning)'
    };
    
    // Study settings
    const [studyMode, setStudyMode] = useState<StudyMode>('multiple-choice');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('both');
    const [showSettings, setShowSettings] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState<FilterState>({
        section: '入門',
        lesson: '1',
        activities: []
    });
    
    // Study session state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
    const [shuffledVocab, setShuffledVocab] = useState<IradoriVocabItem[]>([]);
    
    // Available filter options
    const availableOptions = useMemo(() => {
        const sections = new Set<string>();
        const lessons = new Set<string>();
        const activities = new Set<string>();
        
        vocabData.forEach(item => {
            sections.add(item.section);
            // Only add lessons for the selected section
            if (item.section === filters.section) {
                lessons.add(item.lesson);
                // Only add activities for selected section and lesson
                if (item.lesson === filters.lesson) {
                    activities.add(item.activity);
                }
            }
        });
        
        return {
            sections: Array.from(sections).sort(),
            lessons: Array.from(lessons).sort((a, b) => {
                // Extract numbers from lesson strings for proper numeric sorting
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            }),
            activities: Array.from(activities).sort((a, b) => {
                // Extract numbers from activity strings for proper numeric sorting
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            })
        };
    }, [vocabData, filters.section, filters.lesson]);
    
    // Filtered vocabulary based on current filters
    const filteredVocab = useMemo(() => {
        let filtered = vocabData;
        
        // Apply filters
        filtered = vocabData.filter(item => {
            const sectionMatch = !filters.section || item.section === filters.section;
            const lessonMatch = !filters.lesson || item.lesson === filters.lesson;
            const activityMatch = filters.activities.length === 0 || filters.activities.includes(item.activity);
            
            return sectionMatch && lessonMatch && activityMatch;
        });
        
        return shuffledVocab.length > 0 && shuffledVocab.length === filtered.length ? shuffledVocab : filtered;
    }, [vocabData, filters, shuffledVocab]);
    
    // Load CSV data
    useEffect(() => {
        const loadVocabData = async () => {
            try {
                const response = await fetch('/wordlist_iradori.csv');
                if (!response.ok) {
                    throw new Error('Failed to load vocabulary data');
                }
                
                const csvText = await response.text();
                const lines = csvText.split('\n');
                // Skip the header line
                
                const data: IradoriVocabItem[] = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // Parse CSV line handling quoted fields
                    const values = parseCSVLine(line);
                    if (values.length >= 11) {
                        data.push({
                            id: parseInt(values[0]) || i,
                            order: parseInt(values[1]) || i,
                            word: values[2] || '',
                            reading: values[3] || '',
                            accent: values[4] || '',
                            romanji: values[5] || '',
                            english: values[6] || '',
                            partOfSpeech: values[7] || '',
                            section: values[8] || '',
                            lesson: values[9] || '',
                            activity: values[10] || ''
                        });
                    }
                }
                
                setVocabData(data);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setLoading(false);
            }
        };
        
        loadVocabData();
    }, []);
    
    // Parse CSV line handling quoted fields
    const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    };
    
    // Generate multiple choice options
    const generateMultipleChoiceOptions = useCallback((correctAnswer: string) => {
        const otherAnswers = filteredVocab
            .filter(item => item.english !== correctAnswer)
            .map(item => item.english)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        return [correctAnswer, ...otherAnswers].sort(() => Math.random() - 0.5);
    }, [filteredVocab]);
    
    // Initialize study session
    useEffect(() => {
        if (filteredVocab.length > 0) {
            setCurrentIndex(0);
            setIsFlipped(false);
            setSelectedAnswer(null);
            setShowResult(false);
            
            if (studyMode === 'multiple-choice') {
                const options = generateMultipleChoiceOptions(filteredVocab[0].english);
                setMultipleChoiceOptions(options);
            }
        }
    }, [filteredVocab, studyMode, generateMultipleChoiceOptions]);
    
    // Handle next card
    const handleNext = () => {
        if (currentIndex < filteredVocab.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setIsFlipped(false);
            setSelectedAnswer(null);
            setShowResult(false);
            
            if (studyMode === 'multiple-choice') {
                const options = generateMultipleChoiceOptions(filteredVocab[nextIndex].english);
                setMultipleChoiceOptions(options);
            }
        }
    };
    
    // Handle previous card
    const handlePrevious = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            setIsFlipped(false);
            setSelectedAnswer(null);
            setShowResult(false);
            
            if (studyMode === 'multiple-choice') {
                const options = generateMultipleChoiceOptions(filteredVocab[prevIndex].english);
                setMultipleChoiceOptions(options);
            }
        }
    };
    
    // Handle flip card
    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };
    
    // Handle multiple choice answer
    const handleAnswerSelect = (answer: string) => {
        setSelectedAnswer(answer);
        setShowResult(true);
        
        const isCorrect = answer === filteredVocab[currentIndex].english;
        setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }));
    };
    
    // Handle filter changes
    const handleFilterChange = (type: keyof FilterState, value: string) => {
        setFilters(prev => {
            if (type === 'activities') {
                // Multi-select for activities
                return {
                    ...prev,
                    [type]: prev[type].includes(value)
                        ? prev[type].filter(item => item !== value)
                        : [...prev[type], value]
                };
            } else {
                // Single select for section and lesson
                return {
                    ...prev,
                    [type]: prev[type] === value ? '' : value,
                    // Reset lesson when section changes
                    ...(type === 'section' ? { lesson: '' } : {})
                };
            }
        });
    };
    
    // Reset filters
    const resetFilters = () => {
        setFilters({
            section: '入門',
            lesson: '1',
            activities: []
        });
    };
    
    // Shuffle vocabulary
    const shuffleVocab = () => {
        const shuffled = [...filteredVocab].sort(() => Math.random() - 0.5);
        setShuffledVocab(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore({ correct: 0, total: 0 });
    };
    
    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return; // Don't trigger when typing in inputs
            }
            
            switch (e.key) {
                case ' ': // Spacebar to flip
                    e.preventDefault();
                    if (studyMode === 'flipcard') {
                        handleFlip();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNext();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    if (studyMode === 'multiple-choice' && !showResult) {
                        const index = parseInt(e.key) - 1;
                        if (index < multipleChoiceOptions.length) {
                            handleAnswerSelect(multipleChoiceOptions[index]);
                        }
                    }
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [studyMode, showResult, multipleChoiceOptions]);
    
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                        いらどり語彙を読み込み中...
                    </h2>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">エラー</h2>
                    <p className="text-gray-700 dark:text-gray-300">{error}</p>
                </div>
            </div>
        );
    }
    
    if (filteredVocab.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto p-4">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                            {translations.title}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {translations.subtitle}
                        </p>
                    </header>
                    
                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                        <h3 className="text-lg font-semibold mb-4">{translations.filterSettings}</h3>
                        
                        {/* Section filters */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">{translations.section}:</h4>
                            <div className="flex flex-wrap gap-2">
                                {availableOptions.sections.map(section => (
                                    <button
                                        key={section}
                                        onClick={() => handleFilterChange('section', section)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                            filters.section === section
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                                        }`}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Lesson filters */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">{translations.lesson}:</h4>
                            <div className="flex flex-wrap gap-2">
                                {availableOptions.lessons.map(lesson => (
                                    <button
                                        key={lesson}
                                        onClick={() => handleFilterChange('lesson', lesson)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                            filters.lesson === lesson
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
                                        }`}
                                    >
                                        {lesson}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activity filters */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">{translations.activity}:</h4>
                            <div className="mb-2">
                                <button
                                    onClick={() => {
                                        const allSelected = availableOptions.activities.every(activity => 
                                            filters.activities.includes(activity)
                                        );
                                        setFilters(prev => ({
                                            ...prev,
                                            activities: allSelected ? [] : [...availableOptions.activities]
                                        }));
                                    }}
                                    className="px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition"
                                >
                                    {filters.activities.length === availableOptions.activities.length ? translations.deselectAll : translations.selectAll}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableOptions.activities.map(activity => (
                                    <button
                                        key={activity}
                                        onClick={() => handleFilterChange('activities', activity)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                            filters.activities.includes(activity)
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                        }`}
                                    >
                                        {activity}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            {translations.resetFilters}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const currentItem = filteredVocab[currentIndex];
    
    return (
        <div className="min-h-screen h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-4 flex-1 flex flex-col">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {translations.title}
                    </h1>
                    <div className="flex items-center justify-between">
                        <p className="text-gray-600 dark:text-gray-400">
                            {currentIndex + 1} / {filteredVocab.length} {translations.progress}
                        </p>
                        <div className="flex items-center gap-4">
                            {studyMode === 'multiple-choice' && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {translations.score}: {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                                    ({score.correct}/{score.total})
                                </div>
                            )}
                            <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                                ⌨️ キーボード: スペース(反転), ←→(ナビ), 1-4(選択)
                            </div>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                ⚙️ {translations.settings}
                            </button>
                        </div>
                    </div>
                </header>
                
                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
                        <h3 className="text-lg font-semibold mb-4">{translations.settings}</h3>
                        
                        {/* Study Mode */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">学習モード (Study Mode):</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStudyMode('flipcard')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        studyMode === 'flipcard'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                                    }`}
                                >
                                    🔄 {translations.studyModeFlipcard}
                                </button>
                                <button
                                    onClick={() => setStudyMode('multiple-choice')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        studyMode === 'multiple-choice'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                                    }`}
                                >
                                    ✅ {translations.studyModeMultipleChoice}
                                </button>
                            </div>
                        </div>
                        
                        {/* Display Mode */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">表示モード (Display Mode):</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDisplayMode('kana')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        displayMode === 'kana'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                    }`}
                                >
                                    あ {translations.displayKana}
                                </button>
                                <button
                                    onClick={() => setDisplayMode('romanji')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        displayMode === 'romanji'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                    }`}
                                >
                                    ABC {translations.displayRomaji}
                                </button>
                                <button
                                    onClick={() => setDisplayMode('both')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${
                                        displayMode === 'both'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                                    }`}
                                >
                                    {translations.displayBoth}
                                </button>
                            </div>
                        </div>
                        
                        {/* Filters */}
                        <div className="space-y-4">
                            {/* Section filters */}
                            <div>
                                <h4 className="font-medium mb-2">{translations.section}:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {availableOptions.sections.map(section => (
                                        <button
                                            key={section}
                                            onClick={() => handleFilterChange('section', section)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                                filters.section === section
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                                            }`}
                                        >
                                            {section}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Lesson filters */}
                            <div>
                                <h4 className="font-medium mb-2">{translations.lesson}:</h4>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {availableOptions.lessons.map(lesson => (
                                        <button
                                            key={lesson}
                                            onClick={() => handleFilterChange('lesson', lesson)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                                filters.lesson === lesson
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
                                            }`}
                                        >
                                            {lesson}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Activity filters */}
                            <div>
                                <h4 className="font-medium mb-2">{translations.activity}:</h4>
                                <div className="mb-2">
                                    <button
                                        onClick={() => {
                                            const allSelected = availableOptions.activities.every(activity => 
                                                filters.activities.includes(activity)
                                            );
                                            setFilters(prev => ({
                                                ...prev,
                                                activities: allSelected ? [] : [...availableOptions.activities]
                                            }));
                                        }}
                                        className="px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition"
                                    >
                                        {filters.activities.length === availableOptions.activities.length ? translations.deselectAll : translations.selectAll}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {availableOptions.activities.map(activity => (
                                        <button
                                            key={activity}
                                            onClick={() => handleFilterChange('activities', activity)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                                                filters.activities.includes(activity)
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
                                            }`}
                                        >
                                            {activity}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                            >
                                {translations.resetFilters}
                            </button>
                            <button
                                onClick={shuffleVocab}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                                🔀 {translations.shuffleData}
                            </button>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {translations.close}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Content Area (scrollable on mobile, leaves space for fixed footer) */}
                <div className="flex-1 overflow-y-auto pb-24 sm:pb-0">
                    {/* Study Card */}
                    <div className="max-w-2xl mx-auto">
                    {studyMode === 'flipcard' ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[400px]">
                            <div 
                                className="cursor-pointer"
                                onClick={handleFlip}
                            >
                                {!isFlipped ? (
                                    // Front side - Japanese word
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                                {currentItem.section} - 課{currentItem.lesson} - 活動{currentItem.activity}
                                            </span>
                                        </div>
                                        
                                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-6" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                                            {currentItem.word}
                                        </h2>
                                        
                                        {(displayMode === 'kana' || displayMode === 'both') && (
                                            <div className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                                                {currentItem.reading}
                                            </div>
                                        )}
                                        
                                        {(displayMode === 'romanji' || displayMode === 'both') && (
                                            <div className="text-lg sm:text-xl text-gray-500 dark:text-gray-500 mb-4">
                                                {currentItem.romanji}
                                            </div>
                                        )}
                                        
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                                            クリックして意味を見る
                                        </div>
                                    </div>
                                ) : (
                                    // Back side - English meaning
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                                                {currentItem.partOfSpeech}
                                            </span>
                                        </div>
                                        
                                        <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-6">
                                            {currentItem.english}
                                        </h2>
                                        
                                        <div className="text-lg text-gray-600 dark:text-gray-400 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                                            {currentItem.word} ({currentItem.reading})
                                        </div>
                                        
                                        {currentItem.accent && (
                                            <div className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                                                アクセント: {currentItem.accent}
                                            </div>
                                        )}
                                        
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-8">
                                            クリックして戻る
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Multiple Choice Mode
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="mb-4">
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                        {currentItem.section} - 課{currentItem.lesson} - 活動{currentItem.activity}
                                    </span>
                                </div>
                                
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-6" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                                    {currentItem.word}
                                </h2>
                                
                                {(displayMode === 'kana' || displayMode === 'both') && (
                                    <div className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-4" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
                                        {currentItem.reading}
                                    </div>
                                )}
                                
                                {(displayMode === 'romanji' || displayMode === 'both') && (
                                    <div className="text-lg sm:text-xl text-gray-500 dark:text-gray-500 mb-4">
                                        {currentItem.romanji}
                                    </div>
                                )}
                                
                                <p className="text-gray-600 dark:text-gray-400 mb-8">
                                    正しい意味を選んでください
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {multipleChoiceOptions.map((option, index) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === currentItem.english;
                                    const showColor = showResult && (isSelected || isCorrect);
                                    
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !showResult && handleAnswerSelect(option)}
                                            disabled={showResult}
                                            className={`p-4 rounded-lg text-left font-medium transition-all relative ${
                                                showColor
                                                    ? isCorrect
                                                        ? 'bg-green-100 dark:bg-green-900 border-2 border-green-500 text-green-800 dark:text-green-200'
                                                        : isSelected
                                                        ? 'bg-red-100 dark:bg-red-900 border-2 border-red-500 text-red-800 dark:text-red-200'
                                                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                                                    : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-300 dark:hover:border-blue-600'
                                            }`}
                                        >
                                            <span className="inline-block w-8 h-8 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-center leading-8 text-sm font-bold mr-3">
                                                {index + 1}
                                            </span>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {showResult && (
                                <div className="mt-6 text-center">
                                    <div className={`text-lg font-bold mb-2 ${
                                        selectedAnswer === currentItem.english 
                                            ? 'text-green-600 dark:text-green-400' 
                                            : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {selectedAnswer === currentItem.english ? '正解！' : '不正解'}
                                    </div>
                                    {currentItem.partOfSpeech && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            品詞: {currentItem.partOfSpeech}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                        {/* Navigation (desktop/tablet) */}
                        <div className="hidden sm:flex justify-between items-center mt-6">
                            <button
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                ← 前
                            </button>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {currentIndex + 1} / {filteredVocab.length}
                            </div>
                            
                            <button
                                onClick={handleNext}
                                disabled={currentIndex === filteredVocab.length - 1}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                次 →
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Fixed Footer Navigation */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 border-t border-gray-200 dark:border-gray-700 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← 前
                        </button>
                        <div className="w-28 text-center text-sm text-gray-600 dark:text-gray-300">
                            {currentIndex + 1} / {filteredVocab.length}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === filteredVocab.length - 1}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            次 →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}