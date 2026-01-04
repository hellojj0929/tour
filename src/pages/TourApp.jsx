import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Plane,
    Coffee,
    Utensils,
    Moon,
    Sun,
    ChevronRight,
    Clock,
    Flag,
    Waves,
    ShoppingBag,
    Navigation,
    Info,
    Hotel,
    Building,
    Loader2,
    RefreshCw,
    ArrowRightCircle,
    ExternalLink,
    CheckCircle2,
    Wallet,
    TrendingUp,
    CreditCard,
    Award,
    Sparkles,
    Mountain,
    Compass,
    Users,
    Map as MapIcon,
    Layout,
    PiggyBank,
    Globe,
    AlertCircle,
    Gamepad2
} from 'lucide-react';
import { Link } from 'react-router-dom';

import mapImageStatic from '../assets/kobe_map_custom.jpg';

const TourApp = () => {
    const [activeTab, setActiveTab] = useState('itinerary');
    const [selectedPlan, setSelectedPlan] = useState('A'); // 'A' or 'B'
    const [selectedDay, setSelectedDay] = useState(1);
    const [mapImage, setMapImage] = useState(mapImageStatic);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRealMap, setShowRealMap] = useState(true);
    const [error, setError] = useState(null);

    const apiKey = "";

    const colors = {
        primary: 'bg-[#1a365d]',
        primaryText: 'text-[#1a365d]',
        accent: 'bg-[#d4af37]',
        accentText: 'text-[#b08d49]',
        bg: 'bg-[#f8f9fb]',
        card: 'bg-[#ffffff]',
        border: 'border-[#e2e8f0]'
    };

    // 온천 프리미엄 (Plan A)
    const itineraryA = [
        {
            day: 1, date: "3월 20일 (금)", title: "고베 입국 및 제1라운드", route: "고베공항 ➔ 아리마 로열 GC ➔ 료칸",
            mainQuery: "Arima Onsen",
            items: [
                { time: "10:30", icon: <Navigation size={16} />, activity: "고베 공항(UKB) 도착", desc: "전용 차량 픽업 및 골프장 이동", mapQuery: "Kobe Airport" },
                {
                    time: "12:30", icon: <Flag size={16} />, activity: "제1라운드 (18홀)", desc: "아리마 로열 GC (금요일 라운딩)",
                    mapQuery: "Arima Royal Golf Club",
                    bookingUrl: "https://experiences.myrealtrip.com/products/4963367"
                },
                { time: "18:30", icon: <Hotel size={16} />, activity: "료칸 체크인/석식", desc: "아리마 부티크 료칸 (가성비 프리미엄)", mapQuery: "Arima Onsen Hotel" },
            ]
        },
        {
            day: 2, date: "3월 21일 (토)", title: "오전 휴식 & 오후 라운딩", route: "료칸 ➔ 롯코 국제 GC (오후 티) ➔ 아리마",
            mainQuery: "The Rokko Kokusai Golf Club",
            items: [
                { time: "10:00", icon: <Coffee size={16} />, activity: "여유로운 오전 휴식", desc: "료칸 조식 후 온천욕 및 휴식", mapQuery: "Arima Onsen" },
                {
                    time: "13:00", icon: <Flag size={16} />, activity: "제2라운드 (18홀)", desc: "롯코 국제 GC (토요일 오후 티 특가)",
                    mapQuery: "The Rokko Kokusai Golf Club",
                    bookingUrl: "https://www.rokko-kokusai-yokawa.com/"
                },
                { time: "18:00", icon: <Waves size={16} />, activity: "나이트 온천 힐링", desc: "라운딩 후 조용한 밤 온천 체험", mapQuery: "Arima Onsen" },
                { time: "20:00", icon: <Utensils size={16} />, activity: "아리마 마을 디너", desc: "온천 마을 로컬 맛집 탐방", mapQuery: "Arima Onsen Town" },
            ]
        },
        {
            day: 3, date: "3월 22일 (일)", title: "롯코산 투어 및 시내 이동", route: "아리마 ➔ 롯코산 ➔ 산노미야",
            mainQuery: "Mount Rokko",
            items: [
                { time: "11:00", icon: <Coffee size={16} />, activity: "여유로운 조식", desc: "료칸 체크아웃 및 여유로운 오전", mapQuery: "Arima Onsen" },
                { time: "14:00", icon: <MapPin size={16} />, activity: "롯코산 전망대", desc: "케이블카 탑승 및 전경 감상", mapQuery: "Mt. Rokko Tenran Observatory" },
                { time: "18:00", icon: <Hotel size={16} />, activity: "시내 호텔 체크인", desc: "산노미야 부티크 호텔", mapQuery: "Remm Plus Kobe Sannomiya" },
                { time: "20:00", icon: <Utensils size={16} />, activity: "고베항 야경 디너", desc: "하버랜드 야경과 함께하는 파이닝", mapQuery: "Kobe Harborland" },
            ]
        },
        {
            day: 4, date: "3월 23일 (월)", title: "시내 쇼핑 및 귀국", route: "산노미야 ➔ 다이마루 ➔ 고베공항",
            mainQuery: "Kobe Airport",
            items: [
                { time: "11:00", icon: <ShoppingBag size={16} />, activity: "고베 집중 쇼핑", desc: "다이마루 백화점 및 센터가이", mapQuery: "Daimaru Kobe" },
                { time: "18:40", icon: <Plane size={16} />, activity: "고베 공항(T2) 출국", desc: "18:40 귀국편 탑승 (고베 2터미널)", mapQuery: "Kobe Airport" },
            ]
        }
    ];

    // 시내 실속형 (Plan B)
    const itineraryB = [
        {
            day: 1, date: "3월 20일 (금)", title: "고베공항 입국 & 시내 맛집", route: "고베공항 ➔ 산노미야 ➔ 이진칸",
            mainQuery: "Remm Plus Kobe Sannomiya",
            items: [
                { time: "10:30", icon: <Navigation size={16} />, activity: "고베 공항(UKB) 도착", desc: "포트라이너 또는 택시 이동", mapQuery: "Kobe Airport" },
                { time: "15:00", icon: <Hotel size={16} />, activity: "호텔 체크인", desc: "렘 플러스 고베 산노미야", mapQuery: "Remm Plus Kobe Sannomiya" },
                { time: "19:00", icon: <Utensils size={16} />, activity: "디너: 고베규 이자카야", desc: "현지인 가성비 맛집", mapQuery: "Steakland Kobe" },
            ]
        },
        {
            day: 2, date: "3월 21일 (토)", title: "제1라운드 & 온천 마을 산책", route: "호텔 ➔ 고베 가스토니안 GC ➔ 아리마",
            mainQuery: "Kobe Gastonian Golf Club",
            items: [
                {
                    time: "08:30", icon: <Flag size={16} />, activity: "제1라운드 (18홀)", desc: "고베 가스토니안 GC",
                    mapQuery: "Kobe Gastonian Golf Club",
                    bookingUrl: "https://booking.gora.golf.rakuten.co.jp/guide/obj/id/280036"
                },
                { time: "16:00", icon: <MapPin size={16} />, activity: "아리마 온천 산책", desc: "마을 투어 및 간식 탐방", mapQuery: "Arima Onsen Town" },
            ]
        },
        {
            day: 3, date: "3월 22일 (일)", title: "고베 시티 투어 & 하버랜드 야경", route: "산노미야 ➔ 모토마치 ➔ 하버랜드",
            mainQuery: "Kobe Harborland",
            items: [
                { time: "11:00", icon: <ShoppingBag size={16} />, activity: "모토마치 & 난킨마치", desc: "고베 속 차이나타운 & 쇼핑몰", mapQuery: "Nankin-machi" },
                { time: "15:00", icon: <Coffee size={16} />, activity: "메리켄 파크 산책", desc: "고베 포트 타워 & 사진 명소", mapQuery: "Meriken Park" },
                { time: "19:00", icon: <MapPin size={16} />, activity: "하버랜드 야경 감상", desc: "모자이크 몰 관람차 & 야경 디너", mapQuery: "Kobe Harborland" },
            ]
        },
        {
            day: 4, date: "3월 23일 (월)", title: "월요일 실속 라운딩 & 귀국", route: "호텔 ➔ 아리마 CC ➔ 고베공항",
            mainQuery: "Arima Country Club",
            items: [
                {
                    time: "08:00", icon: <Flag size={16} />, activity: "제2라운드 (18홀)", desc: "아리마 컨트리클럽 (평일 실속)",
                    mapQuery: "Arima Country Club",
                    bookingUrl: "https://www.arimacc.jp/"
                },
                { time: "14:30", icon: <Navigation size={16} />, activity: "라운딩 종료 후 이동", desc: "클럽하우스 중식 후 공항 이동", mapQuery: "Arima Country Club" },
                { time: "18:40", icon: <Plane size={16} />, activity: "고베 공항(T2) 출국", desc: "18:40 귀국편 탑승 (고베 2터미널)", mapQuery: "Kobe Airport" },
            ]
        }
    ];

    const budgetItemsA = [
        { category: "숙박 (Stay)", detail: "3인 1실 (실속형 프리미엄 료칸/호텔)", cost: "¥85,000", icon: <Hotel size={20} />, color: "bg-[#f4f7fa] text-[#1a365d]" },
        { category: "골프 (Golf)", detail: "금요일 및 토요일 오후 티(할인)", cost: "¥53,000", icon: <Flag size={20} />, color: "bg-[#fffcf0] text-[#b08d49]" },
        { category: "기타 (Misc)", detail: "가이세키 및 3인 전용 이동비", cost: "¥40,000", icon: <TrendingUp size={20} />, color: "bg-gray-50 text-gray-600" },
    ];

    const budgetItemsB = [
        { category: "숙박 (Stay)", detail: "시내 부티크 호텔 트리플룸 3박", cost: "¥60,000", icon: <Building size={20} />, color: "bg-[#f0f9f6] text-[#2d6a4f]" },
        { category: "골프 (Golf)", detail: "월요일 라운딩 적용 (할인)", cost: "¥35,000", icon: <Flag size={20} />, color: "bg-[#fffcf0] text-[#b08d49]" },
        { category: "기타 (Misc)", detail: "로컬 다이닝 및 공항 이동비", cost: "¥35,000", icon: <PiggyBank size={20} />, color: "bg-gray-50 text-gray-600" },
    ];

    const activeItinerary = selectedPlan === 'A' ? itineraryA : itineraryB;
    const activeBudget = selectedPlan === 'A' ? budgetItemsA : budgetItemsB;

    const generateMap = async () => {
        if (!apiKey) {
            setMapImage(mapImageStatic);
            return;
        }
        setIsGenerating(true);
        setMapImage(null);
        const prompt = `A luxury travel map of Kobe Japan starting from Kobe Airport. Plan ${selectedPlan}. Navy and gold colors.`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [{ prompt: prompt }], parameters: { sampleCount: 1 } })
            });
            const result = await response.json();
            if (result.predictions?.[0]?.bytesBase64Encoded) {
                setMapImage(`data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`);
            }
        } catch (err) {
            setError("지도를 불러올 수 없습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const openUrl = (url) => {
        if (url) window.open(url, '_blank');
    };

    const openInGoogleMaps = (query) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    };

    useEffect(() => {
        if (activeTab === 'map') generateMap();
    }, [activeTab, selectedPlan]);

    const currentPlanName = selectedPlan === 'A' ? '온천 프리미엄' : '시내 실속형';

    return (
        <div className={`max-w-md mx-auto ${colors.bg} min-h-screen flex flex-col font-sans text-[#1a202c] shadow-2xl relative overflow-hidden`}>

            {/* Header */}
            <div className="bg-white pt-16 pb-12 px-8 rounded-b-[4.5rem] shadow-2xl shadow-gray-200/40 z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Award size={14} className={colors.accentText} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${colors.accentText}`}>Kober Edition</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-[#1a202c] leading-none mb-2">KOBE TOUR</h1>
                        <div className="flex items-center gap-1.5">
                            <Link to="/game" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                                <Gamepad2 size={14} className={colors.accentText} />
                                <p className={`${colors.accentText} text-sm font-black tracking-tight`}>미니 게임하러 가기! 🕹️</p>
                            </Link>
                        </div>
                    </div>
                    <div className={`${colors.primary} w-14 h-14 rounded-2xl flex items-center justify-center text-[#d4af37] shadow-xl`}>
                        {selectedPlan === 'A' ? <Layout size={24} /> : <PiggyBank size={24} />}
                    </div>
                </div>

                {/* Plan Switcher Menu */}
                <div className="flex bg-gray-100 p-1.5 rounded-3xl mb-8">
                    <button
                        onClick={() => { setSelectedPlan('A'); setSelectedDay(1); }}
                        className={`flex-1 py-3 rounded-[1.5rem] text-[11px] font-black transition-all ${selectedPlan === 'A' ? `${colors.primary} text-white shadow-lg` : 'text-gray-400'}`}
                    >
                        온천 프리미엄
                    </button>
                    <button
                        onClick={() => { setSelectedPlan('B'); setSelectedDay(1); }}
                        className={`flex-1 py-3 rounded-[1.5rem] text-[11px] font-black transition-all ${selectedPlan === 'B' ? `${colors.primary} text-white shadow-lg` : 'text-gray-400'}`}
                    >
                        시내 실속형
                    </button>
                </div>

                <div className="bg-[#f8fafc] rounded-[2.5rem] p-8 flex items-center justify-between border border-[#e2e8f0]">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">UKB</p>
                        <p className="text-xl font-black text-[#1a202c]">출국</p>
                        <p className={`text-xs font-black ${colors.primaryText}`}>10:30</p>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                        <div className="w-full flex items-center gap-2">
                            <div className="flex-1 h-[1px] bg-[#cbd5e1]"></div>
                            <Plane className={colors.primaryText} size={16} />
                            <div className="flex-1 h-[1px] bg-[#cbd5e1]"></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-black tracking-widest uppercase">Kobe Airport</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">UKB</p>
                        <p className="text-xl font-black text-[#1a202c]">귀국</p>
                        <p className={`text-xs font-black ${colors.primaryText}`}>18:40</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto z-0">
                {activeTab === 'itinerary' && (
                    <div className="p-6 animate-in fade-in duration-700 pb-32">
                        <div className="flex space-x-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                            {[1, 2, 3, 4].map((d) => (
                                <button key={d} onClick={() => setSelectedDay(d)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${selectedDay === d ? `${colors.primary} text-white shadow-xl scale-105` : 'bg-white text-gray-400 border border-[#e2e8f0]'}`}>
                                    <span className="text-[10px] font-black mb-1 opacity-60">DAY</span>
                                    <span className="text-xl font-black">{d}</span>
                                </button>
                            ))}
                        </div>

                        <div className={`${colors.card} rounded-[2.5rem] p-8 shadow-xl border border-[#f1f5f9]`}>
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-[#1a202c] leading-tight mb-1">{activeItinerary[selectedDay - 1].title}</h2>
                                <p className={`${colors.primaryText} font-bold text-xs uppercase tracking-widest`}>{activeItinerary[selectedDay - 1].date}</p>
                                {selectedPlan === 'A' && selectedDay === 2 && (
                                    <div className="mt-2 inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-md">토요일 오후 티 특가 적용</div>
                                )}
                            </div>
                            <div className="space-y-10 relative">
                                <div className="absolute left-[9px] top-3 bottom-3 w-[1px] bg-[#e2e8f0]"></div>
                                {activeItinerary[selectedDay - 1].items.map((item, idx) => (
                                    <div key={idx} className="flex items-start relative pl-8">
                                        <div className={`absolute left-0 w-[18px] h-[18px] rounded-full border-[3px] border-white flex items-center justify-center z-10 shadow-sm ${colors.primary}`}><div className="w-1 h-1 bg-white rounded-full"></div></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-black tracking-wider flex items-center gap-1 ${colors.primaryText}`}><Clock size={12} /> {item.time}</span>
                                                <div className="flex gap-1">
                                                    {item.bookingUrl && (
                                                        <button onClick={() => openUrl(item.bookingUrl)} className="text-[9px] font-black text-white bg-[#d4af37] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                            <ExternalLink size={10} /> 예약하기
                                                        </button>
                                                    )}
                                                    {item.mapQuery && (
                                                        <button onClick={() => openInGoogleMaps(item.mapQuery)} className="text-[9px] font-black text-[#d4af37] bg-[#fffcf0] px-2 py-1 rounded-full border border-[#f3eee0] flex items-center gap-1">
                                                            <MapIcon size={10} /> 위치보기
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1 text-[#1a202c]">{item.icon}<h3 className="font-black text-lg leading-none">{item.activity}</h3></div>
                                            <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'map' && (
                    <div className="p-6 animate-in fade-in duration-700 pb-32">
                        <div className={`${colors.card} rounded-[2.5rem] p-4 shadow-xl border border-[#f1f5f9] min-h-[500px] flex flex-col`}>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Day {selectedDay} Map</h3>
                                <div className="flex bg-gray-100 p-1 rounded-full">
                                    <button onClick={() => setShowRealMap(true)} className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${showRealMap ? `${colors.primary} text-white shadow-md` : 'text-gray-400'}`}>구글 지도</button>
                                    <button onClick={() => setShowRealMap(false)} className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${!showRealMap ? `${colors.primary} text-white shadow-md` : 'text-gray-400'}`}>일러스트</button>
                                </div>
                            </div>
                            {showRealMap ? (
                                <div className="flex-1 w-full rounded-[2rem] overflow-hidden border border-[#e2e8f0] bg-gray-50 h-[350px]">
                                    <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(activeItinerary[selectedDay - 1].mainQuery)}`} title="Google Maps"></iframe>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    {isGenerating ? <Loader2 className="animate-spin text-[#1a365d] mb-4" size={40} /> : mapImage ? <img src={mapImage} className="rounded-3xl shadow-2xl" alt="Map Illustration" /> : <p className="text-gray-400">지도를 로드 중...</p>}
                                </div>
                            )}
                            <div className="mt-6 p-6 bg-[#f8fafc] rounded-[2rem] border border-[#e2e8f0]">
                                <h4 className="font-black text-[#1a202c] mb-1 flex items-center gap-2"><Compass size={18} className={colors.accentText} /> {currentPlanName} 경로</h4>
                                <p className="text-xs font-bold text-gray-500">{activeItinerary[selectedDay - 1].route}</p>
                                <button onClick={() => openInGoogleMaps(activeItinerary[selectedDay - 1].mainQuery)} className={`mt-4 w-full py-3.5 rounded-2xl ${colors.primary} text-white text-[11px] font-black flex items-center justify-center gap-2 shadow-lg`}>
                                    <MapIcon size={14} /> 구글 지도 앱에서 크게 보기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'budget' && (
                    <div className="p-6 animate-in fade-in duration-700 pb-32">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                            <div className="mb-8 text-center">
                                <div className="inline-flex items-center gap-1.5 mb-2 px-4 py-1.5 bg-[#f8fafc] rounded-full">
                                    <Users size={12} className={colors.accentText} />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.accentText}`}>{selectedPlan === 'A' ? 'Premium Value' : 'Value'} Plan</span>
                                </div>
                                <h2 className="text-2xl font-black text-[#1a202c]">3인 그룹 1인 경비</h2>
                                <p className="text-xs text-gray-400 font-bold mt-1 uppercase">토요일 오후 티 특가 반영</p>
                            </div>
                            <div className="space-y-4 mb-10">
                                {activeBudget.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white border border-[#f1f5f9] shadow-sm">
                                        <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color.split(' ')[0]}`}>{item.icon}</div><div><p className="text-sm font-black text-[#1a202c]">{item.category}</p><p className="text-[10px] text-gray-400 font-black uppercase">{item.detail}</p></div></div>
                                        <p className={`font-black text-lg ${item.color.split(' ')[1]}`}>{item.cost}</p>
                                    </div>
                                ))}
                            </div>
                            <div className={`${colors.primary} p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
                                <div className="flex justify-between items-center mb-4 opacity-80 text-[10px] font-black tracking-[0.4em]"><span>TOTAL ESTIMATION</span><Wallet size={16} /></div>
                                <div className="flex flex-col"><span className="text-5xl font-black text-[#d4af37]">{selectedPlan === 'A' ? '¥178,000' : '¥130,000'}</span><span className="text-white/60 text-xs font-bold mt-3 tracking-wide text-center">한화 약 {selectedPlan === 'A' ? '1,602,000' : '1,170,000'}원</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-700 pb-32">
                        {selectedPlan === 'A' ? (
                            // 온천 프리미엄 중요 정보
                            <div className="space-y-6">
                                <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1a202c]">
                                        <Sparkles className={colors.accentText} size={22} /> 프리미엄 투어 핵심 안내
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0]">
                                            <h3 className={`font-black ${colors.primaryText} text-sm mb-2 flex items-center gap-2`}>
                                                <Clock size={16} /> 1. 라운딩 시간 및 진행
                                            </h3>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                금요일(12:30), 토요일(13:00 오후 티) 시작입니다. 특히 주말 오후 티는 일몰 전 종료를 위해 '스루 라운드(식사 없이 18홀)'로 진행될 수 있으니 사전에 간식을 준비하는 것이 좋습니다.
                                            </p>
                                        </div>
                                        <div className="p-5 bg-[#fdfcf5] rounded-3xl border border-[#f3eee0]">
                                            <h3 className={`font-black ${colors.accentText} text-sm mb-2 flex items-center gap-2`}>
                                                <Utensils size={16} /> 2. 료칸 가이세키 석식 시간
                                            </h3>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                아리마 료칸의 전통 석식은 보통 19:30이 마지막 입장입니다. 토요일 오후 라운딩 후 복귀 시간을 고려하여 미리 료칸 측에 도착 예정 시간을 고지해야 합니다.
                                            </p>
                                        </div>
                                        <div className="p-5 bg-[#f0f4f8] rounded-3xl border border-[#d1dce5]">
                                            <h3 className={`font-black text-gray-700 text-sm mb-2 flex items-center gap-2`}>
                                                <Award size={16} /> 3. 명문 코스 복장 규정
                                            </h3>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                아리마 로열과 롯코 국제는 엄격한 복장 규정을 적용합니다. 클럽하우스 입장 시 **재킷(자켓) 착용**이 필수이며, 라운드 시에도 깃 있는 셔츠를 착용해야 합니다.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                                <div className="p-6 bg-[#1a365d] rounded-[2.5rem] text-white flex items-start gap-4">
                                    <AlertCircle className="text-[#d4af37] shrink-0" size={24} />
                                    <div>
                                        <h4 className="font-black text-sm mb-1 text-[#d4af37]">차량 팁</h4>
                                        <p className="text-[11px] opacity-80 leading-relaxed">3인의 골프백 3개와 캐리어를 동시에 적재하려면 미니밴(알파드 등) 또는 대형 SUV 차량 렌트가 필수입니다.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // 시내 실속형 중요 정보
                            <div className="space-y-6">
                                <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1a202c]">
                                        <PiggyBank className={colors.accentText} size={22} /> 실속형 투어 핵심 안내
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-[#f0f9f6] rounded-3xl border border-[#d1e7dd]">
                                            <h3 className="font-black text-[#198754] text-sm mb-2 flex items-center gap-2">
                                                <TrendingUp size={16} /> 1. 월요일 평일 라운딩 메리트
                                            </h3>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                월요일 라운딩은 주말 대비 약 30~50% 저렴한 그린피로 이용 가능합니다. 또한 예약이 비교적 수월하여 원하는 티타임을 확보하기 좋습니다.
                                            </p>
                                        </div>
                                        <div className="p-5 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0]">
                                            <h3 className={`font-black ${colors.primaryText} text-sm mb-2 flex items-center gap-2`}>
                                                <Building size={16} /> 2. 시내 숙박 및 야경 투어
                                            </h3>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                산노미야 시내 호텔은 고베항 하버랜드와 모토마치 쇼핑가 접근성이 매우 뛰어납니다. 주말 저녁에는 하버랜드에서 포트 타워 야경을 감상하며 자유로운 디너를 즐기세요.
                                            </p>
                                        </div>
                                        <div className="p-5 bg-[#fdfcf5] rounded-3xl border border-[#f3eee0]">
                                            <h3 className={`font-black ${colors.accentText} text-sm mb-2 flex items-center gap-2`}>
                                                <Navigation size={16} /> 3. 고베 공항 이동 (18:40 편)
                                            </h3>
                                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                                고베 시내에서 공항까지 포트라이너로 단 18분 소요됩니다. 18:40 귀국편 기준, 면세 구역 이용 및 수속을 위해 17:00까지는 공항에 도착하는 동선을 추천합니다.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                                <div className="p-6 bg-emerald-600 rounded-[2.5rem] text-white flex items-start gap-4">
                                    <CheckCircle2 className="text-white shrink-0" size={24} />
                                    <div>
                                        <h4 className="font-black text-sm mb-1">식사 팁</h4>
                                        <p className="text-[11px] opacity-90 leading-relaxed">실속형 플랜은 고가의 정식보다는 '스테이크랜드'와 같은 시내 가성비 고베규 맛집이나 현지인 이자카야를 활용하면 만족도가 높습니다.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Tab Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#1a365d]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] h-22 shadow-2xl flex items-center justify-around px-4 z-50">
                <TabButton active={activeTab === 'itinerary'} onClick={() => setActiveTab('itinerary')} icon={<Calendar size={24} />} label="일정" />
                <TabButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapPin size={24} />} label="지도" />
                <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<Info size={24} />} label="정보" />
                <TabButton active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={24} />} label="경비" />
            </div>

            {/* Decorative Background Blur */}
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-[#1a365d]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-[#d4af37]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-1/4 py-4 rounded-3xl transition-all duration-500 ${active ? 'bg-[#d4af37] text-[#1a365d] shadow-2xl scale-110' : 'text-white/40 hover:text-white/70'}`}>
        {icon}<span className="text-[10px] font-black mt-1 tracking-tighter uppercase">{label}</span>
    </button>
);

export default TourApp;
