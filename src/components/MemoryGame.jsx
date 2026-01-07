import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';
import hayanImg from '../assets/hayan.png';
import haneulImg from '../assets/haneul.png';

const MemoryGame = () => {
    const [gameState, setGameState] = useState('START'); // START, PLAYING, WON, LEADERBOARD
    const [cards, setCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [difficulty, setDifficulty] = useState('kids'); // 'kids' (8 cards) or 'adult' (16 cards)
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('memoryPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [leaderboard, setLeaderboard] = useState(() => {
        try {
            const saved = localStorage.getItem('memoryLeaderboard');
            const data = saved ? JSON.parse(saved) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState('checking');
    const [dbError, setDbError] = useState('');

    const BREAD_EMOJIS = [
        '🍞', '🥐', '🥖', '🥨', '🥯', '🥞',
        { type: 'image', src: hayanImg, name: '하얀이' },
        { type: 'image', src: haneulImg, name: '하늘이' },
        '🍩', '🧁', '🍰', '🎂'
    ];

    useEffect(() => {
        let interval;
        if (gameState === 'PLAYING') {
            interval = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    const initGame = () => {
        const pairCount = difficulty === 'kids' ? 4 : 8;
        const selectedEmojis = BREAD_EMOJIS.slice(0, pairCount);
        const cardPairs = [...selectedEmojis, ...selectedEmojis];
        const shuffled = cardPairs
            .map((item, index) => ({
                id: index,
                content: typeof item === 'string' ? item : item.name,
                emoji: typeof item === 'string' ? item : null,
                image: typeof item === 'object' ? item.src : null,
                isFlipped: false,
                isMatched: false
            }))
            .sort(() => Math.random() - 0.5);

        setCards(shuffled);
        setFlippedCards([]);
        setMatchedPairs([]);
        setMoves(0);
        setTime(0);
        setGameState('PLAYING');
    };

    const handleCardClick = (cardId) => {
        if (flippedCards.length === 2) return;
        if (flippedCards.includes(cardId)) return;
        if (matchedPairs.includes(cards.find(c => c.id === cardId)?.content)) return;

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = newFlipped;
            const firstCard = cards.find(c => c.id === first);
            const secondCard = cards.find(c => c.id === second);

            if (firstCard.content === secondCard.content) {
                setMatchedPairs([...matchedPairs, firstCard.content]);
                setFlippedCards([]);

                const totalPairs = difficulty === 'kids' ? 4 : 8;
                if (matchedPairs.length + 1 === totalPairs) {
                    setTimeout(() => {
                        setGameState('WON');
                        setShowNameInput(true);
                    }, 500);
                }
            } else {
                setTimeout(() => {
                    setFlippedCards([]);
                }, 1000);
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
                collection(db, "memory_leaderboard"),
                orderBy("moves", "asc"),
                orderBy("time", "asc"),
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
                localStorage.setItem('memoryLeaderboard', JSON.stringify(top5));
            }
        } catch (e) {
            setDbStatus('error');
            setDbError(e.message);
            console.error("Critical error fetching leaderboard from Firebase:", e);
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
            alert("랭킹에 등록할 이름을 입력해 주세요! ✨");
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        const newEntry = {
            name: trimmedName,
            moves: moves,
            time: time,
            difficulty: difficulty,
            date: new Date().toLocaleDateString('ko-KR')
        };

        const localList = [...leaderboard];
        const existingIdx = localList.findIndex(e => e.name === newEntry.name);

        let shouldUpdateLocal = true;
        if (existingIdx !== -1) {
            const existing = localList[existingIdx];
            if (newEntry.moves > existing.moves || (newEntry.moves === existing.moves && newEntry.time >= existing.time)) {
                shouldUpdateLocal = false;
            }
        }

        if (shouldUpdateLocal) {
            const updatedList = (existingIdx !== -1)
                ? localList.map((e, i) => i === existingIdx ? newEntry : e)
                : [...localList, newEntry];

            const sortedLocal = updatedList.sort((a, b) => {
                if (a.moves !== b.moves) return a.moves - b.moves;
                return a.time - b.time;
            }).slice(0, 5);

            setLeaderboard(sortedLocal);
            localStorage.setItem('memoryLeaderboard', JSON.stringify(sortedLocal));
        }

        setShowNameInput(false);
        setGameState('LEADERBOARD');

        if (isFirebaseConfigured) {
            try {
                await addDoc(collection(db, "memory_leaderboard"), {
                    name: newEntry.name,
                    moves: newEntry.moves,
                    time: newEntry.time,
                    difficulty: newEntry.difficulty,
                    created_at: serverTimestamp()
                });

                await fetchLeaderboard();
            } catch (e) {
                console.error("Firebase sync failed:", e);
            }
        }

        setIsSaving(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-slate-800 flex flex-col items-center p-2 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-4 md:mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-purple-100 shadow-sm font-bold text-sm md:text-base">
                    <ArrowLeft size={18} className="md:w-5 md:h-5" />
                    <span className="tracking-tight uppercase">Exit</span>
                </Link>
                {gameState === 'PLAYING' && (
                    <div className="flex gap-2 md:gap-4 items-center">
                        <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-purple-100 shadow-sm font-black text-sm md:text-base flex items-center gap-2">
                            <Star className="text-yellow-500" size={16} />
                            <span>{moves} moves</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-purple-100 shadow-sm font-black text-sm md:text-base flex items-center gap-2">
                            <Clock className="text-blue-500" size={16} />
                            <span>{formatTime(time)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative w-full max-w-[95vw] md:max-w-[640px] flex justify-center">
                {gameState === 'START' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter text-purple-500 uppercase">하얀하늘이 메모리 카드 게임! 🧩</h2>
                        <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 font-medium">같은 빵 친구를 찾아보세요! ✨</p>

                        <div className="mb-6">
                            <p className="text-purple-500 text-[10px] uppercase tracking-widest font-black mb-3">난이도 선택</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDifficulty('kids')}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm transition-all ${difficulty === 'kids'
                                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">👶</div>
                                    <div>아이 모드</div>
                                    <div className="text-[9px] opacity-70 mt-1">8장 (4쌍)</div>
                                </button>
                                <button
                                    onClick={() => setDifficulty('adult')}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm transition-all ${difficulty === 'adult'
                                        ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg scale-105'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">🔥</div>
                                    <div>어른 모드</div>
                                    <div className="text-[9px] opacity-70 mt-1">16장 (8쌍)</div>
                                </button>
                            </div>
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
                                onClick={initGame}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black tracking-widest text-base md:text-lg shadow-xl shadow-purple-100 transition-all active:scale-95 flex items-center gap-2 md:gap-3 mx-auto w-full justify-center"
                            >
                                시작하기! 🧩
                            </button>
                            <button
                                onClick={() => setGameState('LEADERBOARD')}
                                className="bg-white hover:bg-slate-50 text-slate-600 px-8 py-3 rounded-[1.5rem] font-bold text-sm border border-slate-100 flex items-center gap-2 mx-auto"
                            >
                                <Medal size={16} /> 명예의 전당 보기
                            </button>
                        </div>
                        <div className="mt-6 flex flex-col items-center gap-2 opacity-40">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Memory Game v1.0</p>
                            <div className="flex items-center gap-1.5 grayscale">
                                <div className={`w-1 h-1 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                    {isFirebaseConfigured ? 'Firebase Sync Ready' : 'Local Mode Only'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'PLAYING' && (
                    <div className="w-full">
                        <div className={`grid ${difficulty === 'kids' ? 'grid-cols-4' : 'grid-cols-4'} gap-2 md:gap-4`}>
                            {cards.map((card) => {
                                const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.content);
                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => handleCardClick(card.id)}
                                        disabled={isFlipped}
                                        className={`aspect-square rounded-2xl md:rounded-3xl font-black text-4xl md:text-6xl transition-all duration-300 transform overflow-hidden ${isFlipped
                                                ? 'bg-white shadow-lg scale-100'
                                                : 'bg-gradient-to-br from-purple-400 to-pink-400 shadow-md hover:scale-105 active:scale-95'
                                            } ${matchedPairs.includes(card.content) ? 'opacity-70' : ''}`}
                                    >
                                        {isFlipped ? (
                                            card.image ? (
                                                <img
                                                    src={card.image}
                                                    alt={card.content}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                card.emoji
                                            )
                                        ) : (
                                            '?'
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {gameState === 'WON' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-purple-50 w-full">
                        <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase text-emerald-500">축하합니다! 🎉</h2>
                        <p className="text-sm md:text-base text-slate-600 mb-6 font-medium">모든 카드를 찾았어요!</p>

                        {showNameInput ? (
                            <div className="mb-6">
                                <div className="bg-slate-50 py-4 px-6 rounded-3xl mb-4 flex justify-around">
                                    <div className="text-center">
                                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Moves</p>
                                        <p className="text-xl font-black text-slate-700">{moves}</p>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200 self-center" />
                                    <div className="text-center">
                                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Time</p>
                                        <p className="text-xl font-black text-slate-700">{formatTime(time)}</p>
                                    </div>
                                </div>
                                <p className="text-purple-600 font-black text-[10px] mb-2 uppercase tracking-widest">명예의 전당에 등록할 이름</p>
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
                                        {isSaving ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                저장 중...
                                            </>
                                        ) : (
                                            '등록'
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowNameInput(false)}
                                    className="mt-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-tighter"
                                >
                                    등록하지 않고 계속하기
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 py-4 px-6 rounded-3xl mb-6 flex justify-around">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">Moves</p>
                                    <p className="text-3xl font-black text-slate-700">{moves}</p>
                                </div>
                                <div className="w-px h-12 bg-slate-200 self-center" />
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">Time</p>
                                    <p className="text-3xl font-black text-slate-700">{formatTime(time)}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={initGame}
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
                                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Shared</span>
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
                                            <p className="text-lg md:text-xl font-black text-purple-500 tracking-tighter leading-none">{entry.moves} moves</p>
                                            <p className="text-[10px] text-purple-400 font-bold uppercase mt-0.5">{formatTime(entry.time)}</p>
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

export default MemoryGame;
