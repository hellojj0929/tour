import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';

const ColorMatchGame = () => {
    const [gameState, setGameState] = useState('START');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentColor, setCurrentColor] = useState(null);
    const [options, setOptions] = useState([]);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('colorMatchHighScore') || '0'));
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('colorMatchPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [leaderboard, setLeaderboard] = useState(() => {
        try {
            const saved = localStorage.getItem('colorMatchLeaderboard');
            const data = saved ? JSON.parse(saved) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState('checking');
    const [dbError, setDbError] = useState('');

    const colors = [
        { name: '빨강', color: '#ef4444' },
        { name: '파랑', color: '#3b82f6' },
        { name: '노랑', color: '#eab308' },
        { name: '초록', color: '#22c55e' },
        { name: '보라', color: '#a855f7' },
        { name: '주황', color: '#f97316' },
        { name: '분홍', color: '#ec4899' },
        { name: '하늘', color: '#06b6d4' },
    ];

    useEffect(() => {
        let timer;
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

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setGameState('PLAYING');
        generateQuestion();
    };

    const generateQuestion = () => {
        const correctColor = colors[Math.floor(Math.random() * colors.length)];
        setCurrentColor(correctColor);

        const wrongColors = colors.filter(c => c.name !== correctColor.name);
        const shuffled = [...wrongColors].sort(() => Math.random() - 0.5);
        const selectedOptions = [correctColor, ...shuffled.slice(0, 3)];
        setOptions(selectedOptions.sort(() => Math.random() - 0.5));
    };

    const handleAnswer = (selectedColor) => {
        if (selectedColor.name === currentColor.name) {
            setScore(prev => prev + 1);
            generateQuestion();
        } else {
            setTimeLeft(prev => Math.max(0, prev - 2));
        }
    };

    const fetchLeaderboard = async () => {
        try {
            if (!isFirebaseConfigured) {
                setDbStatus('offline');
                return;
            }

            setDbStatus('checking');
            const q = query(
                collection(db, "colormatch_leaderboard"),
                orderBy("score", "desc"),
                limit(50)
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: doc.data().created_at?.toDate?.()?.toISOString() || null
            }));

            if (data) {
                setDbStatus('online');
                const uniqueData = [];
                const names = new Set();
                data.forEach(entry => {
                    if (!names.has(entry.name)) {
                        uniqueData.push(entry);
                        names.add(entry.name);
                    }
                });
                const top5 = uniqueData.slice(0, 5);
                setLeaderboard(top5);
                localStorage.setItem('colorMatchLeaderboard', JSON.stringify(top5));
            }
        } catch (e) {
            setDbStatus('error');
            setDbError(e.message);
            console.error("Error fetching leaderboard:", e);
        }
    };

    useEffect(() => {
        if (gameState === 'LEADERBOARD' || gameState === 'START') {
            fetchLeaderboard();
        }
    }, [gameState]);

    const saveScore = async () => {
        const trimmedName = playerName.trim();
        if (!trimmedName) {
            alert("이름을 입력해 주세요! ✨");
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        const newEntry = {
            name: trimmedName,
            score: score,
            date: new Date().toLocaleDateString('ko-KR')
        };

        const localList = [...leaderboard];
        const existingIdx = localList.findIndex(e => e.name === newEntry.name);

        let shouldUpdateLocal = true;
        if (existingIdx !== -1) {
            const existing = localList[existingIdx];
            if (newEntry.score <= existing.score) {
                shouldUpdateLocal = false;
            }
        }

        if (shouldUpdateLocal) {
            const updatedList = (existingIdx !== -1)
                ? localList.map((e, i) => i === existingIdx ? newEntry : e)
                : [...localList, newEntry];

            const sortedLocal = updatedList.sort((a, b) => b.score - a.score).slice(0, 5);

            setLeaderboard(sortedLocal);
            localStorage.setItem('colorMatchLeaderboard', JSON.stringify(sortedLocal));
        }

        setShowNameInput(false);
        setGameState('LEADERBOARD');

        if (isFirebaseConfigured) {
            try {
                await addDoc(collection(db, "colormatch_leaderboard"), {
                    name: newEntry.name,
                    score: newEntry.score,
                    created_at: serverTimestamp()
                });

                await fetchLeaderboard();
            } catch (e) {
                console.error("Firebase sync failed:", e);
            }
        }

        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-slate-800 flex flex-col items-center p-2 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-4 md:mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-purple-100 shadow-sm font-bold text-sm md:text-base">
                    <ArrowLeft size={18} className="md:w-5 md:h-5" />
                    <span className="tracking-tight uppercase">Exit</span>
                </Link>
                {gameState === 'PLAYING' && (
                    <div className="flex gap-3">
                        <div className="bg-white px-4 py-2 rounded-xl border border-purple-100 shadow-sm font-black text-lg flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={20} />
                            <span>{score}</span>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm font-black text-lg flex items-center gap-2">
                            ⏱️ <span>{timeLeft}초</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative w-full max-w-[95vw] md:max-w-[640px] flex justify-center">
                {gameState === 'START' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter text-purple-500 uppercase">색깔 맞추기! 🎨</h2>
                        <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 font-medium">색깔 이름을 보고 맞는 색을 선택하세요!</p>

                        <div className="mb-6 bg-purple-50 p-4 rounded-2xl">
                            <p className="text-sm font-bold text-purple-700 mb-2">🎮 게임 방법</p>
                            <p className="text-xs text-slate-600">• 30초 안에 최대한 많이 맞추세요!</p>
                            <p className="text-xs text-slate-600">• 정답: +1점</p>
                            <p className="text-xs text-slate-600">• 오답: -2초</p>
                        </div>

                        <div className="mb-6 w-full max-w-[280px] mx-auto">
                            <p className="text-purple-500 text-[10px] uppercase tracking-widest font-black mb-2">Player Nickname</p>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                maxLength={10}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 focus:border-purple-500 outline-none font-bold text-center bg-purple-50/50"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={startGame}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black tracking-widest text-base md:text-lg shadow-xl shadow-purple-100 transition-all active:scale-95 flex items-center gap-2 md:gap-3 mx-auto w-full justify-center"
                            >
                                시작하기! 🎨
                            </button>
                            <button
                                onClick={() => setGameState('LEADERBOARD')}
                                className="bg-white hover:bg-slate-50 text-slate-600 px-8 py-3 rounded-[1.5rem] font-bold text-sm border border-slate-100 flex items-center gap-2 mx-auto"
                            >
                                <Medal size={16} /> 명예의 전당 보기
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'PLAYING' && currentColor && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-3xl md:text-5xl font-black mb-8 md:mb-12 text-center tracking-tighter" style={{ color: currentColor.color }}>
                            {currentColor.name}
                        </h2>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            {options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    className="aspect-square rounded-3xl shadow-xl transition-all active:scale-95 hover:scale-105 border-4 border-white"
                                    style={{ backgroundColor: option.color }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'GAMEOVER' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase text-red-500">Time's Up! ⏰</h2>
                        <p className="text-sm md:text-base text-slate-600 mb-6 font-medium">점수: {score}점</p>

                        {showNameInput ? (
                            <div className="mb-6">
                                <p className="text-purple-600 font-black text-[10px] mb-2 uppercase tracking-widest">명예의 전당에 등록</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="닉네임"
                                        maxLength={10}
                                        className="flex-1 px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 outline-none font-bold text-sm"
                                    />
                                    <button
                                        onClick={saveScore}
                                        disabled={isSaving}
                                        className={`bg-purple-500 text-white px-5 py-3 rounded-2xl font-black hover:bg-purple-600 transition-all shadow-md shadow-purple-100 text-sm flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {isSaving ? <><RefreshCw size={16} className="animate-spin" />저장 중...</> : '등록'}
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={startGame}
                                className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black tracking-widest text-sm md:text-base shadow-lg shadow-purple-100 transition-all active:scale-95"
                            >
                                <RefreshCw size={18} /> 재도전
                            </button>
                            <button
                                onClick={() => setGameState('LEADERBOARD')}
                                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black tracking-widest text-sm"
                            >
                                <Medal size={18} /> 순위
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'LEADERBOARD' && (
                    <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-100 w-full max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <Medal className="text-yellow-500" size={28} />
                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-800 uppercase leading-none">명예의 전당</h2>

                            <div className="flex items-center ml-auto gap-2">
                                {dbStatus === 'online' ? (
                                    <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-tighter">Shared</span>
                                    </div>
                                ) : dbStatus === 'offline' ? (
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Local Only</span>
                                    </div>
                                ) : dbStatus === 'error' ? (
                                    <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Sync Error</span>
                                    </div>
                                ) : (
                                    <RefreshCw size={12} className="text-slate-300 animate-spin" />
                                )}
                            </div>
                        </div>

                        {dbStatus === 'error' && (
                            <div className="mb-4 p-3 bg-red-50 rounded-2xl border border-red-100 text-[11px] text-red-600 font-bold">
                                ⚠️ 서버 연결 실패: {dbError}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((entry, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-xs md:text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-white text-slate-400'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-slate-700 leading-none text-sm md:text-base">{entry.name}</p>
                                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString('ko-KR') : entry.date || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg md:text-xl font-black text-purple-500 tracking-tighter leading-none">{entry.score}점</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-2 italic">
                                    <p className="text-sm font-bold">아직 기록이 없어요!</p>
                                    <p className="text-xs">첫 번째 주인공이 되어보세요 ✨</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setGameState('START')}
                            className="flex-shrink-0 bg-slate-800 hover:bg-slate-900 text-white py-4 md:py-5 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
                        >
                            메인으로 돌아가기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorMatchGame;
