import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const BreakoutGame = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER, WON
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('breakoutHighScore') || '0'));

    // Game constants
    const PADDLE_HEIGHT = 12;
    const PADDLE_WIDTH = 100;
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
    const ballRef = useRef({ x: 0, y: 0, dx: 4, dy: -4 });
    const bricksRef = useRef([]);

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
            y: canvas.height - 30,
            dx: 4 * (Math.random() > 0.5 ? 1 : -1),
            dy: -4
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
                if (bricksRef.current[c][r].status === 1) {
                    const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                    bricksRef.current[c][r].x = brickX;
                    bricksRef.current[c][r].y = brickY;

                    const gradient = ctx.createLinearGradient(brickX, brickY, brickX, brickY + BRICK_HEIGHT);
                    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6'];
                    gradient.addColorStop(0, colors[r]);
                    gradient.addColorStop(1, colors[r]);

                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    ctx.closePath();

                    // Subtle border
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
        ctx.shadowBlur = 0; // Reset shadow
        ctx.closePath();

        // Draw Paddle
        const paddleGradient = ctx.createLinearGradient(paddleRef.current.x, 0, paddleRef.current.x + PADDLE_WIDTH, 0);
        paddleGradient.addColorStop(0, '#6366f1');
        paddleGradient.addColorStop(1, '#a855f7');

        ctx.beginPath();
        ctx.roundRect(paddleRef.current.x, canvas.height - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.fillStyle = paddleGradient;
        ctx.fill();
        ctx.closePath();

        // Collision Detection
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
            if (ballRef.current.x > paddleRef.current.x && ballRef.current.x < paddleRef.current.x + PADDLE_WIDTH) {
                ballRef.current.dy = -ballRef.current.dy;
                // Add paddle speed influence
                ballRef.current.dx += (ballRef.current.x - (paddleRef.current.x + PADDLE_WIDTH / 2)) * 0.15;
            } else {
                setGameState('GAMEOVER');
                return;
            }
        }

        // Move Ball
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
                                <h2 className="text-4xl font-black mb-4 tracking-tighter">READY?</h2>
                                <p className="text-slate-400 mb-8 font-medium">마우스로 바를 움직여 공을 튕겨보세요!</p>
                                <button
                                    onClick={startGame}
                                    className="bg-indigo-500 hover:bg-indigo-600 px-8 py-4 rounded-3xl font-black tracking-widest text-sm shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    START GAME
                                </button>
                            </>
                        )}
                        {gameState === 'GAMEOVER' && (
                            <>
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-pink-500">GAME OVER</h2>
                                <p className="text-slate-400 mb-8 font-medium">아쉽습니다! 다시 도전해보세요.</p>
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
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-emerald-400">YOU WON!</h2>
                                <p className="text-slate-400 mb-8 font-medium">모든 블록을 제거했습니다! 대단해요.</p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={startGame}
                                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 px-8 py-4 rounded-3xl font-black tracking-widest text-sm shadow-xl transition-all active:scale-95"
                                    >
                                        PLAY AGAIN
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 text-slate-500 text-xs font-bold tracking-[0.3em] uppercase opacity-50">
                Move mouse to control paddle
            </div>

            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px]"></div>
        </div>
    );
};

export default BreakoutGame;
