import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';

const ColorMatchGame = () => {
    const [gameState, setGameState] = useState('START');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
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

    const gameRef = useRef({
        fallingItems: [],
        baskets: [
            { x: 100, color: '#fbbf24', emoji: '🥖' }, // Yellow
            { x: 270, color: '#f97316', emoji: '🥐' }, // Orange
            { x: 440, color: '#ec4899', emoji: '🧁' }, // Pink
        ],
        selectedBasket: 1,
        speed: 2,
        spawnRate: 60,
        frameCount: 0
    });

    const requestRef = useRef();

    useEffect(() => {
        if (gameState === 'PLAYING') {
            const animate = () => {
                updateGame();
                requestRef.current = requestAnimationFrame(animate);
            };
            requestRef.current = requestAnimationFrame(animate);

            return () => {
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                }
            };
        }
    }, [gameState, lives]);

    const startGame = () => {
        const game = gameRef.current;
        game.fallingItems = [];
        game.selectedBasket = 1;
        game.speed = 2;
        game.frameCount = 0;
        setScore(0);
        setLives(3);
        setGameState('PLAYING');
    };

    const moveBasket = (direction) => {
        if (gameState !== 'PLAYING') return;
        const game = gameRef.current;
        if (direction === 'left' && game.selectedBasket > 0) {
            game.selectedBasket--;
        } else if (direction === 'right' && game.selectedBasket < 2) {
            game.selectedBasket++;
        }
    };

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') moveBasket('left');
            if (e.key === 'ArrowRight') moveBasket('right');
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState]);

    const updateGame = () => {
        const game = gameRef.current;
        game.frameCount++;

        // Spawn new items
        if (game.frameCount % game.spawnRate === 0) {
            const randomBasketIndex = Math.floor(Math.random() * 3);
            const basket = game.baskets[randomBasketIndex];
            game.fallingItems.push({
                x: basket.x + 40,
                y: 0,
                color: basket.color,
                emoji: basket.emoji,
                targetBasket: randomBasketIndex
            });
        }

        // Update falling items
        for (let i = game.fallingItems.length - 1; i >= 0; i--) {
            const item = game.fallingItems[i];
            item.y += game.speed;

            // Check if caught
            if (item.y > 380 && item.y < 420) {
                if (item.targetBasket === game.selectedBasket) {
                    // Correct catch!
                    setScore(prev => prev + 10);
                    game.fallingItems.splice(i, 1);

                    // Increase difficulty
                    if (score > 0 && score % 50 === 0) {
                        game.speed = Math.min(game.speed + 0.5, 6);
                        game.spawnRate = Math.max(game.spawnRate - 5, 30);
                    }
                } else if (item.y > 400) {
                    // Wrong basket or missed
                    game.fallingItems.splice(i, 1);
                    setLives(prev => {
                        const newLives = prev - 1;
                        if (newLives <= 0) {
                            setGameState('GAMEOVER');
                            if (score > highScore) {
                                setHighScore(score);
                                localStorage.setItem('colorMatchHighScore', score.toString());
                            }
                            setShowNameInput(score >= 30);
                        }
                        return newLives;
                    });
                }
            }

            // Remove if off screen
            if (item.y > 500) {
                game.fallingItems.splice(i, 1);
            }
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

    const game = gameRef.current;

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
                        <div className="bg-white px-4 py-2 rounded-xl border border-red-100 shadow-sm font-black text-lg flex items-center gap-2">
                            ❤️ <span>{lives}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative w-full max-w-[95vw] md:max-w-[640px] flex justify-center">
                {gameState === 'START' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter text-purple-500 uppercase">색깔 맞추기! 🎨</h2>
                        <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 font-medium">떨어지는 빵을 같은 색 바구니에 넣으세요!</p>

                        <div className="mb-6 bg-purple-50 p-4 rounded-2xl">
                            <p className="text-sm font-bold text-purple-700 mb-2">🎮 조작법</p>
                            <p className="text-xs text-slate-600">• 화살표 키 또는 버튼으로 바구니 이동</p>
                            <p className="text-xs text-slate-600">• 같은 색 빵을 받으면 +10점!</p>
                            <p className="text-xs text-slate-600">• 틀리면 생명 -1 (총 3개)</p>
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

                {gameState === 'PLAYING' && (
                    <div className="w-full">
                        <div className="bg-gradient-to-b from-purple-100 to-pink-100 rounded-[1rem] md:rounded-[2.5rem] border-4 md:border-8 border-white shadow-2xl w-full h-[500px] relative overflow-hidden">
                            {/* Falling items */}
                            {game.fallingItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="absolute text-4xl transition-all"
                                    style={{
                                        left: `${item.x}px`,
                                        top: `${item.y}px`,
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                    }}
                                >
                                    {item.emoji}
                                </div>
                            ))}

                            {/* Baskets */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                {game.baskets.map((basket, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl transition-all ${game.selectedBasket === idx
                                                ? 'scale-110 shadow-2xl ring-4 ring-white'
                                                : 'opacity-50 scale-90'
                                            }`}
                                        style={{ backgroundColor: basket.color }}
                                    >
                                        {basket.emoji}
                                    </div>
                                ))}
                            </div>

                            {/* Control buttons */}
                            <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-4">
                                <button
                                    onClick={() => moveBasket('left')}
                                    className="bg-white text-purple-600 px-6 py-3 rounded-xl font-black shadow-lg active:scale-95 transition-all"
                                >
                                    ← 왼쪽
                                </button>
                                <button
                                    onClick={() => moveBasket('right')}
                                    className="bg-white text-purple-600 px-6 py-3 rounded-xl font-black shadow-lg active:scale-95 transition-all"
                                >
                                    오른쪽 →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'GAMEOVER' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase text-red-500">Game Over! 💥</h2>
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
