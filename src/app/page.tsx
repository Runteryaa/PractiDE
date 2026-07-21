"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Plus, List as ListIcon, Play, Trash2, Check, RotateCcw, Wand2, LogIn, UserPlus, LogOut, Gamepad2, Trophy, Timer, Pencil, Keyboard, BookOpen, CheckCircle, XCircle, Volume2, HelpCircle } from 'lucide-react';

const API_BASE_URL = 'https://runauth-worker.runte.workers.dev/v1/practide';

const articleColors: Record<string, string> = {
  der: 'bg-blue-500 text-white',
  die: 'bg-red-500 text-white',
  das: 'bg-green-500 text-white',
  'die (çoğul)': 'bg-yellow-500 text-white',
  fiil: 'bg-purple-500 text-white',
  sıfat: 'bg-teal-500 text-white',
  zarf: 'bg-orange-500 text-white',
  diğer: 'bg-[#293561] text-gray-200'
};

const articleOptions = ['der', 'die', 'das', 'die (çoğul)', 'fiil', 'sıfat', 'zarf', 'diğer'];

export default function App() {
  // Auth states
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // App states
  const [activeTab, setActiveTab] = useState('list');
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWords, setFetchingWords] = useState(false);

  // Form states
  const [word, setWord] = useState('');
  const [article, setArticle] = useState('diğer');
  const [meaningTR, setMeaningTR] = useState('');
  const [meaningEN, setMeaningEN] = useState('');
  const [lastEdited, setLastEdited] = useState<string | null>(null);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);

  // Practice states
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Games states
  const [activeGame, setActiveGame] = useState<'menu' | 'flashcards' | 'quiz' | 'match' | 'typing' | 'article' | 'listening' | 'tf'>('menu');
  
  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Match states
  const [matchCards, setMatchCards] = useState<any[]>([]);
  const [flippedMatchCards, setFlippedMatchCards] = useState<number[]>([]);
  const [matchedMatchCards, setMatchedMatchCards] = useState<number[]>([]);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);
  const [matchTime, setMatchTime] = useState(0);
  const [matchFinished, setMatchFinished] = useState(false);

  // Typing states
  const [typingQuestions, setTypingQuestions] = useState<any[]>([]);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [typingInput, setTypingInput] = useState('');
  const [typingStatus, setTypingStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [typingScore, setTypingScore] = useState(0);
  const [typingFinished, setTypingFinished] = useState(false);

  // Article Quiz states
  const [articleQuestions, setArticleQuestions] = useState<any[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const [articleScore, setArticleScore] = useState(0);
  const [articleFinished, setArticleFinished] = useState(false);
  const [selectedArticleAnswer, setSelectedArticleAnswer] = useState<string | null>(null);

  // Listening states
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
  const [currentListeningIndex, setCurrentListeningIndex] = useState(0);
  const [listeningInput, setListeningInput] = useState('');
  const [listeningStatus, setListeningStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [listeningScore, setListeningScore] = useState(0);
  const [listeningFinished, setListeningFinished] = useState(false);

  // True/False states
  const [tfQuestions, setTfQuestions] = useState<any[]>([]);
  const [currentTfIndex, setCurrentTfIndex] = useState(0);
  const [tfScore, setTfScore] = useState(0);
  const [tfFinished, setTfFinished] = useState(false);
  const [tfStatus, setTfStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [tfSelected, setTfSelected] = useState<'true' | 'false' | null>(null);

  // Practice settings
  const [practiceLearnedOnly, setPracticeLearnedOnly] = useState(false);
  const [sessionLearnedWords, setSessionLearnedWords] = useState<any[]>([]);

  const getFullWord = (w: any) => {
    if (!w) return '';
    if (['der', 'die', 'das', 'die (çoğul)'].includes(w.article)) {
      return `${w.article === 'die (çoğul)' ? 'die' : w.article} ${w.word}`;
    }
    return w.word;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeGame === 'match' && matchStartTime && !matchFinished) {
      interval = setInterval(() => {
        setMatchTime(Math.floor((Date.now() - matchStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame, matchStartTime, matchFinished]);

  const startQuiz = () => {
    const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
    const shuffled = [...practicePool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    const questions = selected.map(word => {
      const others = words.filter(w => w.id !== word.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      let options = [word.meaning_tr, ...others.map(w => w.meaning_tr)];
      options = Array.from(new Set(options));
      while (options.length < 4 && options.length < words.length) {
         const randomDummy = words[Math.floor(Math.random() * words.length)].meaning_tr;
         if (!options.includes(randomDummy)) options.push(randomDummy);
      }
      options.sort(() => 0.5 - Math.random());
      return { ...word, options };
    });
    
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);
    setSessionLearnedWords([]);
    setActiveGame('quiz');
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    
    const currentWordObj = quizQuestions[currentQuestionIndex];
    const isCorrect = answer === currentWordObj.meaning_tr;
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      handleWordSuccess(currentWordObj);
    } else {
      handleWordMistake(currentWordObj.id);
    }
    
    setTimeout(() => {
      if (currentQuestionIndex + 1 < quizQuestions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1000);
  };

  const startMatch = () => {
    const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
    const selected = [...practicePool].sort(() => 0.5 - Math.random()).slice(0, 6);
    const cards: any[] = [];
    selected.forEach(word => {
      cards.push({ id: word.id + '-de', wordId: word.id, text: getFullWord(word), type: 'de' });
      cards.push({ id: word.id + '-tr', wordId: word.id, text: word.meaning_tr, type: 'tr' });
    });
    setMatchCards(cards.sort(() => 0.5 - Math.random()));
    setFlippedMatchCards([]);
    setMatchedMatchCards([]);
    setMatchStartTime(Date.now());
    setMatchTime(0);
    setMatchFinished(false);
    setSessionLearnedWords([]);
    setActiveGame('match');
  };

  const handleMatchCardClick = (index: number) => {
    if (flippedMatchCards.length === 2 || matchedMatchCards.includes(index) || flippedMatchCards.includes(index)) return;

    const newFlipped = [...flippedMatchCards, index];
    setFlippedMatchCards(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = matchCards[newFlipped[0]];
      const card2 = matchCards[newFlipped[1]];

      if (card1.wordId === card2.wordId && card1.type !== card2.type) {
        const wordObj = words.find(w => w.id === card1.wordId);
        if (wordObj) handleWordSuccess(wordObj);

        setTimeout(() => {
          const newMatched = [...matchedMatchCards, newFlipped[0], newFlipped[1]];
          setMatchedMatchCards(newMatched);
          setFlippedMatchCards([]);
          if (newMatched.length === matchCards.length) {
            setMatchFinished(true);
          }
        }, 500);
      } else {
        handleWordMistake(card1.wordId);
        handleWordMistake(card2.wordId);
        setTimeout(() => {
          setFlippedMatchCards([]);
        }, 1000);
      }
    }
  };

  const startTyping = () => {
    const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
    const shuffled = [...practicePool].sort(() => 0.5 - Math.random());
    setTypingQuestions(shuffled.slice(0, 10)); // up to 10 questions
    setCurrentTypingIndex(0);
    setTypingInput('');
    setTypingStatus('idle');
    setTypingScore(0);
    setTypingFinished(false);
    setSessionLearnedWords([]);
    setActiveGame('typing');
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typingStatus !== 'idle') return;

    const currentWordObj = typingQuestions[currentTypingIndex];
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    
    const isCorrect = normalize(typingInput) === normalize(getFullWord(currentWordObj));

    if (isCorrect) {
      setTypingStatus('correct');
      setTypingScore(prev => prev + 1);
      handleWordSuccess(currentWordObj);
    } else {
      setTypingStatus('incorrect');
      handleWordMistake(currentWordObj.id);
    }

    setTimeout(() => {
      if (currentTypingIndex + 1 < typingQuestions.length) {
        setCurrentTypingIndex(prev => prev + 1);
        setTypingInput('');
        setTypingStatus('idle');
      } else {
        setTypingFinished(true);
      }
    }, 1500);
  };

  const startArticle = () => {
    const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
    const validArticles = ['der', 'die', 'das', 'die (çoğul)'];
    const articlePool = practicePool.filter(w => validArticles.includes(w.article));
    
    const shuffled = [...articlePool].sort(() => 0.5 - Math.random());
    setArticleQuestions(shuffled.slice(0, 10));
    setCurrentArticleIndex(0);
    setArticleScore(0);
    setArticleFinished(false);
    setSelectedArticleAnswer(null);
    setSessionLearnedWords([]);
    setActiveGame('article');
  };

  const handleArticleAnswer = (answer: string) => {
    if (selectedArticleAnswer) return;
    setSelectedArticleAnswer(answer);
    
    const currentWordObj = articleQuestions[currentArticleIndex];
    const isCorrect = answer === currentWordObj.article;
    
    if (isCorrect) {
      setArticleScore(prev => prev + 1);
      handleWordSuccess(currentWordObj);
    } else {
      handleWordMistake(currentWordObj.id);
    }
    
    setTimeout(() => {
      if (currentArticleIndex + 1 < articleQuestions.length) {
        setCurrentArticleIndex(prev => prev + 1);
        setSelectedArticleAnswer(null);
      } else {
        setArticleFinished(true);
      }
    }, 1000);
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
    const shuffled = [...practicePool].sort(() => 0.5 - Math.random());
    setListeningQuestions(shuffled.slice(0, 10));
    setCurrentListeningIndex(0);
    setListeningInput('');
    setListeningScore(0);
    setListeningFinished(false);
    setListeningStatus('idle');
    setSessionLearnedWords([]);
    setActiveGame('listening');
    
    setTimeout(() => {
      playAudio(getFullWord(shuffled[0]));
    }, 500);
  };

  const handleListeningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (listeningStatus !== 'idle') return;

    const currentWordObj = listeningQuestions[currentListeningIndex];
    const normalize = (str: string) => str.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    
    const isCorrect = normalize(listeningInput) === normalize(getFullWord(currentWordObj));

    if (isCorrect) {
      setListeningStatus('correct');
      setListeningScore(prev => prev + 1);
      handleWordSuccess(currentWordObj);
    } else {
      setListeningStatus('incorrect');
      handleWordMistake(currentWordObj.id);
    }

    setTimeout(() => {
      if (currentListeningIndex + 1 < listeningQuestions.length) {
        setCurrentListeningIndex(prev => prev + 1);
        setListeningInput('');
        setListeningStatus('idle');
        setTimeout(() => {
          playAudio(getFullWord(listeningQuestions[currentListeningIndex + 1]));
        }, 500);
      } else {
        setListeningFinished(true);
      }
    }, 1500);
  };

  const startTf = () => {
    const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
    const shuffled = [...practicePool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    const questions = selected.map(word => {
      const isMatch = Math.random() > 0.5;
      let displayedMeaning = word.meaning_tr;
      if (!isMatch && practicePool.length > 1) {
        const others = practicePool.filter(w => w.id !== word.id);
        if (others.length > 0) {
          displayedMeaning = others[Math.floor(Math.random() * others.length)].meaning_tr;
        }
      }
      return { wordObj: word, displayedMeaning, isMatch: displayedMeaning === word.meaning_tr };
    });
    
    setTfQuestions(questions);
    setCurrentTfIndex(0);
    setTfScore(0);
    setTfFinished(false);
    setTfStatus('idle');
    setTfSelected(null);
    setSessionLearnedWords([]);
    setActiveGame('tf');
  };

  const handleTfAnswer = (answer: boolean) => {
    if (tfStatus !== 'idle') return;
    setTfSelected(answer ? 'true' : 'false');
    
    const q = tfQuestions[currentTfIndex];
    const isCorrect = q.isMatch === answer;
    
    if (isCorrect) {
      setTfScore(prev => prev + 1);
      setTfStatus('correct');
      handleWordSuccess(q.wordObj);
    } else {
      setTfStatus('incorrect');
      handleWordMistake(q.wordObj.id);
    }
    
    setTimeout(() => {
      if (currentTfIndex + 1 < tfQuestions.length) {
        setCurrentTfIndex(prev => prev + 1);
        setTfStatus('idle');
        setTfSelected(null);
      } else {
        setTfFinished(true);
      }
    }, 1500);
  };

  // Keyboard Navigation for Flashcards
  useEffect(() => {
    if (activeTab !== 'practice' || words.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Inputlara yazarken klavye kısayollarını devre dışı bırak
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Sayfa kaymasını önle
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, words.length, practiceIndex]); // We need practiceIndex in dependency array for accurate next/prev functions if they weren't using state callbacks, but they do.

  // Initial user check & RunAuth OAuth Callback handling
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          // Logged in via RunAuth SSO
          const runauthUser = {
            id: 'usr_runauth_main',
            username: 'RunAuth Kullanıcısı'
          };
          setUser(runauthUser);
          localStorage.setItem('practide_user', JSON.stringify(runauthUser));
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }

      const savedUser = localStorage.getItem('practide_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Local storage / RunAuth callback error:", e);
    }
  }, []);

  const handleRunAuthLogin = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('runauth_state', state);
    const redirectUri = encodeURIComponent(window.location.origin);
    // Redirect to RunAuth Website login portal (localhost:3000/login in local dev, runauth.com/login in prod)
    const runauthWebUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000/login'
      : 'https://runauth.com/login';
    const authUrl = `${runauthWebUrl}?client_id=practide-app-client&redirect_uri=${redirectUri}&state=${state}`;
    window.location.href = authUrl;
  };

  // Fetch words when user logs in
  useEffect(() => {
    if (user) {
      fetchWords();
    } else {
      setWords([]);
    }
  }, [user]);

  const fetchWords = async () => {
    if (!user) return;
    setFetchingWords(true);
    try {
      const q = encodeURIComponent(JSON.stringify({ user_id: user.id }));
      const res = await fetch(`${API_BASE_URL}/words/?q=${q}&limit=1000`);
      const data = await res.json();
      if (data.items) {
        // Sort by created_at desc (newest first)
        const sorted = data.items.sort((a: any, b: any) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        // Map learned to boolean for UI
        const mapped = sorted.map((w: any) => ({ ...w, learned: w.learned === 1 }));
        setWords(mapped);
      }
    } catch (e) {
      console.error("Kelimeler çekilirken hata:", e);
    } finally {
      setFetchingWords(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Bir hata oluştu.');
      }

      const userData = { id: data.id, username: data.username };
      setUser(userData);
      localStorage.setItem('practide_user', JSON.stringify(userData));
      setAuthUsername('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('practide_user');
  };

  const handleAutoFill = async () => {
    const sourceText = word.trim() || meaningTR.trim() || meaningEN.trim();
    if (!sourceText) return;

    setLoading(true);
    
    let sourceLang = 'de';
    let activeQuery = '';

    if (lastEdited === 'de' && word.trim()) {
      sourceLang = 'de';
      activeQuery = word.trim();
    } else if (lastEdited === 'tr' && meaningTR.trim()) {
      sourceLang = 'tr';
      activeQuery = meaningTR.trim();
    } else if (lastEdited === 'en' && meaningEN.trim()) {
      sourceLang = 'en';
      activeQuery = meaningEN.trim();
    } else {
      if (word.trim()) {
        sourceLang = 'de';
        activeQuery = word.trim();
      } else if (meaningTR.trim()) {
        sourceLang = 'tr';
        activeQuery = meaningTR.trim();
      } else if (meaningEN.trim()) {
        sourceLang = 'en';
        activeQuery = meaningEN.trim();
      }
    }

    try {
      const fetchTranslation = async (text: string, sl: string, tl: string) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0][0][0];
      };

      let resultDe = word.trim();
      let resultTr = meaningTR.trim();
      let resultEn = meaningEN.trim();
      let guessedArticle = 'diğer';

      if (sourceLang === 'de') {
        const parts = activeQuery.split(' ');
        if (parts.length > 1) {
          const firstWord = parts[0].toLowerCase();
          if (['der', 'die', 'das'].includes(firstWord)) {
            guessedArticle = firstWord;
            resultDe = parts.slice(1).join(' ');
            activeQuery = resultDe;
          }
        }
        
        const [trText, enText] = await Promise.all([
          fetchTranslation(activeQuery, 'de', 'tr'),
          fetchTranslation(activeQuery, 'de', 'en')
        ]);
        resultTr = trText;
        resultEn = enText;
      } else if (sourceLang === 'tr') {
        const [deText, enText] = await Promise.all([
          fetchTranslation(activeQuery, 'tr', 'de'),
          fetchTranslation(activeQuery, 'tr', 'en')
        ]);
        resultDe = deText;
        resultEn = enText;
      } else if (sourceLang === 'en') {
        const [deText, trText] = await Promise.all([
          fetchTranslation(activeQuery, 'en', 'de'),
          fetchTranslation(activeQuery, 'en', 'tr')
        ]);
        resultDe = deText;
        resultTr = trText;
      }

      const deParts = resultDe.split(' ');
      if (deParts.length > 1) {
        const firstWordDe = deParts[0].toLowerCase();
        if (['der', 'die', 'das'].includes(firstWordDe)) {
          guessedArticle = firstWordDe;
          resultDe = deParts.slice(1).join(' ');
          resultDe = resultDe.charAt(0).toUpperCase() + resultDe.slice(1);
        }
      }

      if (guessedArticle === 'diğer') {
        if (resultEn.toLowerCase().startsWith('to ')) {
          guessedArticle = 'fiil';
        } else if (resultEn) {
          const testEnText = resultEn.toLowerCase().startsWith('the ') ? resultEn : `the ${resultEn}`;
          const articleTest = await fetchTranslation(testEnText, 'en', 'de');
          const testParts = articleTest.split(' ');
          
          if (testParts.length > 1) {
            const possibleArticle = testParts[0].toLowerCase();
            if (['der', 'die', 'das'].includes(possibleArticle)) {
              guessedArticle = possibleArticle;
              resultDe = resultDe.charAt(0).toUpperCase() + resultDe.slice(1);
            }
          }
        }
      }

      if (guessedArticle === 'die') {
        const trLower = resultTr.toLowerCase().trim();
        const enLower = resultEn.toLowerCase().trim();
        const isTrPlural = trLower.endsWith('lar') || trLower.endsWith('ler');
        const isEnPlural = 
          ['children', 'people', 'men', 'women', 'teeth', 'feet', 'mice'].includes(enLower) || 
          (enLower.endsWith('s') && enLower.length > 3 && !enLower.endsWith('ss') && !enLower.endsWith('us') && !enLower.endsWith('is') && !enLower.endsWith('news') && !enLower.endsWith('gas'));
          
        if (isTrPlural || isEnPlural) {
          guessedArticle = 'die (çoğul)';
        }
      }

      setWord(resultDe);
      setMeaningTR(resultTr.toLowerCase());
      setMeaningEN(resultEn.toLowerCase());
      setArticle(guessedArticle);

    } catch (error) {
      console.error("Otomatik çeviri hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditWord = (w: any) => {
    setEditingWordId(w.id);
    setWord(w.word);
    setArticle(w.article);
    setMeaningTR(w.meaning_tr);
    setMeaningEN(w.meaning_en || '');
    setActiveTab('add');
  };

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaningTR.trim() || !user) return;

    let finalWord = word.trim();
    let finalArticle = article;

    const parts = finalWord.split(' ');
    if (parts.length > 1) {
      const firstWord = parts[0].toLowerCase();
      if (['der', 'die', 'das'].includes(firstWord)) {
        if (firstWord === 'die' && finalArticle === 'die (çoğul)') {
            finalArticle = 'die (çoğul)';
        } else {
            finalArticle = firstWord;
            if (firstWord === 'die') {
                const trLower = meaningTR.trim().toLowerCase();
                if (trLower.endsWith('lar') || trLower.endsWith('ler')) {
                    finalArticle = 'die (çoğul)';
                }
            }
        }
        finalWord = parts.slice(1).join(' ');
      }
    }

    if (editingWordId) {
      const existingWord = words.find(w => w.id === editingWordId);
      if (!existingWord) return;

      const updatedWord = {
        ...existingWord,
        word: finalWord,
        article: finalArticle,
        meaning_tr: meaningTR.trim(),
        meaning_en: meaningEN.trim(),
      };

      setWords(words.map(w => w.id === editingWordId ? updatedWord : w));
      
      setEditingWordId(null);
      setWord('');
      setArticle('diğer');
      setMeaningTR('');
      setMeaningEN('');
      setLastEdited(null);
      setActiveTab('list');

      try {
        const dbWord = {
          id: updatedWord.id,
          user_id: updatedWord.user_id,
          word: updatedWord.word,
          article: updatedWord.article,
          meaning_tr: updatedWord.meaning_tr,
          meaning_en: updatedWord.meaning_en,
          learned: updatedWord.learned ? 1 : 0,
          streak: updatedWord.streak || 0,
          created_at: updatedWord.created_at
        };

        await fetch(`${API_BASE_URL}/words/${editingWordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dbWord)
        });
      } catch (err) {
        console.error("Kelime güncellenemedi:", err);
      }
      return;
    }

    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID().replace(/-/g, '').substring(0, 32);
      }
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };
    const newId = generateId();

    const newWord = {
      id: newId,
      user_id: user.id,
      word: finalWord,
      article: finalArticle,
      meaning_tr: meaningTR.trim(),
      meaning_en: meaningEN.trim(),
      learned: 0,
      streak: 0,
      created_at: new Date().toISOString()
    };

    // Optimistic UI update
    const uiWord = { ...newWord, learned: false };
    setWords([uiWord, ...words]);
    
    // Reset form
    setWord('');
    setArticle('diğer');
    setMeaningTR('');
    setMeaningEN('');
    setLastEdited(null);

    // Save to DB
    try {
      await fetch(`${API_BASE_URL}/words/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord)
      });
    } catch (err) {
      console.error("Veritabanına kaydedilemedi:", err);
    }
  };

  const deleteWord = async (id: string) => {
    // Optimistic delete
    setWords(words.filter(w => w.id !== id));
    try {
      await fetch(`${API_BASE_URL}/words/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Kelime silinemedi:", err);
    }
  };

  const updateWordDb = async (w: any, overrides: any) => {
    const updated = { ...w, ...overrides };
    // Optimistic update
    setWords(prev => prev.map(item => item.id === w.id ? updated : item));

    try {
      const dbWord = {
        id: updated.id,
        user_id: updated.user_id,
        word: updated.word,
        article: updated.article,
        meaning_tr: updated.meaning_tr,
        meaning_en: updated.meaning_en,
        learned: updated.learned ? 1 : 0,
        streak: updated.streak || 0,
        created_at: updated.created_at
      };

      await fetch(`${API_BASE_URL}/words/${w.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbWord)
      });
    } catch (err) {
      console.error("Kelime güncellenemedi:", err);
    }
  };

  const toggleLearned = async (w: any, forceState?: boolean) => {
    const newLearnedState = forceState !== undefined ? forceState : !w.learned;
    if (w.learned === newLearnedState) return;
    
    const newStreak = newLearnedState ? (w.streak >= 5 ? w.streak : 5) : 0;
    await updateWordDb(w, { learned: newLearnedState, streak: newStreak });
  };

  const handleWordSuccess = (wordObj: any) => {
    if (wordObj.learned) return;

    const currentStreak = (wordObj.streak || 0) + 1;
    
    if (currentStreak >= 5) {
      updateWordDb(wordObj, { streak: currentStreak, learned: true });
      setSessionLearnedWords(prevLearned => {
        if (!prevLearned.find(w => w.id === wordObj.id)) {
          return [...prevLearned, wordObj];
        }
        return prevLearned;
      });
    } else {
      updateWordDb(wordObj, { streak: currentStreak });
    }
  };

  const handleWordMistake = (wordId: string) => {
    const wordObj = words.find(w => w.id === wordId);
    if (wordObj && !wordObj.learned && (wordObj.streak || 0) > 0) {
      updateWordDb(wordObj, { streak: 0 });
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setPracticeIndex((prev) => {
        const pool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
        if (pool.length === 0) return 0;
        return (prev + 1) % pool.length;
      });
    }, 150); 
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setPracticeIndex((prev) => {
        const pool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
        if (pool.length === 0) return 0;
        return (prev - 1 + pool.length) % pool.length;
      });
    }, 150);
  };

  // --- AUTH UI ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131B39] rounded-2xl shadow-2xl shadow-black/50 shadow-black/40 border border-[#1F294F] p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🇩🇪</div>
            <h1 className="text-2xl font-bold text-gray-100">PractiDE</h1>
          </div>

          {/* RunAuth SSO Primary Button */}
          <button
            type="button"
            onClick={handleRunAuthLogin}
            className="w-full py-3.5 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:opacity-95 transition-all flex justify-center items-center gap-2 text-base border border-indigo-400/30"
          >
            <Shield size={20} /> Login with RunAuth
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-[#1F294F]"></div>
            <span className="px-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">veya yerel giriş</span>
            <div className="flex-1 border-t border-[#1F294F]"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/20 text-red-600 rounded-lg text-sm border border-red-100">
                {authError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                required
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#1F294F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4255FF] text-white"
                placeholder="örn: ahmet123"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Şifre</label>
              <input
                type="password"
                required
                minLength={6}
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#1F294F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4255FF] text-white"
                placeholder="En az 6 karakter"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 mt-4 bg-blue-600 text-white rounded-xl font-bold shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 hover:bg-blue-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {authLoading ? <RotateCcw className="animate-spin" size={20} /> : (authMode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />)}
              {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {authMode === 'login' ? (
              <p>Hesabınız yok mu? <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-blue-600 font-bold hover:underline p-2">Kayıt Ol</button></p>
            ) : (
              <p>Zaten hesabınız var mı? <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-blue-600 font-bold hover:underline p-2">Giriş Yap</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <div className="min-h-screen bg-[#0A0F2C] flex flex-col font-sans">
      {/* Header & Navigation */}
      <header className="bg-[#131B39] shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20 border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            PractiDE
          </h1>
          <nav className="flex flex-wrap justify-center sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'list' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-300 hover:bg-[#1C2545]'
              }`}
            >
              <ListIcon size={18} className="hidden sm:block" /> Listem
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'add' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-300 hover:bg-[#1C2545]'
              }`}
            >
              <Plus size={18} className="hidden sm:block" /> Ekle
            </button>
            <button
              onClick={() => { setActiveTab('practice'); setActiveGame('menu'); }}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'practice' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-300 hover:bg-[#1C2545]'
              }`}
            >
              <Play size={18} className="hidden sm:block" /> Çalış
            </button>
            
            <div className="w-px bg-[#293561] mx-1 h-8 self-center hidden sm:block"></div>
            
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-red-500 hover:bg-red-500/20 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut size={18} /> <span className="hidden sm:block">Çıkış</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col">
        
        {/* LIST TAB */}
        {activeTab === 'list' && (
          <div className="flex-1">
            {fetchingWords ? (
              <div className="flex justify-center items-center h-40">
                <RotateCcw className="animate-spin text-[#4255FF]" size={32} />
              </div>
            ) : words.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 mt-10">
                <div className="w-24 h-24 bg-[#293561] rounded-full flex items-center justify-center mb-6">
                  <ListIcon size={48} className="text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-200 mb-2">Listeniz henüz boş</h2>
                <p className="text-gray-500 mb-6">Yeni kelimeler ekleyerek kendi çalışma setinizi oluşturun.</p>
                <button 
                  onClick={() => setActiveTab('add')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={20} /> İlk Kelimeni Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#131B39] p-4 rounded-xl shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20 border border-[#1F294F]">
                  <span className="text-gray-300">Toplam: <strong>{words.length}</strong> kelime</span>
                  <span className="text-gray-300">Öğrenilen: <strong>{words.filter(w => w.learned).length}</strong></span>
                </div>
                <div className="grid gap-4">
                  {words.map((w) => (
                    <div key={w.id} className={`bg-[#131B39] p-4 sm:p-5 rounded-xl shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20 border flex flex-col sm:flex-row sm:items-center gap-4 transition-all group ${w.learned ? 'border-green-200 bg-green-500/10 opacity-75' : 'border-[#1F294F] hover:shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30'}`}>
                      <div className="flex items-center gap-4 sm:w-1/3">
                        <div className={`px-2 py-1 rounded text-xs font-bold min-w-[3rem] text-center ${articleColors[w.article] || 'bg-[#293561]'}`}>
                          {w.article !== 'diğer' ? w.article : '-'}
                        </div>
                        <h3 className={`text-lg font-bold ${w.learned ? 'line-through text-gray-500' : 'text-gray-100'}`}>{w.word}</h3>
                      </div>
                      
                      <div className="hidden sm:block w-px h-10 bg-[#293561] mx-2"></div>
                      
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className={`text-base font-medium ${w.learned ? 'text-gray-500' : 'text-gray-200'}`}>{w.meaning_tr}</p>
                          {w.meaning_en && <p className="text-sm text-gray-500 mt-1">{w.meaning_en}</p>}
                        </div>
                        
                        <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end">
                          <button 
                            onClick={() => toggleLearned(w)}
                            className={`p-2 rounded-full transition-colors ${w.learned ? 'bg-green-100 text-green-600' : 'bg-[#1C2545] text-gray-500 hover:text-green-600 hover:bg-green-500/20'}`}
                            title={w.learned ? 'Öğrenilmedi İşaretle' : 'Öğrenildi İşaretle'}
                          >
                            <Check size={20} />
                          </button>
                          <button 
                            onClick={() => startEditWord(w)}
                            className="p-2 bg-[#1C2545] text-gray-500 rounded-full hover:text-blue-500 hover:bg-blue-500/20 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil size={20} />
                          </button>
                          <button 
                            onClick={() => deleteWord(w.id)}
                            className="p-2 bg-[#1C2545] text-gray-500 rounded-full hover:text-red-600 hover:bg-red-500/20 transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD TAB */}
        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto w-full bg-[#131B39] rounded-2xl shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20 border border-[#1F294F] overflow-hidden relative">
            <div className="p-6 border-b border-[#1F294F] flex justify-between items-center bg-[#0A0F2C]/50">
              <h2 className="text-xl font-bold text-gray-100">{editingWordId ? 'Kelimeyi Düzenle' : 'Yeni Kelime Ekle'}</h2>
            </div>

            <form onSubmit={addWord} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Almanca Kelime
                </label>
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => {
                      setWord(e.target.value);
                      setLastEdited('de');
                    }}
                    placeholder='örn: Buch, elma, apple'
                    className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#1F294F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4255FF] transition-all text-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Tür / Artikel</label>
                <div className="flex flex-wrap gap-2">
                  {articleOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setArticle(opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        article === opt 
                          ? `${articleColors[opt]} shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 transform scale-105` 
                          : 'bg-[#1C2545] text-gray-300 hover:bg-[#293561]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Türkçe Anlamı</label>
                <input
                  type="text"
                  value={meaningTR}
                  onChange={(e) => {
                    setMeaningTR(e.target.value);
                    setLastEdited('tr');
                  }}
                  placeholder="örn: kitap"
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#1F294F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4255FF] transition-all text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">İngilizce Anlamı (Opsiyonel)</label>
                <input
                  type="text"
                  value={meaningEN}
                  onChange={(e) => {
                    setMeaningEN(e.target.value);
                    setLastEdited('en');
                  }}
                  placeholder="örn: book"
                  className="w-full px-4 py-3 bg-[#0A0F2C] border border-[#1F294F] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4255FF] transition-all text-white"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <p className="text-xs text-gray-500 text-center mb-1">
                  💡 Herhangi bir kutuya kelime yazıp sihirli değneğe basabilirsiniz.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={loading || !(word.trim() || meaningTR.trim() || meaningEN.trim())}
                    className="flex-none px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.98]"
                    title="Kelimeyi Algıla, Çevir ve Otomatik Doldur"
                  >
                    {loading ? <RotateCcw className="animate-spin" size={24} /> : <Wand2 size={24} />}
                  </button>
                  <button
                    type="submit"
                    disabled={!word.trim() || !meaningTR.trim()}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 hover:bg-blue-700 disabled:bg-gray-400 active:scale-[0.98] transition-all"
                  >
                    {editingWordId ? 'Güncelle' : 'Listeye Ekle'}
                  </button>
                  {editingWordId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWordId(null);
                        setWord(''); setArticle('diğer'); setMeaningTR(''); setMeaningEN(''); setLastEdited(null);
                        setActiveTab('list');
                      }}
                      className="flex-1 py-4 bg-[#1C2545] text-white rounded-xl font-bold text-lg shadow-2xl hover:bg-[#293561] transition-all"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === 'practice' && (() => {
          const practicePool = practiceLearnedOnly ? words.filter(w => w.learned) : words;
          const validArticles = ['der', 'die', 'das', 'die (çoğul)'];
          const articlePool = practicePool.filter(w => validArticles.includes(w.article));
          return (
          <div className="flex-1 flex flex-col items-center pb-10">
            {words.length === 0 ? (
              <div className="text-center mt-20">
                <p className="text-gray-500 mb-4">Çalışmak için önce kelime eklemelisiniz.</p>
                <button onClick={() => setActiveTab('add')} className="text-blue-600 font-medium underline">Kelime Ekle</button>
              </div>
            ) : activeGame === 'menu' ? (
              <div className="w-full max-w-3xl mt-10 px-4">
                <h2 className="text-3xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
                  <Play className="text-[#4255FF]" size={36} /> Çalışma Modları
                </h2>
                
                <div className="flex justify-center mb-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <span className={`text-sm font-medium ${practiceLearnedOnly ? 'text-gray-400' : 'text-white'}`}>Tümü</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={practiceLearnedOnly}
                        onChange={(e) => {
                          setPracticeLearnedOnly(e.target.checked);
                          setPracticeIndex(0);
                        }}
                      />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${practiceLearnedOnly ? 'bg-green-500' : 'bg-[#1F294F]'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${practiceLearnedOnly ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <span className={`text-sm font-medium ${practiceLearnedOnly ? 'text-green-400' : 'text-gray-400'}`}>Sadece Öğrenilenler</span>
                  </label>
                </div>
                
                {practiceLearnedOnly && practicePool.length === 0 ? (
                  <div className="text-center p-6 bg-[#131B39] border border-[#1F294F] rounded-2xl">
                    <p className="text-gray-400">Öğrenilmiş kelimeniz bulunmuyor. Lütfen listeden kelimeleri işaretleyin veya oyun oynayarak öğrenin.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <button onClick={() => setActiveGame('flashcards')} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-green-500/20 hover:border-green-500/50 transition-all group flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ListIcon className="text-green-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Kartlar</h3>
                      <p className="text-gray-400 text-sm">Klasik flashcard yöntemiyle kelimeleri ezberleyin.</p>
                    </button>
                    <button onClick={startQuiz} disabled={practicePool.length < 4} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-[#4255FF]/20 hover:border-[#4255FF]/50 transition-all group flex flex-col items-center text-center disabled:opacity-50 disabled:hover:border-[#1F294F] disabled:hover:shadow-none disabled:cursor-not-allowed">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Trophy className="text-[#4255FF]" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Quiz Modu</h3>
                      <p className="text-gray-400 text-sm">{practicePool.length < 4 ? 'En az 4 kelime gerekli' : 'Çoktan seçmeli sorularla bilginizi test edin.'}</p>
                    </button>
                    <button onClick={startMatch} disabled={practicePool.length < 4} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all group flex flex-col items-center text-center disabled:opacity-50 disabled:hover:border-[#1F294F] disabled:hover:shadow-none disabled:cursor-not-allowed">
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Gamepad2 className="text-purple-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Eşleştirme</h3>
                      <p className="text-gray-400 text-sm">{practicePool.length < 4 ? 'En az 4 kelime gerekli' : 'Zamana karşı kelimelerle anlamlarını eşleştirin.'}</p>
                    </button>

                    <button onClick={startTyping} disabled={practicePool.length === 0} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-orange-500/20 hover:border-orange-500/50 transition-all group flex flex-col items-center text-center disabled:opacity-50 disabled:hover:border-[#1F294F] disabled:hover:shadow-none disabled:cursor-not-allowed">
                      <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Keyboard className="text-orange-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Yazma</h3>
                      <p className="text-gray-400 text-sm">{practicePool.length === 0 ? 'Kelime gerekli' : 'Kelimelerin Almancasını yazarak pratik yapın.'}</p>
                    </button>

                    <button onClick={startArticle} disabled={articlePool.length === 0} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-pink-500/20 hover:border-pink-500/50 transition-all group flex flex-col items-center text-center disabled:opacity-50 disabled:hover:border-[#1F294F] disabled:hover:shadow-none disabled:cursor-not-allowed">
                      <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen className="text-pink-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Artikel</h3>
                      <p className="text-gray-400 text-sm">{articlePool.length === 0 ? 'İsim (der/die/das) gerekli' : 'Kelimelerin artikellerini tahmin edin.'}</p>
                    </button>

                    <button onClick={startListening} disabled={practicePool.length === 0} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-yellow-500/20 hover:border-yellow-500/50 transition-all group flex flex-col items-center text-center disabled:opacity-50 disabled:hover:border-[#1F294F] disabled:hover:shadow-none disabled:cursor-not-allowed">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Volume2 className="text-yellow-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Dinleme</h3>
                      <p className="text-gray-400 text-sm">{practicePool.length === 0 ? 'Kelime gerekli' : 'Duyduğunuz kelimenin Almancasını yazın.'}</p>
                    </button>

                    <button onClick={startTf} disabled={practicePool.length < 4} className="bg-[#131B39] border border-[#1F294F] p-6 rounded-2xl shadow-xl hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all group flex flex-col items-center text-center disabled:opacity-50 disabled:hover:border-[#1F294F] disabled:hover:shadow-none disabled:cursor-not-allowed">
                      <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <HelpCircle className="text-cyan-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Doğru / Yanlış</h3>
                      <p className="text-gray-400 text-sm">{practicePool.length < 4 ? 'En az 4 kelime gerekli' : 'Kelime ve anlamı eşleşiyor mu karar verin.'}</p>
                    </button>
                  </div>
                )}
              </div>
            ) : activeGame === 'flashcards' ? (
              <div className="w-full max-w-2xl mt-4 px-4">
                <div className="flex justify-between items-center mb-4 text-gray-500 text-sm font-medium px-4">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <span>Kart {practiceIndex + 1} / {practicePool.length}</span>
                  <span className="flex items-center gap-2">
                    <kbd className="hidden sm:inline-block px-2 py-1 bg-[#1C2545] border border-[#2A365D] rounded-md text-xs font-sans shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20">Space</kbd> Çevir
                    <kbd className="hidden sm:inline-block px-2 py-1 bg-[#1C2545] border border-[#2A365D] rounded-md text-xs font-sans shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20">← →</kbd> Geç
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-[#293561] h-1.5 rounded-full mb-8 overflow-hidden">
                  <div 
                    className="bg-[#4255FF] h-full transition-all duration-300 ease-out" 
                    style={{ width: `${((practiceIndex + 1) / practicePool.length) * 100}%` }}
                  ></div>
                </div>

                <div 
                  className="relative w-full h-[300px] sm:h-[450px] cursor-pointer group perspective-1000"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* Front: German */}
                    <div className="absolute inset-0 backface-hidden bg-[#131B39] rounded-3xl shadow-2xl shadow-black/50 border border-[#1F294F] flex flex-col items-center justify-center p-8">
                      {practicePool[practiceIndex]?.article !== 'diğer' && (
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold mb-6 ${articleColors[practicePool[practiceIndex]?.article] || 'bg-[#293561]'}`}>
                          {practicePool[practiceIndex]?.article}
                        </span>
                      )}
                      <h2 className="text-5xl font-extrabold text-gray-100 text-center break-words w-full">
                        {practicePool[practiceIndex]?.word}
                      </h2>
                      <p className="absolute bottom-6 text-gray-500 text-sm flex items-center gap-2">
                        <RotateCcw size={16} /> Çevirmek için tıkla
                      </p>
                    </div>

                    {/* Back: Meaning */}
                    <div className="absolute inset-0 backface-hidden bg-[#131B39] rounded-3xl shadow-2xl shadow-black/50 border border-[#1F294F] flex flex-col items-center justify-center p-8 rotate-y-180">
                      <div className="flex flex-col items-center justify-center gap-6 w-full">
                        <div className="text-center w-full">
                          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-100 break-words text-center px-2 sm:px-4">{practicePool[practiceIndex]?.meaning_tr}</h2>
                        </div>
                        
                        {practicePool[practiceIndex]?.meaning_en && (
                          <div className="text-center pt-6 border-t border-[#1F294F] w-full px-2 sm:px-4 mx-auto">
                            <h3 className="text-xl sm:text-2xl font-medium text-[#4255FF] break-words text-center">{practicePool[practiceIndex]?.meaning_en}</h3>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevCard(); }}
                    className="flex-1 py-3 sm:py-4 bg-[#131B39] border border-[#1F294F] rounded-xl font-bold text-gray-200 hover:bg-[#0A0F2C] active:scale-[0.98] transition-all shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 shadow-black/20 text-sm sm:text-base"
                  >
                    Önceki
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextCard(); }}
                    className="flex-1 py-3 sm:py-4 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-2xl shadow-black/50 shadow-black/40 shadow-black/30 text-sm sm:text-base"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            ) : activeGame === 'quiz' ? (
              <div className="w-full max-w-2xl mt-4 px-4">
                <div className="flex justify-between items-center mb-6 text-gray-400">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <span>Soru {currentQuestionIndex + 1} / {quizQuestions.length}</span>
                  <span className="font-bold text-[#4255FF]">Skor: {quizScore}</span>
                </div>
                
                {quizFinished ? (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-10 text-center shadow-xl">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="text-green-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Quiz Tamamlandı!</h2>
                    <p className="text-xl text-gray-300 mb-8">Skorunuz: {quizScore} / {quizQuestions.length}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setActiveGame('menu')} className="px-6 py-3 bg-[#1C2545] text-white rounded-xl hover:bg-[#293561] transition-colors">Menüye Dön</button>
                      <button onClick={startQuiz} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"><RotateCcw size={20}/> Tekrar Oyna</button>
                    </div>
                    {sessionLearnedWords.length > 0 && (
                      <div className="mt-10 border-t border-[#1F294F] pt-8">
                        <h3 className="text-xl font-bold text-white mb-4">🎉 Bu Turda Öğrenilen Kelimeler</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sessionLearnedWords.map(w => (
                            <span key={w.id} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-medium border border-green-500/30">
                              {getFullWord(w)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="text-center mb-10">
                      {quizQuestions[currentQuestionIndex]?.article !== 'diğer' && (
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold mb-4 inline-block ${articleColors[quizQuestions[currentQuestionIndex]?.article] || 'bg-[#293561]'}`}>
                          {quizQuestions[currentQuestionIndex]?.article}
                        </span>
                      )}
                      <h2 className="text-3xl sm:text-4xl font-bold text-white break-words">{quizQuestions[currentQuestionIndex]?.word}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quizQuestions[currentQuestionIndex]?.options.map((opt: string, i: number) => {
                        const isCorrect = opt === quizQuestions[currentQuestionIndex].meaning_tr;
                        const isSelected = selectedAnswer === opt;
                        
                        let btnClass = "bg-[#0A0F2C] border-[#1F294F] hover:border-[#4255FF] text-gray-200";
                        if (selectedAnswer) {
                          if (isCorrect) btnClass = "bg-green-500/20 border-green-500 text-white";
                          else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-white";
                          else btnClass = "bg-[#0A0F2C] border-[#1F294F] opacity-50 text-gray-500";
                        }
                        
                        return (
                          <button
                            key={i}
                            disabled={!!selectedAnswer}
                            onClick={() => handleQuizAnswer(opt)}
                            className={`p-4 rounded-xl border-2 transition-all text-lg font-medium break-words ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : activeGame === 'match' ? (
              <div className="w-full max-w-4xl mt-4 px-4">
                <div className="flex justify-between items-center mb-6 text-gray-400">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <div className="flex items-center gap-2 text-xl font-bold text-white">
                    <Timer className="text-[#4255FF]" /> {matchTime}s
                  </div>
                </div>

                {matchFinished ? (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-10 text-center shadow-xl max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Timer className="text-purple-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Harika İş!</h2>
                    <p className="text-xl text-gray-300 mb-8">Tamamlama süreniz: <span className="font-bold text-[#4255FF]">{matchTime}</span> saniye</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setActiveGame('menu')} className="px-6 py-3 bg-[#1C2545] text-white rounded-xl hover:bg-[#293561] transition-colors">Menüye Dön</button>
                      <button onClick={startMatch} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"><RotateCcw size={20}/> Tekrar Oyna</button>
                    </div>
                    {sessionLearnedWords.length > 0 && (
                      <div className="mt-10 border-t border-[#1F294F] pt-8">
                        <h3 className="text-xl font-bold text-white mb-4">🎉 Bu Turda Öğrenilen Kelimeler</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sessionLearnedWords.map(w => (
                            <span key={w.id} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-medium border border-green-500/30">
                              {getFullWord(w)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {matchCards.map((card, index) => {
                      const isFlipped = flippedMatchCards.includes(index);
                      const isMatched = matchedMatchCards.includes(index);
                      
                      return (
                        <div
                          key={index}
                          onClick={() => handleMatchCardClick(index)}
                          className={`
                            h-24 sm:h-32 rounded-xl flex items-center justify-center p-3 sm:p-4 cursor-pointer transition-all duration-300 transform select-none
                            ${isMatched ? 'bg-green-500/20 border-2 border-green-500 opacity-0 pointer-events-none scale-90' : 
                              isFlipped ? 'bg-[#4255FF]/20 border-2 border-[#4255FF] scale-105' : 
                              'bg-[#131B39] border border-[#1F294F] hover:bg-[#1C2545] hover:-translate-y-1 shadow-lg'}
                          `}
                        >
                          <span className={`text-base sm:text-xl font-bold text-center break-words ${isFlipped || isMatched ? 'text-white' : 'text-gray-200'}`}>
                            {card.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeGame === 'typing' ? (
              <div className="w-full max-w-2xl mt-4 px-4">
                <div className="flex justify-between items-center mb-6 text-gray-400">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <span>Soru {currentTypingIndex + 1} / {typingQuestions.length}</span>
                  <span className="font-bold text-[#4255FF]">Skor: {typingScore}</span>
                </div>

                {typingFinished ? (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-10 text-center shadow-xl">
                    <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="text-orange-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Harika İş!</h2>
                    <p className="text-xl text-gray-300 mb-8">Skorunuz: {typingScore} / {typingQuestions.length}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setActiveGame('menu')} className="px-6 py-3 bg-[#1C2545] text-white rounded-xl hover:bg-[#293561] transition-colors">Menüye Dön</button>
                      <button onClick={startTyping} className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2"><RotateCcw size={20}/> Tekrar Oyna</button>
                    </div>
                    {sessionLearnedWords.length > 0 && (
                      <div className="mt-10 border-t border-[#1F294F] pt-8">
                        <h3 className="text-xl font-bold text-white mb-4">🎉 Bu Turda Öğrenilen Kelimeler</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sessionLearnedWords.map(w => (
                            <span key={w.id} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-medium border border-green-500/30">
                              {getFullWord(w)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-6 sm:p-8 shadow-xl text-center">
                    <p className="text-gray-400 mb-2">Almancasını yazın (Varsa artikeliyle):</p>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white break-words mb-8">{typingQuestions[currentTypingIndex]?.meaning_tr}</h2>

                    <form onSubmit={handleTypingSubmit} className="max-w-md mx-auto">
                      <div className="relative">
                        <input
                          type="text"
                          value={typingInput}
                          onChange={(e) => setTypingInput(e.target.value)}
                          disabled={typingStatus !== 'idle'}
                          autoFocus
                          className={`w-full px-6 py-4 bg-[#0A0F2C] border-2 rounded-xl text-xl text-center focus:outline-none transition-colors text-white ${
                            typingStatus === 'idle' ? 'border-[#1F294F] focus:border-[#4255FF]' :
                            typingStatus === 'correct' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                          }`}
                          placeholder="Cevabınız..."
                        />
                        {typingStatus === 'correct' && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={24} />}
                        {typingStatus === 'incorrect' && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={24} />}
                      </div>

                      {typingStatus === 'incorrect' && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-medium text-lg">
                          Doğru Cevap: <span className="font-bold text-white">{getFullWord(typingQuestions[currentTypingIndex])}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!typingInput.trim() || typingStatus !== 'idle'}
                        className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {typingStatus !== 'idle' ? 'Geçiliyor...' : 'Kontrol Et'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : activeGame === 'article' ? (
              <div className="w-full max-w-2xl mt-4 px-4">
                <div className="flex justify-between items-center mb-6 text-gray-400">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <span>Soru {currentArticleIndex + 1} / {articleQuestions.length}</span>
                  <span className="font-bold text-[#4255FF]">Skor: {articleScore}</span>
                </div>
                
                {articleFinished ? (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-10 text-center shadow-xl">
                    <div className="w-24 h-24 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="text-pink-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Artikel Quiz Bitti!</h2>
                    <p className="text-xl text-gray-300 mb-8">Skorunuz: {articleScore} / {articleQuestions.length}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setActiveGame('menu')} className="px-6 py-3 bg-[#1C2545] text-white rounded-xl hover:bg-[#293561] transition-colors">Menüye Dön</button>
                      <button onClick={startArticle} className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors flex items-center gap-2"><RotateCcw size={20}/> Tekrar Oyna</button>
                    </div>
                    {sessionLearnedWords.length > 0 && (
                      <div className="mt-10 border-t border-[#1F294F] pt-8">
                        <h3 className="text-xl font-bold text-white mb-4">🎉 Bu Turda Öğrenilen Kelimeler</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sessionLearnedWords.map(w => (
                            <span key={w.id} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-medium border border-green-500/30">
                              {getFullWord(w)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-6 sm:p-8 shadow-xl text-center">
                    <p className="text-gray-400 mb-2">Artikeli nedir?</p>
                    <h2 className="text-4xl font-bold text-white mb-2">___ {articleQuestions[currentArticleIndex]?.word}</h2>
                    <p className="text-gray-500 mb-10">{articleQuestions[currentArticleIndex]?.meaning_tr}</p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      {['der', 'die', 'das', 'die (çoğul)'].map((art) => {
                        const isCorrect = art === articleQuestions[currentArticleIndex]?.article;
                        const isSelected = selectedArticleAnswer === art;
                        
                        let btnClass = "bg-[#0A0F2C] border-[#1F294F] hover:border-[#4255FF] text-gray-200";
                        if (selectedArticleAnswer) {
                          if (isCorrect) btnClass = "bg-green-500/20 border-green-500 text-white";
                          else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-white";
                          else btnClass = "bg-[#0A0F2C] border-[#1F294F] opacity-50 text-gray-500";
                        }
                        
                        return (
                          <button
                            key={art}
                            disabled={!!selectedArticleAnswer}
                            onClick={() => handleArticleAnswer(art)}
                            className={`p-4 rounded-xl border-2 transition-all text-xl font-bold ${btnClass}`}
                          >
                            {art}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : activeGame === 'listening' ? (
              <div className="w-full max-w-2xl mt-4 px-4">
                <div className="flex justify-between items-center mb-6 text-gray-400">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <span>Soru {currentListeningIndex + 1} / {listeningQuestions.length}</span>
                  <span className="font-bold text-[#4255FF]">Skor: {listeningScore}</span>
                </div>

                {listeningFinished ? (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-10 text-center shadow-xl">
                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="text-yellow-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Harika İş!</h2>
                    <p className="text-xl text-gray-300 mb-8">Skorunuz: {listeningScore} / {listeningQuestions.length}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setActiveGame('menu')} className="px-6 py-3 bg-[#1C2545] text-white rounded-xl hover:bg-[#293561] transition-colors">Menüye Dön</button>
                      <button onClick={startListening} className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors flex items-center gap-2"><RotateCcw size={20}/> Tekrar Oyna</button>
                    </div>
                    {sessionLearnedWords.length > 0 && (
                      <div className="mt-10 border-t border-[#1F294F] pt-8">
                        <h3 className="text-xl font-bold text-white mb-4">🎉 Bu Turda Öğrenilen Kelimeler</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sessionLearnedWords.map(w => (
                            <span key={w.id} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-medium border border-green-500/30">
                              {getFullWord(w)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-6 sm:p-8 shadow-xl text-center">
                    <button 
                      onClick={() => playAudio(getFullWord(listeningQuestions[currentListeningIndex]))}
                      className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-8 hover:scale-110 transition-transform hover:bg-yellow-500/30 active:scale-95"
                    >
                      <Volume2 className="text-yellow-500" size={40} />
                    </button>
                    <p className="text-gray-400 mb-6">Duyduğunuz kelimenin Almancasını yazın (Varsa artikeliyle):</p>

                    <form onSubmit={handleListeningSubmit} className="max-w-md mx-auto">
                      <div className="relative">
                        <input
                          type="text"
                          value={listeningInput}
                          onChange={(e) => setListeningInput(e.target.value)}
                          disabled={listeningStatus !== 'idle'}
                          autoFocus
                          className={`w-full px-6 py-4 bg-[#0A0F2C] border-2 rounded-xl text-xl text-center focus:outline-none transition-colors text-white ${
                            listeningStatus === 'idle' ? 'border-[#1F294F] focus:border-[#4255FF]' :
                            listeningStatus === 'correct' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                          }`}
                          placeholder="Cevabınız..."
                        />
                        {listeningStatus === 'correct' && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={24} />}
                        {listeningStatus === 'incorrect' && <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={24} />}
                      </div>

                      {listeningStatus === 'incorrect' && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-medium text-lg">
                          Doğru Cevap: <span className="font-bold text-white">{getFullWord(listeningQuestions[currentListeningIndex])}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!listeningInput.trim() || listeningStatus !== 'idle'}
                        className="w-full mt-6 py-4 bg-yellow-600 text-white rounded-xl font-bold text-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                      >
                        {listeningStatus !== 'idle' ? 'Geçiliyor...' : 'Kontrol Et'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : activeGame === 'tf' ? (
              <div className="w-full max-w-2xl mt-4 px-4">
                <div className="flex justify-between items-center mb-6 text-gray-400">
                  <button onClick={() => setActiveGame('menu')} className="hover:text-white transition-colors">← Geri</button>
                  <span>Soru {currentTfIndex + 1} / {tfQuestions.length}</span>
                  <span className="font-bold text-[#4255FF]">Skor: {tfScore}</span>
                </div>
                
                {tfFinished ? (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-10 text-center shadow-xl">
                    <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="text-cyan-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Oyun Bitti!</h2>
                    <p className="text-xl text-gray-300 mb-8">Skorunuz: {tfScore} / {tfQuestions.length}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setActiveGame('menu')} className="px-6 py-3 bg-[#1C2545] text-white rounded-xl hover:bg-[#293561] transition-colors">Menüye Dön</button>
                      <button onClick={startTf} className="px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors flex items-center gap-2"><RotateCcw size={20}/> Tekrar Oyna</button>
                    </div>
                    {sessionLearnedWords.length > 0 && (
                      <div className="mt-10 border-t border-[#1F294F] pt-8">
                        <h3 className="text-xl font-bold text-white mb-4">🎉 Bu Turda Öğrenilen Kelimeler</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {sessionLearnedWords.map(w => (
                            <span key={w.id} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-medium border border-green-500/30">
                              {getFullWord(w)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#131B39] border border-[#1F294F] rounded-2xl p-6 sm:p-8 shadow-xl text-center">
                    <div className="mb-10">
                      <h2 className="text-4xl font-bold text-white mb-6 break-words">{getFullWord(tfQuestions[currentTfIndex]?.wordObj)}</h2>
                      <div className="w-12 h-1 bg-[#1F294F] mx-auto mb-6 rounded-full"></div>
                      <p className="text-2xl text-gray-300 break-words">{tfQuestions[currentTfIndex]?.displayedMeaning}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <button
                        disabled={tfStatus !== 'idle'}
                        onClick={() => handleTfAnswer(true)}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                          tfSelected === 'true' 
                            ? (tfStatus === 'correct' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400')
                            : (tfStatus !== 'idle' && tfQuestions[currentTfIndex]?.isMatch) ? 'bg-green-500/20 border-green-500 text-green-400 opacity-50' : 'bg-[#0A0F2C] border-[#1F294F] hover:border-green-500 text-gray-200 hover:text-green-400'
                        }`}
                      >
                        <CheckCircle size={32} />
                        <span className="font-bold text-xl">Doğru</span>
                      </button>
                      
                      <button
                        disabled={tfStatus !== 'idle'}
                        onClick={() => handleTfAnswer(false)}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                          tfSelected === 'false' 
                            ? (tfStatus === 'correct' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400')
                            : (tfStatus !== 'idle' && !tfQuestions[currentTfIndex]?.isMatch) ? 'bg-green-500/20 border-green-500 text-green-400 opacity-50' : 'bg-[#0A0F2C] border-[#1F294F] hover:border-red-500 text-gray-200 hover:text-red-400'
                        }`}
                      >
                        <XCircle size={32} />
                        <span className="font-bold text-xl">Yanlış</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          );
        })()}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}