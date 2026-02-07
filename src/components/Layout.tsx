import React from 'react';
import { Home, Gamepad2, User, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // URL에 main=app 파라미터가 있으면 내비게이션 바 숨김 (앱 웹뷰 모드)
    const isAppMode = new URLSearchParams(location.search).get('mode') === 'app';

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-center font-sans text-gray-900">
            {/* Mobile Frame Container */}
            <div className="w-full max-w-[430px] h-screen bg-white relative shadow-2xl overflow-hidden flex flex-col">

                {/* Status Bar Area (웹 모드일 때만 공백 표시, 앱에서는 상태바에 겹치지 않게 처리해야 할 수 있음) */}
                {!isAppMode && <div className="h-[env(safe-area-inset-top)] bg-white w-full flex-shrink-0" />}

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-slate-50 relative">
                    {children}
                </main>

                {/* Bottom Navigation (앱 모드에서는 숨김) */}
                {!isAppMode && (
                    <nav className="bg-white border-t border-gray-100 px-6 pb-[env(safe-area-inset-bottom)] pt-2 h-[80px] flex items-start justify-between z-50 shrink-0">
                        <NavItem
                            icon={<Home size={24} />}
                            label="홈"
                            active={isActive('/')}
                            onClick={() => navigate('/')}
                        />
                        <NavItem
                            icon={<Gamepad2 size={24} />}
                            label="게임"
                            active={location.pathname.startsWith('/game')}
                            onClick={() => navigate('/game/colormatch')}
                        />
                        <NavItem
                            icon={<User size={24} />}
                            label="마이"
                            active={isActive('/profile')}
                            onClick={() => navigate('/profile')}
                        />
                        <NavItem
                            icon={<Menu size={24} />}
                            label="메뉴"
                            active={isActive('/menu')}
                            onClick={() => navigate('/menu')}
                        />
                    </nav>
                )}
            </div>
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 transition-all duration-200 ${active ? 'text-blue-500 scale-105' : 'text-gray-400 hover:text-gray-600'
                }`}
        >
            <div className="mb-1">{icon}</div>
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
        </button>
    );
};

export default Layout;
