# FlowWorks iPhone Install With Xcode

This path installs FlowWorks directly onto your own iPhone without App Store distribution and without a paid backend.

## Requirements

- Mac with Xcode installed
- iPhone connected by USB or paired wirelessly
- Free Apple ID added to Xcode

Apple documents that Xcode can create a personal team for Apple IDs that are not in the paid Developer Program. App Store distribution still requires joining the Apple Developer Program.

## Build And Sync

```bash
npm install
npm run ios:sync
npm run ios:open
```

If this is the first native setup:

```bash
npm run ios:add
npm run ios:open
```

## Xcode Steps

1. Open `ios/App/App.xcodeproj`.
2. Select the `App` target.
3. Open `Signing & Capabilities`.
4. Enable `Automatically manage signing`.
5. Select your Apple ID personal team.
6. Connect and unlock your iPhone.
7. Select the iPhone as the run destination.
8. Press Run.

If iOS asks you to trust the developer app, open iPhone Settings and trust the Apple ID developer profile shown for the installed app.

## Free Limitations

- This is for your own device/development install.
- App Store/TestFlight distribution requires Apple Developer Program membership.
- Free personal signing may require periodic reinstalling from Xcode.
- Cloud sync between multiple devices requires a backend. FlowWorks standalone mode keeps data on the device.
