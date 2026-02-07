import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const handleMessage = (event) => {
    // Handle messages from the web app
    console.log("Message from Web:", event.nativeEvent.data);
  };

  // 1. 배포 전 Vercel URL로 변경하세요.
  // 2. 로컬 테스트 시:
  //    - iOS Simulator: http://localhost:5173
  //    - Android Emulator: http://10.0.2.2:5173
  //    - 실기기: 사용 중인 PC의 IP 주소 (예: http://192.168.0.x:5173)
  const WEB_APP_URL = 'http://localhost:5173/?mode=app';

  return (
    <SafeAreaProvider>
      {/* 상태바 영역 배경색 설정 (브랜드 컬러에 맞게 조정 가능) */}
      <SafeAreaView style={styles.topSafeArea} edges={['top']} />

      <View style={styles.container}>
        <WebView
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsBackForwardNavigationGestures={true}
          // iOS에서 스크롤 바운스 효과 제거 (웹앱 느낌 강화)
          bounces={false}
        // 모바일 User Agent 설정 (필요 시)
        // userAgent="KobeMobileApp/1.0"
        />
        <StatusBar style="dark" />
      </View>

      {/* 하단 홈 인디케이터 영역 배경색 */}
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  topSafeArea: {
    flex: 0,
    backgroundColor: '#fff', // 상태바 배경색
  },
  bottomSafeArea: {
    flex: 0,
    backgroundColor: '#fff', // 하단 영역 배경색
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  }
});
