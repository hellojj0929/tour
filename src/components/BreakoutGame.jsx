import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Users, Medal, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import paddleImage from '../assets/paddle_custom.png';
import paddleHitImage from '../assets/paddle_hit.png';

const BreakoutGame = () => {
    const canvasRef = useRef(null);
    const paddleImgRef = useRef(null);
    const paddleHitImgRef = useRef(null);
    const hitTimerRef = useRef(0);

    // States
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER, WON, LEADERBOARD
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('breakoutHighScore') || '0'));
    const [leaderboard, setLeaderboard] = useState(() => {
        try {
            const saved = localStorage.getItem('breakoutLeaderboard');
            const data = saved ? JSON.parse(saved) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    });
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('breakoutPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [gameTime, setGameTime] = useState(0); // For display

    const startTimeRef = useRef(0);
    const finalTimeRef = useRef(0);

    // Game constants
    const PADDLE_HEIGHT = 70;
    const PADDLE_WIDTH = 160;
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
    const ballRef = useRef({ x: 0, y: 0, dx: 2.5, dy: -2.5 });
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
            dx: 2.5 * (Math.random() > 0.5 ? 1 : -1),
            dy: -2.5
        };
        bricksRef.current = initBricks();
        setScore(0);
        setGameTime(0);
        startTimeRef.current = Date.now();
        setShowNameInput(false);
    };

    const saveScore = () => {
        if (!playerName.trim()) return;

        const newEntry = {
            name: playerName.trim(),
            score: score,
            time: finalTimeRef.current,
            date: new Date().toLocaleDateString('ko-KR')
        };

        // Update leaderboard: Deduplicate by name and keep best record
        const updatedList = [...leaderboard];
        const existingIdx = updatedList.findIndex(e => e.name === newEntry.name);

        if (existingIdx !== -1) {
            // Only update if the new score is better, or same score with better time
            const existing = updatedList[existingIdx];
            if (newEntry.score > existing.score || (newEntry.score === existing.score && newEntry.time < existing.time)) {
                updatedList[existingIdx] = newEntry;
            }
        } else {
            updatedList.push(newEntry);
        }

        const sortedList = updatedList
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.time || 999) - (b.time || 999);
            })
            .slice(0, 5);

        setLeaderboard(sortedList);
        localStorage.setItem('breakoutLeaderboard', JSON.stringify(sortedList));
        setShowNameInput(false);
        setGameState('LEADERBOARD');
    };

    const resetLeaderboard = () => {
        if (window.confirm("정말로 모든 명예의 전당 기록을 초기화할까요? 🧹")) {
            setLeaderboard([]);
            localStorage.removeItem('breakoutLeaderboard');
        }
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
                        ballRef.current.dy = Math.abs(ballRef.current.dy); // Bounce DOWN
                        b.status = 0;
                        setScore(s => s + 10);
                        break; // Process only one collision per frame
                    }
                }
            }
        }

        // Wall collisions
        if (ballRef.current.x + ballRef.current.dx > canvas.width - BALL_RADIUS) {
            ballRef.current.dx = -Math.abs(ballRef.current.dx);
        } else if (ballRef.current.x + ballRef.current.dx < BALL_RADIUS) {
            ballRef.current.dx = Math.abs(ballRef.current.dx);
        }

        if (ballRef.current.y + ballRef.current.dy < BALL_RADIUS) {
            ballRef.current.dy = Math.abs(ballRef.current.dy);
        } else if (ballRef.current.y + ballRef.current.dy > canvas.height - PADDLE_HEIGHT - 10 - BALL_RADIUS) {
            // Paddle collision
            if (ballRef.current.x > paddleRef.current.x - 5 && ballRef.current.x < paddleRef.current.x + PADDLE_WIDTH + 5) {
                if (ballRef.current.dy > 0 && ballRef.current.y <= canvas.height - PADDLE_HEIGHT - 10) {
                    ballRef.current.dy = -Math.abs(ballRef.current.dy);
                    const deltaX = (ballRef.current.x - (paddleRef.current.x + PADDLE_WIDTH / 2)) * 0.15;
                    ballRef.current.dx = Math.max(-8, Math.min(8, ballRef.current.dx + deltaX));
                    hitTimerRef.current = 45;
                }
            } else if (ballRef.current.y + ballRef.current.dy > canvas.height) {
                // Ball fell below - Game Over (Lives removed)
                finalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setGameTime(finalTimeRef.current);
                setGameState('GAMEOVER');
                setShowNameInput(score >= 50);
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
            finalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setGameTime(finalTimeRef.current);
            setGameState('WON');
            setShowNameInput(true);
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

    const handleMove = (clientX) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const mouseX = (clientX - rect.left) * scaleX;
        paddleRef.current.x = Math.max(0, Math.min(canvas.width - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
    };

    const handleMouseMove = (e) => {
        handleMove(e.clientX);
    };

    const handleTouchMove = (e) => {
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX);
            if (e.cancelable) e.preventDefault();
        }
    };

    const startGame = () => {
        if (!playerName.trim()) {
            alert("게임을 시작하기 전에 이름을 입력해주세요! ✨");
            return;
        }
        localStorage.setItem('breakoutPlayerName', playerName);
        initGame(canvasRef.current);
        setGameState('PLAYING');
    };

    return (
        <div className="min-h-screen bg-[#fffbeb] text-slate-800 flex flex-col items-center p-4 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-6 md:mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm font-bold text-sm md:text-base">
                    <ArrowLeft size={18} className="md:w-5 md:h-5" />
                    <span className="tracking-tight uppercase">Exit</span>
                </Link>
                <div className="flex gap-2 md:gap-4 items-center">
                    <div className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm font-black tracking-tighter flex items-center gap-2 text-sm md:text-base">
                        <span className="text-orange-500 text-[10px] md:text-xs uppercase tracking-widest">Score</span>
                        <span className="text-slate-700">{score}</span>
                    </div>
                    <button
                        onClick={() => setGameState('LEADERBOARD')}
                        className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm font-black tracking-tighter flex items-center gap-2 text-sm md:text-base text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                        <Medal size={16} className="text-yellow-500" />
                        <span className="text-[10px] md:text-xs uppercase tracking-widest">Ranking</span>
                    </button>
                </div>
            </div>

            <div className="relative group w-full max-w-[640px] flex justify-center">
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border-4 md:border-8 border-white shadow-2xl cursor-none overflow-hidden touch-none w-full h-auto max-h-[70vh] object-contain"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    onTouchStart={handleTouchMove}
                />

                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center p-4 md:p-8 text-center animate-in fade-in zoom-in duration-300">
                        {gameState === 'START' && (
                            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-orange-50 max-w-[90%] w-full">
                                <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter text-pink-500 uppercase">도넛 숲의 모험! 🍩</h2>
                                <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 font-medium">신비로운 도넛 숲에서 빵 친구들을 구해주세여! ✨</p>
                                <div className="mb-6 w-full max-w-[280px] mx-auto">
                                    <p className="text-orange-500 text-[10px] uppercase tracking-widest font-black mb-2">Player Nickname</p>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="이름을 입력하세요"
                                        maxLength={10}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-orange-100 focus:border-orange-500 outline-none font-bold text-center bg-orange-50/50"
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={startGame}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black tracking-widest text-base md:text-lg shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center gap-2 md:gap-3 mx-auto w-full justify-center"
                                    >
                                        시작하기! 🥯
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

                        {(gameState === 'GAMEOVER' || gameState === 'WON') && (
                            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-orange-50 max-w-[90%] w-full">
                                <h2 className={`text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase ${gameState === 'WON' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {gameState === 'WON' ? '대성공! 🎉' : '아쉬워요!'}
                                </h2>
                                <p className="text-sm md:text-base text-slate-600 mb-6 font-medium">
                                    {gameState === 'WON' ? '도넛 숲의 모든 빵 친구들을 구했어요! 🍩✨' : '빵이 바닥에 떨어졌어요! 🥖'}
                                </p>
                                {showNameInput ? (
                                    <div className="bg-orange-50 p-5 md:p-6 rounded-3xl mb-6 animate-in slide-in-from-bottom duration-500 border border-orange-100">
                                        <div className="flex justify-around mb-4 bg-white/50 py-3 rounded-2xl">
                                            <div className="text-center">
                                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Score</p>
                                                <p className="text-xl font-black text-slate-700">{score}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Time</p>
                                                <p className="text-xl font-black text-slate-700">{gameTime}s</p>
                                            </div>
                                        </div>
                                        <p className="text-orange-600 font-black text-[10px] mb-2 uppercase tracking-widest">명예의 전당에 등록할 이름</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                placeholder="닉네임"
                                                maxLength={10}
                                                className="flex-1 px-4 py-3 rounded-2xl border-2 border-orange-200 focus:border-orange-500 outline-none font-bold text-sm"
                                            />
                                            <button
                                                onClick={saveScore}
                                                className="bg-orange-500 text-white px-5 py-3 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-md shadow-orange-100 text-sm"
                                            >
                                                등록
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
                                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">Score</p>
                                            <p className="text-3xl font-black text-slate-700">{score}</p>
                                        </div>
                                        <div className="w-px h-10 bg-slate-200 self-center" />
                                        <div>
                                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">Time</p>
                                            <p className="text-3xl font-black text-slate-700">{gameTime}s</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={startGame}
                                        className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black tracking-widest text-sm md:text-base shadow-lg shadow-orange-100 transition-all active:scale-95"
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
                            <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-orange-100 max-w-[90%] w-full max-h-[90%] overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <div className="flex items-center gap-3">
                                        <Medal className="text-yellow-500" size={28} />
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-800 uppercase leading-none">명예의 전당</h2>
                                    </div>
                                    <button
                                        onClick={resetLeaderboard}
                                        className="text-slate-300 hover:text-red-400 transition-colors p-2"
                                        title="Reset Rankings"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 custom-scrollbar">
                                    {leaderboard.length > 0 ? (
                                        leaderboard.map((entry, idx) => (
                                            <div key={idx} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border ${idx === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-xs md:text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-white text-slate-400'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-black text-slate-700 leading-none text-sm md:text-base">{entry.name}</p>
                                                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-1">{entry.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg md:text-xl font-black text-orange-500 tracking-tighter leading-none">{entry.score}</p>
                                                    <p className="text-[10px] text-orange-400 font-bold uppercase mt-0.5">{entry.time !== undefined ? entry.time + 's' : '-'}</p>
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
                )}
            </div>

            <div className="mt-6 md:mt-10 text-orange-400 text-[10px] md:text-sm font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase bg-white/50 px-4 py-2 md:px-6 md:py-2 rounded-full backdrop-blur-sm border border-orange-100 text-center relative z-10">
                {window.matchMedia('(pointer: coarse)').matches ? '손가락으로 아이들을 움직여 빵을 튕겨주세요!' : '마우스로 아이들을 움직여 빵을 튕겨주세요!'} ✨
            </div>
        </div>
    );
};

export default BreakoutGame;
