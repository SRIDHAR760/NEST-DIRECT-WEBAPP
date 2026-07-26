import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nestdirect.app',
  appName: 'NestDirect',
  webDir: 'www',
  server: {
    url: 'https://nest-direct-webapp.vercel.app/',
    cleartext: false
  }
};

export default config;
