import React from 'react';
import Head from 'next/head';
import { notFound } from 'next/navigation';
import path from 'path';
import fs from 'fs';
import DailySprintClient from './DailySprintClient';

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
    kanjiNote?: string;
    vocabNote?: string;
    grammarNote?: string;
}

export async function generateStaticParams() {
    // Generate pages based on vocabulary count with default settings (20 items per page)
    // We'll generate enough pages to cover various settings scenarios
    const dataDir = path.join(process.cwd(), 'src', 'data');
    
    try {
        const vocabFilePath = path.join(dataDir, 'vocabulary', 'n5.json');
        const vocabContent = fs.readFileSync(vocabFilePath, 'utf-8');
        const vocabData = JSON.parse(vocabContent);
        
        // Calculate maximum possible pages (if user sets vocabulary to 1 per page)
        const maxPossiblePages = Math.ceil(vocabData.length / 1);
        
        // Generate static params for all possible pages
        return Array.from({ length: maxPossiblePages }, (_, i) => ({ day: (i + 1).toString() }));
    } catch {
        return [];
    }
}

export default async function DailySprintPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ day: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { day } = await params;
    const search = await searchParams;
    const pageNumber = Number(day);
    
    // Get items per page from search params or use defaults
    const kanjiPerPage = Number(search.kanjiPerPage) || 5;
    const vocabularyPerPage = Number(search.vocabularyPerPage) || 20;
    const grammarPerPage = Number(search.grammarPerPage) || 3;
    
    // Load all three data files
    let kanjiData: KanjiItem[] = [];
    let vocabData: VocabItem[] = [];
    let grammarData: GrammarItem[] = [];
    
    try {
        const dataDir = path.join(process.cwd(), 'src', 'data');
        
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
        
    } catch {
        notFound();
    }
    
    // Calculate pagination based on vocabulary (the longest array)
    const totalPages = Math.ceil(vocabData.length / vocabularyPerPage);
    
    if (pageNumber < 1 || pageNumber > totalPages) {
        notFound();
    }
    
    // Get paginated data for each section based on their respective settings
    const kanjiStartIndex = (pageNumber - 1) * kanjiPerPage;
    const kanjiEndIndex = kanjiStartIndex + kanjiPerPage;
    const paginatedKanji = kanjiData.slice(kanjiStartIndex, kanjiEndIndex);
    
    const vocabularyStartIndex = (pageNumber - 1) * vocabularyPerPage;
    const vocabularyEndIndex = vocabularyStartIndex + vocabularyPerPage;
    const paginatedVocab = vocabData.slice(vocabularyStartIndex, vocabularyEndIndex);
    
    const grammarStartIndex = (pageNumber - 1) * grammarPerPage;
    const grammarEndIndex = grammarStartIndex + grammarPerPage;
    const paginatedGrammar = grammarData.slice(grammarStartIndex, grammarEndIndex);
    
    // Create sprint data with paginated content
    const sprintData: SprintData = {
        day: pageNumber,
        type: "N5",
        kanji: paginatedKanji,
        vocabulary: paginatedVocab,
        grammar: paginatedGrammar
    };
    
    // Extract meanings from full datasets for multiple choice options (lightweight approach)
    const allKanjiMeanings = kanjiData.map(item => item.arti);
    const allVocabMeanings = vocabData.map(item => {
        const match = item.reading_meaning.match(/\((.*)\)/);
        return match ? match[1] : '';
    }).filter(meaning => meaning); // Remove empty meanings
    
    // Generate available pages for navigation based on vocabulary count
    const availableDays = Array.from({ length: totalPages }, (_, i) => i + 1);
    
    // Pass settings to client component
    const settings = {
        kanjiPerPage,
        vocabularyPerPage,
        grammarPerPage
    };

    return (
        <>
            <Head>
                <title>Belajar JLPT N5: Halaman {sprintData.day}</title>
                <meta name="description" content={`Materi belajar Jepang JLPT N5 halaman ke-${sprintData.day}`} />
            </Head>

            <DailySprintClient 
                sprintData={sprintData} 
                day={day} 
                availableDays={availableDays}
                settings={settings}
                allKanjiMeanings={allKanjiMeanings}
                allVocabMeanings={allVocabMeanings}
            />
        </>
    );
}