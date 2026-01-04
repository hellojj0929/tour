import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

import paddleImage from '../assets/paddle_custom.png';
import paddleHitImage from '../assets/paddle_hit.png';

const BreakoutGame = () => {
    const canvasRef = useRef(null);
    const paddleImgRef = useRef(null);
    const paddleHitImgRef = useRef(null);
    const hitTimerRef = useRef(0);
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER, WON
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('breakoutHighScore') || '0'));

    // Game constants
    const PADDLE_HEIGHT = 80;
    const PADDLE_WIDTH = 160;
    const BALL_RADIUS = 8;
    const BRICK_ROW_COUNT = 5;
    const BRICK_COLUMN_COUNT = 7;
    const BRICK_WIDTH = 75;
    const BRICK_HEIGHT = 20;
    const BRICK_PADDING = 10;
    const BRICK_OFFSET_TOP = 40;
    const BRICK_OFFSET_LEFT = 35;

    const requestRef = useRef();
    const paddleRef = useRef({ x: 0 });
    const ballRef = useRef({ x: 0, y: 0, dx: 2.5, dy: -2.5 });
    const bricksRef = useRef([]);

    // Load paddle images
    useEffect(() => {
        const img = new Image();
        img.src = paddleImage;
        img.onload = () => {
            paddleImgRef.current = img;
        };
        const hitImg = new Image();
        hitImg.src = paddleHitImage;
        hitImg.onload = () => {
            paddleHitImgRef.current = hitImg;
        };
    }, []);

    // Initialize bricks
    const initBricks = () => {
        const bricks = [];
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }
        return bricks;
    };

    const initGame = (canvas) => {
        paddleRef.current.x = (canvas.width - PADDLE_WIDTH) / 2;
        ballRef.current = {
            x: canvas.width / 2,
            y: canvas.height - 40 - PADDLE_HEIGHT,
            dx: 2.5 * (Math.random() > 0.5 ? 1 : -1),
            dy: -2.5
        };
        bricksRef.current = initBricks();
        setScore(0);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Bricks
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricksRef.current[c][r];
                if (b.status === 1) {
                    const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                    b.x = brickX;
                    b.y = brickY;

                    const gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + BRICK_HEIGHT);
                    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6'];
                    gradient.addColorStop(0, colors[r]);
                    gradient.addColorStop(1, colors[r]);

                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    ctx.closePath();

                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#fff";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // Draw Paddle (Image)
        const currentImg = (hitTimerRef.current > 0 && paddleHitImgRef.current)
            ? paddleHitImgRef.current
            : paddleImgRef.current;

        if (currentImg) {
            ctx.drawImage(
                currentImg,
                paddleRef.current.x,
                canvas.height - PADDLE_HEIGHT - 10,
                PADDLE_WIDTH,
                PADDLE_HEIGHT
            );
            if (hitTimerRef.current > 0) hitTimerRef.current--;
        } else {
            ctx.beginPath();
            ctx.roundRect(paddleRef.current.x, canvas.height - 20, PADDLE_WIDTH, 10, 6);
            ctx.fillStyle = '#6366f1';
            ctx.fill();
            ctx.closePath();
        }

        // Brick Collision
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricksRef.current[c][r];
                if (b.status === 1) {
                    if (
                        ballRef.current.x > b.x &&
                        ballRef.current.x < b.x + BRICK_WIDTH &&
                        ballRef.current.y > b.y &&
                        ballRef.current.y < b.y + BRICK_HEIGHT
                    ) {
                        ballRef.current.dy = -ballRef.current.dy;
                        b.status = 0;
                        setScore(s => s + 10);
                    }
                }
            }
        }

        // Wall Collision
        if (ballRef.current.x + ballRef.current.dx > canvas.width - BALL_RADIUS || ballRef.current.x + ballRef.current.dx < BALL_RADIUS) {
            ballRef.current.dx = -ballRef.current.dx;
        }
        if (ballRef.current.y + ballRef.current.dy < BALL_RADIUS) {
            ballRef.current.dy = -ballRef.current.dy;
        } else if (ballRef.current.y + ballRef.current.dy > canvas.height - BALL_RADIUS - 10) {
            // Paddle Collision
            if (ballRef.current.x > paddleRef.current.x && ballRef.current.x < paddleRef.current.x + PADDLE_WIDTH) {
                if (ballRef.current.y < canvas.height - 10) {
                    ballRef.current.dy = -ballRef.current.dy;
                    ballRef.current.dx += (ballRef.current.x - (paddleRef.current.x + PADDLE_WIDTH / 2)) * 0.15;
                    hitTimerRef.current = 45; // Show hit image for 45 frames (approx 0.75s)
                }
            } else if (ballRef.current.y + ballRef.current.dy > canvas.height) {
                setGameState('GAMEOVER');
                return;
            }
        }

        ballRef.current.x += ballRef.current.dx;
        ballRef.current.y += ballRef.current.dy;

        // Check Win
        let activeBricks = 0;
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                if (bricksRef.current[c][r].status === 1) activeBricks++;
            }
        }
        if (activeBricks === 0) {
            setGameState('WON');
            return;
        }

        requestRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        if (gameState === 'PLAYING') {
            requestRef.current = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            initGame(canvas);
        }
    }, []);

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('breakoutHighScore', score.toString());
        }
    }, [score, highScore]);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const root = document.documentElement;
        const mouseX = e.clientX - rect.left - root.scrollLeft;
        paddleRef.current.x = Math.max(0, Math.min(canvas.width - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
    };

    const startGame = () => {
        initGame(canvasRef.current);
        setGameState('PLAYING');
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-8 font-sans overflow-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-8">
                <Link to="/game" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span className="font-bold tracking-tight">EXIT GAME</span>
                </Link>
                <div className="flex gap-4">
                    <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 font-black tracking-tighter flex items-center gap-2">
                        <span className="text-indigo-400 text-xs uppercase tracking-widest">Score</span>
                        <span className="text-xl">{score}</span>
                    </div>
                    <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 font-black tracking-tighter flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" />
                        <span className="text-indigo-400 text-xs uppercase tracking-widest">Best</span>
                        <span className="text-xl">{highScore}</span>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="bg-[#1e293b] rounded-[2.5rem] border border-slate-700 shadow-2xl cursor-none"
                    onMouseMove={handleMouseMove}
                />

                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        {gameState === 'START' && (
                            <>
                                <h2 className="text-4xl font-black mb-4 tracking-tighter text-indigo-400 uppercase">Super Kid Mode</h2>
                                <p className="text-slate-400 mb-8 font-medium italic">"공을 놓치지 마세요!"</p>
                                <button
                                    onClick={startGame}
                                    className="bg-indigo-500 hover:bg-indigo-600 px-8 py-4 rounded-3xl font-black tracking-widest text-sm shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    GAME START
                                </button>
                            </>
                        )}
                        {gameState === 'GAMEOVER' && (
                            <>
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-pink-500">GAME OVER</h2>
                                <p className="text-slate-400 mb-8 font-medium">다시 한번 해봐요!</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-3xl font-black tracking-widest text-sm border border-slate-600 transition-all active:scale-95"
                                >
                                    <RefreshCw size={18} /> RETRY
                                </button>
                            </>
                        )}
                        {gameState === 'WON' && (
                            <>
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-emerald-400">VICTORY!</h2>
                                <p className="text-slate-400 mb-8 font-medium">대단해요! 미션을 완료했습니다.</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 px-8 py-4 rounded-3xl font-black tracking-widest text-sm shadow-xl transition-all active:scale-95"
                                >
                                    PLAY AGAIN
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 text-slate-500 text-xs font-bold tracking-[0.3em] uppercase opacity-50">
                Move mouse to control Super Kid
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
        </div>
    );
};

export default BreakoutGame;
