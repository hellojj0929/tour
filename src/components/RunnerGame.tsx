import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';
import hayanFace from '../assets/hayan-face.png';

interface LeaderboardEntry {
    id?: string;
    name: string;
    score: number;
    created_at?: string | Timestamp | null;
    date?: string;
}

const RunnerGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'LEADERBOARD'>('START');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        try { return parseInt(localStorage.getItem('runnerHighScore') || '0'); } catch { return 0; }
    });
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('runnerPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
        try {
            const saved = localStorage.getItem('runnerLeaderboard');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
    const [dbError, setDbError] = useState('');

    // Game Constants
    const CANVAS_WIDTH = 380;
    const CANVAS_HEIGHT = 550; // Taller for portrait

    const gameRef = useRef({
        player: { y: 200, velocity: 0, size: 40 },
        obstacles: [] as { x: number, height: number, type: 'top' | 'bottom', passed: boolean }[],
        score: 0,
        frameCount: 0,
        gravity: 0.6,
        jumpStrength: -12,
        obstacleSpeed: 4.5, // Slightly faster
        obstacleGap: 180, // More clickable space
        lastObstacle: 0,
        bgScroll: 0
    });

    const requestRef = useRef<number>();
    const hayanImgRef = useRef<HTMLImageElement | null>(null);

    // Initialize Image
    useEffect(() => {
        const img = new Image();
        img.src = hayanFace;
        img.onload = () => { hayanImgRef.current = img; };
        img.onerror = () => { console.warn("Failed to load character image"); };
    }, []);

    const startGame = () => {
        const game = gameRef.current;
        game.player = { y: 200, velocity: 0, size: 40 };
        game.obstacles = [];
        game.score = 0;
        game.frameCount = 0;
        game.lastObstacle = -game.obstacleGap;
        game.bgScroll = 0;
        setScore(0);
        setGameState('PLAYING');
    };

    const jump = () => {
        if (gameState === 'PLAYING') {
            gameRef.current.player.velocity = gameRef.current.jumpStrength;
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const game = gameRef.current;

        // Clear
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - 50);
        skyGradient.addColorStop(0, '#e0f2fe');
        skyGradient.addColorStop(1, '#dbeafe');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - 50);

        game.bgScroll += 1;

        // Draw Ground
        const groundY = CANVAS_HEIGHT - 50;
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, groundY, CANVAS_WIDTH, 50);

        // Stripes on ground
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.lineDashOffset = -game.bgScroll * 3;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(0, groundY + 10);
        ctx.lineTo(CANVAS_WIDTH, groundY + 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Player Physics
        game.player.velocity += game.gravity;
        game.player.y += game.player.velocity;

        // Ground Collision
        if (game.player.y > groundY - game.player.size) {
            game.player.y = groundY - game.player.size;
            game.player.velocity = 0;
        }
        // Ceiling
        if (game.player.y < 0) {
            game.player.y = 0;
            game.player.velocity = 0;
        }

        const playerX = 60;
        const pSize = game.player.size;
        const pY = game.player.y;

        // Draw Player
        if (hayanImgRef.current) {
            ctx.save();
            // Simple bobbing effect or rotation could go here
            ctx.drawImage(hayanImgRef.current, playerX, pY, pSize, pSize);
            ctx.restore();
        } else {
            // Fallback
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(playerX, pY, pSize, pSize);
        }

        // Generate Obstacles
        game.frameCount++;
        if (game.frameCount - game.lastObstacle > game.obstacleGap) {
            const height = 50 + Math.random() * 80; // Reasonable height
            const isTop = Math.random() > 0.5;
            game.obstacles.push({
                x: CANVAS_WIDTH,
                height: height,
                type: isTop ? 'top' : 'bottom',
                passed: false
            });
            game.lastObstacle = game.frameCount;
        }

        // Update Obstacles
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obs = game.obstacles[i];
            obs.x -= game.obstacleSpeed;

            ctx.fillStyle = '#334155';
            if (obs.type === 'bottom') {
                ctx.fillRect(obs.x, groundY - obs.height, 40, obs.height);
                // Detail
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(obs.x + 5, groundY - obs.height + 5, 30, obs.height - 10);
            } else {
                ctx.fillRect(obs.x, 0, 40, obs.height);
                // Detail
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(obs.x + 5, 5, 30, obs.height - 10);
            }

            // AABB Collision
            const pRight = playerX + pSize - 5; // hitbox adjustment
            const pLeft = playerX + 5;
            const pTop = pY + 5;
            const pBottom = pY + pSize - 5;
            const obsRight = obs.x + 40;
            const obsLeft = obs.x;

            let collision = false;
            if (pRight > obsLeft && pLeft < obsRight) {
                if (obs.type === 'bottom') {
                    if (pBottom > groundY - obs.height) collision = true;
                } else {
                    if (pTop < obs.height) collision = true;
                }
            }

            if (collision) {
                setGameState('GAMEOVER');
                if (game.score > highScore) {
                    setHighScore(game.score);
                    localStorage.setItem('runnerHighScore', game.score.toString());
                }
                setShowNameInput(game.score >= 5);
                return;
            }

            if (!obs.passed && obsRight < playerX) {
                obs.passed = true;
                game.score++;
                setScore(game.score);
            }

            if (obs.x < -50) game.obstacles.splice(i, 1);
        }

        requestRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        if (gameState === 'PLAYING') {
            requestRef.current = requestAnimationFrame(draw);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState]);

    // Simple save score
    const saveScore = async () => {
        if (!playerName.trim() || isSaving) return;
        setIsSaving(true);
        const newEntry = { name: playerName, score, date: new Date().toLocaleDateString() };
        setLeaderboard([newEntry, ...leaderboard].sort((a, b) => b.score - a.score).slice(0, 5));
        setShowNameInput(false);
        setGameState('LEADERBOARD');
        setIsSaving(false);

        // Fire and forget firebase
        if (isFirebaseConfigured) {
            addDoc(collection(db, 'runner_leaderboard'), { ...newEntry, created_at: serverTimestamp() }).catch(console.error);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-100 font-sans pb-20 touch-none">
            {/* Header */}
            <div className="w-full flex justify-between items-center bg-white p-4 shadow-sm z-10">
                <Link to="/game" className="text-slate-500 font-bold text-sm bg-slate-100 px-3 py-2 rounded-xl flex gap-1 items-center">
                    <ArrowLeft size={16} /> EXIT
                </Link>
                <div className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full font-black text-lg">
                    {score}
                </div>
            </div>

            {/* Game Canvas */}
            <div
                className="relative w-full max-w-[400px] mt-4 px-2"
                onClick={jump}
                onTouchStart={jump}
            >
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto bg-white rounded-2xl shadow-xl border-4 border-white"
                />

                {/* Overlays */}
                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                        {gameState === 'START' && (
                            <>
                                <h1 className="text-4xl font-black mb-2 text-blue-500">JUMP JUMP!</h1>
                                <p className="text-slate-500 mb-8 font-bold">화면을 탭해서 점프하세요!</p>
                                <button onClick={startGame} className="bg-blue-500 text-white px-10 py-4 rounded-xl font-black text-xl shadow-xl active:scale-95 transition-transform flex items-center gap-2">
                                    <Play size={24} fill="white" /> START
                                </button>
                                <button onClick={() => setGameState('LEADERBOARD')} className="mt-6 text-slate-400 font-bold text-xs underline">Rankings</button>
                            </>
                        )}
                        {gameState === 'GAMEOVER' && (
                            <>
                                <div className="text-5xl mb-4">💥</div>
                                <h2 className="text-2xl font-black text-red-500 mb-2">GAME OVER</h2>
                                <p className="text-xl font-black text-slate-800 mb-6">Score: {score}</p>

                                {showNameInput && (
                                    <div className="w-full mb-4 animate-in slide-in-from-bottom">
                                        <input
                                            type="text"
                                            value={playerName}
                                            onChange={(e) => setPlayerName(e.target.value)}
                                            placeholder="Nickname"
                                            className="w-full bg-slate-100 mb-2 p-3 rounded-xl text-center font-bold"
                                        />
                                        <button onClick={saveScore} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold">
                                            랭킹 등록
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2 w-full">
                                    <button onClick={startGame} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg">RETRY</button>
                                    <button onClick={() => setGameState('LEADERBOARD')} className="flex-1 bg-slate-200 text-slate-600 py-3 rounded-xl font-bold">RANK</button>
                                </div>
                            </>
                        )}
                        {gameState === 'LEADERBOARD' && (
                            <div className="w-full">
                                <h2 className="text-xl font-black mb-4">TOP 5 RANKING</h2>
                                <div className="space-y-2 mb-6">
                                    {leaderboard.length === 0 && <p className="text-slate-400">아직 기록이 없어요.</p>}
                                    {leaderboard.map((e, i) => (
                                        <div key={i} className="flex justify-between bg-slate-50 p-3 rounded-xl text-sm">
                                            <span className="font-bold text-slate-500">#{i + 1} {e.name}</span>
                                            <span className="font-bold text-blue-500">{e.score}</span>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => setGameState('START')} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">BACK</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="text-slate-400 text-xs mt-4">모바일 화면 어디든 탭하면 점프해요!</p>
        </div>
    );
};

export default RunnerGame;
