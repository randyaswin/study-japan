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

    // Get available days for navigation
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const files = fs.readdirSync(dataDir);
    const availableDays = files
        .filter(f => f.startsWith('sprint_day') && f.endsWith('.json'))
        .map(f => {
            const match = f.match(/sprint_day(\d+)\.json/);
            return match ? Number(match[1]) : null;
        })
        .filter((day): day is number => day !== null)
        .sort((a, b) => a - b);

    return (
        <>
            <Head>
                <title>Belajar Harian: Hari {sprintData.day}</title>
                <meta name="description" content={`Materi belajar Jepang untuk hari ke-${sprintData.day}`} />
            </Head>

            <DailySprintClient 
                sprintData={sprintData} 
                day={day} 
                availableDays={availableDays}
            />
        </>
    );
}