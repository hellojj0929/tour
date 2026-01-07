import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GameIntro = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-bold tracking-tight">Back to Tour</span>
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="text-sm font-black tracking-widest uppercase">Member Lounge</span>
                    </div>
                </header>

                <section className="mb-16 text-center">
                    <div className="inline-block p-4 bg-indigo-500/10 rounded-3xl mb-6 border border-indigo-500/20">
                        <Gamepad2 size={48} className="text-indigo-400" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        GAME ARCADE
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto font-medium">
                        여행 중 지루함을 달래줄 미니 게임 센터입니다. <br />
                        친구들과 하이레코드를 겨뤄보세요!
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Brick Breaker Card */}
                    <Link to="/game/breakout" className="group">
                        <div className="relative overflow-hidden bg-slate-800/40 rounded-[2.5rem] border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95">
                            <div className="aspect-video bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center p-8 overflow-hidden">
                                <div className="grid grid-cols-4 gap-2 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className={`w-8 h-4 rounded-sm ${['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500'][i % 4]}`}></div>
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-1 text-white">BRICK BREAKER</h3>
                                        <p className="text-slate-400 text-sm font-medium">클래식 블록 깨기 게임</p>
                                    </div>
                                    <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                                        <Play size={20} fill="white" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Trophy size={14} /> High: 2500</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">New</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Memory Card Game */}
                    <Link to="/game/memory" className="group">
                        <div className="relative overflow-hidden bg-slate-800/40 rounded-[2.5rem] border border-slate-700/50 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95">
                            <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center p-8 overflow-hidden">
                                <div className="grid grid-cols-4 gap-2 opacity-30 group-hover:opacity-60 transition-opacity duration-500">
                                    {['🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🍩', '🧁'].map((emoji, i) => (
                                        <div key={i} className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                                            {emoji}
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-1 text-white">MEMORY GAME</h3>
                                        <p className="text-slate-400 text-sm font-medium">같은 카드 찾기 게임</p>
                                    </div>
                                    <div className="p-3 bg-purple-500 rounded-2xl shadow-lg shadow-purple-500/30">
                                        <Play size={20} fill="white" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Trophy size={14} /> Best: 12 moves</span>
                                    <span className="px-2 py-0.5 rounded bg-purple-700 text-purple-300">New</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Decorative elements */}
                <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]"></div>
                <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
};

export default GameIntro;
