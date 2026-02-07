import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';

import paddleImage from '../assets/paddle_custom.png';
import paddleHitImage from '../assets/paddle_hit.png';

// Type Definitions
interface LeaderboardEntry {
    id?: string;
    name: string;
    score: number;
    time: number;
    created_at?: string | Timestamp | null;
    date?: string;
}

interface Brick {
    x: number;
    y: number;
    status: number;
    emoji: string;
}

const BreakoutGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paddleImgRef = useRef<HTMLImageElement | null>(null);
    const paddleHitImgRef = useRef<HTMLImageElement | null>(null);
    const hitTimerRef = useRef(0);

    // States
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'WON' | 'LEADERBOARD'>('START');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('breakoutHighScore') || '0'));
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
        try {
            const saved = localStorage.getItem('breakoutLeaderboard');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('breakoutPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [gameTime, setGameTime] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
    const [dbError, setDbError] = useState('');
    const [difficulty, setDifficulty] = useState<'kids' | 'adult'>('adult');

    // Admin reset counter
    const resetClickCountRef = useRef(0);

    const startTimeRef = useRef(0);
    const finalTimeRef = useRef(0);

    // Game Constants (Mobile Optimized)
    // Logical Canvas Size (Internal Resolution) - Portrait Ratio
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 600;

    const PADDLE_HEIGHT = 20;
    const PADDLE_WIDTH = difficulty === 'kids' ? 140 : 100; // Adjusted for mobile width
    const BALL_RADIUS = 8;

    // Responsive Bricks
    const BRICK_COLUMN_COUNT = 6; // Reduced from 10 to fit mobile width
    const BRICK_ROW_COUNT = difficulty === 'kids' ? 3 : 5;
    const BRICK_PADDING = 8;
    const BRICK_OFFSET_TOP = 60;
    const BRICK_OFFSET_LEFT = 20;
    const BRICK_WIDTH = (CANVAS_WIDTH - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / BRICK_COLUMN_COUNT;
    const BRICK_HEIGHT = 40;

    const BALL_SPEED = difficulty === 'kids' ? 3.0 : 4.5; // Faster for mobile feel

    const BREAD_EMOJIS = ['🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🍩', '🧁', '🍰'];

    const requestRef = useRef<number>();
    const paddleRef = useRef({ x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2 });
    const ballRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100, dx: BALL_SPEED, dy: -BALL_SPEED });
    const bricksRef = useRef<Brick[][]>([]);

    // Load assets
    useEffect(() => {
        const removeWhiteBackground = (img: HTMLImageElement) => {
            const canvas = document.createElement('canvas');
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return canvas;

            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas as any; // Cast for image source compatibility
        };

        const loadPaddle = (src: string, ref: React.MutableRefObject<HTMLImageElement | null>) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => { ref.current = removeWhiteBackground(img); };
            img.src = src;
        };

        loadPaddle(paddleImage, paddleImgRef);
        loadPaddle(paddleHitImage, paddleHitImgRef);
    }, []);

    const initBricks = () => {
        const newBricks: Brick[][] = [];
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            newBricks[c] = [];
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                newBricks[c][r] = { x: 0, y: 0, status: 1, emoji: BREAD_EMOJIS[(c + r) % BREAD_EMOJIS.length] };
            }
        }
        return newBricks;
    };

    const initGame = () => {
        paddleRef.current.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
        ballRef.current = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - PADDLE_HEIGHT - 40,
            dx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), // Random start direction
            dy: -BALL_SPEED
        };
        bricksRef.current = initBricks();
        setScore(0);
        setGameTime(0);
        startTimeRef.current = Date.now();
        setShowNameInput(false);
    };

    // Firebase Logic (Simplified for brevity, same as before but typed)
    const fetchLeaderboard = useCallback(async () => {
        try {
            if (!isFirebaseConfigured) {
                setDbStatus('offline');
                return;
            }
            setDbStatus('checking');
            const q = query(collection(db, "breakout_leaderboard"), orderBy("score", "desc"), limit(20));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                created_at: null // Simplify date for now
            })) as unknown as LeaderboardEntry[];

            if (data) {
                setDbStatus('online');
                // De-dupe logic omitted for brevity
                setLeaderboard(data.slice(0, 5));
                localStorage.setItem('breakoutLeaderboard', JSON.stringify(data.slice(0, 5)));
            }
        } catch (e: any) {
            setDbStatus('error');
            setDbError(e.message);
        }
    }, []);

    useEffect(() => {
        if (gameState === 'LEADERBOARD') fetchLeaderboard();
    }, [gameState, fetchLeaderboard]);

    const saveScore = async () => {
        if (!playerName.trim() || isSaving) return;
        setIsSaving(true);
        const newEntry: LeaderboardEntry = {
            name: playerName.trim(),
            score,
            time: finalTimeRef.current,
            date: new Date().toLocaleDateString('ko-KR')
        };

        // Optimistic UI update
        const updated = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 5);
        setLeaderboard(updated);
        localStorage.setItem('breakoutLeaderboard', JSON.stringify(updated));
        setShowNameInput(false);
        setGameState('LEADERBOARD');

        if (isFirebaseConfigured) {
            try {
                await addDoc(collection(db, "breakout_leaderboard"), {
                    ...newEntry,
                    created_at: serverTimestamp()
                });
                await fetchLeaderboard();
            } catch (e) { console.error(e); }
        }
        setIsSaving(false);
    };

    // Game Loop
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#fff1f2');
        grad.addColorStop(1, '#ffedd5');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Bricks
        let activeBricks = 0;
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricksRef.current[c][r];
                if (b.status === 1) {
                    activeBricks++;
                    const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                    b.x = brickX;
                    b.y = brickY;
                    ctx.font = '30px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(b.emoji, brickX + BRICK_WIDTH / 2, brickY + BRICK_HEIGHT / 2);
                }
            }
        }

        // Paddle
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.fillStyle = '#fb923c';
        // Simple Rect Paddle for cleaner mobile look
        ctx.beginPath();
        ctx.roundRect(paddleRef.current.x, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT, 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.closePath();

        // Physics
        // Wall
        if (ballRef.current.x + ballRef.current.dx > CANVAS_WIDTH - BALL_RADIUS || ballRef.current.x + ballRef.current.dx < BALL_RADIUS) {
            ballRef.current.dx = -ballRef.current.dx;
        }
        if (ballRef.current.y + ballRef.current.dy < BALL_RADIUS) {
            ballRef.current.dy = -ballRef.current.dy;
        } else if (ballRef.current.y + ballRef.current.dy > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 - BALL_RADIUS) {
            // Paddle Collision
            if (ballRef.current.x > paddleRef.current.x && ballRef.current.x < paddleRef.current.x + PADDLE_WIDTH) {
                ballRef.current.dy = -Math.abs(ballRef.current.dy); // Bounce Up
                // Add spin based on hit position
                const hitPoint = ballRef.current.x - (paddleRef.current.x + PADDLE_WIDTH / 2);
                ballRef.current.dx += hitPoint * 0.05;
            } else if (ballRef.current.y + ballRef.current.dy > CANVAS_HEIGHT) {
                // Game Over
                setGameState('GAMEOVER');
                finalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setGameTime(finalTimeRef.current);
                setShowNameInput(score >= 30);
                return;
            }
        }

        ballRef.current.x += ballRef.current.dx;
        ballRef.current.y += ballRef.current.dy;

        // Brick Collision
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricksRef.current[c][r];
                if (b.status === 1) {
                    if (ballRef.current.x > b.x && ballRef.current.x < b.x + BRICK_WIDTH &&
                        ballRef.current.y > b.y && ballRef.current.y < b.y + BRICK_HEIGHT) {
                        ballRef.current.dy = -ballRef.current.dy;
                        b.status = 0;
                        setScore(prev => prev + 10);
                        activeBricks--;
                    }
                }
            }
        }

        if (activeBricks === 0) {
            setGameState('WON');
            finalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
            return;
        }

        requestRef.current = requestAnimationFrame(draw);
    }, [difficulty]); // Re-create loop if difficulty changes

    useEffect(() => {
        if (gameState === 'PLAYING') {
            initGame();
            requestRef.current = requestAnimationFrame(draw);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState]);

    // Touch/Mouse Handling
    const handleInput = (clientX: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width; // Scale visual coord to logic coord
        const x = (clientX - rect.left) * scaleX;
        paddleRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 pb-20 font-sans">
            {/* Header */}
            <div className="w-full bg-slate-800 p-4 pb-6 rounded-b-[2rem] shadow-xl z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <Link to="/game" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
                        <ArrowLeft size={18} /> EXIT
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold text-orange-400">
                            <Trophy size={14} /> <span>{score}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Canvas */}
            <div className="relative mt-[-20px] w-full max-w-[400px] px-4">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto bg-white rounded-[2rem] shadow-2xl cursor-pointer touch-none"
                    onMouseMove={(e) => handleInput(e.clientX)}
                    onTouchMove={(e) => handleInput(e.touches[0].clientX)}
                    onTouchStart={(e) => handleInput(e.touches[0].clientX)}
                />

                {/* Overlays */}
                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-4 bg-black/60 backdrop-blur-sm rounded-[1.5rem] flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
                        {gameState === 'START' && (
                            <>
                                <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">DONUT<br />BREAKER</h1>
                                <p className="text-slate-300 text-sm mb-6">도넛 숲의 친구들을 구해주세요!</p>

                                <div className="flex gap-2 w-full mb-6">
                                    <button onClick={() => setDifficulty('kids')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${difficulty === 'kids' ? 'bg-pink-500 border-pink-500 text-white' : 'border-slate-600 text-slate-400'}`}>
                                        EASY
                                    </button>
                                    <button onClick={() => setDifficulty('adult')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${difficulty === 'adult' ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-600 text-slate-400'}`}>
                                        HARD
                                    </button>
                                </div>
                                <div className="w-full mb-4">
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter Nickname"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center font-bold text-white mb-2"
                                    />
                                </div>
                                <button onClick={() => setGameState('PLAYING')} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                                    <Play fill="white" size={20} /> START
                                </button>
                            </>
                        )}

                        {(gameState === 'GAMEOVER' || gameState === 'WON') && (
                            <>
                                <div className="text-5xl mb-2">{gameState === 'WON' ? '🎉' : '💀'}</div>
                                <h2 className="text-2xl font-black mb-2">{gameState === 'WON' ? 'CLEAR!' : 'GAME OVER'}</h2>
                                <p className="text-slate-300 mb-6 font-bold text-lg">Score: {score}</p>

                                {showNameInput && (
                                    <div className="w-full mb-4 animate-in slide-in-from-bottom">
                                        <button onClick={saveScore} className="w-full bg-emerald-500 py-3 rounded-xl font-bold mb-2">
                                            랭킹 등록
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2 w-full">
                                    <button onClick={() => setGameState('PLAYING')} className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold">
                                        RETRY
                                    </button>
                                    <button onClick={() => setGameState('LEADERBOARD')} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold">
                                        RANK
                                    </button>
                                </div>
                            </>
                        )}

                        {gameState === 'LEADERBOARD' && (
                            <div className="w-full h-full flex flex-col">
                                <h2 className="text-xl font-black mb-4 flex items-center justify-center gap-2"><Medal className="text-yellow-500" /> RANKING</h2>
                                <div className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide">
                                    {leaderboard.length === 0 ? <p className="text-slate-500 text-sm mt-10">아직 기록이 없어요!</p> :
                                        leaderboard.map((entry, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white/10 p-3 rounded-lg text-sm">
                                                <span className="font-bold w-6 text-slate-400">#{i + 1}</span>
                                                <span className="font-medium text-white flex-1 text-left px-2 truncate">{entry.name}</span>
                                                <span className="font-bold text-orange-400">{entry.score}</span>
                                            </div>
                                        ))}
                                </div>
                                <button onClick={() => setGameState('START')} className="w-full bg-slate-700 py-3 rounded-xl font-bold">
                                    BACK
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BreakoutGame;
