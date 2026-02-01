# Xcode Setup Instructions

Your iOS project has been successfully generated and is ready to use in Xcode!

## ✅ What's Been Done

1. **Native iOS project created** - The `ios/` directory contains your complete Xcode project
2. **CocoaPods dependencies installed** - All 136 pods have been installed
3. **Xcode workspace created** - `PhysicsTutor.xcworkspace` is ready to use
4. **Xcode version compatibility** - Created a patch to allow Xcode 16.0 (React Native requires 16.1+)

## 🚀 Opening in Xcode2

The workspace should have opened automatically. If not, you can open it manually:

```bash
open ios/PhysicsTutor.xcworkspace
```

**Important**: Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

## 📱 Building and Running

### 0. Start Metro Bundler (REQUIRED)
**Before building in Xcode, you MUST start Metro bundler in a separate terminal:**

```bash
cd /Users/MAC/Downloads/create-anything/apps/mobile
npx expo start
```

Or if you want to clear the cache:
```bash
npx expo start -c
```

Keep this terminal window open while running the app. Metro bundler must be running for the app to load JavaScript code.

**Common Error**: If you see "No script URL provided" or "unsanitizedScriptURLString = (null)", it means Metro bundler is not running. Start it using the command above.

### 1. Select a Simulator or Device
- In Xcode, click on the device selector in the toolbar (next to the Play button)
- Choose an iPhone simulator (e.g., iPhone 15 Pro) or your physical device

### 2. Build and Run
- Click the **Play button** (▶️) or press `Cmd + R`
- Xcode will build and launch your app

### 3. Using Terminal (Alternative)
You can also build and run from the terminal:
```bash
cd ios
xcodebuild -workspace PhysicsTutor.xcworkspace -scheme PhysicsTutor -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build
```

## ⚙️ Xcode Configuration

### Signing & Capabilities
1. Select the **PhysicsTutor** project in the left sidebar
2. Select the **PhysicsTutor** target
3. Go to **Signing & Capabilities** tab
4. Select your **Team** (Apple Developer account)
5. Xcode will automatically generate a provisioning profile

### Bundle Identifier
Current bundle ID: `com.physicstutor.app`

To change it:
1. Select the project → Target → General tab
2. Change the **Bundle Identifier**

### App Icons
1. In Xcode, open `Images.xcassets` → `AppIcon`
2. Drag your app icon images to the appropriate slots
3. Required sizes:
   - 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024

## 🔧 Common Xcode Tasks

### Clean Build
- **Product** → **Clean Build Folder** (Shift + Cmd + K)

### Archive for App Store
1. **Product** → **Scheme** → **Edit Scheme**
2. Set **Build Configuration** to **Release**
3. **Product** → **Archive**
4. Once archived, click **Distribute App** to upload to App Store Connect

### View Console Logs
- **View** → **Debug Area** → **Activate Console** (Shift + Cmd + C)

### Debugging
- Set breakpoints by clicking in the gutter next to line numbers
- Use the Debug navigator (left sidebar) to inspect variables

## 📦 Updating Dependencies

If you need to update CocoaPods dependencies:

```bash
cd ios
pod install
```

Or from the project root:
```bash
cd /Users/MAC/Downloads/create-anything/apps/mobile
npx expo prebuild --platform ios --clean
```

## ⚠️ Important Notes

1. **Always use the workspace**: Open `PhysicsTutor.xcworkspace`, never `PhysicsTutor.xcodeproj`
2. **Xcode version**: Currently patched to work with Xcode 16.0. If you upgrade to 16.1+, you can remove the patch
3. **First build**: The first build may take 5-10 minutes as Xcode compiles all dependencies
4. **Metro bundler**: **REQUIRED** - You MUST start Metro bundler before running the app from Xcode. See "Starting Metro Bundler" section below.

## 🐛 Troubleshooting

### "No script URL provided" or "unsanitizedScriptURLString = (null)" Error
**This is the most common error when running from Xcode.**

**Solution**: Metro bundler is not running. You MUST start it before running the app:
```bash
cd /Users/MAC/Downloads/create-anything/apps/mobile
npx expo start
```

Make sure:
1. Metro bundler is running in a separate terminal
2. Metro is accessible on `localhost:8081` (default port)
3. No firewall is blocking the connection
4. You're in the correct directory (`apps/mobile`)

If Metro is running but you still get this error:
- Check that Metro is listening on the correct port (usually 8081)
- Try restarting Metro: Stop it (Ctrl+C) and start again with `npx expo start -c`
- Check Xcode console for more details about the connection attempt

### Build Errors
- **Clean build folder**: Product → Clean Build Folder (Shift + Cmd + K)
- **Delete Derived Data**: Xcode → Settings → Locations → Derived Data → Delete
- **Reinstall pods**: `cd ios && pod install`

### "No such module" Errors
- Clean build folder
- Reinstall pods: `cd ios && pod install`

### Signing Issues
- Make sure you have a valid Apple Developer account
- Check that your bundle identifier is unique
- Verify your provisioning profiles in Apple Developer Portal

### Simulator Issues
- **Reset simulator**: Device → Erase All Content and Settings
- **Restart Xcode**: Sometimes Xcode needs a restart after installing pods

## 🎨 Using Xcode's Tools

### Interface Builder
- Edit Storyboard files for native UI adjustments
- Adjust Auto Layout constraints
- Preview different device sizes

### Instruments
- **Product** → **Profile** (Cmd + I) - Performance profiling
- Analyze memory leaks, CPU usage, network activity

### Asset Catalog
- Manage app icons and images in `Images.xcassets`
- Create color sets and image sets
- Organize assets by density (@1x, @2x, @3x)

### Build Settings
- Adjust compiler flags
- Configure deployment targets
- Manage code signing settings

## 📚 Additional Resources

- [Apple's Xcode Documentation](https://developer.apple.com/xcode/)
- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- [CocoaPods Documentation](https://guides.cocoapods.org/)

Your project is now ready for native iOS development! 🎉
