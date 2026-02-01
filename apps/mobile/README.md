# Physics Tutor Mobile App

A React Native mobile app built with Expo for iOS that helps students learn physics through AI-powered problem solving.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS development:
  - macOS with Xcode installed
  - CocoaPods (`sudo gem install cocoapods`)
  - iOS Simulator or physical iOS device

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

or

```bash
yarn install
```

### 2. Run the App

#### Development Mode (iOS Simulator)

```bash
npx expo start --ios
```

#### Development Mode (Physical Device)

```bash
npx expo start
```

Then scan the QR code with:
- **iOS**: Camera app or Expo Go app

#### Web Development (for testing)

```bash
npx expo start --web
```

## Building for iOS App Store

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Configure EAS

```bash
eas build:configure
```

### 3. Build for iOS App Store

```bash
eas build --platform ios --profile production
```

This will create an `.ipa` file that you can upload to App Store Connect.

### 4. Build iOS Native Project (for Xcode)

To generate the native iOS project that you can open in Xcode:

```bash
npx expo prebuild --platform ios
```

This creates an `ios/` directory with the native Xcode project. You can then:

```bash
cd ios
pod install
cd ..
```

Then open the project in Xcode:

```bash
open ios/YourApp.xcworkspace
```

In Xcode, you can:
- Configure signing and certificates
- Customize app settings
- Build and run on simulator/device
- Archive for App Store submission

### 5. Development Build

For a development build that you can test on device:

```bash
eas build --platform ios --profile development
```

## Project Structure

```
mobile/
├── src/
│   ├── app/              # App screens (Expo Router)
│   │   ├── (tabs)/       # Tab navigation screens
│   │   │   ├── index.jsx # Home screen
│   │   │   ├── library.jsx # Problems/Problems screen
│   │   │   ├── profile.jsx # Profile screen
│   │   │   └── settings.jsx # Settings screen
│   │   ├── problem/      # Problem detail screens
│   │   └── tutor/        # AI Tutor chat screens
│   ├── components/       # Reusable components
│   └── utils/            # Utility functions and hooks
├── assets/               # Images and assets
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Key Features

- **AI-Powered Learning**: Upload physics problems and get step-by-step solutions
- **Visual Explanations**: Interactive diagrams and visual aids
- **AI Tutor Chat**: Chat interface for asking questions and getting help
- **Problem Library**: Track and review all your solved problems
- **Progress Tracking**: Statistics, streaks, and achievements
- **iOS Native Design**: Built with SF Symbols and iOS design patterns

## iOS App Store Deployment

### 1. App Store Connect Setup

1. Create an app in [App Store Connect](https://appstoreconnect.apple.com)
2. Set up your app information, screenshots, and metadata
3. Note your Bundle Identifier (e.g., `com.yourcompany.physicstutor`)

### 2. Update app.json

Make sure your `app.json` has the correct bundle identifier:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.physicstutor"
    }
  }
}
```

### 3. Generate App Icons and Splash Screen

Replace the images in `assets/images/` with your app icons:
- `icon.png` (1024x1024)
- `splash-icon.png` (for splash screen)

### 4. Build and Submit

```bash
eas build --platform ios --profile production
```

After the build completes, download the `.ipa` file and upload it to App Store Connect using Transporter or Xcode Organizer.

### 5. Submit for Review

In App Store Connect:
1. Go to your app
2. Click "+ Version or Platform"
3. Fill in version information
4. Upload screenshots and description
5. Submit for review

## Troubleshooting

### iOS Build Issues

If you encounter CocoaPods issues:

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Metro Bundler Cache

Clear Metro bundler cache:

```bash
npx expo start -c
```

### Xcode Issues

If Xcode shows build errors:

1. Clean build folder: `Product > Clean Build Folder` (Shift+Cmd+K)
2. Delete derived data
3. Reinstall pods: `cd ios && pod install && cd ..`

## Environment Variables

Create a `.env` file for environment-specific variables (make sure to add `.env` to `.gitignore`):

```
EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY=your_key_here
EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL=your_url_here
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
