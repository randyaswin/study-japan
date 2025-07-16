"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';

// Types for our state
interface Settings {
    kanjiPerPage: number;
    vocabularyPerPage: number;
    grammarPerPage: number;
}

interface StudyState {
    // Navigation state
    currentSection: 'hiragana' | 'katakana' | 'n5' | 'kaiwa' | 'number' | 'time' | 'home';
    currentPage: number;
    
    // Settings
    settings: Settings;
    
    // Pagination state
    pagination: {
        kanjiCurrentPage: number;
        vocabCurrentPage: number;
        grammarCurrentPage: number;
    };
    
    // N5 specific state
    n5Data: {
        totalPages: number;
        availableDays: number[];
        isLoading: boolean;
        error: string | null;
        currentPage: number;
        viewMode: 'home' | 'study'; // 'home' shows page selection, 'study' shows study content
    };
    
    // Interactive modes
    flipModes: {
        kanjiFlipMode: boolean;
        vocabFlipMode: boolean;
        flippedKanjiCards: Set<number>;
        flippedVocabCards: Set<number>;
    };
    
    // Multiple choice modes
    multipleChoiceModes: {
        kanjiMultipleChoice: boolean;
        vocabMultipleChoice: boolean;
        kanjiAnswers: { [key: number]: string };
        vocabAnswers: { [key: number]: string };
        showKanjiResults: { [key: number]: boolean };
        showVocabResults: { [key: number]: boolean };
    };
    
    // UI state
    ui: {
        isSettingsOpen: boolean;
        theme: 'light' | 'dark' | 'system';
    };
}

// Action types
type StudyAction = 
    | { type: 'SET_CURRENT_SECTION'; payload: StudyState['currentSection'] }
    | { type: 'SET_CURRENT_PAGE'; payload: number }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
    | { type: 'RESET_SETTINGS' }
    | { type: 'SET_KANJI_CURRENT_PAGE'; payload: number }
    | { type: 'SET_VOCAB_CURRENT_PAGE'; payload: number }
    | { type: 'SET_GRAMMAR_CURRENT_PAGE'; payload: number }
    | { type: 'SET_N5_DATA'; payload: Partial<StudyState['n5Data']> }
    | { type: 'SET_N5_CURRENT_PAGE'; payload: number }
    | { type: 'SET_N5_VIEW_MODE'; payload: 'home' | 'study' }
    | { type: 'TOGGLE_KANJI_FLIP_MODE'; payload?: boolean | undefined }
    | { type: 'TOGGLE_VOCAB_FLIP_MODE'; payload?: boolean | undefined }
    | { type: 'TOGGLE_KANJI_CARD'; payload: number }
    | { type: 'TOGGLE_VOCAB_CARD'; payload: number }
    | { type: 'TOGGLE_KANJI_MULTIPLE_CHOICE'; payload: boolean | undefined }
    | { type: 'TOGGLE_VOCAB_MULTIPLE_CHOICE'; payload: boolean | undefined }
    | { type: 'SET_KANJI_ANSWER'; payload: { cardIndex: number; answer: string } }
    | { type: 'SET_VOCAB_ANSWER'; payload: { cardIndex: number; answer: string } }
    | { type: 'RESET_KANJI_ANSWERS' }
    | { type: 'RESET_VOCAB_ANSWERS' }
    | { type: 'RESET_FLIP_MODES' }
    | { type: 'RESET_MULTIPLE_CHOICE_MODES' }
    | { type: 'TOGGLE_SETTINGS_PANEL' }
    | { type: 'LOAD_FROM_STORAGE'; payload: Partial<StudyState> };

// Default state
const defaultSettings: Settings = {
    kanjiPerPage: 5,
    vocabularyPerPage: 20,
    grammarPerPage: 3
};

const initialState: StudyState = {
    currentSection: 'home',
    currentPage: 0,
    settings: defaultSettings,
    pagination: {
        kanjiCurrentPage: 1,
        vocabCurrentPage: 1,
        grammarCurrentPage: 1
    },
    n5Data: {
        totalPages: 23, // 452 vocab items / 20 per page
        availableDays: Array.from({ length: 23 }, (_, i) => i + 1),
        isLoading: false,
        error: null,
        currentPage: 1,
        viewMode: 'home'
    },
    flipModes: {
        kanjiFlipMode: false,
        vocabFlipMode: false,
        flippedKanjiCards: new Set(),
        flippedVocabCards: new Set()
    },
    multipleChoiceModes: {
        kanjiMultipleChoice: false,
        vocabMultipleChoice: false,
        kanjiAnswers: {},
        vocabAnswers: {},
        showKanjiResults: {},
        showVocabResults: {}
    },
    ui: {
        isSettingsOpen: false,
        theme: 'system'
    }
};

// Reducer function
function studyReducer(state: StudyState, action: StudyAction): StudyState {
    switch (action.type) {
        case 'SET_CURRENT_SECTION':
            return { ...state, currentSection: action.payload };
            
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload };
            
        case 'UPDATE_SETTINGS':
            const newSettings = { ...state.settings, ...action.payload };
            const newState = { 
                ...state, 
                settings: newSettings,
                // Reset pagination when settings change
                pagination: {
                    kanjiCurrentPage: 1,
                    vocabCurrentPage: 1,
                    grammarCurrentPage: 1
                },
                // Recalculate total pages when settings change
                n5Data: {
                    ...state.n5Data,
                    totalPages: Math.ceil(452 / newSettings.vocabularyPerPage), // 452 is vocab count
                    availableDays: Array.from({ length: Math.ceil(452 / newSettings.vocabularyPerPage) }, (_, i) => i + 1),
                    currentPage: 1 // Reset to first page when settings change
                }
            };
            return newState;
            
        case 'RESET_SETTINGS':
            return { 
                ...state, 
                settings: defaultSettings,
                pagination: {
                    kanjiCurrentPage: 1,
                    vocabCurrentPage: 1,
                    grammarCurrentPage: 1
                },
                n5Data: {
                    ...state.n5Data,
                    totalPages: Math.ceil(452 / defaultSettings.vocabularyPerPage),
                    availableDays: Array.from({ length: Math.ceil(452 / defaultSettings.vocabularyPerPage) }, (_, i) => i + 1),
                    currentPage: 1
                }
            };
            
        case 'SET_KANJI_CURRENT_PAGE':
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    kanjiCurrentPage: action.payload
                }
            };
            
        case 'SET_VOCAB_CURRENT_PAGE':
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    vocabCurrentPage: action.payload
                }
            };
            
        case 'SET_GRAMMAR_CURRENT_PAGE':
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    grammarCurrentPage: action.payload
                }
            };
            
        case 'SET_N5_DATA':
            return {
                ...state,
                n5Data: { ...state.n5Data, ...action.payload }
            };
            
        case 'SET_N5_CURRENT_PAGE':
            return {
                ...state,
                n5Data: { ...state.n5Data, currentPage: action.payload }
            };
            
        case 'SET_N5_VIEW_MODE':
            return {
                ...state,
                n5Data: { ...state.n5Data, viewMode: action.payload }
            };
            
        case 'TOGGLE_KANJI_FLIP_MODE':
            return {
                ...state,
                flipModes: {
                    ...state.flipModes,
                    kanjiFlipMode: action.payload !== undefined ? action.payload : !state.flipModes.kanjiFlipMode,  
                    flippedKanjiCards: new Set() // Reset flipped cards
                }
            };
            
        case 'TOGGLE_VOCAB_FLIP_MODE':
            return {
                ...state,
                flipModes: {
                    ...state.flipModes,
                    vocabFlipMode: action.payload !== undefined ? action.payload : !state.flipModes.vocabFlipMode,
                    flippedVocabCards: new Set() // Reset flipped cards
                }
            };
            
        case 'TOGGLE_KANJI_CARD':
            const newFlippedKanjiCards = new Set(state.flipModes.flippedKanjiCards);
            if (newFlippedKanjiCards.has(action.payload)) {
                newFlippedKanjiCards.delete(action.payload);
            } else {
                newFlippedKanjiCards.add(action.payload);
            }
            return {
                ...state,
                flipModes: {
                    ...state.flipModes,
                    flippedKanjiCards: newFlippedKanjiCards
                }
            };
            
        case 'TOGGLE_VOCAB_CARD':
            const newFlippedVocabCards = new Set(state.flipModes.flippedVocabCards);
            if (newFlippedVocabCards.has(action.payload)) {
                newFlippedVocabCards.delete(action.payload);
            } else {
                newFlippedVocabCards.add(action.payload);
            }
            return {
                ...state,
                flipModes: {
                    ...state.flipModes,
                    flippedVocabCards: newFlippedVocabCards
                }
            };
            
        case 'TOGGLE_KANJI_MULTIPLE_CHOICE':
            return {
                ...state,
                multipleChoiceModes: {
                    ...state.multipleChoiceModes,
                    kanjiMultipleChoice: action.payload !== undefined ? action.payload : !state.multipleChoiceModes.kanjiMultipleChoice,
                    kanjiAnswers: {},
                    showKanjiResults: {}
                }
            };
            
        case 'TOGGLE_VOCAB_MULTIPLE_CHOICE':
            return {
                ...state,
                multipleChoiceModes: {
                    ...state.multipleChoiceModes,
                    vocabMultipleChoice: action.payload !== undefined ? action.payload : !state.multipleChoiceModes.vocabMultipleChoice,
                    vocabAnswers: {},
                    showVocabResults: {}
                }
            };
            
        case 'SET_KANJI_ANSWER':
            return {
                ...state,
                multipleChoiceModes: {
                    ...state.multipleChoiceModes,
                    kanjiAnswers: {
                        ...state.multipleChoiceModes.kanjiAnswers,
                        [action.payload.cardIndex]: action.payload.answer
                    },
                    showKanjiResults: {
                        ...state.multipleChoiceModes.showKanjiResults,
                        [action.payload.cardIndex]: true
                    }
                }
            };
            
        case 'SET_VOCAB_ANSWER':
            return {
                ...state,
                multipleChoiceModes: {
                    ...state.multipleChoiceModes,
                    vocabAnswers: {
                        ...state.multipleChoiceModes.vocabAnswers,
                        [action.payload.cardIndex]: action.payload.answer
                    },
                    showVocabResults: {
                        ...state.multipleChoiceModes.showVocabResults,
                        [action.payload.cardIndex]: true
                    }
                }
            };
            
        case 'RESET_KANJI_ANSWERS':
            return {
                ...state,
                multipleChoiceModes: {
                    ...state.multipleChoiceModes,
                    kanjiAnswers: {},
                    showKanjiResults: {}
                }
            };
            
        case 'RESET_VOCAB_ANSWERS':
            return {
                ...state,
                multipleChoiceModes: {
                    ...state.multipleChoiceModes,
                    vocabAnswers: {},
                    showVocabResults: {}
                }
            };
            
        case 'RESET_FLIP_MODES':
            return {
                ...state,
                flipModes: {
                    kanjiFlipMode: false,
                    vocabFlipMode: false,
                    flippedKanjiCards: new Set(),
                    flippedVocabCards: new Set()
                }
            };
            
        case 'RESET_MULTIPLE_CHOICE_MODES':
            return {
                ...state,
                multipleChoiceModes: {
                    kanjiMultipleChoice: false,
                    vocabMultipleChoice: false,
                    kanjiAnswers: {},
                    vocabAnswers: {},
                    showKanjiResults: {},
                    showVocabResults: {}
                }
            };
            
        case 'TOGGLE_SETTINGS_PANEL':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    isSettingsOpen: !state.ui.isSettingsOpen
                }
            };
            
        case 'LOAD_FROM_STORAGE':
            // Ensure we don't override pagination when loading from storage
            const loadedState = { 
                ...state, 
                ...action.payload,
                // Always use fresh pagination state, never load from storage
                pagination: {
                    kanjiCurrentPage: 1,
                    vocabCurrentPage: 1,
                    grammarCurrentPage: 1
                }
            };
            return loadedState;
            
        default:
            return state;
    }
}

// Context
const StudyContext = createContext<{ state: StudyState; dispatch: React.Dispatch<StudyAction> } | null>(null);

// Provider component
export function StudyProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(studyReducer, initialState);
    
    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Clear any existing storage that might conflict
            localStorage.removeItem('study-japan-state');
        }
    }, []);
    
    // Save to localStorage when state changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const toSave = {
                settings: state.settings,
                ui: state.ui
            };
            localStorage.setItem('study-japan-state', JSON.stringify(toSave));
        }
    }, [state.settings, state.ui]);
    
    return (
        <StudyContext.Provider value={{ state, dispatch }}>
            {children}
        </StudyContext.Provider>
    );
}

// Custom hook to use the study context
export function useStudy() {
    const context = useContext(StudyContext);
    if (!context) {
        throw new Error('useStudy must be used within a StudyProvider');
    }
    return context;
}

// Custom hook for settings
export function useSettings() {
    const { state, dispatch } = useStudy();
    
    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    }, [dispatch]);
    
    const resetSettings = useCallback(() => {
        dispatch({ type: 'RESET_SETTINGS' });
    }, [dispatch]);
    
    return {
        settings: state.settings,
        updateSettings,
        resetSettings
    };
}

// Custom hook for navigation
export function useNavigation() {
    const { state, dispatch } = useStudy();
    
    const navigateToSection = useCallback((section: StudyState['currentSection']) => {
        dispatch({ type: 'SET_CURRENT_SECTION', payload: section });
    }, [dispatch]);
    
    const navigateToPage = useCallback((page: number) => {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    }, [dispatch]);
    
    return {
        currentSection: state.currentSection,
        currentPage: state.currentPage,
        navigateToSection,
        navigateToPage
    };
}

// Custom hook for pagination
export function usePagination() {
    const { state, dispatch } = useStudy();
    
    const setKanjiCurrentPage = useCallback((page: number) => {
        dispatch({ type: 'SET_KANJI_CURRENT_PAGE', payload: page });
    }, [dispatch]);
    
    const setVocabCurrentPage = useCallback((page: number) => {
        dispatch({ type: 'SET_VOCAB_CURRENT_PAGE', payload: page });
    }, [dispatch]);
    
    const setGrammarCurrentPage = useCallback((page: number) => {
        dispatch({ type: 'SET_GRAMMAR_CURRENT_PAGE', payload: page });
    }, [dispatch]);
    
    const resetPagination = useCallback(() => {
        dispatch({ type: 'SET_KANJI_CURRENT_PAGE', payload: 1 });
        dispatch({ type: 'SET_VOCAB_CURRENT_PAGE', payload: 1 });
        dispatch({ type: 'SET_GRAMMAR_CURRENT_PAGE', payload: 1 });
    }, [dispatch]);
    
    return {
        ...state.pagination,
        setKanjiCurrentPage,
        setVocabCurrentPage,
        setGrammarCurrentPage,
        resetPagination
    };
}

// Custom hook for flip modes
export function useFlipMode() {
    const { state, dispatch } = useStudy();
    
    const toggleKanjiFlipMode = useCallback((payload?: boolean) => {
        dispatch({ type: 'TOGGLE_KANJI_FLIP_MODE', payload });
    }, [dispatch]);

    const toggleVocabFlipMode = useCallback((payload?: boolean) => {
        dispatch({ type: 'TOGGLE_VOCAB_FLIP_MODE', payload });
    }, [dispatch]);
    
    const toggleKanjiCard = useCallback((cardIndex: number) => {
        dispatch({ type: 'TOGGLE_KANJI_CARD', payload: cardIndex });
    }, [dispatch]);
    
    const toggleVocabCard = useCallback((cardIndex: number) => {
        dispatch({ type: 'TOGGLE_VOCAB_CARD', payload: cardIndex });
    }, [dispatch]);
    
    const resetFlipModes = useCallback(() => {
        dispatch({ type: 'RESET_FLIP_MODES' });
    }, [dispatch]);
    
    return {
        ...state.flipModes,
        toggleKanjiFlipMode,
        toggleVocabFlipMode,
        toggleKanjiCard,
        toggleVocabCard,
        resetFlipModes
    };
}

// Custom hook for multiple choice modes
export function useMultipleChoice() {
    const { state, dispatch } = useStudy();
    
    const toggleKanjiMultipleChoice = useCallback((payload?: boolean) => {
        dispatch({ type: 'TOGGLE_KANJI_MULTIPLE_CHOICE', payload });
    }, [dispatch]);
    
    const toggleVocabMultipleChoice = useCallback((payload?: boolean) => {
        dispatch({ type: 'TOGGLE_VOCAB_MULTIPLE_CHOICE', payload });
    }, [dispatch]);
    
    const setKanjiAnswer = useCallback((cardIndex: number, answer: string) => {
        dispatch({ type: 'SET_KANJI_ANSWER', payload: { cardIndex, answer } });
    }, [dispatch]);
    
    const setVocabAnswer = useCallback((cardIndex: number, answer: string) => {
        dispatch({ type: 'SET_VOCAB_ANSWER', payload: { cardIndex, answer } });
    }, [dispatch]);
    
    const resetKanjiAnswers = useCallback(() => {
        dispatch({ type: 'RESET_KANJI_ANSWERS' });
    }, [dispatch]);
    
    const resetVocabAnswers = useCallback(() => {
        dispatch({ type: 'RESET_VOCAB_ANSWERS' });
    }, [dispatch]);
    
    const resetMultipleChoiceModes = useCallback(() => {
        dispatch({ type: 'RESET_MULTIPLE_CHOICE_MODES' });
    }, [dispatch]);
    
    return {
        ...state.multipleChoiceModes,
        toggleKanjiMultipleChoice,
        toggleVocabMultipleChoice,
        setKanjiAnswer,
        setVocabAnswer,
        resetKanjiAnswers,
        resetVocabAnswers,
        resetMultipleChoiceModes
    };
}

// Custom hook for UI state
export function useUI() {
    const { state, dispatch } = useStudy();
    
    const toggleSettingsPanel = useCallback(() => {
        dispatch({ type: 'TOGGLE_SETTINGS_PANEL' });
    }, [dispatch]);
    
    return {
        ...state.ui,
        toggleSettingsPanel
    };
}

// Custom hook for N5 functionality
export function useN5() {
    const { state, dispatch } = useStudy();
    
    const setN5CurrentPage = useCallback((page: number) => {
        dispatch({ type: 'SET_N5_CURRENT_PAGE', payload: page });
    }, [dispatch]);
    
    const setN5ViewMode = useCallback((mode: 'home' | 'study') => {
        dispatch({ type: 'SET_N5_VIEW_MODE', payload: mode });
    }, [dispatch]);
    
    const setN5Data = useCallback((data: Partial<StudyState['n5Data']>) => {
        dispatch({ type: 'SET_N5_DATA', payload: data });
    }, [dispatch]);
    
    const goToStudyPage = useCallback((pageNumber: number) => {
        dispatch({ type: 'SET_N5_CURRENT_PAGE', payload: pageNumber });
        dispatch({ type: 'SET_N5_VIEW_MODE', payload: 'study' });
    }, [dispatch]);
    
    const goToHomePage = useCallback(() => {
        dispatch({ type: 'SET_N5_VIEW_MODE', payload: 'home' });
    }, [dispatch]);
    
    return {
        n5Data: state.n5Data,
        setN5CurrentPage,
        setN5ViewMode,
        setN5Data,
        goToStudyPage,
        goToHomePage
    };
}
