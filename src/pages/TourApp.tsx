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
    Car,
    Gamepad2
} from 'lucide-react';
import { Link } from 'react-router-dom';

import mapImageStatic from '../assets/kobe_map_custom.jpg';

const TourApp = () => {
    const [activeTab, setActiveTab] = useState('itinerary');

    const [selectedDay, setSelectedDay] = useState(1);
    const [mapImage, setMapImage] = useState<string | null>(mapImageStatic);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showRealMap, setShowRealMap] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // 시내 실속형
    const itinerary = [
        {
            day: 1, date: "3월 20일 (금)", title: "고베공항 입국 & 시내 맛집", route: "고베공항 ➔ 산노미야 ➔ 이진칸",
            mainQuery: "Candeo Hotels Kobe Tor Road",
            items: [
                { time: "08:25", icon: <Plane size={16} />, activity: "인천공항(ICN) T2 출발", desc: "KE2171 A321-neo", mapQuery: "Incheon International Airport Terminal 2" },
                { time: "10:10", icon: <Car size={16} />, activity: "고베 공항(UKB) T2 도착", desc: "입국 수속 후 렌트카 픽업", mapQuery: "Kobe Airport" },
                { time: "12:00", icon: <Utensils size={16} />, activity: "점심 식사 (스테이크랜드 고베)", desc: "가성비 좋은 고베규 런치 (1인 약 3,500엔~)", mapQuery: "Steakland Kobe" },
                { time: "15:00", icon: <Hotel size={16} />, activity: "호텔 체크인", desc: "칸데오 호텔 고베 토르 로드 (주차 불포함/인근이용)", mapQuery: "Candeo Hotels Kobe Tor Road" },
                { time: "19:00", icon: <Utensils size={16} />, activity: "디너: 고베규 이자카야", desc: "현지인 가성비 맛집", mapQuery: "Steakland Kobe" },
            ]
        },
        {
            day: 2, date: "3월 21일 (토)", title: "제1라운드 & 온천 마을 산책", route: "호텔 ➔ 고베 가스토니안 GC ➔ 아리마",
            mainQuery: "Kobe Gastonian Golf Club",
            items: [
                {
                    time: "08:30", icon: <Flag size={16} />, activity: "제1라운드 (18홀)", desc: "고베 가스토니안 GC (자차 이동 약 40분)",
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
            day: 4, date: "3월 23일 (월)", title: "로코 CC 스루플레이 & 귀국", route: "호텔 ➔ 로코 CC ➔ 고베공항",
            mainQuery: "Rokko Country Club",
            items: [
                {
                    time: "07:00", icon: <Flag size={16} />, activity: "제2라운드 (18H 스루)", desc: "로코 CC (자차 이동 / OUT코스 / 3B)",
                    mapQuery: "Rokko Country Club",
                    bookingUrl: ""
                },
                { time: "11:00", icon: <Utensils size={16} />, activity: "점심 식사 & 샤워", desc: "라운드 후 식사 & 렌트카 반납 준비", mapQuery: "Rokko Country Club" },
                { time: "12:50", icon: <Car size={16} />, activity: "렌트카 반납 & 공항 도착", desc: "차량 반납 후 체크인 및 면세점 쇼핑", mapQuery: "Kobe Airport" },
                { time: "18:40", icon: <Plane size={16} />, activity: "고베 공항(UKB) T2 출발", desc: "KE2174 A321-neo", mapQuery: "Kobe Airport" },
                { time: "20:40", icon: <Navigation size={16} />, activity: "인천공항(ICN) T2 도착", desc: "입국 수속 및 귀가", mapQuery: "Incheon International Airport Terminal 2" },
            ]
        }
    ];

    const budgetItems = [
        { category: "숙박 (Stay)", detail: "총 ¥98,258 ÷ 3명 (3박)", cost: "¥32,753", icon: <Building size={20} />, color: "bg-[#f0f9f6] text-[#2d6a4f]" },
        { category: "골프 (Golf)", detail: "가스토니안 + 로코(10,540엔)", cost: "¥32,000", icon: <Flag size={20} />, color: "bg-[#fffcf0] text-[#b08d49]" },
        { category: "기타 (Misc)", detail: "렌트카(1/3) + 식비 + 주유비", cost: "¥44,300", icon: <PiggyBank size={20} />, color: "bg-gray-50 text-gray-600" },
    ];

    const activeItinerary = itinerary;
    const activeBudget = budgetItems;

    const generateMap = async () => {
        if (!apiKey) {
            setMapImage(mapImageStatic);
            return;
        }
        setIsGenerating(true);
        setMapImage(null);
        const prompt = `A luxury travel map of Kobe Japan starting from Kobe Airport. Plan Value. Navy and gold colors.`;
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
    }, [activeTab]);

    const currentPlanName = '시내 실속형';

    return (
        <div className={`w-full h-full ${colors.bg} font-sans text-[#1a202c] relative`}>

            {/* Main Scrollable Area */}
            <div className="w-full h-full overflow-y-auto pb-40 no-scrollbar">

                {/* Header */}
                <div className="bg-white pt-16 pb-12 px-8 rounded-b-[4.5rem] shadow-2xl shadow-gray-200/40 relative z-10">
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
                            <PiggyBank size={24} />
                        </div>
                    </div>

                    <div className="bg-[#f8fafc] rounded-[1.5rem] p-8 flex items-center justify-between border border-[#e2e8f0]">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">UKB</p>
                            <p className="text-xl font-black text-[#1a202c]">출국</p>
                            <p className={`text-xs font-black ${colors.primaryText}`}>08:25</p>
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

                {/* Content */}
                <div className="z-0 pb-32">
                    {activeTab === 'itinerary' && (
                        <div className="p-6 animate-in fade-in duration-700">
                            <div className="flex justify-center space-x-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                                {[1, 2, 3, 4].map((d) => (
                                    <button key={d} onClick={() => setSelectedDay(d)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${selectedDay === d ? `${colors.primary} text-white shadow-xl scale-105` : 'bg-white text-gray-400 border border-[#e2e8f0]'}`}>
                                        <span className="text-[10px] font-black mb-1 opacity-60">DAY</span>
                                        <span className="text-xl font-black">{d}</span>
                                    </button>
                                ))}
                            </div>

                            <div className={`${colors.card} rounded-[1.5rem] p-8 shadow-xl border border-[#f1f5f9]`}>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-[#1a202c] leading-tight mb-1">{activeItinerary[selectedDay - 1].title}</h2>
                                    <p className={`${colors.primaryText} font-bold text-xs uppercase tracking-widest`}>{activeItinerary[selectedDay - 1].date}</p>

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
                                                            <button onClick={() => openInGoogleMaps(item.mapQuery)} className="text-[9px] font-black text-[#d4af37] bg-[#fffcf0] px-2 py-1 rounded-full border border border-[#f3eee0] flex items-center gap-1">
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
                        <div className="p-6 animate-in fade-in duration-700">
                            <div className={`${colors.card} rounded-[1.5rem] p-4 shadow-xl border border-[#f1f5f9] min-h-[500px] flex flex-col`}>
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Day {selectedDay} Map</h3>
                                    <div className="flex bg-gray-100 p-1 rounded-full">
                                        <button onClick={() => setShowRealMap(true)} className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${showRealMap ? `${colors.primary} text-white shadow-md` : 'text-gray-400'}`}>구글 지도</button>
                                        <button onClick={() => setShowRealMap(false)} className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${!showRealMap ? `${colors.primary} text-white shadow-md` : 'text-gray-400'}`}>일러스트</button>
                                    </div>
                                </div>
                                {showRealMap ? (
                                    <div className="flex-1 w-full rounded-[2rem] overflow-hidden border border-[#e2e8f0] bg-gray-50 h-[350px]">
                                        <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent(activeItinerary[selectedDay - 1].mainQuery)}&output=embed`} title="Google Maps"></iframe>
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
                        <div className="p-6 animate-in fade-in duration-700">
                            <div className="bg-white rounded-[1.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-1.5 mb-2 px-4 py-1.5 bg-[#f8fafc] rounded-full">
                                        <Users size={12} className={colors.accentText} />
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.accentText}`}>Value Plan</span>
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
                                    <div className="flex flex-col"><span className="text-5xl font-black text-[#d4af37]">¥109,053</span><span className="text-white/60 text-xs font-bold mt-3 tracking-wide text-center">한화 약 1,000,000원</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-700">

                            <div className="space-y-6">
                                <section className="bg-white rounded-[1.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1a202c]">
                                        <Hotel className={colors.accentText} size={22} /> 숙소 예약 정보
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-[#f0f9f6] rounded-3xl border border-[#d1e7dd]">
                                            <h3 className="font-black text-[#198754] text-sm mb-2 flex items-center gap-2">
                                                <MapPin size={16} /> 1. 장소 & 일정
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p><span className="font-bold text-[#198754]">호텔:</span> 칸데오 호텔 고베 토르 로드</p>
                                                <p className="text-[10px] text-gray-400">Candeo Hotels Kobe Tor Road</p>
                                                <p className="text-[10px] text-gray-400">Chuo-ku Sannomiya-cho 3-8-8</p>
                                                <div className="mt-2 pt-2 border-t border-dashed border-[#198754]/30">
                                                    <p><span className="font-bold text-[#198754]">체크인:</span> 3.20(금) 15:00~</p>
                                                    <p><span className="font-bold text-[#198754]">체크아웃:</span> 3.23(월) ~11:00</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0]">
                                            <h3 className={`font-black ${colors.primaryText} text-sm mb-2 flex items-center gap-2`}>
                                                <Info size={16} /> 2. 객실 & 인원
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p><span className="font-bold text-[#1a365d]">객실:</span> 디럭스 트윈룸 (금연)</p>
                                                <p><span className="font-bold text-[#1a365d]">인원:</span> 성인 3명 (3박)</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[#fdfcf5] rounded-3xl border border-[#f3eee0]">
                                            <h3 className={`font-black ${colors.accentText} text-sm mb-2 flex items-center gap-2`}>
                                                <CreditCard size={16} /> 3. 결제 정보
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <div className="flex justify-between font-bold text-[#1a202c]">
                                                    <span>총 합계</span>
                                                    <span className="text-[#d4af37]">¥98,258</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1">VAT 포함, Booking.com 할인 적용됨</p>
                                                <p className="text-[10px] text-gray-400">2026.03.17 자동 결제 예정</p>
                                                <p className="mt-1 text-red-400 font-bold">취소기한: 3.18 23:59까지 무료</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-[1.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1a202c]">
                                        <Car className={colors.accentText} size={22} /> 렌트카 예약 정보
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-[#f0f9f6] rounded-3xl border border-[#d1e7dd]">
                                            <h3 className="font-black text-[#198754] text-sm mb-2 flex items-center gap-2">
                                                <MapPin size={16} /> 1. 대여 장소 & 차량
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p><span className="font-bold text-[#198754]">업체:</span> 토요타 렌터카 (고베공항점)</p>
                                                <p><span className="font-bold text-[#198754]">차종:</span> 시엔타 / 프리우스α (미니밴 랜덤)</p>
                                                <p className="text-[10px] text-gray-400">최대 6인승 (골프백 + 캐리어 적재 가능)</p>
                                                <p className="text-[10px] text-gray-400">네비게이션(한국어 지원) + ETC 포함 / AT</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0]">
                                            <h3 className={`font-black ${colors.primaryText} text-sm mb-2 flex items-center gap-2`}>
                                                <Info size={16} /> 2. 비용 & 혜택
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <div className="flex justify-between font-bold text-[#1a202c]">
                                                    <span>총 요금 (3박 4일)</span>
                                                    <span className="text-[#d4af37]">¥42,900</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1">현지 결제 또는 사전 결제 확인 필요</p>
                                                <p className="text-[10px] text-gray-400">포인트 858P 적립 예정</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[#fdfcf5] rounded-3xl border border-[#f3eee0]">
                                            <h3 className={`font-black ${colors.accentText} text-sm mb-2 flex items-center gap-2`}>
                                                <AlertCircle size={16} /> 3. 주의사항
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p className="text-red-400 font-bold">• 취소기한: 3월 13일까지 무료 취소</p>
                                                <p>• 면책 보상 옵션 현장 추가 가능</p>
                                                <p>• 공항 데스크에서 픽업 절차 진행</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white rounded-[1.5rem] p-8 shadow-xl border border-[#f1f5f9]">
                                    <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-[#1a202c]">
                                        <Flag className={colors.accentText} size={22} /> 로코 CC 골프 예약
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-[#f0f9f6] rounded-3xl border border-[#d1e7dd]">
                                            <h3 className="font-black text-[#198754] text-sm mb-2 flex items-center gap-2">
                                                <MapPin size={16} /> 1. 장소 & 일시
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p><span className="font-bold text-[#198754]">장소:</span> 六甲カントリー倶楽部 (로코 CC)</p>
                                                <p className="text-[10px] text-gray-400">兵庫県西宮市山口町金仙寺1659-1</p>
                                                <p className="mt-1"><span className="font-bold text-[#198754]">일시:</span> 2026년 3월 23일 (월) 07:00</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[#f8fafc] rounded-3xl border border-[#e2e8f0]">
                                            <h3 className={`font-black ${colors.primaryText} text-sm mb-2 flex items-center gap-2`}>
                                                <Flag size={16} /> 2. 코스 & 비용
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p><span className="font-bold text-[#1a365d]">코스:</span> OUT코스 / 1팀 3명</p>
                                                <p><span className="font-bold text-[#1a365d]">비용:</span> 1인 10,540엔 (기본 9,990 + 3B할증 550 / 락커 별도)</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-[#fdfcf5] rounded-3xl border border-[#f3eee0]">
                                            <h3 className={`font-black ${colors.accentText} text-sm mb-2 flex items-center gap-2`}>
                                                <AlertCircle size={16} /> 3. 주의사항
                                            </h3>
                                            <div className="text-[11px] text-gray-500 leading-relaxed space-y-1">
                                                <p>• 2주 전까지 동반자 이름 입력 필수</p>
                                                <p>• 취소 시 3일 전부터 3,000엔/1인 수수료 발생</p>
                                                <p className="mt-1 text-[#d4af37] font-bold">대표자: 이경진 (Lee Kyungjin)</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <div className="p-6 bg-emerald-600 rounded-[1.5rem] text-white flex items-start gap-4">
                                    <CheckCircle2 className="text-white shrink-0" size={24} />
                                    <div>
                                        <h4 className="font-black text-sm mb-1">식사 팁</h4>
                                        <p className="text-[11px] opacity-90 leading-relaxed">실속형 플랜은 고가의 정식보다는 '스테이크랜드'와 같은 시내 가성비 고베규 맛집이나 현지인 이자카야를 활용하면 만족도가 높습니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tab Bar */}
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-[#1a365d]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] h-22 shadow-2xl flex items-center justify-around px-4 z-50">
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
