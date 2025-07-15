import React from 'react';
import Link from 'next/link';
import KaiwaClient from './KaiwaClient';
import InstallPrompt from '@/components/InstallPrompt';

// Import conversation data from JSON files
import n5Data from '@/data/conversation/n5.json';
import n4Data from '@/data/conversation/n4.json';
import n3Data from '@/data/conversation/n3.json';

// Combine all conversations from different levels
const allConversations = [
  ...n5Data.conversations,
  ...n4Data.conversations,
  ...n3Data.conversations
];

export default function KaiwaPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto p-4 sm:p-8">
        {/* Back to Home navigation */}
        <div className="mb-6 flex justify-start">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <span>←</span> Back to Home
          </Link>
        </div>

        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100">会話 (Kaiwa) - Percakapan</h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-2">Pelajari percakapan bahasa Jepang sehari-hari dengan audio dan analisis frasa</p>
        </header>

        <KaiwaClient conversationData={allConversations} />
      </div>
      <InstallPrompt />
    </div>
  );
}
