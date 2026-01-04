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
    const PADDLE_HEIGHT = 70;
    const PADDLE_WIDTH = 130;
    const BALL_RADIUS = 10;
    const BRICK_ROW_COUNT = 3;
    const BRICK_COLUMN_COUNT = 10;
    const BRICK_WIDTH = 60;
    const BRICK_HEIGHT = 60;
    const BRICK_PADDING = 4;
    const BRICK_OFFSET_TOP = 30;
    const BRICK_OFFSET_LEFT = 10;

    const BREAD_EMOJIS = ['🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🍩', '🧁', '🍰'];

    const requestRef = useRef();
    const paddleRef = useRef({ x: 0 });
    const ballRef = useRef({ x: 0, y: 0, dx: 3, dy: -3 });
    const bricksRef = useRef([]);

    // Load assets and process transparency
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

        // Draw Fairytale Gradient Background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#fff1f2'); // Soft pink sky
        bgGradient.addColorStop(1, '#ffedd5'); // Warm orange hills
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- NEW: Draw Fairytale Donut Forest Background ---
        const drawDonutForest = () => {
            ctx.save();
            ctx.globalAlpha = 0.4; // Soft transparency

            const drawDonutTree = (x, y, scale, donutColor) => {
                // Trunk
                ctx.fillStyle = '#78350f';
                ctx.fillRect(x - 5 * scale, y, 10 * scale, 40 * scale);

                // Donut Foliage
                ctx.beginPath();
                ctx.arc(x, y, 25 * scale, 0, Math.PI * 2);
                ctx.fillStyle = donutColor;
                ctx.fill();

                // Donut Hole
                ctx.beginPath();
                ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
                ctx.fillStyle = '#fff1f2'; // Match top sky color
                ctx.fill();

                // Sprinkles
                const sprinkleColors = ['#fb7185', '#60a5fa', '#facc15', '#ffffff'];
                for (let i = 0; i < 8; i++) {
                    ctx.fillStyle = sprinkleColors[i % 4];
                    ctx.beginPath();
                    ctx.arc(x + Math.cos(i) * 15 * scale, y + Math.sin(i) * 15 * scale, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // Draw trees along the bottom corners
            drawDonutTree(80, 420, 1.2, '#f472b6'); // Pink donut tree left
            drawDonutTree(160, 440, 0.8, '#fbbf24'); // Yellow donut tree left

            drawDonutTree(canvas.width - 80, 420, 1.3, '#c084fc'); // Purple donut tree right
            drawDonutTree(canvas.width - 150, 445, 0.9, '#fb7185'); // Strawberry donut tree right

            // Magic Grass
            ctx.fillStyle = '#fde68a';
            ctx.beginPath();
            ctx.ellipse(150, 500, 300, 60, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(canvas.width - 150, 500, 300, 60, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        drawDonutForest();

        // Draw Subtle Deco - soft sparkles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(100 + i * 120, 100 + ((i * 30) % 150), 2, 0, Math.PI * 2);
            ctx.fill();
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

                    // Super Sharp Emoji Rendering
                    ctx.save();
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1.0;
                    ctx.fillStyle = '#000';
                    ctx.font = '54px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(b.emoji, Math.floor(brickX + BRICK_WIDTH / 2), Math.floor(brickY + BRICK_HEIGHT / 2));
                    ctx.restore();
                }
            }
        }

        // Draw Ball
        ctx.beginPath();
        ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b"; // Golden honey ball
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(245, 158, 11, 0.4)";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // Draw Paddle (Image)
        const currentImg = (hitTimerRef.current > 0 && paddleHitImgRef.current)
            ? paddleHitImgRef.current
            : paddleImgRef.current;

        if (currentImg) {
            ctx.shadowBlur = 15;
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
        <div className="min-h-screen bg-[#fffbeb] text-slate-800 flex flex-col items-center p-8 font-sans overflow-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors bg-white px-4 py-2 rounded-2xl border border-orange-100 shadow-sm font-bold">
                    <ArrowLeft size={20} />
                    <span className="tracking-tight uppercase">Exit</span>
                </Link>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-orange-100 shadow-sm font-black tracking-tighter flex items-center gap-2">
                        <span className="text-orange-500 text-xs uppercase tracking-widest">Score</span>
                        <span className="text-xl text-slate-700">{score}</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-2xl border border-orange-100 shadow-sm font-black tracking-tighter flex items-center gap-2">
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
                    className="bg-white rounded-[2.5rem] border-8 border-white shadow-2xl cursor-none overflow-hidden"
                    onMouseMove={handleMouseMove}
                />

                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        {gameState === 'START' && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-orange-50">
                                <h2 className="text-4xl font-black mb-4 tracking-tighter text-pink-500 uppercase">도넛 숲의 모험! 🍩</h2>
                                <p className="text-slate-600 mb-8 font-medium">신비로운 도넛 숲에서 빵 친구들을 구해주세여! ✨</p>
                                <button
                                    onClick={startGame}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-[2.5rem] font-black tracking-widest text-lg shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center gap-3"
                                >
                                    시작하기! 🥯
                                </button>
                            </div>
                        )}
                        {gameState === 'GAMEOVER' && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-red-50">
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-red-500">아쉬워요!</h2>
                                <p className="text-slate-600 mb-8 font-medium">빵이 바닥에 떨어졌어요! 🥖</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-[2rem] font-black tracking-widest text-sm transition-all active:scale-95"
                                >
                                    <RefreshCw size={18} /> 재도전!
                                </button>
                            </div>
                        )}
                        {gameState === 'WON' && (
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-emerald-50">
                                <h2 className="text-5xl font-black mb-2 tracking-tighter text-emerald-500">대성공! 🎉</h2>
                                <p className="text-slate-600 mb-8 font-medium">도넛 숲의 모든 빵 친구들을 구했어요! 🍩✨</p>
                                <button
                                    onClick={startGame}
                                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-[2rem] font-black tracking-widest text-sm shadow-xl shadow-orange-100 transition-all active:scale-95"
                                >
                                    한 번 더 하기!
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-10 text-orange-400 text-sm font-bold tracking-[0.2em] uppercase bg-white/50 px-6 py-2 rounded-full backdrop-blur-sm border border-orange-100">
                마우스로 아이들을 움직여 빵을 튕겨주세요! ✨
            </div>
        </div>
    );
};

export default BreakoutGame;
