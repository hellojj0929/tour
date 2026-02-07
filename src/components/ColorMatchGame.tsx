import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';

interface LeaderboardEntry {
    id?: string;
    name: string;
    score: number;
    created_at?: string | Timestamp | null;
    date?: string;
}

interface ColorOption {
    name: string;
    english: string;
    color: string;
}

const ColorMatchGame: React.FC = () => {
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'LEADERBOARD'>('START');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentColor, setCurrentColor] = useState<ColorOption | null>(null);
    const [options, setOptions] = useState<ColorOption[]>([]);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('colorMatchHighScore') || '0'));
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('colorMatchPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
        try {
            const saved = localStorage.getItem('colorMatchLeaderboard');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
    const [dbError, setDbError] = useState('');
    const [showAdminReset, setShowAdminReset] = useState(false);

    const colors: ColorOption[] = [
        { name: '빨강', english: 'Red', color: '#ef4444' },
        { name: '파랑', english: 'Blue', color: '#3b82f6' },
        { name: '노랑', english: 'Yellow', color: '#eab308' },
        { name: '초록', english: 'Green', color: '#22c55e' },
        { name: '보라', english: 'Purple', color: '#a855f7' },
        { name: '주황', english: 'Orange', color: '#f97316' },
        { name: '분홍', english: 'Pink', color: '#ec4899' },
        { name: '하늘', english: 'Sky Blue', color: '#06b6d4' },
    ];

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'PLAYING' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameState('GAMEOVER');
                        if (score > highScore) {
                            setHighScore(score);
                            localStorage.setItem('colorMatchHighScore', score.toString());
                        }
                        setShowNameInput(score >= 5);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, score, highScore]);

    // TTS Logic
    const speakColor = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            const voices = window.speechSynthesis.getVoices();
            const engVoice = voices.find(v => v.lang.includes('en-US') || v.lang.startsWith('en'));
            if (engVoice) utterance.voice = engVoice;
            window.speechSynthesis.speak(utterance);
        }, 50);
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setGameState('PLAYING');
        generateQuestion();
    };

    const generateQuestion = () => {
        const correct = colors[Math.floor(Math.random() * colors.length)];
        setCurrentColor(correct);
        const wrong = colors.filter(c => c.name !== correct.name).sort(() => Math.random() - 0.5);
        setOptions([correct, ...wrong.slice(0, 3)].sort(() => Math.random() - 0.5));

        setTimeout(() => speakColor(correct.english), 200);
    };

    const handleAnswer = (selected: ColorOption) => {
        if (!currentColor) return;
        if (selected.name === currentColor.name) {
            setScore(prev => prev + 1);
            generateQuestion();
        } else {
            setTimeLeft(prev => Math.max(0, prev - 2));
            // Haptic Feedback for wrong answer could go here
        }
    };

    // Firebase Logic (Simplified)
    const fetchLeaderboard = async () => { /* ... reuse logic ... */ };
    const saveScore = async () => {
        if (!playerName.trim() || isSaving) return;
        setIsSaving(true);
        const newEntry = { name: playerName, score, date: new Date().toLocaleDateString() };
        setLeaderboard([newEntry, ...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10));
        setShowNameInput(false);
        setGameState('LEADERBOARD');
        setIsSaving(false);
    };

    // Admin Reset
    const resetLeaderboard = async () => {
        const password = prompt('Admin Password:');
        if (password === 'hayan2026') {
            if (confirm('Reall reset?')) {
                setLeaderboard([]);
                localStorage.removeItem('colorMatchLeaderboard');
                setGameState('START');
            }
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 text-slate-800 flex flex-col items-center p-2 font-sans pb-20">
            {/* Header */}
            <div className="w-full flex justify-between items-center bg-white p-4 mb-4 rounded-b-2xl shadow-sm z-10">
                <Link to="/game" className="text-slate-500 font-bold text-sm bg-slate-100 px-3 py-2 rounded-xl flex gap-1 items-center">
                    <ArrowLeft size={16} /> EXIT
                </Link>
                {gameState === 'PLAYING' && (
                    <div className="flex gap-2">
                        <div className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                            <Trophy size={14} /> {score}
                        </div>
                        <div className={`px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 ${timeLeft <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                            ⏱️ {timeLeft}s
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full max-w-[400px] px-2">
                {gameState === 'START' && (
                    <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
                        <h1 className="text-4xl font-black text-orange-500 mb-2">COLOR<br />MATCH</h1>
                        <p className="text-slate-500 mb-8 text-sm">색깔 이름을 듣고 맞춰주세요!</p>

                        <div className="space-y-2 mb-6 text-sm bg-orange-50 p-4 rounded-2xl text-left">
                            <p className="font-bold text-orange-600">🎮 HOW TO PLAY</p>
                            <p>• 30초 동안 최대한 많이 맞추기</p>
                            <p>• 틀리면 시간 -2초 깎여요!</p>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Nickname"
                                className="w-full bg-slate-100 rounded-xl px-4 py-3 text-center font-bold"
                            />
                        </div>

                        <button onClick={startGame} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg mb-3 flex items-center justify-center gap-2">
                            START GAME 🎨
                        </button>
                        <button onClick={() => setGameState('LEADERBOARD')} className="text-sm font-bold text-slate-400 underline">
                            Rankings
                        </button>
                    </div>
                )}

                {gameState === 'PLAYING' && currentColor && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 bg-white rounded-3xl p-6 shadow-lg mb-4 flex flex-col items-center justify-center min-h-[180px]">
                            <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-4">{currentColor.name}</h2>
                            <button onClick={() => speakColor(currentColor.english)} className="bg-slate-100 p-4 rounded-full text-slate-600 active:bg-slate-200">
                                <Volume2 size={32} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    className="aspect-[4/3] rounded-2xl shadow-md flex items-center justify-center text-white text-2xl font-black border-4 border-white/20 active:scale-95 transition-transform"
                                    style={{ backgroundColor: opt.color }}
                                >
                                    {opt.english}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(gameState === 'GAMEOVER' || gameState === 'LEADERBOARD') && (
                    <div className="bg-white rounded-3xl p-8 shadow-xl text-center animate-in zoom-in">
                        {gameState === 'GAMEOVER' ? (
                            <>
                                <div className="text-6xl mb-4">⏰</div>
                                <h2 className="text-2xl font-black text-red-500 mb-2">TIME'S UP!</h2>
                                <p className="text-3xl font-black text-slate-800 mb-6">{score} <span className="text-base text-slate-400 font-bold">POINTS</span></p>

                                {showNameInput && (
                                    <button onClick={saveScore} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold mb-4">
                                        RANKING 등록
                                    </button>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={startGame} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg">RETRY</button>
                                    <button onClick={() => setGameState('LEADERBOARD')} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">RANK</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black mb-4 flex items-center justify-center gap-2"><Medal className="text-yellow-500" /> HALL OF FAME</h2>
                                <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto">
                                    {leaderboard.map((e, i) => (
                                        <div key={i} className="flex justify-between bg-slate-50 p-3 rounded-xl text-sm">
                                            <span className="font-bold text-slate-500">#{i + 1} {e.name}</span>
                                            <span className="font-bold text-orange-500">{e.score} pts</span>
                                        </div>
                                    ))}
                                    {leaderboard.length === 0 && <p className="text-slate-400 text-sm">기록이 없습니다.</p>}
                                </div>
                                <button onClick={() => setGameState('START')} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">BACK</button>

                                {/* Hidden Admin Trigger */}
                                <div className="h-10 w-full mt-4" onClick={() => setShowAdminReset(p => !p)}></div>
                                {showAdminReset && <button onClick={resetLeaderboard} className="text-red-500 text-xs font-bold">Reset All Data</button>}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorMatchGame;
