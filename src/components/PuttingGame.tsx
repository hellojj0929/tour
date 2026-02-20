import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal, Play, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';

import greenTexture from '../assets/green-texture.png';

// Type Definitions
interface LeaderboardEntry {
    id?: string;
    name: string;
    score: number;
    holes: number;
    created_at?: string | Timestamp | null;
    date?: string;
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Hole {
    x: number;
    y: number;
    radius: number;
}

interface SlopeArrow {
    x: number;
    y: number;
    angle: number;
    strength: number;
}

const PuttingGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);

    // States
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'AIMING' | 'ROLLING' | 'HOLE_IN' | 'GAMEOVER' | 'LEADERBOARD'>('START');
    const [score, setScore] = useState(0);
    const [strokes, setStrokes] = useState(0);
    const [currentHole, setCurrentHole] = useState(1);
    const [totalHoles] = useState(9);
    const [holeScores, setHoleScores] = useState<number[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
        try {
            const saved = localStorage.getItem('puttingLeaderboard');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('puttingPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');
    const [message, setMessage] = useState('');

    // Game Constants
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 600;
    const BALL_RADIUS = 10;
    const HOLE_RADIUS = 18;
    const MAX_POWER = 15;
    const FRICTION = 0.98;
    const SLOPE_FRICTION = 0.97;
    const MIN_VELOCITY = 0.1;

    // Refs
    const requestRef = useRef<number>();
    const ballRef = useRef<Ball>({ x: 200, y: 500, vx: 0, vy: 0 });
    const holeRef = useRef<Hole>({ x: 200, y: 120, radius: HOLE_RADIUS });
    const slopesRef = useRef<SlopeArrow[]>([]);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const dragEndRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);

    // Course Configurations
    const courses = [
        // Hole 1: Simple straight
        { holeX: 200, holeY: 100, ballX: 200, ballY: 500, slopes: [] },
        // Hole 2: Slight offset
        { holeX: 280, holeY: 120, ballX: 120, ballY: 480, slopes: [] },
        // Hole 3: Left slope
        { holeX: 150, holeY: 100, ballX: 300, ballY: 500, slopes: [{ x: 200, y: 300, angle: Math.PI, strength: 0.03 }] },
        // Hole 4: Right slope
        { holeX: 300, holeY: 130, ballX: 100, ballY: 480, slopes: [{ x: 200, y: 300, angle: 0, strength: 0.03 }] },
        // Hole 5: Down slope
        { holeX: 200, holeY: 150, ballX: 200, ballY: 450, slopes: [{ x: 200, y: 300, angle: Math.PI / 2, strength: 0.04 }] },
        // Hole 6: Up slope (harder)
        { holeX: 200, holeY: 100, ballX: 200, ballY: 520, slopes: [{ x: 200, y: 300, angle: -Math.PI / 2, strength: 0.03 }] },
        // Hole 7: Diagonal
        { holeX: 320, holeY: 100, ballX: 80, ballY: 520, slopes: [{ x: 200, y: 300, angle: Math.PI / 4, strength: 0.025 }] },
        // Hole 8: Double slope
        { holeX: 200, holeY: 80, ballX: 200, ballY: 520, slopes: [
            { x: 150, y: 350, angle: 0, strength: 0.02 },
            { x: 250, y: 200, angle: Math.PI, strength: 0.02 }
        ]},
        // Hole 9: Challenge
        { holeX: 350, holeY: 80, ballX: 50, ballY: 550, slopes: [
            { x: 200, y: 400, angle: -Math.PI / 4, strength: 0.03 },
            { x: 200, y: 200, angle: Math.PI / 3, strength: 0.025 }
        ]},
    ];

    const setupHole = useCallback((holeNum: number) => {
        const course = courses[Math.min(holeNum - 1, courses.length - 1)];
        ballRef.current = { x: course.ballX, y: course.ballY, vx: 0, vy: 0 };
        holeRef.current = { x: course.holeX, y: course.holeY, radius: HOLE_RADIUS };
        slopesRef.current = difficulty === 'hard' ? course.slopes : course.slopes.map(s => ({ ...s, strength: s.strength * 1.5 }));
        setStrokes(0);
        setMessage(`Hole ${holeNum}`);
        setTimeout(() => setMessage(''), 1500);
    }, [difficulty]);

    const initGame = () => {
        setScore(0);
        setCurrentHole(1);
        setHoleScores([]);
        setupHole(1);
        setGameState('AIMING');
    };

    // Firebase Logic
    const fetchLeaderboard = useCallback(async () => {
        try {
            if (!isFirebaseConfigured) return;
            const q = query(collection(db, "putting_leaderboard"), orderBy("score", "asc"), limit(10));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as unknown as LeaderboardEntry[];
            if (data) {
                setLeaderboard(data.slice(0, 5));
                localStorage.setItem('puttingLeaderboard', JSON.stringify(data.slice(0, 5)));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // Load background image
    useEffect(() => {
        const img = new Image();
        img.src = greenTexture;
        img.onload = () => {
            bgImageRef.current = img;
        };
    }, []);

    useEffect(() => {
        if (gameState === 'LEADERBOARD') fetchLeaderboard();
    }, [gameState, fetchLeaderboard]);

    const saveScore = async () => {
        if (!playerName.trim() || isSaving) return;
        setIsSaving(true);
        localStorage.setItem('puttingPlayerName', playerName.trim());
        const newEntry: LeaderboardEntry = {
            name: playerName.trim(),
            score,
            holes: totalHoles,
            date: new Date().toLocaleDateString('ko-KR')
        };

        const updated = [...leaderboard, newEntry].sort((a, b) => a.score - b.score).slice(0, 5);
        setLeaderboard(updated);
        localStorage.setItem('puttingLeaderboard', JSON.stringify(updated));
        setShowNameInput(false);
        setGameState('LEADERBOARD');

        if (isFirebaseConfigured) {
            try {
                await addDoc(collection(db, "putting_leaderboard"), {
                    ...newEntry,
                    created_at: serverTimestamp()
                });
                await fetchLeaderboard();
            } catch (e) { console.error(e); }
        }
        setIsSaving(false);
    };

    // Drawing
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Green background gradient
        const gradient = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 400);
        gradient.addColorStop(0, '#4ade80');
        gradient.addColorStop(0.7, '#22c55e');
        gradient.addColorStop(1, '#16a34a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Overlay photo with transparency
        if (bgImageRef.current && bgImageRef.current.complete) {
            ctx.globalAlpha = 0.8;
            ctx.drawImage(bgImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalAlpha = 1.0;
        }

        // Draw slope indicators
        slopesRef.current.forEach(slope => {
            ctx.save();
            ctx.translate(slope.x, slope.y);
            ctx.rotate(slope.angle);
            
            // Arrow body
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(20, 0);
            ctx.lineTo(20, -8);
            ctx.lineTo(40, 0);
            ctx.lineTo(20, 8);
            ctx.lineTo(20, 0);
            ctx.lineTo(-30, 0);
            ctx.fill();
            
            ctx.restore();
        });

        // Hole shadow
        ctx.beginPath();
        ctx.ellipse(holeRef.current.x + 3, holeRef.current.y + 3, HOLE_RADIUS + 5, HOLE_RADIUS + 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // Hole
        ctx.beginPath();
        ctx.arc(holeRef.current.x, holeRef.current.y, HOLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Flag
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(holeRef.current.x + HOLE_RADIUS - 2, holeRef.current.y - 60, 2, 50);
        ctx.beginPath();
        ctx.moveTo(holeRef.current.x + HOLE_RADIUS, holeRef.current.y - 60);
        ctx.lineTo(holeRef.current.x + HOLE_RADIUS + 25, holeRef.current.y - 50);
        ctx.lineTo(holeRef.current.x + HOLE_RADIUS, holeRef.current.y - 40);
        ctx.closePath();
        ctx.fill();

        // Ball shadow
        ctx.beginPath();
        ctx.ellipse(ballRef.current.x + 2, ballRef.current.y + 2, BALL_RADIUS, BALL_RADIUS * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        // Ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        const ballGradient = ctx.createRadialGradient(
            ballRef.current.x - 3, ballRef.current.y - 3, 0,
            ballRef.current.x, ballRef.current.y, BALL_RADIUS
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(1, '#e5e5e5');
        ctx.fillStyle = ballGradient;
        ctx.fill();
        ctx.strokeStyle = '#d4d4d4';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Aiming line
        if (isDraggingRef.current && dragStartRef.current && dragEndRef.current) {
            const dx = dragStartRef.current.x - dragEndRef.current.x;
            const dy = dragStartRef.current.y - dragEndRef.current.y;
            const power = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_POWER * 10);
            
            // Power indicator line
            ctx.beginPath();
            ctx.moveTo(ballRef.current.x, ballRef.current.y);
            ctx.lineTo(ballRef.current.x + dx * 0.5, ballRef.current.y + dy * 0.5);
            ctx.strokeStyle = `rgba(255, ${255 - power * 2}, 0, 0.8)`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Direction dots
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(
                    ballRef.current.x + dx * 0.1 * i,
                    ballRef.current.y + dy * 0.1 * i,
                    3,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - i * 0.15})`;
                ctx.fill();
            }

            // Power meter
            const powerPercent = power / (MAX_POWER * 10);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(20, CANVAS_HEIGHT - 40, 100, 20);
            ctx.fillStyle = powerPercent < 0.5 ? '#4ade80' : powerPercent < 0.8 ? '#facc15' : '#ef4444';
            ctx.fillRect(22, CANVAS_HEIGHT - 38, 96 * powerPercent, 16);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, CANVAS_HEIGHT - 40, 100, 20);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('POWER', 130, CANVAS_HEIGHT - 26);
        }

        // HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, 10, 120, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Hole: ${currentHole}/${totalHoles}`, 20, 32);
        ctx.fillText(`Strokes: ${strokes}`, 20, 52);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(CANVAS_WIDTH - 80, 10, 70, 35);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${score}`, CANVAS_WIDTH - 45, 35);
        ctx.textAlign = 'left';

    }, [currentHole, strokes, score, totalHoles]);

    // Physics update
    const update = useCallback(() => {
        const ball = ballRef.current;
        const hole = holeRef.current;

        if (gameState !== 'ROLLING') return;

        // Apply slope forces
        slopesRef.current.forEach(slope => {
            const dist = Math.sqrt((ball.x - slope.x) ** 2 + (ball.y - slope.y) ** 2);
            if (dist < 150) {
                ball.vx += Math.cos(slope.angle) * slope.strength;
                ball.vy += Math.sin(slope.angle) * slope.strength;
            }
        });

        // Apply friction
        ball.vx *= slopesRef.current.length > 0 ? SLOPE_FRICTION : FRICTION;
        ball.vy *= slopesRef.current.length > 0 ? SLOPE_FRICTION : FRICTION;

        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collision
        if (ball.x < BALL_RADIUS) {
            ball.x = BALL_RADIUS;
            ball.vx = -ball.vx * 0.7;
        }
        if (ball.x > CANVAS_WIDTH - BALL_RADIUS) {
            ball.x = CANVAS_WIDTH - BALL_RADIUS;
            ball.vx = -ball.vx * 0.7;
        }
        if (ball.y < BALL_RADIUS) {
            ball.y = BALL_RADIUS;
            ball.vy = -ball.vy * 0.7;
        }
        if (ball.y > CANVAS_HEIGHT - BALL_RADIUS) {
            ball.y = CANVAS_HEIGHT - BALL_RADIUS;
            ball.vy = -ball.vy * 0.7;
        }

        // Check hole
        const distToHole = Math.sqrt((ball.x - hole.x) ** 2 + (ball.y - hole.y) ** 2);
        const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
        
        if (distToHole < hole.radius - BALL_RADIUS / 2 && speed < 5) {
            // Hole in!
            ball.x = hole.x;
            ball.y = hole.y;
            ball.vx = 0;
            ball.vy = 0;
            
            const holeScore = strokes;
            setHoleScores(prev => [...prev, holeScore]);
            setScore(prev => prev + holeScore);
            
            // Message based on strokes
            if (holeScore === 1) setMessage('HOLE IN ONE! 🎉');
            else if (holeScore === 2) setMessage('BIRDIE! 🐦');
            else if (holeScore === 3) setMessage('PAR 👍');
            else if (holeScore === 4) setMessage('BOGEY');
            else setMessage('Nice try!');

            setGameState('HOLE_IN');
            
            setTimeout(() => {
                if (currentHole < totalHoles) {
                    setCurrentHole(prev => prev + 1);
                    setupHole(currentHole + 1);
                    setGameState('AIMING');
                } else {
                    setShowNameInput(true);
                    setGameState('GAMEOVER');
                }
            }, 2000);
            return;
        }

        // Stop if slow enough
        if (speed < MIN_VELOCITY) {
            ball.vx = 0;
            ball.vy = 0;
            setGameState('AIMING');
        }
    }, [gameState, strokes, currentHole, totalHoles, setupHole]);

    // Game loop
    useEffect(() => {
        if (gameState === 'AIMING' || gameState === 'ROLLING' || gameState === 'HOLE_IN') {
            const gameLoop = () => {
                update();
                draw();
                requestRef.current = requestAnimationFrame(gameLoop);
            };
            requestRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, update, draw]);

    // Input handlers
    const getCanvasCoords = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleStart = (clientX: number, clientY: number) => {
        if (gameState !== 'AIMING') return;
        const coords = getCanvasCoords(clientX, clientY);
        const dist = Math.sqrt((coords.x - ballRef.current.x) ** 2 + (coords.y - ballRef.current.y) ** 2);
        if (dist < 50) {
            isDraggingRef.current = true;
            dragStartRef.current = coords;
            dragEndRef.current = coords;
        }
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isDraggingRef.current) return;
        dragEndRef.current = getCanvasCoords(clientX, clientY);
    };

    const handleEnd = () => {
        if (!isDraggingRef.current || !dragStartRef.current || !dragEndRef.current) {
            isDraggingRef.current = false;
            return;
        }

        const dx = dragStartRef.current.x - dragEndRef.current.x;
        const dy = dragStartRef.current.y - dragEndRef.current.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER);

        if (power > 0.5) {
            const angle = Math.atan2(dy, dx);
            ballRef.current.vx = Math.cos(angle) * power;
            ballRef.current.vy = Math.sin(angle) * power;
            setStrokes(prev => prev + 1);
            setGameState('ROLLING');
        }

        isDraggingRef.current = false;
        dragStartRef.current = null;
        dragEndRef.current = null;
    };

    const getParText = (totalScore: number, holes: number) => {
        const par = holes * 3; // Par 3 for each hole
        const diff = totalScore - par;
        if (diff < -3) return 'AMAZING! 🏆';
        if (diff < 0) return `${Math.abs(diff)} Under Par! 🎉`;
        if (diff === 0) return 'Even Par 👍';
        return `${diff} Over Par`;
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-slate-900 pb-20 font-sans">
            {/* Header */}
            <div className="w-full bg-slate-800 p-4 pt-10 pb-6 rounded-b-[2rem] shadow-xl z-10 flex flex-col gap-4 mt-0">
                <div className="flex justify-between items-center px-2">
                    <Link to="/game" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold">
                        <ArrowLeft size={18} /> EXIT
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold text-green-400">
                            <Flag size={14} /> <span>Hole {currentHole}</span>
                        </div>
                        <div className="bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold text-amber-400">
                            <Trophy size={14} /> <span>{score}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Canvas */}
            <div className="relative mt-4 w-full max-w-[400px] px-4">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-auto rounded-[2rem] shadow-2xl cursor-pointer touch-none"
                    onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchEnd={handleEnd}
                />

                {/* Message overlay */}
                {message && (gameState === 'AIMING' || gameState === 'HOLE_IN') && (
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-6 py-3 rounded-xl">
                        <p className="text-white font-black text-2xl text-center">{message}</p>
                    </div>
                )}

                {/* Overlays */}
                {(gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'LEADERBOARD') && (
                    <div className="absolute inset-4 bg-black/70 backdrop-blur-sm rounded-[1.5rem] flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in">
                        {gameState === 'START' && (
                            <>
                                <div className="text-5xl mb-4">⛳</div>
                                <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">MINI PUTT</h1>
                                <p className="text-slate-300 text-sm mb-6">드래그해서 퍼팅! 9홀 도전!</p>

                                <div className="flex gap-2 w-full mb-6">
                                    <button onClick={() => setDifficulty('easy')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${difficulty === 'easy' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 text-slate-400'}`}>
                                        EASY
                                    </button>
                                    <button onClick={() => setDifficulty('hard')} className={`flex-1 py-3 rounded-xl text-xs font-bold border ${difficulty === 'hard' ? 'bg-red-500 border-red-500 text-white' : 'border-slate-600 text-slate-400'}`}>
                                        HARD
                                    </button>
                                </div>
                                <div className="w-full mb-4">
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter Nickname"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center font-bold text-white"
                                    />
                                </div>
                                <button onClick={initGame} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                                    <Play fill="white" size={20} /> START
                                </button>
                            </>
                        )}

                        {gameState === 'GAMEOVER' && (
                            <>
                                <div className="text-5xl mb-2">🏌️</div>
                                <h2 className="text-2xl font-black mb-2">ROUND COMPLETE!</h2>
                                <p className="text-3xl font-black text-amber-400 mb-1">{score} Strokes</p>
                                <p className="text-slate-300 mb-4">{getParText(score, totalHoles)}</p>
                                
                                <div className="w-full bg-slate-800/50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        {holeScores.map((s, i) => (
                                            <div key={i} className="bg-slate-700/50 rounded-lg p-2">
                                                <span className="text-slate-400">H{i + 1}</span>
                                                <span className="ml-2 font-bold text-white">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {showNameInput && (
                                    <button onClick={saveScore} className="w-full bg-emerald-500 py-3 rounded-xl font-bold mb-2">
                                        🏆 랭킹 등록
                                    </button>
                                )}
                                <div className="flex gap-2 w-full">
                                    <button onClick={initGame} className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-bold">
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
                                <p className="text-slate-400 text-xs mb-3">Lower is better! ⛳</p>
                                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                    {leaderboard.length === 0 ? <p className="text-slate-500 text-sm mt-10">아직 기록이 없어요!</p> :
                                        leaderboard.map((entry, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white/10 p-3 rounded-lg text-sm">
                                                <span className="font-bold w-6 text-slate-400">#{i + 1}</span>
                                                <span className="font-medium text-white flex-1 text-left px-2 truncate">{entry.name}</span>
                                                <span className="font-bold text-green-400">{entry.score}</span>
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

            {/* Instructions */}
            {gameState === 'AIMING' && (
                <div className="mt-4 text-center text-slate-400 text-sm">
                    <p>🏌️ 공 근처에서 드래그해서 퍼팅!</p>
                    <p className="text-xs mt-1">당기는 반대 방향으로 날아가요</p>
                </div>
            )}
        </div>
    );
};

export default PuttingGame;
