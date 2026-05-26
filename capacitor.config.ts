import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.flowworks.app",
  appName: "FlowWorks",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "capacitor"
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  },
  android: {
    allowMixedContent: false,
    captureInput: true
  }
};

export default config;
