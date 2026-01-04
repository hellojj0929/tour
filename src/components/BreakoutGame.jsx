import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

import paddleImage from '../assets/paddle_custom.png';
import paddleHitImage from '../assets/paddle_hit.png';
import gameBgImage from '../assets/game_bg.png';

const BreakoutGame = () => {
    const canvasRef = useRef(null);
    const paddleImgRef = useRef(null);
    const paddleHitImgRef = useRef(null);
    const bgImgRef = useRef(null);
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

    // Load assets
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
        const bgImg = new Image();
        bgImg.src = gameBgImage;
        bgImg.onload = () => {
            bgImgRef.current = bgImg;
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

        // Draw Background Image
        if (bgImgRef.current) {
            ctx.drawImage(bgImgRef.current, 0, 0, canvas.width, canvas.height);
            // Add a slight white overlay to make bricks more visible
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#f0f9ff'; // Light sky blue fallback
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

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
                    // Brighter, candy-like colors
                    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#1DD1A1'];
                    gradient.addColorStop(0, colors[r]);
                    gradient.addColorStop(1, colors[r]);

                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                    ctx.fillStyle = gradient;
                    // Add subtle glow to bricks
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = colors[r];
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.closePath();

                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#FF4757"; // Vibrant red ball
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 71, 87, 0.5)";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // Draw Paddle (Image)
        const currentImg = (hitTimerRef.current > 0 && paddleHitImgRef.current)
            ? paddleHitImgRef.current
            : paddleImgRef.current;

        if (currentImg) {
            // Draw a subtle shadow for the kids
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.drawImage(
                currentImg,
                paddleRef.current.x,
                canvas.height - PADDLE_HEIGHT - 10,
                PADDLE_WIDTH,
                PADDLE_HEIGHT
            );
            ctx.shadowBlur = 0;
            if (hitTimerRef.current > 0) hitTimerRef.current--;
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
        <div className="min-h-screen bg-[#f0f9ff] text-slate-800 flex flex-col items-center p-8 font-sans overflow-hidden">
            {/* Soft decorative circles for a friendly look */}
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-sky-200/50 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[100px] -z-10"></div>

            <div className="max-w-3xl w-full flex justify-between items-center mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors bg-white/50 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/50 shadow-sm">
                    <ArrowLeft size={20} />
                    <span className="font-bold tracking-tight">EXIT</span>
                </Link>
                <div className="flex gap-4">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white shadow-sm font-black tracking-tighter flex items-center gap-2">
                        <span className="text-sky-500 text-xs uppercase tracking-widest">Score</span>
                        <span className="text-xl text-slate-700">{score}</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white shadow-sm font-black tracking-tighter flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" />
                        <span className="text-sky-500 text-xs uppercase tracking-widest">Best</span>
                        <span className="text-xl text-slate-700">{highScore}</span>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="bg-white rounded-[2.5rem] border-4 border-white shadow-2xl cursor-none overflow-hidden"
                    onMouseMove={handleMouseMove}
                />

                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        {gameState === 'START' && (
                            <div className="bg-white/80 p-10 rounded-[3rem] shadow-xl border border-white">
                                <h2 className="text-4xl font-black mb-4 tracking-tighter text-sky-500 uppercase">뽀로로 마을 대모험</h2>
                                <p className="text-slate-600 mb-8 font-medium">아이들과 함께 블록을 깨보아요! ❄️</p>
                                <button
                                    onClick={startGame}
                                    className="bg-sky-500 hover:bg-sky-600 text-white px-10 py-5 rounded-[2.5rem] font-black tracking-widest text-lg shadow-xl shadow-sky-200 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    시작하기! 🚀
                                </button>
                            </div>
                        )}
                        {gameState === 'GAMEOVER' && (
                            <div className="bg-white/80 p-10 rounded-[3rem] shadow-xl border border-white">
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-orange-500">다시 해볼까요?</h2>
                                <p className="text-slate-600 mb-8 font-medium">눈밭에 공이 빠졌어요! ❄️</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-[2rem] font-black tracking-widest text-sm border border-white shadow-sm transition-all active:scale-95"
                                >
                                    <RefreshCw size={18} /> 한 번 더!
                                </button>
                            </div>
                        )}
                        {gameState === 'WON' && (
                            <div className="bg-white/80 p-10 rounded-[3rem] shadow-xl border border-white">
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-emerald-500">와! 성공이에요!</h2>
                                <p className="text-slate-600 mb-8 font-medium">모든 블록을 다 깨뜨렸어요! 🎉</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-[2rem] font-black tracking-widest text-sm shadow-xl shadow-sky-200 transition-all active:scale-95"
                                >
                                    다시 하기
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-10 text-slate-400 text-sm font-bold tracking-[0.2em] uppercase bg-white/50 px-6 py-2 rounded-full backdrop-blur-sm border border-white">
                마우스로 아이들을 움직여 공을 튕겨주세요! ✨
            </div>
        </div>
    );
};

export default BreakoutGame;
