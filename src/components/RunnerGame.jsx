import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';
import hayanFace from '../assets/hayan-face.png';

const RunnerGame = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER, LEADERBOARD
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('runnerHighScore') || '0'));
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('runnerPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [leaderboard, setLeaderboard] = useState(() => {
        try {
            const saved = localStorage.getItem('runnerLeaderboard');
            const data = saved ? JSON.parse(saved) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState('checking');
    const [dbError, setDbError] = useState('');

    const gameRef = useRef({
        player: { y: 200, velocity: 0, size: 40 },
        obstacles: [],
        score: 0,
        frameCount: 0,
        gravity: 0.6,
        jumpStrength: -12,
        obstacleSpeed: 3,
        obstacleGap: 250,
        lastObstacle: 0
    });

    const requestRef = useRef();
    const hayanImgRef = useRef(new Image());

    useEffect(() => {
        if (gameState === 'PLAYING') {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const animate = () => {
                draw();
                requestRef.current = requestAnimationFrame(animate);
            };
            requestRef.current = requestAnimationFrame(animate);

            return () => {
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                }
            };
        }
    }, [gameState]);

    useEffect(() => {
        hayanImgRef.current.src = hayanFace;
    }, []);

    const startGame = () => {
        const game = gameRef.current;
        game.player = { y: 200, velocity: 0, size: 40 };
        game.obstacles = [];
        game.score = 0;
        game.frameCount = 0;
        game.lastObstacle = 0;
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
        const game = gameRef.current;

        // Draw sky with gradient (fairy tale sky)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#fef3c7'); // Light yellow
        skyGradient.addColorStop(0.5, '#fed7aa'); // Peach
        skyGradient.addColorStop(1, '#fecaca'); // Light pink
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw candy clouds
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 3; i++) {
            const cloudX = (game.frameCount * 0.2 + i * 200) % (canvas.width + 100);
            ctx.beginPath();
            ctx.arc(cloudX, 50 + i * 30, 20, 0, Math.PI * 2);
            ctx.arc(cloudX + 25, 50 + i * 30, 25, 0, Math.PI * 2);
            ctx.arc(cloudX + 50, 50 + i * 30, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw candy houses in background
        ctx.font = '40px Arial';
        for (let i = 0; i < 3; i++) {
            const houseX = 100 + i * 250;
            const houseY = canvas.height - 150;
            ctx.fillText('🏠', houseX, houseY);
        }

        // Draw lollipop trees
        ctx.font = '30px Arial';
        for (let i = 0; i < 5; i++) {
            const treeX = 50 + i * 150;
            const treeY = canvas.height - 100;
            ctx.fillText('🍭', treeX, treeY);
        }

        // Draw gingerbread path (ground)
        const groundGradient = ctx.createLinearGradient(0, canvas.height - 50, 0, canvas.height);
        groundGradient.addColorStop(0, '#d97706'); // Brown
        groundGradient.addColorStop(1, '#92400e'); // Dark brown
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

        // Add candy decorations on ground
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.arc(i + 10, canvas.height - 25, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Update player
        game.player.velocity += game.gravity;
        game.player.y += game.player.velocity;

        // Ground collision
        if (game.player.y > canvas.height - 50 - game.player.size) {
            game.player.y = canvas.height - 50 - game.player.size;
            game.player.velocity = 0;
        }

        // Ceiling collision
        if (game.player.y < 0) {
            game.player.y = 0;
            game.player.velocity = 0;
        }

        // Draw player (Hayan character)
        const playerX = 80;
        const playerY = game.player.y;
        const size = game.player.size;

        // Draw cute dress/skirt
        ctx.fillStyle = '#ec4899'; // Pink dress
        ctx.beginPath();
        // Trapezoid shape for dress
        ctx.moveTo(playerX + size * 0.3, playerY + size * 0.6);
        ctx.lineTo(playerX + size * 0.7, playerY + size * 0.6);
        ctx.lineTo(playerX + size * 0.85, playerY + size * 1.1);
        ctx.lineTo(playerX + size * 0.15, playerY + size * 1.1);
        ctx.closePath();
        ctx.fill();

        // Dress decoration (white trim)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(playerX + size * 0.5, playerY + size * 1.1, size * 0.35, 0, Math.PI, true);
        ctx.stroke();

        // Draw cute arms
        ctx.fillStyle = '#fbbf24'; // Skin tone
        // Left arm
        ctx.beginPath();
        ctx.arc(playerX + size * 0.2, playerY + size * 0.75, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        // Right arm
        ctx.beginPath();
        ctx.arc(playerX + size * 0.8, playerY + size * 0.75, size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Draw cute legs with shoes
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        // Left leg
        ctx.beginPath();
        ctx.moveTo(playerX + size * 0.35, playerY + size * 1.1);
        ctx.lineTo(playerX + size * 0.3, playerY + size * 1.35);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(playerX + size * 0.65, playerY + size * 1.1);
        ctx.lineTo(playerX + size * 0.7, playerY + size * 1.35);
        ctx.stroke();

        // Draw shoes
        ctx.fillStyle = '#ef4444'; // Red shoes
        ctx.beginPath();
        ctx.ellipse(playerX + size * 0.3, playerY + size * 1.38, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(playerX + size * 0.7, playerY + size * 1.38, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Hayan's face
        if (hayanImgRef.current.complete) {
            ctx.drawImage(hayanImgRef.current, playerX, playerY, size, size);
        }

        // Generate obstacles
        game.frameCount++;
        if (game.frameCount - game.lastObstacle > game.obstacleGap) {
            const gapSize = 200;
            const gapY = Math.random() * (canvas.height - 50 - gapSize - 100) + 50;
            game.obstacles.push({
                x: canvas.width,
                topHeight: gapY,
                bottomY: gapY + gapSize,
                passed: false
            });
            game.lastObstacle = game.frameCount;
        }

        // Update and draw obstacles
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obs = game.obstacles[i];
            obs.x -= game.obstacleSpeed;

            // Draw top obstacle (stacked donuts)
            const donutSize = 35;
            ctx.font = `${donutSize}px Arial`;
            const topDonutCount = Math.ceil(obs.topHeight / donutSize);
            for (let d = 0; d < topDonutCount; d++) {
                ctx.fillText('🍩', obs.x + 7, (d + 1) * donutSize);
            }

            // Draw bottom obstacle (stacked donuts)
            const bottomHeight = canvas.height - 50 - obs.bottomY;
            const bottomDonutCount = Math.ceil(bottomHeight / donutSize);
            for (let d = 0; d < bottomDonutCount; d++) {
                ctx.fillText('🍩', obs.x + 7, obs.bottomY + (d + 1) * donutSize);
            }

            // Check collision
            const playerLeft = 80;
            const playerRight = 80 + game.player.size;
            const playerTop = game.player.y;
            const playerBottom = game.player.y + game.player.size;

            const obsLeft = obs.x;
            const obsRight = obs.x + 50;

            if (playerRight > obsLeft && playerLeft < obsRight) {
                if (playerTop < obs.topHeight || playerBottom > obs.bottomY) {
                    // Game Over
                    setGameState('GAMEOVER');
                    if (game.score > highScore) {
                        setHighScore(game.score);
                        localStorage.setItem('runnerHighScore', game.score.toString());
                    }
                    setShowNameInput(game.score >= 5);
                    return;
                }
            }

            // Score point
            if (!obs.passed && obs.x + 50 < 80) {
                obs.passed = true;
                game.score++;
                setScore(game.score);
            }

            // Remove off-screen obstacles
            if (obs.x < -50) {
                game.obstacles.splice(i, 1);
            }
        }

        // Draw score
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Score: ${game.score}`, 20, 40);
    };

    const fetchLeaderboard = async () => {
        try {
            if (!isFirebaseConfigured) {
                setDbStatus('offline');
                return;
            }

            setDbStatus('checking');
            const q = query(
                collection(db, "runner_leaderboard"),
                orderBy("score", "desc"),
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
                localStorage.setItem('runnerLeaderboard', JSON.stringify(top5));
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
            score: score,
            date: new Date().toLocaleDateString('ko-KR')
        };

        const localList = [...leaderboard];
        const existingIdx = localList.findIndex(e => e.name === newEntry.name);

        let shouldUpdateLocal = true;
        if (existingIdx !== -1) {
            const existing = localList[existingIdx];
            if (newEntry.score <= existing.score) {
                shouldUpdateLocal = false;
            }
        }

        if (shouldUpdateLocal) {
            const updatedList = (existingIdx !== -1)
                ? localList.map((e, i) => i === existingIdx ? newEntry : e)
                : [...localList, newEntry];

            const sortedLocal = updatedList.sort((a, b) => b.score - a.score).slice(0, 5);

            setLeaderboard(sortedLocal);
            localStorage.setItem('runnerLeaderboard', JSON.stringify(sortedLocal));
        }

        setShowNameInput(false);
        setGameState('LEADERBOARD');

        if (isFirebaseConfigured) {
            try {
                await addDoc(collection(db, "runner_leaderboard"), {
                    name: newEntry.name,
                    score: newEntry.score,
                    created_at: serverTimestamp()
                });

                await fetchLeaderboard();
            } catch (e) {
                console.error("Firebase sync failed:", e);
            }
        }

        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 text-slate-800 flex flex-col items-center p-2 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-4 md:mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-blue-100 shadow-sm font-bold text-sm md:text-base">
                    <ArrowLeft size={18} className="md:w-5 md:h-5" />
                    <span className="tracking-tight uppercase">Exit</span>
                </Link>
                {gameState === 'PLAYING' && (
                    <div className="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm font-black text-lg flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={20} />
                        <span>{score}</span>
                    </div>
                )}
            </div>

            <div className="relative w-full max-w-[95vw] md:max-w-[640px] flex justify-center">
                {gameState === 'START' && (
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-blue-50 w-full">
                        <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter text-blue-500 uppercase">하얀늘이 러닝 게임! 🏃</h2>
                        <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 font-medium">장애물을 피해 달려보세요! ✨</p>

                        <div className="mb-6 bg-blue-50 p-4 rounded-2xl">
                            <p className="text-sm font-bold text-blue-700 mb-2">🎮 조작법</p>
                            <p className="text-xs text-slate-600">• 화면 클릭 또는 스페이스바: 점프</p>
                            <p className="text-xs text-slate-600">• 장애물 사이를 통과하면 점수 획득!</p>
                        </div>

                        <div className="mb-6 w-full max-w-[280px] mx-auto">
                            <p className="text-blue-500 text-[10px] uppercase tracking-widest font-black mb-2">Player Nickname</p>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                maxLength={10}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold text-center bg-blue-50/50"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={startGame}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black tracking-widest text-base md:text-lg shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 md:gap-3 mx-auto w-full justify-center"
                            >
                                시작하기! 🏃
                            </button>
                            <button
                                onClick={() => setGameState('LEADERBOARD')}
                                className="bg-white hover:bg-slate-50 text-slate-600 px-8 py-3 rounded-[1.5rem] font-bold text-sm border border-slate-100 flex items-center gap-2 mx-auto"
                            >
                                <Medal size={16} /> 명예의 전당 보기
                            </button>
                        </div>
                        <div className="mt-6 flex flex-col items-center gap-2 opacity-40">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Runner Game v1.0</p>
                            <div className="flex items-center gap-1.5 grayscale">
                                <div className={`w-1 h-1 rounded-full ${isFirebaseConfigured ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                    {isFirebaseConfigured ? 'Firebase Sync Ready' : 'Local Mode Only'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {(gameState === 'PLAYING' || gameState === 'GAMEOVER') && (
                    <div className="w-full">
                        <canvas
                            ref={canvasRef}
                            width={640}
                            height={480}
                            onClick={jump}
                            onKeyDown={(e) => e.key === ' ' && jump()}
                            tabIndex={0}
                            className="bg-white rounded-[1rem] md:rounded-[2.5rem] border-2 md:border-8 border-white shadow-2xl w-full h-auto max-h-[80vh] md:max-h-[75vh] object-contain cursor-pointer"
                        />
                        {gameState === 'GAMEOVER' && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-[1rem] md:rounded-[2.5rem] flex items-center justify-center">
                                <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-blue-50 max-w-[90%] w-full">
                                    <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase text-red-500">Game Over! 💥</h2>
                                    <p className="text-sm md:text-base text-slate-600 mb-6 font-medium">점수: {score}점</p>

                                    {showNameInput ? (
                                        <div className="mb-6">
                                            <p className="text-blue-600 font-black text-[10px] mb-2 uppercase tracking-widest">명예의 전당에 등록할 이름</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={playerName}
                                                    onChange={(e) => setPlayerName(e.target.value)}
                                                    placeholder="닉네임"
                                                    maxLength={10}
                                                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-blue-200 focus:border-blue-500 outline-none font-bold text-sm"
                                                />
                                                <button
                                                    onClick={saveScore}
                                                    disabled={isSaving}
                                                    className={`bg-blue-500 text-white px-5 py-3 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-md shadow-blue-100 text-sm flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
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
                                    ) : null}

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={startGame}
                                            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black tracking-widest text-sm md:text-base shadow-lg shadow-blue-100 transition-all active:scale-95"
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
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'LEADERBOARD' && (
                    <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-blue-100 w-full max-h-[85vh] overflow-hidden flex flex-col">
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
                                            <p className="text-lg md:text-xl font-black text-blue-500 tracking-tighter leading-none">{entry.score}점</p>
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

export default RunnerGame;
