import React from 'react';
import Head from 'next/head';
import path from 'path';
import fs from 'fs';
import InstallPrompt from '@/components/InstallPrompt';
import N5HomeClient from './N5HomeClient';

export default function HomePage() {
    // Read vocabulary data to determine initial pagination count
    const dataDir = path.join(process.cwd(), 'src', 'data');
    let initialTotalPages = 0;
    const defaultVocabularyPerPage = 20; // Default vocabulary items per page
    
    try {
        const vocabFilePath = path.join(dataDir, 'vocabulary', 'n5.json');
        const vocabContent = fs.readFileSync(vocabFilePath, 'utf-8');
        const vocabData = JSON.parse(vocabContent);
        initialTotalPages = Math.ceil(vocabData.length / defaultVocabularyPerPage);
    } catch {
        // fallback: set to 0 if can't read
        initialTotalPages = 0;
    }

    return (
        <>
            <Head>
                <title>Study Japan Journey - JLPT N5</title>
                <meta name="description" content="Landing page belajar JLPT N5 dengan pengaturan items per halaman" />
            </Head>
            
            <N5HomeClient initialTotalPages={initialTotalPages} />
            
            <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
                &copy; {new Date().getFullYear()} Study Japan Journey
            </footer>
            <InstallPrompt />
        </>
    );
}