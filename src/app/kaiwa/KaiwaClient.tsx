"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import Furigana from '@/components/Furigana';

interface ConversationLine {
  speaker: string;
  japanese: string;
  furigana: string;
  romaji: string;
  indonesian: string;
  notes: string;
}

interface KeyPhrase {
  phrase: string;
  reading: string;
  meaning: string;
  usage: string;
}

interface ConversationData {
  id: number;
  title: string;
  level: string;
  description: string;
  scenario: string;
  conversation: ConversationLine[];
  keyPhrases: KeyPhrase[];
}

interface KaiwaClientProps {
  conversationData: ConversationData[];
}


// Memoized conversation card component
const ConversationCard = React.memo<{
  conversation: ConversationData;
  isSelected: boolean;
  onClick: (id: number) => void;
}>(({ conversation, isSelected, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(conversation.id);
  }, [conversation.id, onClick]);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 touch-manipulation ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate flex-1 mr-2">
          {conversation.title}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
          conversation.level === 'N5' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
          conversation.level === 'N4' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
          conversation.level === 'N3' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
          conversation.level === 'N2' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
          conversation.level === 'N1' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
          'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
        }`}>
          {conversation.level}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {conversation.description}
      </p>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
        シナリオ: {conversation.scenario}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-blue-600 dark:text-blue-400">
          {conversation.conversation.length} lines
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {conversation.keyPhrases.length} key phrases
          </span>
        </div>
      </div>
    </div>
  );
});

ConversationCard.displayName = 'ConversationCard';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function KaiwaClient({ conversationData }: KaiwaClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const [showTranslation, setShowTranslation] = useState<{[key: number]: boolean}>({});
  const [showRomaji, setShowRomaji] = useState<{[key: number]: boolean}>({});
  const [autoPlay, setAutoPlay] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1.0);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isAudioSupported, setIsAudioSupported] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [conversationsPerPage] = useState<number>(isMobile ? 4 : 6); // Fewer on mobile
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized available levels
  const availableLevels = useMemo(() => 
    ['All', ...Array.from(new Set(conversationData.map(conv => conv.level)))],
    [conversationData]
  );

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    return conversationData.filter(conv => {
      const matchesLevel = selectedLevel === 'All' || conv.level === selectedLevel;
      const matchesSearch = debouncedSearchTerm === '' || 
        conv.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        conv.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        conv.scenario.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [conversationData, selectedLevel, debouncedSearchTerm]);

  // Memoized pagination logic
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredConversations.length / conversationsPerPage);
    const indexOfLastConversation = currentPage * conversationsPerPage;
    const indexOfFirstConversation = indexOfLastConversation - conversationsPerPage;
    const currentConversations = filteredConversations.slice(indexOfFirstConversation, indexOfLastConversation);
    
    return {
      totalPages,
      indexOfLastConversation,
      indexOfFirstConversation,
      currentConversations
    };
  }, [filteredConversations, currentPage, conversationsPerPage]);

  const { totalPages, indexOfLastConversation, indexOfFirstConversation, currentConversations } = paginationData;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, debouncedSearchTerm]);

  // Optimized callback functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedConversation(null);
    stopAudio();
  }, []);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const toggleTranslation = useCallback((lineIndex: number) => {
    setShowTranslation(prev => ({
      ...prev,
      [lineIndex]: !prev[lineIndex]
    }));
  }, []);

  const toggleRomaji = useCallback((lineIndex: number) => {
    setShowRomaji(prev => ({
      ...prev,
      [lineIndex]: !prev[lineIndex]
    }));
  }, []);

  const handleLevelChange = useCallback((level: string) => {
    setSelectedLevel(level);
    setSelectedConversation(null);
    stopAudio();
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setSearchTerm(e.target.value);
    setSelectedConversation(null);
    
    // Clear loading state after a short delay
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  const handleConversationSelect = useCallback((conversationId: number) => {
    setSelectedConversation(conversationId);
    setShowTranslation({});
    setShowRomaji({});
    stopAudio();
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedLevel('All');
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedConversation(null);
    stopAudio();
  }, []);

  // Optimized audio functions with useCallback
  const stopAudio = useCallback(() => {
    // Stop Speech Synthesis - with mobile compatibility
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // For mobile devices, sometimes we need to pause and resume to fully stop
      if (isMobile && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      }
    }
    
    // Clear timeout fallback
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setPlayingLine(null);
  }, [isMobile]);

  const playAudio = useCallback((text: string, lineIndex: number) => {
    // Stop any currently playing speech
    stopAudio();

    setPlayingLine(lineIndex);

    // Check if browser supports Speech Synthesis
    if ('speechSynthesis' in window) {
      // Android Chrome requires user interaction to start speech synthesis
      // We'll add a small delay to ensure proper initialization
      setTimeout(() => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set Japanese voice if available
        const voices = window.speechSynthesis.getVoices();
        let japaneseVoice = null;
        
        if (selectedVoice) {
          japaneseVoice = voices.find(voice => voice.name === selectedVoice);
        } else {
          // Use improved Japanese voice filtering logic
          japaneseVoice = voices.find(voice => {
            const lang = voice.lang.toLowerCase().replace(/[-_]/g, '');
            const name = voice.name.toLowerCase();
            
            // First check language codes (most reliable)
            if (lang === 'ja' || lang === 'jajp' || lang.startsWith('ja')) {
              return true;
            }
            
            // Then check for Japanese voice names
            const japaneseNames = [
              'japanese', 'japan', 'tomoko', 'kyoko', 'mizuki', 'haruka', 
              'sayaka', 'naoko', 'akane', 'nihongo', 'otoya', 'ichiro',
              'jp female', 'jp male', 'japanese female', 'japanese male'
            ];
            
            return japaneseNames.some(jpName => name.includes(jpName));
          });
        }
        
        if (japaneseVoice) {
          utterance.voice = japaneseVoice;
          console.log('Using Japanese voice:', japaneseVoice.name, japaneseVoice.lang);
        } else {
          console.warn('No Japanese voice found, using default voice');
        }
        
        // Set speech parameters - adjusted for mobile compatibility
        utterance.lang = 'ja-JP';
        utterance.rate = Math.max(0.5, Math.min(2.0, playSpeed)); // Clamp rate for mobile
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Handle speech events
        utterance.onend = () => {
          setPlayingLine(null);
          
          // Auto-play next line if autoPlay is enabled
          if (autoPlay && selectedConversation !== null) {
            const conversation = conversationData.find(c => c.id === selectedConversation);
            if (conversation && lineIndex < conversation.conversation.length - 1) {
              setTimeout(() => {
                playAudio(conversation.conversation[lineIndex + 1].japanese, lineIndex + 1);
              }, 800); // Increased delay for mobile
            }
          }
        };
        
        utterance.onerror = () => {
          setPlayingLine(null);
        };
        
        // For mobile devices, we need to ensure speech synthesis is ready
        if (isMobile) {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setTimeout(() => {
              window.speechSynthesis.speak(utterance);
            }, 100);
          } else {
            window.speechSynthesis.speak(utterance);
          }
        } else {
          window.speechSynthesis.speak(utterance);
        }
      }, isMobile ? 100 : 0);
    } else {
      // Fallback - simulate audio duration
      const duration = text.length * 100;
      
      timeoutRef.current = setTimeout(() => {
        setPlayingLine(null);
        
        if (autoPlay && selectedConversation !== null) {
          const conversation = conversationData.find(c => c.id === selectedConversation);
          if (conversation && lineIndex < conversation.conversation.length - 1) {
            setTimeout(() => {
              playAudio(conversation.conversation[lineIndex + 1].japanese, lineIndex + 1);
            }, 500);
          }
        }
      }, duration / playSpeed);
    }
  }, [isMobile, selectedVoice, playSpeed, autoPlay, selectedConversation, conversationData, stopAudio]);

  const playConversation = useCallback(() => {
    if (selectedConversation === null) return;
    
    const conversation = conversationData.find(c => c.id === selectedConversation);
    if (!conversation) return;

    playAudio(conversation.conversation[0].japanese, 0);
  }, [selectedConversation, conversationData, playAudio]);

  const pauseConversation = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    // Detect mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
    
    // Check audio support
    const isSupported = 'speechSynthesis' in window;
    setIsAudioSupported(isSupported);
    
    // Load voices when component mounts
    const loadVoices = () => {
      if (isSupported) {
        const voices = window.speechSynthesis.getVoices();
        
        // More comprehensive Japanese voice detection
        const japaneseVoices = voices.filter(v => {
          const lang = v.lang.toLowerCase().replace(/[-_]/g, '');
          const name = v.name.toLowerCase();
          
          // First check language codes (most reliable)
          if (lang === 'ja' || lang === 'jajp' || lang.startsWith('ja')) {
            return true;
          }
          
          // Then check for Japanese voice names
          const japaneseNames = [
            'japanese', 'japan', 'tomoko', 'kyoko', 'mizuki', 'haruka', 
            'sayaka', 'naoko', 'akane', 'nihongo', 'otoya', 'ichiro',
            'jp female', 'jp male', 'japanese female', 'japanese male'
          ];
          
          return japaneseNames.some(jpName => name.includes(jpName));
        });
        
        console.log('All available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
        console.log('Filtered Japanese voices:', japaneseVoices.map(v => ({ name: v.name, lang: v.lang })));
        
        // Additional debugging for voice filtering
        if (japaneseVoices.length === 0) {
          console.warn('No Japanese voices found. Available voices:', 
            voices.map(v => `${v.name} (${v.lang})`).join(', '));
        }
        
        setAvailableVoices(japaneseVoices);
        
        // Auto-select first Japanese voice if available
        if (japaneseVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(japaneseVoices[0].name);
        }
        
        // For mobile devices, try to initialize speech synthesis
        if (isMobileDevice && voices.length > 0) {
          // Create a dummy utterance to initialize the speech synthesis
          const initUtterance = new SpeechSynthesisUtterance('');
          initUtterance.volume = 0;
          window.speechSynthesis.speak(initUtterance);
          setTimeout(() => {
            window.speechSynthesis.cancel();
          }, 10);
        }
      }
    };
    
    // Load voices immediately
    loadVoices();
    
    // Also load voices when they change (some browsers load them asynchronously)
    if (isSupported) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup function
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array since we only need this on mount

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      {/* Filter Controls */}
      <div className="mb-6">
        {/* Audio Status for Mobile */}
        {isMobile && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-600 dark:text-blue-400">📱 Mobile Device Detected</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {isAudioSupported ? (
                availableVoices.length > 0 ? (
                  <span>✅ Audio ready - {availableVoices.length} Japanese voice(s) available</span>
                ) : (
                  <span>⚠️ Audio supported but no Japanese voices found</span>
                )
              ) : (
                <span>❌ Audio not supported in this browser - try Chrome or Firefox</span>
              )}
            </div>
            {/* Debug info - only show if no Japanese voices found */}
            {isAudioSupported && availableVoices.length === 0 && (
              <div className="text-xs text-blue-500 dark:text-blue-300 mt-2">
                <details>
                  <summary>Debug: Show all available voices ({window.speechSynthesis?.getVoices().length || 0} total)</summary>
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    {window.speechSynthesis?.getVoices().map((voice, i) => (
                      <div key={i} className="text-xs border-b border-blue-200 dark:border-blue-800 py-1">
                        <strong>{voice.name}</strong> ({voice.lang})
                        {voice.default && <span className="text-blue-600 ml-1">[Default]</span>}
                      </div>
                    )) || <div>No voices available</div>}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col gap-4 mb-4">
          {/* Level filters */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Level:</span>
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
              {availableLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all touch-manipulation min-h-[44px] ${
                    selectedLevel === level
                      ? level === 'N5' ? 'bg-green-500 text-white shadow-md' :
                        level === 'N4' ? 'bg-blue-500 text-white shadow-md' :
                        level === 'N3' ? 'bg-yellow-500 text-white shadow-md' :
                        level === 'N2' ? 'bg-orange-500 text-white shadow-md' :
                        level === 'N1' ? 'bg-red-500 text-white shadow-md' :
                        'bg-teal-500 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search:</span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border rounded-lg text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            />
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''} found
            {totalPages > 1 && ` • ${totalPages} pages`}
          </div>
        </div>
        
        {/* Statistics */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📊 Statistics</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs">
            {availableLevels.filter(level => level !== 'All').map(level => {
              const count = conversationData.filter(conv => conv.level === level).length;
              return (
                <div key={level} className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded-full ${
                    level === 'N5' ? 'bg-green-500' :
                    level === 'N4' ? 'bg-blue-500' :
                    level === 'N3' ? 'bg-yellow-500' :
                    level === 'N2' ? 'bg-orange-500' :
                    level === 'N1' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></span>
                  <span className="text-gray-600 dark:text-gray-400">{level}: {count}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Audio Instructions */}
        {isMobile && !isAudioSupported && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">📱 Mobile Audio Setup</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <p>To enable audio on your mobile device:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Use <strong>Chrome</strong> or <strong>Firefox</strong> browser</li>
                <li>Enable JavaScript in your browser settings</li>
                <li>Make sure your device volume is turned up</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Clear filters button */}
        {(selectedLevel !== 'All' || searchTerm !== '') && (
          <button
            onClick={clearFilters}
            className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1"
          >
            <span>✕</span> Clear filters
          </button>
        )}
      </div>

      {/* Conversation List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            No conversations found
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            Try adjusting your filters or search terms
          </div>
        </div>
      ) : (
        <>
          {/* Pagination Info */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {indexOfFirstConversation + 1}-{Math.min(indexOfLastConversation, filteredConversations.length)} of {filteredConversations.length} conversations
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {/* Conversation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: conversationsPerPage }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ))
            ) : (
              currentConversations.map((conversation) => (
                <ConversationCard
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation === conversation.id}
                  onClick={handleConversationSelect}
                />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              {/* Previous/Next buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation ${
                    currentPage === 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  ← Previous
                </button>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation ${
                    currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next →
                </button>
              </div>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  if (!showPage) {
                    // Show ellipsis
                    if (page === 2 && currentPage > 4) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 3) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors min-h-[44px] min-w-[44px] touch-manipulation ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Selected Conversation Detail */}
      {selectedConversation !== null && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          {(() => {
            const conversation = conversationData.find(c => c.id === selectedConversation);
            if (!conversation) return null;

            return (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{conversation.title}</h2>
                  
                  {/* Mobile-optimized controls */}
                  <div className="space-y-3">
                    {/* Auto Play and Speed - Mobile stacked */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Auto Play:</label>
                        <button
                          onClick={() => setAutoPlay(!autoPlay)}
                          className={`px-3 py-2 rounded text-sm font-semibold min-w-[60px] min-h-[44px] touch-manipulation ${
                            autoPlay
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {autoPlay ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Speed:</label>
                        <select
                          value={playSpeed}
                          onChange={(e) => setPlaySpeed(Number(e.target.value))}
                          className="px-3 py-2 border rounded text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 min-w-[80px] min-h-[44px]"
                        >
                          <option value={0.5}>0.5x</option>
                          <option value={0.75}>0.75x</option>
                          <option value={1.0}>1x</option>
                          <option value={1.25}>1.25x</option>
                          <option value={1.5}>1.5x</option>
                        </select>
                      </div>
                    </div>

                    {/* Voice selection - Full width on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Voice:</label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full sm:max-w-[300px] px-3 py-2 border rounded text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 min-h-[44px]"
                      >
                        <option value="">Auto-select Japanese voice</option>
                        {availableVoices.length > 0 ? (
                          availableVoices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {isMobile 
                                ? `${voice.name.split(' ')[0]} (${voice.lang})`
                                : `${voice.name} (${voice.lang})`
                              }
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No Japanese voices available</option>
                        )}
                      </select>
                      {availableVoices.length === 0 && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          ⚠️ No Japanese voices found - will use default voice
                        </span>
                      )}
                    </div>

                    {/* Action buttons - Full width on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          // Initialize audio on mobile with user interaction
                          if (isMobile && 'speechSynthesis' in window) {
                            const testUtterance = new SpeechSynthesisUtterance('こんにちは');
                            testUtterance.volume = 0.1;
                            testUtterance.rate = 1.0;
                            window.speechSynthesis.speak(testUtterance);
                            setTimeout(() => {
                              window.speechSynthesis.cancel();
                            }, 100);
                          }
                          playAudio('こんにちは', -1);
                        }}
                        className="w-full px-4 py-3 text-base bg-green-500 text-white rounded-lg hover:bg-green-600 transition min-h-[44px] touch-manipulation"
                      >
                        🔊 Test Audio
                      </button>
                      
                      <button
                        onClick={playingLine !== null ? pauseConversation : playConversation}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition min-h-[44px] touch-manipulation"
                      >
                        {playingLine !== null ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        {playingLine !== null ? 'Pause' : 'Play All'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conversation Lines */}
                <div className="space-y-4 mb-8">
                  {conversation.conversation.map((line, index) => (
                    <div
                      key={index}
                      className={`border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900 p-4 rounded-r-lg transition-all ${
                        playingLine === index ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{line.speaker}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRomaji(index)}
                            className={`px-2 py-1 text-xs rounded min-h-[36px] min-w-[36px] sm:min-w-[50px] touch-manipulation ${
                              showRomaji[index]
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {isMobile ? 'R' : 'Rom'}
                          </button>
                          <button
                            onClick={() => toggleTranslation(index)}
                            className={`px-2 py-1 text-xs rounded min-h-[36px] min-w-[36px] touch-manipulation ${
                              showTranslation[index]
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            ID
                          </button>
                          <button
                            onClick={() => playAudio(line.japanese, index)}
                            disabled={playingLine === index}
                            className={`rounded transition-all min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation ${
                              playingLine === index
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {playingLine === index ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-lg sm:text-xl mb-2 jp-font leading-relaxed">
                        <Furigana htmlString={line.furigana.replace(/\[([^\|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>')} className="text-base" rtClass="furigana-bold"/>
                      </div>
                      
                      {showRomaji[index] && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                          {line.romaji}
                        </div>
                      )}
                      
                      {showTranslation[index] && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {line.indonesian}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        💡 {line.notes}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Phrases Section */}
                <div className="border-t pt-6">
                  <button
                    onClick={() => toggleSection('keyPhrases')}
                    className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4"
                  >
                    {expandedSections['keyPhrases'] ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                    重要なフレーズ (Key Phrases)
                  </button>
                  
                  {expandedSections['keyPhrases'] && (
                    <div className="grid grid-cols-1 gap-4">
                      {conversation.keyPhrases.map((phrase, index) => (
                        <div key={index} className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
                          <div className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-1 jp-font">
                            {phrase.phrase}
                          </div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                            {phrase.reading}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {phrase.meaning}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            使用法: {phrase.usage}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
