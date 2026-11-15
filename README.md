# 우리둘 캘린더 (AOS · iOS 설치형 커플 캘린더 패키지)

이 패키지는 안드로이드(AOS)와 아이폰(iOS) 모두에서 **앱으로 다운로드하여 설치**할 수 있도록 구성된 풀소스 프로젝트입니다.

## 방법 1. 3분 만에 배포 후 AOS · iOS 동시 앱 설치 (가장 추천 / 무료)
1. [Vercel](https://vercel.com) 또는 [Cloudflare Pages](https://pages.cloudflare.com)에 무료 가입 후 이 폴더를 업로드(또는 GitHub 연동)합니다.
2. 생성된 `https://...` 주소로 두 사람의 스마트폰에서 접속합니다.
3. **남자친구 (AOS / 갤럭시)**: Chrome 브라우저 우측 상단 `⋮` → **[앱 설치]** 또는 **[홈 화면에 추가]** 터치
4. **여자친구 (iOS / 아이폰)**: Safari 브라우저 하단 `공유(□↑)` → **[홈 화면에 추가]** 터치

## 방법 2. 네이티브 설치 파일(.apk / iOS Xcode) 직접 추출
- **안드로이드 `.apk` 자동 생성**: 이 프로젝트를 GitHub에 올리면 `.github/workflows/build-android-apk.yml`이 자동 실행되어 `app-debug.apk` 파일을 다운로드할 수 있습니다.
- **아이폰 직접 설치 (Mac 보유 시)**:
  ```bash
  npm install
  npm run build
  npm install @capacitor/core @capacitor/cli @capacitor/ios
  npx cap add ios
  npx cap open ios
  ```
  Xcode가 열리면 아이폰을 케이블로 연결하고 상단 `▶(Run)` 버튼을 누르면 아이폰에 앱이 직접 설치됩니다.
