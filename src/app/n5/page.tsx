import React from 'react';
import Head from 'next/head';
import path from 'path';
import fs from 'fs';
import InstallPrompt from '@/components/InstallPrompt';
import N5HomeClient from './N5HomeClient';

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
    short_explanation?: string;
    explanation: string;
    visual?: string;
    visualLabels?: GrammarVisualLabel[];
    examples: ExampleObj[];
}

export default function HomePage() {
    // Load all data files
    const dataDir = path.join(process.cwd(), 'src', 'data');
    let kanjiData: KanjiItem[] = [];
    let vocabData: VocabItem[] = [];
    let grammarData: GrammarItem[] = [];
    
    try {
        // Load kanji data
        const kanjiFilePath = path.join(dataDir, 'kanji', 'n5.json');
        const kanjiContent = fs.readFileSync(kanjiFilePath, 'utf-8');
        kanjiData = JSON.parse(kanjiContent);
        
        // Load vocabulary data
        const vocabFilePath = path.join(dataDir, 'vocabulary', 'n5.json');
        const vocabContent = fs.readFileSync(vocabFilePath, 'utf-8');
        vocabData = JSON.parse(vocabContent);
        
        // Load grammar data
        const grammarFilePath = path.join(dataDir, 'grammar', 'n5.json');
        const grammarContent = fs.readFileSync(grammarFilePath, 'utf-8');
        grammarData = JSON.parse(grammarContent);
    } catch (error) {
        console.error('Error loading N5 data:', error);
        // Set fallback values if data loading fails
        kanjiData = [];
        vocabData = [];
        grammarData = [];
    }

    return (
        <>
            <Head>
                <title>Study Japan Journey - JLPT N5</title>
                <meta name="description" content="Landing page belajar JLPT N5 dengan pengaturan items per halaman" />
            </Head>
            
            <N5HomeClient 
                kanjiData={kanjiData}
                vocabData={vocabData}
                grammarData={grammarData}
            />
            
            <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
                &copy; {new Date().getFullYear()} M. Randy Aswin
            </footer>
            <InstallPrompt />
        </>
    );
}