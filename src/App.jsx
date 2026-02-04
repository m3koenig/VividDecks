import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Brain, Layers, Settings, TrendingUp, Plus, Play, Trash2,
  ChevronRight, CheckCircle2, XCircle, RotateCcw, LayoutGrid,
  Moon, Sun, Share2, Award, BookOpen, Download, Upload,
  X, FileJson, Languages, Globe2, Send, FastForward, History,
  Check, AlertCircle, Keyboard, ThumbsUp, ThumbsDown, Copy, Link2
} from 'lucide-react';

/**
 * Vivid Decks v2.1
 * - Restored original start decks
 * - Restored session history protocol
 * - Restored % progress indicator
 * - Seed System for sharing via URL
 * - Minimalist, generic wording
 */

const DEFAULT_DECKS = [
  {
    id: 'vivid-en',
    name: 'Sprache: Englisch',
    description: 'Basis-Vokabular für den Alltag.',
    cards: [
      { id: 'en-1', front: 'Hund', back: 'Dog', box: 1 },
      { id: 'en-2', front: 'Katze', back: 'Cat', box: 1 },
      { id: 'en-3', front: 'Blau', back: 'Blue', box: 1 },
      { id: 'en-4', front: 'Apfel', back: 'Apple', box: 1 }
    ]
  },
  {
    id: 'vivid-es',
    name: 'Sprache: Spanisch',
    description: 'Begrüßungen und einfache Zahlen.',
    cards: [
      { id: 'es-1', front: 'Hallo', back: 'Hola', box: 1 },
      { id: 'es-2', front: 'Danke', back: 'Gracias', box: 1 },
      { id: 'es-3', front: 'Bitte', back: 'Por favor', box: 1 },
      { id: 'es-4', front: 'Eins, zwei, drei', back: 'Uno, dos, tres', box: 1 }
    ]
  },
  {
    id: 'vivid-it',
    name: 'Sprache: Italienisch',
    description: 'Essen und höfliche Phrasen.',
    cards: [
      { id: 'it-1', front: 'Guten Tag', back: 'Buongiorno', box: 1 },
      { id: 'it-2', front: 'Tschüss', back: 'Ciao', box: 1 },
      { id: 'it-3', front: 'Lecker', back: 'Delizioso', box: 1 },
      { id: 'it-4', front: 'Frühstück', back: 'Colazione', box: 1 }
    ]
  }
];

const App = () => {
  const [decks, setDecks] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed');
    if (seed) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(seed)));
        return Array.isArray(decoded) ? decoded : [decoded];
      } catch (e) {
        console.error("Invalid seed");
      }
    }
    const saved = localStorage.getItem('vivid_decks_v21');
    return saved ? JSON.parse(saved) : DEFAULT_DECKS;
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState(null);
  const [notification, setNotification] = useState(null);

  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const fileInputRef = useRef(null);
  const answerInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('vivid_decks_v21', JSON.stringify(decks));
  }, [decks]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeView !== 'learn' || !session || session.isFinished) return;
      if (isAnswerChecked) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); nextCard(); }
      } else {
        if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, isAnswerChecked, session, userAnswer]);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getSuccessRate = (deck) => {
    if (!deck.cards || deck.cards.length === 0) return 0;
    const learnedCards = deck.cards.filter(c => c.box > 1).length;
    return Math.round((learnedCards / deck.cards.length) * 100);
  };

  const copyShareLink = (deck) => {
    const seed = btoa(JSON.stringify(deck));
    const url = new URL(window.location.href);
    url.searchParams.set('seed', seed);
    const link = url.toString();

    const textArea = document.createElement("textarea");
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      notify('Link kopiert!');
    } catch (err) {
      notify('Fehler');
    }
    document.body.removeChild(textArea);
  };

  const startSession = (deck) => {
    if (deck.cards.length === 0) return notify('Deck leer');
    setSession({
      deckId: deck.id,
      deckName: deck.name,
      cards: [...deck.cards].sort(() => Math.random() - 0.5),
      currentIndex: 0,
      results: { correct: 0, wrong: 0 },
      history: [],
      isFinished: false
    });
    setUserAnswer('');
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setActiveView('learn');
    setTimeout(() => answerInputRef.current?.focus(), 100);
  };

  const checkAnswer = () => {
    if (isAnswerChecked) return;
    const currentCard = session.cards[session.currentIndex];
    const correctVal = currentCard.back.trim().toLowerCase();
    const userVal = userAnswer.trim().toLowerCase();

    const correct = userVal === correctVal;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    const historyEntry = {
      front: currentCard.front,
      back: currentCard.back,
      input: userVal || "(Leer)",
      isCorrect: correct
    };

    setSession(prev => ({ ...prev, history: [...prev.history, historyEntry] }));

    const newBox = correct ? Math.min(currentCard.box + 1, 5) : 1;
    setDecks(prev => prev.map(d => d.id === session.deckId ? {
      ...d,
      cards: d.cards.map(c => c.id === currentCard.id ? { ...c, box: newBox } : c)
    } : d));
  };

  const nextCard = () => {
    const resultsUpdate = {
      correct: session.results.correct + (isCorrect ? 1 : 0),
      wrong: session.results.wrong + (isCorrect ? 0 : 1)
    };

    if (session.currentIndex < session.cards.length - 1) {
      setSession(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        results: resultsUpdate
      }));
      setUserAnswer('');
      setIsAnswerChecked(false);
      setIsCorrect(null);
      setTimeout(() => answerInputRef.current?.focus(), 50);
    } else {
      setSession(prev => ({ ...prev, results: resultsUpdate, isFinished: true }));
    }
  };

  const activeDeck = useMemo(() => decks.find(d => d.id === selectedDeckId), [decks, selectedDeckId]);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${darkMode ? 'bg-[#08080a] text-zinc-100' : 'bg-[#f4f7f9] text-zinc-900'}`}>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-[600px] h-[600px] blur-[120px] rounded-full ${darkMode ? 'bg-indigo-600/30' : 'bg-indigo-400/20'}`} />
      </div>

      {/* Navigation */}
      <nav className={`fixed z-[100] transition-all bottom-0 left-0 right-0 h-20 md:h-screen md:w-20 lg:w-64 md:top-0 md:border-r border-t md:border-t-0 flex md:flex-col items-center p-2 md:p-6 gap-6 ${darkMode ? 'bg-black/80 border-white/5' : 'bg-white/90 border-black/5'} backdrop-blur-xl`}>
        <div className="hidden md:flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Brain className="text-white" size={20} /></div>
          <span className="hidden lg:block font-black tracking-tighter text-xl uppercase italic">Vivid</span>
        </div>

        <div className="flex md:flex-col flex-1 w-full gap-2">
          {[
            { id: 'dashboard', icon: LayoutGrid, label: 'Kollektion' },
            { id: 'stats', icon: TrendingUp, label: 'Status' },
            { id: 'settings', icon: Settings, label: 'Optionen' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setSession(null); }}
              className={`flex-1 md:flex-none flex flex-col lg:flex-row items-center gap-3 p-3 lg:p-4 rounded-2xl transition-all ${activeView === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'opacity-40 hover:opacity-100 hover:bg-white/5'
                }`}
            >
              <item.icon size={20} />
              <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => setDarkMode(!darkMode)} className="p-4 rounded-2xl opacity-40 hover:opacity-100 transition-all md:mt-auto">
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <main className="md:ml-20 lg:ml-64 pb-32 md:pb-12 relative z-10">
        <div className="max-w-6xl mx-auto p-6 md:p-12">

          {activeView === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none uppercase">Vivid Decks</h1>
                  <p className="opacity-30 font-black mt-4 uppercase text-[10px] tracking-[0.4em]">Personal Knowledge System</p>
                </div>
                <button onClick={() => {
                  const name = prompt('Name:');
                  if (name) setDecks([...decks, { id: Date.now(), name, description: 'Eigene Sammlung', cards: [] }]);
                }} className="w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                  <Plus size={28} />
                </button>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map(deck => {
                  const rate = getSuccessRate(deck);
                  return (
                    <div key={deck.id} className={`group p-8 rounded-[2.5rem] border transition-all hover:-translate-y-2 flex flex-col relative ${darkMode ? 'bg-zinc-900/40 border-white/5 hover:border-white/20' : 'bg-white border-black/5 shadow-xl'}`}>
                      <div className="flex justify-between items-start mb-8">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                          <BookOpen size={24} />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => copyShareLink(deck)} className="p-3 opacity-0 group-hover:opacity-100 transition-all text-indigo-500 hover:bg-indigo-500/10 rounded-xl" title="Teilen">
                            <Link2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-2xl font-black mb-1 italic tracking-tight">{deck.name}</h3>
                        <p className="text-[10px] font-black uppercase opacity-20 tracking-widest">{deck.cards.length} Einheiten</p>
                      </div>

                      <div className="mb-10 space-y-2">
                        <div className="flex justify-between items-end px-1">
                          <span className="text-[10px] font-black uppercase opacity-40">Status</span>
                          <span className="text-xs font-black text-indigo-500">{rate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${rate}%` }} />
                        </div>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <button onClick={() => { setSelectedDeckId(deck.id); setActiveView('editor'); }} className={`p-4 rounded-xl border transition-all ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'}`}><Settings size={18} /></button>
                        <button onClick={() => startSession(deck)} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-indigo-600/20">
                          <Play size={16} fill="currentColor" /> Start
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === 'editor' && activeDeck && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 opacity-30 hover:opacity-100 font-black text-[10px] uppercase tracking-widest"><ChevronRight className="rotate-180" /> Zurück</button>
              <h2 className="text-4xl font-black italic tracking-tighter">{activeDeck.name}</h2>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className={`p-8 rounded-[2rem] border sticky top-8 ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-black/5 shadow-xl'}`}>
                    <h2 className="text-xl font-black mb-6 italic">Neu</h2>
                    <div className="space-y-4">
                      <input id="f-in" placeholder="Inhalt..." className="w-full p-5 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-indigo-500/50 font-bold" />
                      <input id="b-in" placeholder="Lösung..." className="w-full p-5 rounded-2xl bg-black/20 border border-white/10 outline-none focus:border-indigo-500/50 font-bold italic" />
                      <button onClick={() => {
                        const f = document.getElementById('f-in');
                        const b = document.getElementById('b-in');
                        if (f.value && b.value) {
                          setDecks(decks.map(d => d.id === selectedDeckId ? { ...d, cards: [...d.cards, { id: Date.now(), front: f.value, back: b.value, box: 1 }] } : d));
                          f.value = ''; b.value = ''; f.focus();
                        }
                      }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">Hinzufügen</button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-3">
                  {activeDeck.cards.map(card => (
                    <div key={card.id} className={`p-6 rounded-2xl border flex justify-between items-center ${darkMode ? 'bg-zinc-900/20 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <p className="font-bold">{card.front}</p>
                        <p className="italic font-bold text-indigo-500">{card.back}</p>
                      </div>
                      <button onClick={() => setDecks(decks.map(d => d.id === selectedDeckId ? { ...d, cards: d.cards.filter(c => c.id !== card.id) } : d))} className="p-3 text-rose-500/40 hover:text-rose-500"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'learn' && session && (
            <div className="max-w-3xl mx-auto py-4 space-y-8">
              {!session.isFinished ? (
                <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-black italic text-lg opacity-40">{session.currentIndex + 1}</span>
                      <span className="opacity-10 font-black">/</span>
                      <span className="font-black italic text-lg opacity-40">{session.cards.length}</span>
                    </div>
                    <button onClick={() => setActiveView('dashboard')} className="p-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-full transition-all"><X size={20} /></button>
                  </div>

                  <div className={`relative p-12 md:p-24 rounded-[4rem] border text-center transition-all duration-500 ${isAnswerChecked
                      ? isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-rose-500/10 border-rose-500/30'
                      : (darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-black/5 shadow-2xl')
                    }`}>

                    {isAnswerChecked && (
                      <div className={`absolute top-10 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 animate-in slide-in-from-top-4 ${isCorrect ? 'bg-green-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                        {isCorrect ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                        {isCorrect ? 'Richtig' : 'Falsch'}
                      </div>
                    )}

                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-20 leading-tight">{session.cards[session.currentIndex].front}</h2>

                    <div className="max-w-sm mx-auto space-y-4">
                      <input
                        ref={answerInputRef} autoFocus type="text" value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={isAnswerChecked} placeholder="..."
                        className={`w-full py-6 px-10 rounded-3xl text-center text-xl font-black bg-black/20 border-2 outline-none transition-all ${isAnswerChecked ? (isCorrect ? 'border-green-500 text-green-500' : 'border-rose-500 text-rose-500') : 'border-white/10 focus:border-indigo-500'
                          }`}
                      />

                      {isAnswerChecked && !isCorrect && (
                        <div className="p-6 bg-rose-500/10 rounded-3xl border border-rose-500/20 animate-in fade-in">
                          <p className="text-2xl font-black italic text-rose-500">{session.cards[session.currentIndex].back}</p>
                        </div>
                      )}

                      <div className="pt-6">
                        {!isAnswerChecked ? (
                          <button onClick={checkAnswer} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                            <Check size={16} /> Prüfen
                          </button>
                        ) : (
                          <button onClick={nextCard} className={`w-full py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-transform active:scale-95 ${isCorrect ? 'bg-green-600 text-white' : 'bg-zinc-800 text-white'}`}>
                            Weiter <ChevronRight size={16} />
                          </button>
                        )}
                        <div className="mt-4 flex items-center justify-center gap-2 opacity-10">
                          <Keyboard size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Enter / Space</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                  <div className={`p-16 text-center space-y-8 rounded-[4rem] border ${darkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-black/5 shadow-xl'}`}>
                    <Award className="mx-auto text-indigo-500" size={64} />
                    <h2 className="text-5xl font-black italic tracking-tighter uppercase">Abgeschlossen</h2>
                    <div className="flex gap-4 max-w-xs mx-auto">
                      <div className="flex-1 p-6 rounded-3xl bg-green-500/10 border border-green-500/20">
                        <p className="text-3xl font-black text-green-500">{session.results.correct}</p>
                      </div>
                      <div className="flex-1 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                        <p className="text-3xl font-black text-rose-500">{session.results.wrong}</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveView('dashboard')} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px]">Dashboard</button>
                  </div>

                  <div className={`p-8 rounded-[3rem] border ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-black/5 shadow-xl'}`}>
                    <h3 className="text-xl font-black italic mb-8 flex items-center gap-3 opacity-40 uppercase tracking-widest text-[10px]"><History size={16} /> Protokoll</h3>
                    <div className="space-y-3">
                      {session.history.map((item, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 border ${item.isCorrect ? 'bg-green-500/5 border-green-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{item.front}</p>
                          </div>
                          <div className="flex-1 border-l border-white/5 pl-4">
                            <span className="text-[10px] font-black uppercase opacity-30 block mb-1">Deine Antwort</span>
                            <p className={`font-black ${item.isCorrect ? 'text-green-500' : 'text-rose-500'}`}>{item.input}</p>
                          </div>
                          {!item.isCorrect && (
                            <div className="flex-1 border-l border-white/5 pl-4">
                              <span className="text-[10px] font-black uppercase opacity-30 block mb-1">Lösung</span>
                              <p className="font-black italic text-indigo-500">{item.back}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'stats' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-12">
              <h2 className="text-6xl font-black italic tracking-tighter">Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Einheiten', value: decks.reduce((acc, d) => acc + d.cards.length, 0), color: 'text-indigo-500' },
                  { label: 'Meister', value: decks.reduce((acc, d) => acc + d.cards.filter(c => c.box === 5).length, 0), color: 'text-green-500' },
                  { label: 'Level', value: Math.floor(decks.reduce((acc, d) => acc + d.cards.reduce((sum, c) => sum + (c.box - 1), 0), 0) / 5), color: 'text-yellow-500' }
                ].map((stat, i) => (
                  <div key={i} className={`p-10 rounded-[3rem] border ${darkMode ? 'bg-zinc-900/40 border-white/5 shadow-2xl' : 'bg-white border-black/5 shadow-xl'}`}>
                    <span className="text-[10px] font-black opacity-30 uppercase tracking-widest block mb-4">{stat.label}</span>
                    <p className={`text-7xl font-black italic leading-none ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in duration-500">
              <h2 className="text-6xl font-black italic tracking-tighter">Optionen</h2>
              <div className={`p-10 rounded-[3rem] border space-y-6 ${darkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-black/5 shadow-xl'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => {
                    const blob = new Blob([JSON.stringify(decks)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'vivid_backup.json'; a.click();
                  }} className="p-8 rounded-[2rem] border border-white/10 hover:bg-white/5 transition-all flex flex-col gap-4 items-center group">
                    <Download className="text-indigo-500" size={32} />
                    <span className="font-black text-[10px] uppercase tracking-widest">Backup</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-8 rounded-[2rem] border border-white/10 hover:bg-white/5 transition-all flex flex-col gap-4 items-center group">
                    <Upload className="text-purple-500" size={32} />
                    <span className="font-black text-[10px] uppercase tracking-widest">Import</span>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => { try { setDecks(JSON.parse(ev.target.result)); notify('Daten geladen'); } catch (e) { notify('Fehler'); } };
                  reader.readAsText(file);
                }} className="hidden" accept=".json" />
                <button onClick={() => { if (confirm('Alles löschen?')) { setDecks(DEFAULT_DECKS); notify('Reset'); } }} className="w-full p-6 rounded-2xl border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/5 transition-all">Alles Zurücksetzen</button>
              </div>
            </div>
          )}

        </div>
      </main>

      {notification && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 px-8 py-5 bg-white text-black dark:bg-zinc-100 rounded-full shadow-2xl z-[150] flex items-center gap-4 animate-in slide-in-from-bottom-8">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="font-black text-[10px] uppercase tracking-widest">{notification}</span>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: fade-in 0.5s ease-out forwards; }
        .slide-in-from-bottom-4 { transform: translateY(1rem); }
        .slide-in-from-bottom-8 { transform: translateY(2rem); }
        .slide-in-from-top-4 { transform: translateY(-1rem); }
        .zoom-in-95 { transform: scale(0.95); }
        input::placeholder { opacity: 0.1; }
      `}</style>
    </div>
  );
};

export default App;