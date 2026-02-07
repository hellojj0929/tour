import React from 'react';
import { Gamepad2, Trophy, Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GameIntro: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 font-sans pb-20">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-bold tracking-tight text-sm">Tour</span>
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700">
                        <Trophy size={16} className="text-yellow-500" />
                        <span className="text-xs font-black tracking-widest uppercase">Lounge</span>
                    </div>
                </header>

                <section className="mb-8 text-center">
                    <div className="inline-block p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
                        <Gamepad2 size={32} className="text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        GAME ARCADE
                    </h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        여행의 지루함을 날려버릴<br />미니 게임 컬렉션
                    </p>
                </section>

                <div className="flex flex-col gap-5">
                    {/* Brick Breaker Card */}
                    <GameCard
                        to="/game/breakout"
                        title="BRICK BREAKER"
                        desc="클래식 블록 깨기"
                        color="indigo"
                        iconColor="bg-pink-500"
                        isNew={true}
                        highScore="2500"
                    >
                        <div className="grid grid-cols-4 gap-2 opacity-30">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={`w-full h-3 rounded-sm ${['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500'][i % 4]}`}></div>
                            ))}
                        </div>
                    </GameCard>

                    {/* Memory Card Game */}
                    <GameCard
                        to="/game/memory"
                        title="MEMORY GAME"
                        desc="같은 카드 찾기"
                        color="purple"
                        iconColor="bg-purple-500"
                        isNew={true}
                        highScore="12 moves"
                    >
                        <div className="grid grid-cols-4 gap-2 opacity-30 text-lg">
                            {['🍞', '🥐', '🥖', '🥨'].map((emoji, i) => (
                                <div key={i} className="bg-white/90 rounded aspect-square flex items-center justify-center">
                                    {emoji}
                                </div>
                            ))}
                        </div>
                    </GameCard>

                    {/* Runner Game */}
                    <GameCard
                        to="/game/runner"
                        title="RUNNER GAME"
                        desc="장애물 피하기"
                        color="cyan"
                        iconColor="bg-cyan-500"
                        isNew={true}
                        highScore="50"
                    >
                        <div className="text-5xl opacity-40 text-center">🏃💨</div>
                    </GameCard>

                    {/* Color Match Game */}
                    <GameCard
                        to="/game/colormatch"
                        title="COLOR MATCH"
                        desc="색깔 맞추기 퀴즈"
                        color="pink"
                        iconColor="bg-pink-500"
                        isNew={true}
                        highScore={(localStorage.getItem('colorMatchHighScore') || '0').toString()}
                    >
                        <div className="text-5xl opacity-40 text-center">🎨</div>
                    </GameCard>

                    {/* Constellation Game */}
                    <GameCard
                        to="/game/constellation"
                        title="CONSTELLATION"
                        desc="별자리 잇기"
                        color="yellow"
                        iconColor="bg-yellow-500"
                        isNew={true}
                        highScore={(localStorage.getItem('constellationHighScore') || '0').toString()}
                    >
                        <div className="text-5xl opacity-40 text-center">⭐✨</div>
                    </GameCard>
                </div>

                {/* Decorative elements */}
                <div className="fixed top-0 right-0 -z-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]"></div>
                <div className="fixed bottom-0 left-0 -z-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]"></div>
            </div>
        </div>
    );
};

interface GameCardProps {
    to: string;
    title: string;
    desc: string;
    color: string;
    iconColor: string;
    isNew?: boolean;
    highScore?: string;
    children: React.ReactNode;
}

const GameCard: React.FC<GameCardProps> = ({ to, title, desc, color, iconColor, isNew, highScore, children }) => {
    // 동적 색상 매핑 (safelist에 추가 필요할 수 있음, 또는 style로 처리)
    // 여기서는 간단히 하기 위해 템플릿 리터럴 사용하지만, Tailwind Compiler가 전체 문자열을 못 볼 수 있으므로
    // 실제로는 안전한 클래스명을 쓰는 게 좋음. 일단 주요 색상만 매핑.

    // const borderColor = `hover:border-${color}-500/50`; // (X) Tailwind v3은 이렇게 쓰면 안됨

    // 간단 매핑
    const borderColors: Record<string, string> = {
        indigo: 'group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/20',
        purple: 'group-hover:border-purple-500/50 group-hover:shadow-purple-500/20',
        cyan: 'group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20',
        pink: 'group-hover:border-pink-500/50 group-hover:shadow-pink-500/20',
        yellow: 'group-hover:border-yellow-500/50 group-hover:shadow-yellow-500/20',
    };

    const bgGradients: Record<string, string> = {
        indigo: 'from-indigo-600/20 to-purple-600/20',
        purple: 'from-purple-600/20 to-pink-600/20',
        cyan: 'from-cyan-600/20 to-blue-600/20',
        pink: 'from-pink-600/20 to-orange-600/20',
        yellow: 'from-yellow-600/20 to-orange-600/20',
    };

    const btnColors: Record<string, string> = {
        indigo: 'bg-indigo-500 shadow-indigo-500/30',
        purple: 'bg-purple-500 shadow-purple-500/30',
        cyan: 'bg-cyan-500 shadow-cyan-500/30',
        pink: 'bg-pink-500 shadow-pink-500/30',
        yellow: 'bg-yellow-500 shadow-yellow-500/30',
    };

    const textColors: Record<string, string> = {
        indigo: 'text-indigo-300',
        purple: 'text-purple-300',
        cyan: 'text-cyan-300',
        pink: 'text-pink-300',
        yellow: 'text-yellow-300',
    };


    return (
        <Link to={to} className="group block w-full">
            <div className={`relative overflow-hidden bg-slate-800/40 rounded-[2rem] border border-slate-700/50 transition-all duration-300 active:scale-95 ${borderColors[color]} hover:shadow-xl`}>
                <div className="flex h-32">
                    {/* Left: Preview Area */}
                    <div className={`w-32 shrink-0 ${bgGradients[color]} bg-gradient-to-br flex items-center justify-center p-4 relative overflow-hidden`}>
                        {children}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-800/40"></div>
                    </div>

                    {/* Right: Content Area */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-white mb-0.5 leading-tight">{title}</h3>
                                <p className="text-slate-400 text-xs font-medium">{desc}</p>
                            </div>
                            <div className={`p-2 rounded-xl shadow-lg ${btnColors[color]}`}>
                                <Play size={14} fill="white" className="text-white" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest mt-2">
                            <span className={`flex items-center gap-1 ${textColors[color]}`}>
                                <Trophy size={12} /> {highScore}
                            </span>
                            {isNew && <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[9px]">New</span>}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default GameIntro;
