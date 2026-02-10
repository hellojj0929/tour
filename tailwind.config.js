/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // 모바일 앱용 브랜드 컬러 정의
                brand: {
                    navy: '#1a365d',
                    gold: '#d4af37',
                    brown: '#b08d49',
                    bg: '#f8f9fb',
                },
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    900: '#0c4a6e',
                },
            },
            spacing: {
                '12': '2rem', // pb-12를 3rem에서 2rem으로 변경
                '16': '4.5rem', // pt-16을 4rem에서 3rem으로 변경, w-16을 4rem에서 4.5rem으로 변경
            },
            screens: {
                'xs': '475px', // 초소형 모바일 기기 대응
            },
        },
    },
    plugins: [],
}
