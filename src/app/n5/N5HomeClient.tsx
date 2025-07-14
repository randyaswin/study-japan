"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface N5HomeClientProps {
    initialTotalPages: number;
}

interface Settings {
    kanjiPerPage: number;
    vocabularyPerPage: number;
    grammarPerPage: number;
}

const defaultSettings: Settings = {
    kanjiPerPage: 5,
    vocabularyPerPage: 20,
    grammarPerPage: 3
};

export default function N5HomeClient({ initialTotalPages }: N5HomeClientProps) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [totalPages, setTotalPages] = useState(initialTotalPages);

    // Load settings from localStorage on component mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('n5-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(parsed);
                // Recalculate total pages based on saved settings
                calculateTotalPages(parsed);
            } catch (error) {
                console.error('Error parsing saved settings:', error);
            }
        }
    }, []);

    // Save settings to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('n5-settings', JSON.stringify(settings));
        calculateTotalPages(settings);
    }, [settings]);

    const calculateTotalPages = async (currentSettings: Settings) => {
        try {
            // We'll calculate based on vocabulary as it's the longest array
            // In a real implementation, you'd want to fetch the actual data lengths
            // For now, we'll use the vocabulary length as the primary determinant
            const vocabularyCount = 452; // This should ideally come from the server
            const newTotalPages = Math.ceil(vocabularyCount / currentSettings.vocabularyPerPage);
            setTotalPages(newTotalPages);
        } catch (error) {
            console.error('Error calculating total pages:', error);
        }
    };

    const handleSettingChange = (key: keyof Settings, value: number) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    const createPageUrl = (pageNumber: string) => {
        const params = new URLSearchParams();
        params.set('kanjiPerPage', settings.kanjiPerPage.toString());
        params.set('vocabularyPerPage', settings.vocabularyPerPage.toString());
        params.set('grammarPerPage', settings.grammarPerPage.toString());
        return `/n5/${pageNumber}?${params.toString()}`;
    };

    // Generate page numbers array
    const pages = Array.from({ length: totalPages }, (_, i) => (i + 1).toString());

    return (
        <div className="bg-gradient-to-br from-orange-100 via-blue-100 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen flex flex-col">
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center drop-shadow">Study Japan Journey</h1>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">Selamat datang di Belajar JLPT N5! Pilih halaman untuk mulai belajar kanji, kosakata, dan tata bahasa dengan visualisasi dan contoh kalimat lengkap.</p>
                
                {/* Settings Panel */}
                <div className="mb-6 w-full max-w-md">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
                    >
                        <span>⚙️</span>
                        <span>Pengaturan Items per Halaman</span>
                        <span className={`transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {isSettingsOpen && (
                        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                            <div className="space-y-4">
                                {/* Kanji Setting */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <span className="text-orange-500">🟠</span>
                                        Kanji per halaman:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={settings.kanjiPerPage}
                                        onChange={(e) => handleSettingChange('kanjiPerPage', parseInt(e.target.value) || 1)}
                                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                
                                {/* Vocabulary Setting */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <span className="text-blue-500">🔵</span>
                                        Kosakata per halaman:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={settings.vocabularyPerPage}
                                        onChange={(e) => handleSettingChange('vocabularyPerPage', parseInt(e.target.value) || 1)}
                                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                
                                {/* Grammar Setting */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <span className="text-yellow-500">🟡</span>
                                        Grammar per halaman:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settings.grammarPerPage}
                                        onChange={(e) => handleSettingChange('grammarPerPage', parseInt(e.target.value) || 1)}
                                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={resetSettings}
                                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                                >
                                    Reset Default
                                </button>
                                <div className="flex-1 text-right">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Total: {totalPages} halaman
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* back to home */}
                <Link href="/">
                    <span className="inline-flex items-center gap-2 my-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                        <span>←</span> Back to Home
                    </span> 
                </Link>
                
                <div className="flex flex-wrap gap-6 justify-center">
                    {pages.length === 0 ? (
                        <div className="text-gray-500 dark:text-gray-400">Belum ada data tersedia.</div>
                    ) : (
                        pages
                            .slice()
                            .sort((a: string, b: string) => Number(a) - Number(b))
                            .map((page: string) => (
                                <Link
                                    key={page}
                                    href={createPageUrl(page)}
                                    className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg px-8 py-6 min-w-[160px] text-center border-4 border-orange-200 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    <span className="block text-2xl font-bold text-orange-500 dark:text-orange-400 mb-2">Page {page}</span>
                                    <span className="text-gray-700 dark:text-gray-300 text-sm">JLPT N5</span>
                                </Link>
                            ))
                    )}
                </div>
            </main>
        </div>
    );
}
