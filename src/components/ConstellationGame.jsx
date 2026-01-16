import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Medal, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from '../lib/firebase';

// 별자리 패턴 정의 (좌표는 0-1 범위로 정규화)
const CONSTELLATIONS = {
    dog: {
        name: '강아지',
        emoji: '🐶',
        points: [
            { x: 0.3, y: 0.3 }, // 1: 머리
            { x: 0.25, y: 0.25 }, // 2: 귀1
            { x: 0.35, y: 0.25 }, // 3: 귀2
            { x: 0.3, y: 0.4 }, // 4: 목
            { x: 0.3, y: 0.55 }, // 5: 몸통
            { x: 0.2, y: 0.7 }, // 6: 앞다리1
            { x: 0.4, y: 0.7 }, // 7: 앞다리2
            { x: 0.5, y: 0.6 }, // 8: 꼬리
        ]
    },
    car: {
        name: '자동차',
        emoji: '🚗',
        points: [
            { x: 0.2, y: 0.5 }, // 1: 앞 바퀴
            { x: 0.2, y: 0.4 }, // 2: 앞 범퍼
            { x: 0.3, y: 0.3 }, // 3: 보닛
            { x: 0.4, y: 0.25 }, // 4: 앞 유리
            { x: 0.5, y: 0.25 }, // 5: 지붕
            { x: 0.6, y: 0.3 }, // 6: 뒷 유리
            { x: 0.7, y: 0.4 }, // 7: 트렁크
            { x: 0.7, y: 0.5 }, // 8: 뒷 범퍼
            { x: 0.65, y: 0.5 }, // 9: 뒷 바퀴
            { x: 0.2, y: 0.5 }, // 10: 다시 앞 바퀴로
        ]
    },
    house: {
        name: '집',
        emoji: '🏠',
        points: [
            { x: 0.3, y: 0.6 }, // 1: 왼쪽 아래
            { x: 0.3, y: 0.4 }, // 2: 왼쪽 위
            { x: 0.4, y: 0.25 }, // 3: 지붕 꼭대기
            { x: 0.5, y: 0.4 }, // 4: 오른쪽 위
            { x: 0.5, y: 0.6 }, // 5: 오른쪽 아래
            { x: 0.3, y: 0.6 }, // 6: 다시 왼쪽 아래
            { x: 0.35, y: 0.5 }, // 7: 문 위
            { x: 0.35, y: 0.6 }, // 8: 문 아래
        ]
    },
    flower: {
        name: '꽃',
        emoji: '🌸',
        points: [
            { x: 0.4, y: 0.3 }, // 1: 중심
            { x: 0.35, y: 0.25 }, // 2: 꽃잎1
            { x: 0.4, y: 0.3 }, // 3: 중심
            { x: 0.45, y: 0.25 }, // 4: 꽃잎2
            { x: 0.4, y: 0.3 }, // 5: 중심
            { x: 0.45, y: 0.35 }, // 6: 꽃잎3
            { x: 0.4, y: 0.3 }, // 7: 중심
            { x: 0.35, y: 0.35 }, // 8: 꽃잎4
            { x: 0.4, y: 0.3 }, // 9: 중심
            { x: 0.4, y: 0.5 }, // 10: 줄기
        ]
    },
    rocket: {
        name: '로켓',
        emoji: '🚀',
        points: [
            { x: 0.4, y: 0.2 }, // 1: 꼭대기
            { x: 0.35, y: 0.3 }, // 2: 왼쪽 날개
            { x: 0.4, y: 0.35 }, // 3: 몸통 중간
            { x: 0.45, y: 0.3 }, // 4: 오른쪽 날개
            { x: 0.4, y: 0.2 }, // 5: 다시 꼭대기
            { x: 0.4, y: 0.5 }, // 6: 몸통 아래
            { x: 0.35, y: 0.6 }, // 7: 왼쪽 분사구
            { x: 0.4, y: 0.5 }, // 8: 다시 몸통
            { x: 0.45, y: 0.6 }, // 9: 오른쪽 분사구
            { x: 0.4, y: 0.5 }, // 10: 다시 몸통
        ]
    },
    butterfly: {
        name: '나비',
        emoji: '🦋',
        points: [
            { x: 0.4, y: 0.4 }, // 1: 몸통 중심
            { x: 0.3, y: 0.3 }, // 2: 왼쪽 위 날개
            { x: 0.4, y: 0.4 }, // 3: 중심
            { x: 0.3, y: 0.5 }, // 4: 왼쪽 아래 날개
            { x: 0.4, y: 0.4 }, // 5: 중심
            { x: 0.5, y: 0.3 }, // 6: 오른쪽 위 날개
            { x: 0.4, y: 0.4 }, // 7: 중심
            { x: 0.5, y: 0.5 }, // 8: 오른쪽 아래 날개
            { x: 0.4, y: 0.4 }, // 9: 중심
            { x: 0.4, y: 0.25 }, // 10: 더듬이
        ]
    }
};

const ConstellationGame = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('START'); // START, PLAYING, SUCCESS, LEADERBOARD
    const [currentNumber, setCurrentNumber] = useState(1);
    const [connectedPoints, setConnectedPoints] = useState([]);
    const [stars, setStars] = useState([]);
    const [currentConstellation, setCurrentConstellation] = useState(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('constellationPlayerName') || "");
    const [showNameInput, setShowNameInput] = useState(false);
    const [leaderboard, setLeaderboard] = useState(() => {
        try {
            const saved = localStorage.getItem('constellationLeaderboard');
            const data = saved ? JSON.parse(saved) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [dbStatus, setDbStatus] = useState('checking');
    const [dbError, setDbError] = useState('');
    const [difficulty, setDifficulty] = useState('kids'); // 'kids' or 'adult'
    const [showSuccess, setShowSuccess] = useState(false);
    const animationRef = useRef(null);

    // 별자리 초기화
    const initConstellation = () => {
        const constellationKeys = Object.keys(CONSTELLATIONS);
        const randomKey = constellationKeys[Math.floor(Math.random() * constellationKeys.length)];
        const constellation = CONSTELLATIONS[randomKey];

        setCurrentConstellation(constellation);
        setCurrentNumber(1);
        setConnectedPoints([]);

        // 별 위치 생성 (약간의 랜덤성 추가)
        // 별 위치 생성 (약간의 랜덤성 추가)
        // 캔버스 DOM이 없어도 계산할 수 있도록 고정 해상도 사용
        const canvasWidth = 640;
        const canvasHeight = 480;

        const padding = 40; // 화면 활용도 증가
        const availableWidth = canvasWidth - padding * 2;
        const availableHeight = canvasHeight - padding * 2;

        // 1. 현재 별자리의 크기(범위) 계산
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        constellation.points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });

        const dataWidth = maxX - minX;
        const dataHeight = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // 2. 화면의 약 60%를 채우도록 확대 비율 계산 (너무 작으면 키우고, 너무 크면 줄임)
        // dataWidth가 0.1(10%)라면 scaleFactor는 6이 되어 60%크기로 확대됨
        // 화면의 85%까지 채움
        const targetSize = 0.85;
        // 비율 유지를 위해 pixelScale 계산 (화면의 가로세로 중 작은 쪽 기준)
        const maxDataDim = Math.max(dataWidth, dataHeight, 0.1);
        const pixelScale = (Math.min(availableWidth, availableHeight) * targetSize) / maxDataDim;

        const MIN_DISTANCE = 42; // 충돌 방지 최소 거리 (지름 40px + 근소한 여유)
        const newStars = [];

        constellation.points.forEach((point, index) => {
            // 3. 중앙을 기준으로 좌표 재계산 (가로세로 비율 유지)
            // 화면 정중앙(canvasWidth/2, canvasHeight/2)을 기준으로 상대 위치 계산
            const baseX = (canvasWidth / 2) + (point.x - centerX) * pixelScale;
            const baseY = (canvasHeight / 2) + (point.y - centerY) * pixelScale;

            let finalX = baseX;
            let finalY = baseY;

            // 5. 충돌 방지 로직 (완화법 사용)
            let attempts = 0;
            const maxAttempts = 50;
            let hasCollision = true;

            while (hasCollision && attempts < maxAttempts) {
                hasCollision = false;
                for (const existingStar of newStars) {
                    const dx = finalX - existingStar.x;
                    const dy = finalY - existingStar.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < MIN_DISTANCE) {
                        hasCollision = true;
                        // 충돌 시 밀어냄
                        const angle = distance < 1 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
                        const pushDist = (MIN_DISTANCE - distance) + 5;
                        finalX += Math.cos(angle) * pushDist;
                        finalY += Math.sin(angle) * pushDist;

                        // 화면 경계 밖으로 이탈 방지 (별 반지름 고려)
                        finalX = Math.max(padding + 20, Math.min(canvasWidth - padding - 20, finalX));
                        finalY = Math.max(padding + 20, Math.min(canvasHeight - padding - 20, finalY));
                        break;
                    }
                }
                attempts++;
            }

            newStars.push({
                number: index + 1,
                x: finalX,
                y: finalY,
                originalX: baseX,
                originalY: baseY,
            });
        });

        setStars(newStars);
    };

    // 게임 시작
    const startGame = () => {
        if (!playerName.trim()) {
            alert("게임을 시작하기 전에 이름을 입력해주세요! ✨");
            return;
        }
        localStorage.setItem('constellationPlayerName', playerName);
        setScore(0);
        setLevel(1);
        setGameState('PLAYING');

        // 캔버스가 렌더링된 후 초기화되도록 지연 실행
        setTimeout(() => {
            initConstellation();
        }, 100);
    };

    // 별 클릭 처리
    const handleStarClick = (clickedStar) => {
        if (gameState !== 'PLAYING') return;

        if (clickedStar.number === currentNumber) {
            // 정답!
            setConnectedPoints([...connectedPoints, clickedStar]);
            setCurrentNumber(currentNumber + 1);

            // 모든 별을 연결했는지 확인
            if (currentNumber === stars.length) {
                // 레벨 완료!
                const levelScore = difficulty === 'kids' ? 100 : 200;
                setScore(score + levelScore);
                setShowSuccess(true);

                setTimeout(() => {
                    setShowSuccess(false);
                    setLevel(level + 1);
                    initConstellation();
                    setCurrentNumber(1);
                    setConnectedPoints([]);
                }, 3000);
            }
        } else {
            // 오답 - 게임 오버
            setGameState('GAMEOVER');
            setShowNameInput(score >= 100);
        }
    };

    // Canvas 클릭 처리
    const handleCanvasClick = (e) => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // 클릭한 위치에 별이 있는지 확인
        const clickedStar = stars.find(star => {
            const distance = Math.sqrt((star.x - x) ** 2 + (star.y - y) ** 2);
            return distance < 25; // 클릭 반경
        });

        if (clickedStar) {
            handleStarClick(clickedStar);
        }
    };

    // Canvas 그리기
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // 밤하늘 배경
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f172a'); // 진한 남색
        gradient.addColorStop(0.5, '#1e293b'); // 중간 남색
        gradient.addColorStop(1, '#334155'); // 밝은 남색
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 반짝이는 배경 별들
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % canvas.width;
            const y = (i * 197.3) % canvas.height;
            const size = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 별이 없으면 여기서 리턴
        if (stars.length === 0) return;

        // 연결된 선 그리기 (별자리의 원래 형태를 유지하기 위해 original 좌표 사용)
        if (connectedPoints.length > 0) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';

            ctx.beginPath();
            // 첫 포인트로 이동 (원래 정위치 사용)
            ctx.moveTo(connectedPoints[0].originalX, connectedPoints[0].originalY);
            for (let i = 1; i < connectedPoints.length; i++) {
                // 선은 별자리의 '원래 정위치'를 따라 그려짐으로써 형태가 왜곡되지 않음
                ctx.lineTo(connectedPoints[i].originalX, connectedPoints[i].originalY);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // 별(숫자) 그리기
        stars.forEach(star => {
            const isConnected = connectedPoints.some(p => p.number === star.number);
            const isNext = star.number === currentNumber;

            // 별 빛나는 효과
            if (isNext) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#fbbf24';
            }

            // 별 그리기
            ctx.fillStyle = isConnected ? '#fbbf24' : isNext ? '#fde047' : '#e2e8f0';
            ctx.beginPath();

            // 별 모양 그리기
            const spikes = 5;
            const outerRadius = 20;
            const innerRadius = 10;
            let rot = Math.PI / 2 * 3;
            let x = star.x;
            let y = star.y;
            const step = Math.PI / spikes;

            ctx.moveTo(x, y - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = star.x + Math.cos(rot) * outerRadius;
                y = star.y + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = star.x + Math.cos(rot) * innerRadius;
                y = star.y + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(star.x, star.y - outerRadius);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;

            // 숫자 그리기
            ctx.fillStyle = '#000000'; // 검은색으로 통일
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(star.number, star.x, star.y);
        });

        // 성공 애니메이션
        if (showSuccess && currentConstellation) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 완성된 별자리 이름과 이모지
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(currentConstellation.emoji, canvas.width / 2, canvas.height / 2 - 40);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(`${currentConstellation.name} 완성!`, canvas.width / 2, canvas.height / 2 + 40);

            ctx.font = 'bold 24px Arial';
            ctx.fillText(`레벨 ${level} 클리어! 🎉`, canvas.width / 2, canvas.height / 2 + 90);
        }
    };

    // 애니메이션 루프
    useEffect(() => {
        if (gameState === 'PLAYING' || showSuccess) {
            const animate = () => {
                draw();
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [gameState, stars, connectedPoints, currentNumber, showSuccess, currentConstellation, level]);

    // Firebase 리더보드
    const fetchLeaderboard = async () => {
        try {
            if (!isFirebaseConfigured) {
                setDbStatus('offline');
                return;
            }

            setDbStatus('checking');
            const q = query(
                collection(db, "constellation_leaderboard"),
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
                localStorage.setItem('constellationLeaderboard', JSON.stringify(top5));
            }
        } catch (e) {
            setDbStatus('error');
            setDbError(e.message);
            console.error("Error fetching leaderboard:", e);
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
            level: level,
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
            localStorage.setItem('constellationLeaderboard', JSON.stringify(sortedLocal));
        }

        setShowNameInput(false);
        setGameState('LEADERBOARD');

        if (isFirebaseConfigured) {
            try {
                await addDoc(collection(db, "constellation_leaderboard"), {
                    name: newEntry.name,
                    score: newEntry.score,
                    level: newEntry.level,
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex flex-col items-center p-2 md:p-8 font-sans overflow-x-hidden">
            <div className="max-w-3xl w-full flex justify-between items-center mb-4 md:mb-8 relative z-10">
                <Link to="/game" className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors bg-slate-800/50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-yellow-400/30 shadow-sm font-bold text-sm md:text-base backdrop-blur-sm">
                    <ArrowLeft size={18} className="md:w-5 md:h-5" />
                    <span className="tracking-tight uppercase">Exit</span>
                </Link>
                {gameState === 'PLAYING' && (
                    <div className="flex gap-2 md:gap-4">
                        <div className="bg-slate-800/50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-yellow-400/30 shadow-sm font-black text-sm md:text-base backdrop-blur-sm">
                            <span className="text-yellow-400 text-[10px] md:text-xs uppercase tracking-widest">Level</span>
                            <span className="ml-2">{level}</span>
                        </div>
                        <div className="bg-slate-800/50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-yellow-400/30 shadow-sm font-black text-sm md:text-base backdrop-blur-sm">
                            <span className="text-yellow-400 text-[10px] md:text-xs uppercase tracking-widest">Score</span>
                            <span className="ml-2">{score}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative w-full max-w-[95vw] md:max-w-[640px] flex justify-center">
                {gameState === 'START' && (
                    <div className="bg-slate-800/90 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-yellow-400/30 w-full backdrop-blur-md">
                        <div className="text-center mb-6">
                            <Star className="inline-block text-yellow-400 mb-4" size={48} />
                            <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-4 tracking-tighter text-yellow-400 uppercase">별자리 잇기 대모험! ⭐</h2>
                            <p className="text-sm md:text-base text-slate-300 mb-6 md:mb-8 font-medium">숫자 순서대로 별을 연결해보세요! ✨</p>
                        </div>

                        <div className="mb-6 bg-slate-700/50 p-4 rounded-2xl">
                            <p className="text-sm font-bold text-yellow-400 mb-2">🎮 게임 방법</p>
                            <p className="text-xs text-slate-300">• 1번부터 순서대로 별을 클릭하세요</p>
                            <p className="text-xs text-slate-300">• 모든 별을 연결하면 그림이 완성됩니다!</p>
                            <p className="text-xs text-slate-300">• 잘못 클릭하면 게임 오버!</p>
                        </div>

                        <div className="mb-6">
                            <p className="text-yellow-400 text-[10px] uppercase tracking-widest font-black mb-3">난이도 선택</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDifficulty('kids')}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm transition-all ${difficulty === 'kids'
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 shadow-lg scale-105'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">👶</div>
                                    <div>아이 모드</div>
                                    <div className="text-[9px] opacity-70 mt-1">쉬워요!</div>
                                </button>
                                <button
                                    onClick={() => setDifficulty('adult')}
                                    className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm transition-all ${difficulty === 'adult'
                                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg scale-105'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">🔥</div>
                                    <div>어른 모드</div>
                                    <div className="text-[9px] opacity-70 mt-1">도전!</div>
                                </button>
                            </div>
                        </div>

                        <div className="mb-6 w-full max-w-[280px] mx-auto">
                            <p className="text-yellow-400 text-[10px] uppercase tracking-widest font-black mb-2">Player Nickname</p>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                maxLength={10}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-yellow-400/30 focus:border-yellow-400 outline-none font-bold text-center bg-slate-700/50 text-white placeholder-slate-400"
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={startGame}
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-900 px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] font-black tracking-widest text-base md:text-lg shadow-xl shadow-yellow-400/20 transition-all active:scale-95 flex items-center gap-2 md:gap-3 mx-auto w-full justify-center"
                            >
                                시작하기! ⭐
                            </button>
                            <button
                                onClick={() => setGameState('LEADERBOARD')}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-8 py-3 rounded-[1.5rem] font-bold text-sm border border-slate-600 flex items-center gap-2 mx-auto"
                            >
                                <Medal size={16} /> 명예의 전당 보기
                            </button>
                        </div>
                    </div>
                )}

                {(gameState === 'PLAYING' || gameState === 'GAMEOVER') && (
                    <div className="w-full">
                        <canvas
                            ref={canvasRef}
                            width={640}
                            height={480}
                            onClick={handleCanvasClick}
                            className="bg-slate-900 rounded-[1rem] md:rounded-[2.5rem] border-2 md:border-8 border-slate-700 shadow-2xl w-full h-auto max-h-[80vh] md:max-h-[75vh] object-contain cursor-pointer"
                        />

                        {currentConstellation && gameState === 'PLAYING' && (
                            <div className="mt-4 text-center">
                                <p className="text-yellow-400 font-bold text-lg">
                                    {currentConstellation.emoji} {currentConstellation.name}를 완성하세요!
                                </p>
                                <p className="text-slate-300 text-sm mt-2">
                                    다음 숫자: <span className="text-yellow-400 font-black text-xl">{currentNumber}</span>
                                </p>
                            </div>
                        )}

                        {gameState === 'GAMEOVER' && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-[1rem] md:rounded-[2.5rem] flex items-center justify-center">
                                <div className="bg-slate-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-red-400/30 max-w-[90%] w-full">
                                    <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter uppercase text-red-400">Game Over! 💫</h2>
                                    <p className="text-sm md:text-base text-slate-300 mb-6 font-medium">
                                        최종 점수: {score}점 | 레벨: {level}
                                    </p>

                                    {showNameInput ? (
                                        <div className="mb-6">
                                            <p className="text-yellow-400 font-black text-[10px] mb-2 uppercase tracking-widest">명예의 전당에 등록할 이름</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={playerName}
                                                    onChange={(e) => setPlayerName(e.target.value)}
                                                    placeholder="닉네임"
                                                    maxLength={10}
                                                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-yellow-400/30 focus:border-yellow-400 outline-none font-bold text-sm bg-slate-700 text-white"
                                                />
                                                <button
                                                    onClick={saveScore}
                                                    disabled={isSaving}
                                                    className={`bg-yellow-500 text-slate-900 px-5 py-3 rounded-2xl font-black hover:bg-yellow-400 transition-all shadow-md text-sm flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
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
                                                className="mt-3 text-[10px] font-bold text-slate-400 hover:text-slate-300 uppercase tracking-tighter"
                                            >
                                                등록하지 않고 계속하기
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={startGame}
                                            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-6 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black tracking-widest text-sm md:text-base shadow-lg transition-all active:scale-95"
                                        >
                                            <RefreshCw size={18} /> 재도전
                                        </button>
                                        <button
                                            onClick={() => setGameState('LEADERBOARD')}
                                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-6 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black tracking-widest text-sm"
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
                    <div className="bg-slate-800/90 p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-yellow-400/30 w-full max-h-[85vh] overflow-hidden flex flex-col backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <Medal className="text-yellow-400" size={28} />
                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-yellow-400 uppercase leading-none">명예의 전당</h2>

                            <div className="flex items-center ml-auto gap-2">
                                {dbStatus === 'online' ? (
                                    <div className="flex items-center gap-1.5 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-400/30">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Shared</span>
                                    </div>
                                ) : dbStatus === 'offline' ? (
                                    <div className="flex items-center gap-1.5 bg-slate-700 px-2 py-1 rounded-full border border-slate-600">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Local Only</span>
                                    </div>
                                ) : dbStatus === 'error' ? (
                                    <div className="flex items-center gap-1.5 bg-red-500/20 px-2 py-1 rounded-full border border-red-400/30">
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Sync Error</span>
                                    </div>
                                ) : (
                                    <RefreshCw size={12} className="text-slate-400 animate-spin" />
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((entry, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border ${idx === 0 ? 'bg-yellow-500/20 border-yellow-400/50' : 'bg-slate-700/50 border-slate-600'}`}>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-xs md:text-sm ${idx === 0 ? 'bg-yellow-400 text-slate-900' : idx === 1 ? 'bg-slate-400 text-slate-900' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-600 text-slate-300'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-white leading-none text-sm md:text-base">{entry.name}</p>
                                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString('ko-KR') : entry.date || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg md:text-xl font-black text-yellow-400 tracking-tighter leading-none">{entry.score}점</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Lv.{entry.level || 1}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2 italic">
                                    <p className="text-sm font-bold">아직 기록이 없어요!</p>
                                    <p className="text-xs">첫 번째 주인공이 되어보세요 ✨</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setGameState('START')}
                            className="flex-shrink-0 bg-slate-700 hover:bg-slate-600 text-white py-4 md:py-5 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
                        >
                            메인으로 돌아가기
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 md:mt-10 text-yellow-400/60 text-[10px] md:text-sm font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase bg-slate-800/30 px-4 py-2 md:px-6 md:py-2 rounded-full backdrop-blur-sm border border-yellow-400/20 text-center relative z-10">
                숫자 순서대로 별을 연결해보세요! ⭐
            </div>
        </div>
    );
};

export default ConstellationGame;
