import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Brain, Layout,
  Download, Upload, Share2,
  ChevronLeft, Play, Check, X,
  Trophy, ArrowRight, Sun, Moon,
  Eye, Save, Send, Database, GraduationCap,
  Layers, MessageSquare, HelpCircle, Activity,
  Globe, Languages, TrendingUp, Target, AlertTriangle,
  StickyNote, Type, ChevronDown
} from 'lucide-react';

/**
 * MindCard (Vivid Decks)
 * Version: 1.1.4 (Advanced Review)
 * Stabile Version mit Papier-UI und Seed-System.
 */

const StatusIcon = ({ name }) => {
  switch (name) {
    case 'plus': return <Plus size={18} />;
    case 'save': return <Save size={18} />;
    case 'download': return <Download size={18} />;
    case 'upload': return <Upload size={18} />;
    case 'share': return <Share2 size={18} />;
    case 'send': return <Send size={18} />;
    case 'error': return <X size={18} />;
    default: return null;
  }
};

const App = () => {
  // --- States ---
  const [decks, setDecks] = useState(() => {
    const saved = localStorage.getItem('mindcard_decks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [activeTab, setActiveTab] = useState('manage');
  const [statusMsg, setStatusMsg] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('mindcard_darkmode') === 'true';
  });

  const [fontStyle, setFontStyle] = useState(() => {
    return localStorage.getItem('mindcard_font') || 'serif';
  });

  const [session, setSession] = useState(null);
  const [isNewCardAnimating, setIsNewCardAnimating] = useState(false);

  const [newDeckName, setNewDeckName] = useState('');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [seedInput, setSeedInput] = useState('');

  const fileInputRef = useRef(null);
  const answerInputRef = useRef(null);

  // Memoized Selection
  const selectedDeck = useMemo(() =>
    decks.find(d => d.id === selectedDeckId) || null,
    [decks, selectedDeckId]
  );

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('mindcard_decks', JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem('mindcard_darkmode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('mindcard_font', fontStyle);
  }, [fontStyle]);

  // Demo-Daten Initialisierung
  useEffect(() => {
    if (decks.length === 0) {
      const demoData = [
        {
          id: 'deck-spanisch',
          name: 'Spanisch Basics',
          cards: [
            { id: 's1', front: 'Hola', back: 'Hallo' },
            { id: 's2', front: 'Gracias', back: 'Danke' },
            { id: 's3', front: 'Por favor', back: 'Bitte' },
            { id: 's4', front: 'Cerveza', back: 'Bier' },
            { id: 's5', front: 'La cuenta', back: 'Die Rechnung' }
          ],
          stats: { bestPercent: 0, lastPercent: 0, lastCorrect: 0, lastWrong: 0 },
          createdAt: new Date().toISOString()
        },
        {
          id: 'deck-capitals',
          name: 'Hauptstädte Europa',
          cards: [
            { id: 'cap1', front: 'Frankreich', back: 'Paris' },
            { id: 'cap2', front: 'Spanien', back: 'Madrid' },
            { id: 'cap3', front: 'Italien', back: 'Rom' },
            { id: 'cap4', front: 'Norwegen', back: 'Oslo' },
            { id: 'cap5', front: 'Polen', back: 'Warschau' }
          ],
          stats: { bestPercent: 0, lastPercent: 0, lastCorrect: 0, lastWrong: 0 },
          createdAt: new Date().toISOString()
        }
      ];
      setDecks(demoData);
      setSelectedDeckId('deck-spanisch');
    }
  }, []);

  useEffect(() => {
    if (session && !session.showResult && !session.finished && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [session?.currentIndex, session?.showResult, session?.finished]);

  // --- Handlers ---
  const showStatus = (iconName) => {
    setStatusMsg(iconName);
    setTimeout(() => setStatusMsg(null), 2000);
  };

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck = {
      id: `d-${Date.now()}`,
      name: newDeckName,
      cards: [],
      stats: { bestPercent: 0, lastPercent: 0, lastCorrect: 0, lastWrong: 0 },
      createdAt: new Date().toISOString()
    };
    setDecks([...decks, newDeck]);
    setNewDeckName('');
    showStatus('plus');
  };

  const deleteDeck = (id) => {
    setDecks(decks.filter(d => d.id !== id));
    if (selectedDeckId === id) setSelectedDeckId(null);
  };

  const addCard = (deckId) => {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    setDecks(decks.map(deck => {
      if (deck.id === deckId) {
        return {
          ...deck,
          cards: [...deck.cards, { id: `c-${Date.now()}`, front: newCardFront, back: newCardBack }]
        };
      }
      return deck;
    }));
    setNewCardFront('');
    setNewCardBack('');
    showStatus('save');
  };

  const deleteCard = (deckId, cardId) => {
    setDecks(decks.map(deck => {
      if (deck.id === deckId) {
        return { ...deck, cards: deck.cards.filter(c => c.id !== cardId) };
      }
      return deck;
    }));
  };

  const startLearning = (deck) => {
    if (deck.cards.length === 0) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setActiveTab('learn');
    setSession({
      deckId: deck.id,
      deckName: deck.name,
      cards: shuffled,
      currentIndex: 0,
      userInput: '',
      showResult: false,
      results: { correct: 0, wrong: 0 },
      wrongAnswers: [],
      finished: false
    });
  };

  const checkAnswer = () => {
    if (!session || session.showResult) return;
    const currentCard = session.cards[session.currentIndex];
    const isCorrect = session.userInput.trim().toLowerCase() === currentCard.back.trim().toLowerCase();

    setSession({
      ...session,
      showResult: true,
      wrongAnswers: isCorrect ? session.wrongAnswers : [...session.wrongAnswers, { ...currentCard, userType: session.userInput }],
      results: {
        correct: session.results.correct + (isCorrect ? 1 : 0),
        wrong: session.results.wrong + (isCorrect ? 0 : 1)
      }
    });
  };

  const nextCard = () => {
    if (!session) return;
    const isLast = session.currentIndex === session.cards.length - 1;
    if (isLast) {
      const percent = Math.round((session.results.correct / session.cards.length) * 100);
      setDecks(prev => prev.map(d => d.id === session.deckId ? {
        ...d,
        stats: { ...d.stats, bestPercent: Math.max(d.stats.bestPercent, percent), lastPercent: percent }
      } : d));
      setSession({ ...session, finished: true });
    } else {
      setIsNewCardAnimating(true);
      setTimeout(() => {
        setSession(prev => ({ ...prev, showResult: false, userInput: '', currentIndex: prev.currentIndex + 1 }));
        setIsNewCardAnimating(false);
      }, 300);
    }
  };

  const generateSeed = (deck) => {
    try {
      const minimal = { n: deck.name, c: deck.cards.map(c => [c.front, c.back]) };
      const seed = btoa(unescape(encodeURIComponent(JSON.stringify(minimal))));

      const textArea = document.createElement("textarea");
      textArea.value = seed;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      showStatus('share');
    } catch (e) { showStatus('error'); }
  };

  const loadFromSeed = () => {
    if (!seedInput.trim()) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(seedInput))));
      const newDeck = {
        id: `d-${Date.now()}`,
        name: decoded.n || 'Import',
        cards: (decoded.c || []).map(arr => ({ id: `c-${Math.random()}`, front: arr[0], back: arr[1] })),
        stats: { bestPercent: 0, lastPercent: 0, lastCorrect: 0, lastWrong: 0 },
        createdAt: new Date().toISOString()
      };
      setDecks([...decks, newDeck]);
      setSeedInput('');
      showStatus('send');
    } catch (e) { showStatus('error'); }
  };

  // Hilfsklassen für Design & Typography
  const paperClass = darkMode
    ? "bg-slate-900 border-slate-800 shadow-[4px_4px_0px_rgba(0,0,0,0.4)]"
    : "bg-[#fdfdf7] border-[#e2e2d5] shadow-[4px_4px_0px_rgba(200,200,180,0.5)]";

  const getFontClass = () => {
    switch (fontStyle) {
      case 'serif': return 'font-custom-serif';
      case 'sans': return 'font-custom-sans';
      case 'mono': return 'font-custom-mono';
      case 'hand': return 'font-custom-hand';
      default: return 'font-custom-serif';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getFontClass()} ${darkMode ? 'bg-slate-950 text-slate-200 dark' : 'bg-[#f4f1ea] text-[#4a4a44]'}`}>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 h-16 z-[100] flex items-center px-4 justify-between transition-colors ${darkMode ? 'bg-slate-900/95 border-white/10' : 'bg-[#fdfdf7]/95 border-[#e2e2d5]'} backdrop-blur-md border-b`}>
        <div className="flex items-center gap-2 text-indigo-500">
          <Brain size={24} strokeWidth={3} />
          <span className="font-custom-serif italic text-lg opacity-40 hidden xs:block">MindCard</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Navigation Tabs */}
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
            <button onClick={() => { setActiveTab('manage'); setSession(null); }} className={`p-2.5 rounded-lg transition-all ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
              <Database size={18} />
            </button>
            <button onClick={() => setActiveTab('learn')} className={`p-2.5 rounded-lg transition-all ${activeTab === 'learn' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
              <GraduationCap size={18} />
            </button>
          </div>

          {/* Settings: Font Dropdown & Darkmode */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl ml-1">
            <div className="relative flex items-center px-2 border-r border-black/10 dark:border-white/10">
              <Type size={16} className="text-slate-400 mr-2" />
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold uppercase focus:ring-0 cursor-pointer appearance-none pr-4 outline-none text-slate-500 dark:text-slate-300"
              >
                <option value="serif" className="font-custom-serif bg-[#fdfdf7] dark:bg-slate-900">Serif</option>
                <option value="sans" className="font-custom-sans bg-[#fdfdf7] dark:bg-slate-900">Sans</option>
                <option value="mono" className="font-custom-mono bg-[#fdfdf7] dark:bg-slate-900">Mono</option>
                <option value="hand" className="font-custom-hand bg-[#fdfdf7] dark:bg-slate-900">Hand</option>
              </select>
              <ChevronDown size={10} className="absolute right-1 pointer-events-none text-slate-400" />
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-lg transition-colors ${darkMode ? 'text-yellow-400' : 'text-slate-400'}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Status Overlay */}
      {statusMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
          <StatusIcon name={statusMsg} />
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 pt-24 pb-12 min-h-screen relative z-10">
        {activeTab === 'manage' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className={`p-2 rounded-xl border-2 flex flex-wrap items-center gap-2 ${paperClass}`}>
              <div className="flex gap-1">
                <button onClick={() => showStatus('download')} className="p-3.5 hover:text-indigo-600 text-slate-400"><Download size={20} /></button>
                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 hover:text-indigo-600 text-slate-400"><Upload size={20} /></button>
                <input type="file" ref={fileInputRef} className="hidden" />
              </div>
              <div className="flex-1 min-w-[150px] flex gap-2">
                <input
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  type="text" placeholder="Seed importieren..." className="flex-1 bg-black/5 dark:bg-white/5 border-none focus:ring-0 text-sm px-4 py-3 rounded-lg outline-none italic"
                />
                <button onClick={loadFromSeed} className="p-3.5 text-indigo-600 flex items-center justify-center"><Send size={18} /></button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sidebar Decks */}
              <div className="lg:col-span-4 space-y-4">
                <div className={`p-4 rounded-xl border-2 ${paperClass}`}>
                  <div className="flex gap-2 items-center">
                    <input
                      value={newDeckName} onChange={e => setNewDeckName(e.target.value)}
                      placeholder="Neues Deck..." className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-base p-2 outline-none"
                    />
                    <button onClick={createDeck} className="p-3 bg-indigo-600 text-white rounded-xl shadow-md active:scale-90 transition flex items-center justify-center shrink-0 h-10 w-10">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {decks.map(deck => (
                    <div
                      key={deck.id} onClick={() => setSelectedDeckId(deck.id)}
                      className={`p-5 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center relative overflow-hidden ${selectedDeckId === deck.id
                          ? 'bg-indigo-600 border-indigo-700 text-white translate-x-1 shadow-none'
                          : `${paperClass} hover:translate-x-1`
                        }`}
                    >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${selectedDeckId === deck.id ? 'bg-white/20' : 'bg-red-200'}`} />
                      <div className="truncate pr-3 z-10">
                        <p className="font-bold text-sm uppercase truncate tracking-tight italic">{deck.name}</p>
                        <div className="flex items-center gap-3 mt-1 font-bold text-[10px] opacity-60">
                          <Layers size={12} /> {deck.cards.length}
                          {deck.stats?.bestPercent > 0 && <span className="flex items-center gap-1 text-yellow-500"><Trophy size={10} /> {deck.stats.bestPercent}%</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 z-10">
                        <button onClick={(e) => { e.stopPropagation(); generateSeed(deck); }} className="p-2.5 rounded-lg hover:bg-black/5 transition flex items-center justify-center"><Share2 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }} className="p-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition flex items-center justify-center"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor View */}
              <div className="lg:col-span-8">
                {selectedDeck ? (
                  <div className={`rounded-xl border-2 shadow-xl min-h-[500px] flex flex-col ${paperClass}`}>
                    <div className="p-6 flex justify-between items-center border-b-2 border-dotted border-black/10 gap-4">
                      <div className="flex items-center gap-3 truncate">
                        <StickyNote size={24} className="text-indigo-500" />
                        <h2 className="text-xl font-bold uppercase tracking-widest italic">{selectedDeck.name}</h2>
                      </div>
                      <button onClick={() => startLearning(selectedDeck)} className="w-12 h-12 bg-indigo-600 text-white rounded-xl shadow-lg hover:rotate-2 transition active:scale-95 flex items-center justify-center">
                        <Play size={20} fill="currentColor" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6 flex-1">
                      <div className="p-6 rounded-lg border-2 border-indigo-500/20 bg-indigo-500/5 space-y-4">
                        <div className="flex items-center gap-4">
                          <HelpCircle size={20} className="opacity-30" />
                          <input value={newCardFront} onChange={e => setNewCardFront(e.target.value)} placeholder="Frage..." className="w-full bg-transparent border-none focus:ring-0 font-bold text-lg outline-none" />
                        </div>
                        <div className="h-px bg-indigo-500/20" />
                        <div className="flex items-center gap-4">
                          <MessageSquare size={20} className="opacity-30" />
                          <input value={newCardBack} onChange={e => setNewCardBack(e.target.value)} placeholder="Antwort..." className="w-full bg-transparent border-none focus:ring-0 text-base outline-none italic" />
                        </div>
                        <button onClick={() => addCard(selectedDeck.id)} className="w-full h-12 bg-slate-800 text-white rounded-lg flex items-center justify-center hover:bg-indigo-600 transition">
                          <Save size={20} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {selectedDeck.cards.map(card => (
                          <div key={card.id} className="group p-4 flex items-center justify-between border-b border-black/5 hover:bg-black/5 transition">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <span className="font-bold">{card.front}</span>
                              <span className="opacity-60 italic sm:border-l sm:pl-4 border-black/10">{card.back}</span>
                            </div>
                            <button onClick={() => deleteCard(selectedDeck.id, card.id)} className="p-2 opacity-0 group-hover:opacity-100 text-red-400 transition flex items-center justify-center"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed rounded-3xl border-black/5 opacity-40">
                    <Brain size={48} className="mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Deck auswählen</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* LEARN VIEW */
          <div className="max-w-xl mx-auto py-2">
            {!session ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-black uppercase italic mb-8">Lernen beginnen</h2>
                <div className="grid grid-cols-1 gap-4">
                  {decks.map(deck => (
                    <button key={deck.id} onClick={() => startLearning(deck)} className={`p-8 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${paperClass} hover:-rotate-1 relative overflow-hidden`}>
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-200" />
                      <p className="font-bold text-xl uppercase italic mb-2">{deck.name}</p>
                      <span className="text-xs opacity-40 font-bold uppercase">{deck.cards.length} Karteikarten</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : session.finished ? (
              <div className={`p-10 rounded-2xl text-center space-y-8 border-2 ${paperClass}`}>
                <div className="inline-block p-8 bg-indigo-500/10 text-indigo-500 rounded-full animate-bounce mx-auto flex items-center justify-center">
                  <Trophy size={64} />
                </div>
                <h2 className="text-3xl font-bold italic">Session beendet</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-xl">
                    <p className="text-3xl font-black text-green-600">{session.results.correct}</p>
                    <Check size={20} className="mx-auto mt-2 text-green-500" />
                  </div>
                  <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-xl">
                    <p className="text-3xl font-black text-red-600">{session.results.wrong}</p>
                    <X size={20} className="mx-auto mt-2 text-red-500" />
                  </div>
                </div>

                {/* FEHLERANALYSE */}
                {session.wrongAnswers.length > 0 && (
                  <div className="text-left space-y-6 pt-6 border-t border-black/10">
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" /> Fehleranalyse
                    </h3>
                    <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      {session.wrongAnswers.map((card, idx) => (
                        <div key={idx} className="p-4 bg-black/5 rounded-xl border border-black/5 space-y-3">
                          <div>
                            <p className="text-[10px] font-bold opacity-30 uppercase tracking-wider mb-1">Frage</p>
                            <p className="font-bold text-base font-serif italic">{card.front}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-bold opacity-30 uppercase tracking-wider mb-1">Deine Antwort</p>
                              <p className="text-red-500 line-through text-sm font-medium">{card.userType || '(keine)'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold opacity-30 uppercase tracking-wider mb-1">Richtige Antwort</p>
                              <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                                <Check size={14} strokeWidth={3} />
                                <span>{card.back}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setSession(null)} className="w-full h-16 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center shadow-lg transition">
                  <ChevronLeft size={24} />
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className={`p-4 rounded-xl border-2 flex items-center gap-4 ${paperClass}`}>
                  <button onClick={() => setSession(null)} className="text-slate-400 p-1.5 flex items-center justify-center"><ChevronLeft size={28} /></button>
                  <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(session.currentIndex / session.cards.length) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold opacity-30">{session.currentIndex + 1}/{session.cards.length}</span>
                </div>

                <div className="relative min-h-[300px]">
                  <div className={`transition-all duration-300 ${isNewCardAnimating ? '-translate-y-4 opacity-0' : 'translate-x-0 opacity-100'}`}>
                    <div className={`relative p-10 rounded-sm border-2 shadow-xl transition-all duration-500 flex flex-col items-center justify-center min-h-[350px] overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-[#d1d1c4]'
                      }`}>
                      {!darkMode && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(#e1e1d8 1px, transparent 1px)`,
                            backgroundSize: `100% 2.5rem`,
                            paddingTop: '3.5rem'
                          }}
                        >
                          <div className="absolute left-10 top-0 w-px h-full bg-red-200" />
                        </div>
                      )}

                      <div className="relative z-10 text-center space-y-6">
                        <div className="opacity-10 flex justify-center flex items-center justify-center">
                          {!session.showResult ? <HelpCircle size={40} /> : <MessageSquare size={40} />}
                        </div>

                        {!session.showResult ? (
                          <h3 className="text-3xl md:text-5xl font-bold italic leading-tight">
                            {session.cards[session.currentIndex].front}
                          </h3>
                        ) : (
                          <div className="animate-in slide-in-from-bottom-4 duration-300 flex flex-col items-center space-y-6">
                            <h3 className="text-3xl md:text-5xl font-bold italic text-indigo-600 dark:text-indigo-400 leading-tight">
                              {session.cards[session.currentIndex].back}
                            </h3>
                            <div className={`p-4 rounded-full border-2 flex items-center justify-center ${session.userInput.trim().toLowerCase() === session.cards[session.currentIndex].back.trim().toLowerCase() ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                              {session.userInput.trim().toLowerCase() === session.cards[session.currentIndex].back.trim().toLowerCase() ? <Check size={32} /> : <X size={32} />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-w-sm mx-auto space-y-6 pb-20">
                  {!session.showResult ? (
                    <div className="flex flex-col gap-4">
                      <input
                        ref={answerInputRef} type="text" value={session.userInput}
                        onChange={e => setSession({ ...session, userInput: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && checkAnswer()}
                        placeholder="Antwort hier schreiben..."
                        className={`w-full h-16 rounded-xl text-center font-bold text-xl border-2 shadow-lg outline-none transition-all focus:border-indigo-500 ${paperClass}`}
                      />
                      <button onClick={checkAnswer} className="w-full h-16 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                        <Eye size={32} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={nextCard} className="w-full h-16 bg-slate-800 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-indigo-600">
                      <ArrowRight size={32} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Kalam:wght@400;700&display=swap');
        
        .font-custom-serif { font-family: 'Playfair Display', serif; }
        .font-custom-sans { font-family: 'Inter', sans-serif; }
        .font-custom-mono { font-family: 'Courier Prime', monospace; }
        .font-custom-hand { font-family: 'Kalam', cursive; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        input::placeholder { opacity: 0.3; font-style: italic; }

        select option {
          font-weight: bold;
          padding: 10px;
        }

        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}} />
    </div>
  );
};

export default App;