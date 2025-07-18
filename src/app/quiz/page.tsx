"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuiz } from '../../lib/StudyContext';
import { ChevronLeftIcon, PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

// Types for quiz data structure
interface QuizQuestion {
    question: string;
    options: string[];
    correct: string;
    image_url?: string | null;
    audio_url?: string | null;
    image_file?: string | null;
    audio_file?: string | null;
}

interface QuizQuestionGroup {
    instruction: string;
    audio_url?: string | null;
    audio_file?: string | null;
    questions: QuizQuestion[];
}

interface QuizData {
    title: string;
    url: string;
    section: string;
    type: string;
    level: string;
    year: string;
    questions: QuizQuestionGroup[];
}

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export default function QuizPage() {
    console.log('QuizPage component rendering...');
    const { quiz, setQuizLevel, setQuizYear, setQuizAnswer, setQuizResults, resetQuizState, setQuizLoading } = useQuiz();
    const [quizData, setQuizData] = useState<QuizData[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [allQuizzes, setAllQuizzes] = useState<QuizData[]>([]);
    const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
    const [quizStarted, setQuizStarted] = useState<boolean>(false);

    // Check browser audio format support
    const checkAudioSupport = useCallback(() => {
        const audio = document.createElement('audio');
        const formats = {
            mp3: audio.canPlayType('audio/mpeg'),
            mp4: audio.canPlayType('audio/mp4'),
            wav: audio.canPlayType('audio/wav'),
            ogg: audio.canPlayType('audio/ogg')
        };
        console.log('🔊 Browser audio format support:', formats);
        return formats;
    }, []);

    // Load quiz data when level is selected
    useEffect(() => {
        if (quiz.selectedLevel) {
            setQuizLoading(true);
            import(`@/data/quiz/quizzes_${quiz.selectedLevel}.json`)
                .then((data) => {
                    setQuizData(data.default);
                    // Extract unique years
                    const years = [...new Set(data.default.map((q: QuizData) => q.year))].sort() as string[];
                    setAvailableYears(years);
                    setQuizLoading(false);
                })
                .catch((error) => {
                    console.error('Error loading quiz data:', error);
                    setQuizLoading(false, 'Failed to load quiz data');
                });
        }
    }, [quiz.selectedLevel, setQuizLoading]);

    // Filter and combine all sections when year is selected
    useEffect(() => {
        if (quiz.selectedYear && quizData.length > 0) {
            const yearQuizzes = quizData.filter(q => q.year === quiz.selectedYear);
            setAllQuizzes(yearQuizzes);
        }
    }, [quiz.selectedYear, quizData]);

    const calculateScore = useCallback(() => {
        if (!allQuizzes.length) return;

        let correct = 0;
        let total = 0;
        const sectionScores: { [key: string]: { correct: number; total: number } } = {};        allQuizzes.forEach((quizSet, quizIndex) => {
            const sectionName = getSectionType(quizSet.section);
            if (!sectionScores[sectionName]) {
                sectionScores[sectionName] = { correct: 0, total: 0 };
            }

            quizSet.questions.forEach((group, groupIndex) => {
                group.questions.forEach((question, questionIndex) => {
                    const questionKey = `${quizIndex}-${groupIndex}-${questionIndex}`;
                    const userAnswer = quiz.answers[questionKey];
                    if (userAnswer === question.correct) {
                        correct++;
                        sectionScores[sectionName].correct++;
                    }
                    total++;
                    sectionScores[sectionName].total++;
                });
            });
        });

        setIsTimerActive(false);
        setQuizResults(true, correct, total);
        
        // Store section scores for detailed results
        localStorage.setItem('jlpt-section-scores', JSON.stringify(sectionScores));
    }, [allQuizzes, quiz.answers, setQuizResults]);

    const getSectionType = (section: string) => {
        if (section.includes('Letters') || section.includes('Vocabulary') || section.includes('文字語彙')) {
            return 'vocabulary';
        } else if (section.includes('Grammar') || section.includes('Reading') || section.includes('文法') || section.includes('読解')) {
            return 'grammar';
        } else if (section.includes('Listening') || section.includes('聴解')) {
            return 'listening';
        }
        return 'other';
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerActive && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(time => {
                    if (time <= 1) {
                        setIsTimerActive(false);
                        calculateScore();
                        return 0;
                    }
                    return time - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, calculateScore]); // Add calculateScore to dependencies

    // Cleanup audio when component unmounts or audio changes
    useEffect(() => {
        return () => {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
        };
    }, [currentAudio]);

    const getTimeLimit = (level: string) => {
        // Real JLPT time limits in minutes
        switch (level) {
            case 'N1': return 170; // 2h 50min total
            case 'N2': return 155; // 2h 35min total  
            case 'N3': return 140; // 2h 20min total
            case 'N4': return 125; // 2h 5min total
            case 'N5': return 105; // 1h 45min total
            default: return 120;
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const startQuiz = () => {
        const timeLimit = getTimeLimit(quiz.selectedLevel!) * 60; // Convert to seconds
        setTimeRemaining(timeLimit);
        setIsTimerActive(true);
        setQuizStarted(true);
    };

    const handleLevelSelect = (level: typeof JLPT_LEVELS[number] | null) => {
        // Stop any playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        setAudioPlaying(null);
        setCurrentAudio(null);
        
        resetQuizState();
        setAllQuizzes([]);
        setQuizData([]);
        setAvailableYears([]);
        setTimeRemaining(0);
        setIsTimerActive(false);
        setQuizStarted(false);
        if (level) {
            setQuizLevel(level);
        }
    };

    const handleYearSelect = (year: string) => {
        setQuizYear(year);
    };

    const backToYearSelect = () => {
        // Stop any playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        setAudioPlaying(null);
        setCurrentAudio(null);
        
        setQuizYear(null);
        setQuizStarted(false);
        setIsTimerActive(false);
        setTimeRemaining(0);
    };

    const handleAnswerSelect = (quizIndex: number, questionGroupIndex: number, questionIndex: number, answer: string) => {
        const questionKey = `${quizIndex}-${questionGroupIndex}-${questionIndex}`;
        setQuizAnswer(questionKey, answer);
    };

    const playAudio = (audioFile: string) => {
        console.log('🔊 Attempting to play audio:', audioFile);
        console.log('🔊 Full audio path:', `/${audioFile}`);
        
        // Check browser audio support
        const audioSupport = checkAudioSupport();
        
        // If clicking on the same audio that's currently playing, stop it
        if (audioPlaying === audioFile && currentAudio) {
            console.log('🔊 Stopping current audio:', audioFile);
            currentAudio.pause();
            currentAudio.currentTime = 0;
            setAudioPlaying(null);
            setCurrentAudio(null);
            return;
        }
        
        // Stop any currently playing audio
        if (currentAudio) {
            console.log('🔊 Stopping previous audio');
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        setAudioPlaying(audioFile);
        const audio = new Audio();
        
        // Set up audio source with proper MIME type
        const fileExtension = audioFile.split('.').pop()?.toLowerCase();
        let mimeType = '';
        let canPlay = '';
        
        switch (fileExtension) {
            case 'mp3':
                mimeType = 'audio/mpeg';
                canPlay = audioSupport.mp3;
                break;
            case 'mp4':
                mimeType = 'audio/mp4';
                canPlay = audioSupport.mp4;
                break;
            case 'mpeg':
                mimeType = 'audio/mpeg';
                canPlay = audioSupport.mp3;
                break;
            case 'wav':
                mimeType = 'audio/wav';
                canPlay = audioSupport.wav;
                break;
            case 'ogg':
                mimeType = 'audio/ogg';
                canPlay = audioSupport.ogg;
                break;
            default:
                mimeType = 'audio/*';
                canPlay = 'maybe';
        }
        
        console.log('🔊 Audio format detected:', fileExtension, 'MIME type:', mimeType, 'Can play:', canPlay);
        
        if (canPlay === '') {
            console.warn('⚠️ Browser may not support this audio format:', fileExtension);
        }
        
        audio.src = `/${audioFile}`;
        if (mimeType) {
            audio.setAttribute('type', mimeType);
        }
        
        setCurrentAudio(audio);
        
        audio.onloadstart = () => console.log('🔊 Audio load started:', audioFile);
        audio.oncanplay = () => console.log('✅ Audio can play:', audioFile);
        audio.oncanplaythrough = () => console.log('✅ Audio can play through:', audioFile);
        audio.onended = () => {
            console.log('🔊 Audio ended:', audioFile);
            setAudioPlaying(null);
            setCurrentAudio(null);
        };
        audio.onerror = (e) => {
            console.error('❌ Audio error:', audioFile, e);
            console.error('❌ Audio error details:', {
                error: e,
                networkState: audio.networkState,
                readyState: audio.readyState,
                src: audio.src,
                currentSrc: audio.currentSrc
            });
            setAudioPlaying(null);
            setCurrentAudio(null);
        };
        
        // Set audio properties for better compatibility
        audio.preload = 'metadata';
        audio.crossOrigin = 'anonymous';
        
        audio.play().catch((error) => {
            console.error('❌ Audio play failed:', audioFile, error);
            console.error('❌ Play error details:', {
                name: error.name,
                message: error.message,
                code: error.code,
                canPlayType: canPlay
            });
            setAudioPlaying(null);
            setCurrentAudio(null);
        });
    };

    const getJLPTGrade = (percentage: number, level: string) => {
        // JLPT passing criteria (approximate)
        const passingScores: { [key: string]: number } = {
            'N1': 60, // 100/180 points minimum
            'N2': 60, // 90/180 points minimum  
            'N3': 60, // 95/180 points minimum
            'N4': 60, // 90/180 points minimum
            'N5': 60  // 80/180 points minimum
        };
        
        const passing = passingScores[level] || 60;
        
        if (percentage >= passing) {
            if (percentage >= 90) return { grade: 'A', status: 'Excellent', color: 'text-green-600' };
            if (percentage >= 80) return { grade: 'B', status: 'Very Good', color: 'text-blue-600' };
            if (percentage >= 70) return { grade: 'C', status: 'Good', color: 'text-yellow-600' };
            return { grade: 'D', status: 'Pass', color: 'text-orange-600' };
        } else {
            return { grade: 'F', status: 'Fail', color: 'text-red-600' };
        }
    };

    const resetQuiz = () => {
        // Stop any playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        setAudioPlaying(null);
        setCurrentAudio(null);
        
        resetQuizState();
        setAllQuizzes([]);
        setQuizData([]);
        setAvailableYears([]);
        setTimeRemaining(0);
        setIsTimerActive(false);
        setQuizStarted(false);
        localStorage.removeItem('jlpt-section-scores');
    };

    if (quiz.isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading quiz data...</p>
                </div>
            </div>
        );
    }

    if (quiz.error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{quiz.error}</p>
                    <button
                        onClick={resetQuiz}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            <span>Home</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                            JLPT Quiz Simulator
                        </h1>
                    </div>
                    {(quiz.selectedLevel && quiz.selectedYear) && (
                        <div className="flex items-center gap-4">
                            {isTimerActive && (
                                <div className={`text-lg font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    ⏱️ {formatTime(timeRemaining)}
                                </div>
                            )}
                            <button
                                onClick={resetQuiz}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Level Selection */}
                {!quiz.selectedLevel && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">
                            Select JLPT Level
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {JLPT_LEVELS.map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handleLevelSelect(level)}
                                    className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-center"
                                >
                                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                        JLPT {level}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {level === 'N5' && 'Beginner'}
                                        {level === 'N4' && 'Elementary'}
                                        {level === 'N3' && 'Intermediate'}
                                        {level === 'N2' && 'Upper Intermediate'}
                                        {level === 'N1' && 'Advanced'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Year Selection */}
                {quiz.selectedLevel && !quiz.selectedYear && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => handleLevelSelect(null)}
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                                <span>Back to Level Select</span>
                            </button>
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                Select Year for JLPT {quiz.selectedLevel}
                            </h2>
                            <div></div> {/* Spacer for center alignment */}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => handleYearSelect(year)}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-center"
                                >
                                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                        {year}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quiz Start Screen */}
                {quiz.selectedLevel && quiz.selectedYear && !quizStarted && !quiz.showResults && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={backToYearSelect}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                    <span>Back to Year Select</span>
                                </button>
                                <button
                                    onClick={() => handleLevelSelect(null)}
                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                    <span>Back to Level Select</span>
                                </button>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                                JLPT {quiz.selectedLevel} - Year {quiz.selectedYear}
                            </h2>
                            <div className="mb-6">
                                <div className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                                    This quiz includes all three sections:
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
                                        <div className="font-semibold text-blue-600 dark:text-blue-300">Letters & Vocabulary</div>
                                        <div className="text-sm text-blue-500 dark:text-blue-400">文字語彙</div>
                                    </div>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-600">
                                        <div className="font-semibold text-green-600 dark:text-green-300">Grammar & Reading</div>
                                        <div className="text-sm text-green-500 dark:text-green-400">文法・読解</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-600">
                                        <div className="font-semibold text-purple-600 dark:text-purple-300">Listening</div>
                                        <div className="text-sm text-purple-500 dark:text-purple-400">聴解</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Time Limit: {getTimeLimit(quiz.selectedLevel)} minutes
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Questions: {allQuizzes.reduce((total, quiz) => total + quiz.questions.reduce((subTotal, group) => subTotal + group.questions.length, 0), 0)}
                                </div>
                            </div>
                            <div className="text-center">
                                <button
                                    onClick={startQuiz}
                                    className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
                                >
                                    Start Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quiz Content */}
                {quizStarted && !quiz.showResults && allQuizzes.length > 0 && (
                    <div className="max-w-6xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={backToYearSelect}
                                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                        <span>Back to Year Select</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLevelSelect(null);
                                            setIsTimerActive(false);
                                        }}
                                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                        <span>Back to Level Select</span>
                                    </button>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                                        JLPT {quiz.selectedLevel} - Year {quiz.selectedYear}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {formatTime(timeRemaining)}
                                    </div>
                                    <div className="text-sm text-gray-500">Time Remaining</div>
                                </div>
                            </div>

                            {allQuizzes.map((quizSet, quizIndex) => (
                                <div key={quizIndex} className="mb-8">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                            {quizSet.title}
                                        </h3>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            Section: {quizSet.section}
                                        </div>
                                    </div>

                                    {quizSet.questions.map((group, groupIndex) => (
                                        <div key={groupIndex} className="mb-8 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <div 
                                                            className="text-gray-700 dark:text-gray-200 mb-2"
                                                            dangerouslySetInnerHTML={{ __html: group.instruction }}
                                                        />
                                                    </div>
                                                    {group.audio_file && (
                                                        <button
                                                            onClick={() => playAudio(group.audio_file!)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                            title={audioPlaying === group.audio_file ? "Stop Audio" : "Play Audio"}
                                                        >
                                                            {audioPlaying === group.audio_file ? (
                                                                <PauseIcon className="w-4 h-4" />
                                                            ) : (
                                                                <PlayIcon className="w-4 h-4" />
                                                            )}
                                                            <SpeakerWaveIcon className="w-4 h-4" />
                                                            <span className="text-sm">
                                                                {audioPlaying === group.audio_file ? "Stop" : "Play"}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {group.questions.map((question, questionIndex) => {
                                                const questionKey = `${quizIndex}-${groupIndex}-${questionIndex}`;
                                                const selectedAnswer = quiz.answers[questionKey];

                                                return (
                                                    <div key={questionIndex} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                        <div className="flex items-start gap-4 mb-4">
                                                            <div className="flex-1">
                                                                <div 
                                                                    className="text-gray-800 dark:text-gray-100 font-medium mb-3"
                                                                    dangerouslySetInnerHTML={{ __html: question.question }}
                                                                />
                                                            </div>
                                                            {question.audio_file && (
                                                                <button
                                                                    onClick={() => playAudio(question.audio_file!)}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                                    title={audioPlaying === question.audio_file ? "Stop Audio" : "Play Audio"}
                                                                >
                                                                    {audioPlaying === question.audio_file ? (
                                                                        <PauseIcon className="w-4 h-4" />
                                                                    ) : (
                                                                        <PlayIcon className="w-4 h-4" />
                                                                    )}
                                                                    <SpeakerWaveIcon className="w-4 h-4" />
                                                                    <span className="text-sm">
                                                                        {audioPlaying === question.audio_file ? "Stop" : "Play"}
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {question.image_file && (
                                                            <div className="mb-4">
                                                                <img 
                                                                    src={`/${question.image_file}`}
                                                                    alt="Quiz question"
                                                                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                                                                    onError={(e) => {
                                                                        // Don't hide the image, show a placeholder instead
                                                                        e.currentTarget.style.display = 'block';
                                                                        e.currentTarget.style.border = '2px solid red';
                                                                        e.currentTarget.alt = `Failed to load: ${question.image_file}`;
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            {question.options.map((option, optionIndex) => {
                                                                const optionNumber = (optionIndex + 1).toString();
                                                                const isSelected = selectedAnswer === optionNumber;

                                                                return (
                                                                    <button
                                                                        key={optionIndex}
                                                                        onClick={() => handleAnswerSelect(quizIndex, groupIndex, questionIndex, optionNumber)}
                                                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                                            isSelected
                                                                                ? 'border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                                                        }`}
                                                                    >
                                                                        <span className="text-gray-800 dark:text-gray-100">
                                                                            {option}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    onClick={calculateScore}
                                    className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
                                >
                                    Submit Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {quiz.showResults && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
                                JLPT {quiz.selectedLevel} Results
                            </h2>
                            
                            {(() => {
                                const percentage = Math.round((quiz.score / quiz.totalQuestions) * 100);
                                const gradeInfo = getJLPTGrade(percentage, quiz.selectedLevel!);
                                const sectionScores = JSON.parse(localStorage.getItem('jlpt-section-scores') || '{}');
                                
                                return (
                                    <>
                                        <div className="text-center mb-8">
                                            <div className={`text-6xl font-bold mb-4 ${gradeInfo.color}`}>
                                                {percentage}%
                                            </div>
                                            <div className={`text-2xl font-semibold mb-2 ${gradeInfo.color}`}>
                                                Grade: {gradeInfo.grade} - {gradeInfo.status}
                                            </div>
                                            <div className="text-xl text-gray-600 dark:text-gray-300">
                                                {quiz.score} out of {quiz.totalQuestions} questions correct
                                            </div>
                                        </div>

                                        {/* Section Breakdown */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                            {Object.entries(sectionScores).map(([section, scores]: [string, any]) => {
                                                const sectionPercentage = Math.round((scores.correct / scores.total) * 100);
                                                const sectionGrade = getJLPTGrade(sectionPercentage, quiz.selectedLevel!);
                                                
                                                return (
                                                    <div key={section} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                                            {section === 'vocabulary' && 'Letters & Vocabulary'}
                                                            {section === 'grammar' && 'Grammar & Reading'}
                                                            {section === 'listening' && 'Listening'}
                                                        </div>
                                                        <div className={`text-2xl font-bold ${sectionGrade.color}`}>
                                                            {sectionPercentage}%
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                                            {scores.correct}/{scores.total} correct
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="text-center space-x-4">
                                            <button
                                                onClick={() => handleYearSelect(quiz.selectedYear!)}
                                                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                Try Same Year Again
                                            </button>
                                            <button
                                                onClick={backToYearSelect}
                                                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                            >
                                                Try Different Year
                                            </button>
                                            <button
                                                onClick={() => handleLevelSelect(null)}
                                                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                            >
                                                Back to Level Select
                                            </button>
                                            <button
                                                onClick={resetQuiz}
                                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                            >
                                                Start Over
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
