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
    const PADDLE_HEIGHT = 70;
    const PADDLE_WIDTH = 130;
    const BALL_RADIUS = 10;
    const BRICK_ROW_COUNT = 3;
    const BRICK_COLUMN_COUNT = 10;
    const BRICK_WIDTH = 60;
    const BRICK_HEIGHT = 60;
    const BRICK_PADDING = 4;
    const BRICK_OFFSET_TOP = 25;
    const BRICK_OFFSET_LEFT = 10;

    const BREAD_EMOJIS = ['🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🍩', '🧁', '🍰'];

    const requestRef = useRef();
    const paddleRef = useRef({ x: 0 });
    const ballRef = useRef({ x: 0, y: 0, dx: 3, dy: -3 });
    const bricksRef = useRef([]);

    // Load assets
    useEffect(() => {
        const removeWhiteBackground = (img) => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        };

        const loadPaddle = (src, ref) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                ref.current = removeWhiteBackground(img);
            };
        };

        loadPaddle(paddleImage, paddleImgRef);
        loadPaddle(paddleHitImage, paddleHitImgRef);

        const bgImg = new Image();
        bgImg.src = gameBgImage;
        bgImg.onload = () => {
            bgImgRef.current = bgImg;
        };
    }, []);

    const initBricks = () => {
        const bricks = [];
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1, emoji: BREAD_EMOJIS[(c + r) % BREAD_EMOJIS.length] };
            }
        }
        return bricks;
    };

    const initGame = (canvas) => {
        paddleRef.current.x = (canvas.width - PADDLE_WIDTH) / 2;
        ballRef.current = {
            x: canvas.width / 2,
            y: canvas.height - 40 - PADDLE_HEIGHT,
            dx: 3 * (Math.random() > 0.5 ? 1 : -1),
            dy: -3
        };
        bricksRef.current = initBricks();
        setScore(0);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Background
        if (bgImgRef.current) {
            ctx.drawImage(bgImgRef.current, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#fef3c7'; // Warm bread-like yellow
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw Bricks (Bread Emojis)
        for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                const b = bricksRef.current[c][r];
                if (b.status === 1) {
                    const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                    b.x = brickX;
                    b.y = brickY;

                    // Draw Emoji directly on background (Transparent)
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1.0; // Reset alpha to full
                    ctx.fillStyle = '#000'; // Reset fill style to solid
                    ctx.font = '54px sans-serif'; // Slightly larger for better visibility
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(b.emoji, Math.floor(brickX + BRICK_WIDTH / 2), Math.floor(brickY + BRICK_HEIGHT / 2));
                }
            }
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#fbbf24"; // Honey yellow ball
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(251, 191, 36, 0.5)";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // Draw Paddle (Image)
        const currentImg = (hitTimerRef.current > 0 && paddleHitImgRef.current)
            ? paddleHitImgRef.current
            : paddleImgRef.current;

        if (currentImg) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
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

        // Collision detection
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

        if (ballRef.current.x + ballRef.current.dx > canvas.width - BALL_RADIUS || ballRef.current.x + ballRef.current.dx < BALL_RADIUS) {
            ballRef.current.dx = -ballRef.current.dx;
        }
        if (ballRef.current.y + ballRef.current.dy < BALL_RADIUS) {
            ballRef.current.dy = -ballRef.current.dy;
        } else if (ballRef.current.y + ballRef.current.dy > canvas.height - BALL_RADIUS - 10) {
            if (ballRef.current.x > paddleRef.current.x && ballRef.current.x < paddleRef.current.x + PADDLE_WIDTH) {
                if (ballRef.current.y < canvas.height - 10) {
                    ballRef.current.dy = -ballRef.current.dy;
                    ballRef.current.dx += (ballRef.current.x - (paddleRef.current.x + PADDLE_WIDTH / 2)) * 0.15;
                    hitTimerRef.current = 45;
                }
            } else if (ballRef.current.y + ballRef.current.dy > canvas.height) {
                setGameState('GAMEOVER');
                return;
            }
        }

        ballRef.current.x += ballRef.current.dx;
        ballRef.current.y += ballRef.current.dy;

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
        <div className="min-h-screen bg-orange-50 text-slate-800 flex flex-col items-center p-8 font-sans overflow-hidden">
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-orange-200/50 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-yellow-100/50 rounded-full blur-[100px] -z-10"></div>

            <div className="max-w-3xl w-full flex justify-between items-center mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-orange-700 hover:text-orange-900 transition-colors bg-white/50 px-4 py-2 rounded-2xl backdrop-blur-sm border border-orange-100 shadow-sm">
                    <ArrowLeft size={20} />
                    <span className="font-bold tracking-tight uppercase">Exit</span>
                </Link>
                <div className="flex gap-4">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-orange-100 shadow-sm font-black tracking-tighter flex items-center gap-2">
                        <span className="text-orange-500 text-xs uppercase tracking-widest">Score</span>
                        <span className="text-xl text-slate-700">{score}</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-orange-100 shadow-sm font-black tracking-tighter flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" />
                        <span className="text-orange-500 text-xs uppercase tracking-widest">Best</span>
                        <span className="text-xl text-slate-700">{highScore}</span>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="bg-white/80 rounded-[2.5rem] border-4 border-white shadow-2xl cursor-none overflow-hidden"
                    onMouseMove={handleMouseMove}
                />

                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 bg-orange-900/10 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        {gameState === 'START' && (
                            <div className="bg-white/90 p-10 rounded-[3rem] shadow-xl border border-orange-100">
                                <h2 className="text-4xl font-black mb-4 tracking-tighter text-orange-600 uppercase">고베 빵 축제! 🥐</h2>
                                <p className="text-slate-600 mb-8 font-medium">아이들과 함께 맛있는 빵을 모아보아요! ✨</p>
                                <button
                                    onClick={startGame}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-[2.5rem] font-black tracking-widest text-lg shadow-xl shadow-orange-200 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    빵 모으기 시작! 🥯
                                </button>
                            </div>
                        )}
                        {gameState === 'GAMEOVER' && (
                            <div className="bg-white/90 p-10 rounded-[3rem] shadow-xl border border-orange-100">
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-red-500">아쉬워요!</h2>
                                <p className="text-slate-600 mb-8 font-medium">빵을 떨어뜨렸어요. 다시 도전해볼까요?</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-[2rem] font-black tracking-widest text-sm border border-white shadow-sm transition-all active:scale-95"
                                >
                                    <RefreshCw size={18} /> 재도전!
                                </button>
                            </div>
                        )}
                        {gameState === 'WON' && (
                            <div className="bg-white/90 p-10 rounded-[3rem] shadow-xl border border-orange-100">
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-emerald-500">미션 성공! 🎉</h2>
                                <p className="text-slate-600 mb-8 font-medium">모든 빵을 맛있게 모았어요! 대단해요!</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-[2rem] font-black tracking-widest text-sm shadow-xl shadow-orange-200 transition-all active:scale-95"
                                >
                                    다시 하기
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-10 text-orange-400 text-sm font-bold tracking-[0.2em] uppercase bg-white/50 px-6 py-2 rounded-full backdrop-blur-sm border border-orange-50">
                마우스로 아이들을 움직여 빵을 튕겨주세요! ✨
            </div>
        </div>
    );
};

export default BreakoutGame;
