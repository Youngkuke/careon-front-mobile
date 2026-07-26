import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  // react-native-maps uses Apple Maps by default on iOS, so the Android Google Maps key must
  // never be reused there. Set this only if an explicit iOS Google Maps build is introduced.
  const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
  // EAS stores this as a secret file variable, so the Firebase config never needs to be committed.
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile;

  return {
    ...config,
    extra: {
      ...config.extra,
      eas: {
        ...(config.extra?.eas as Record<string, unknown> | undefined),
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? config.extra?.eas?.projectId,
      },
    },
    ...(androidGoogleMapsApiKey || googleServicesFile ? {
      android: {
        ...config.android,
        ...(googleServicesFile ? { googleServicesFile } : {}),
        ...(androidGoogleMapsApiKey ? {
          config: {
            ...config.android?.config,
            googleMaps: { apiKey: androidGoogleMapsApiKey },
          },
        } : {}),
      },
    } : {}),
    ...(iosGoogleMapsApiKey ? {
      ios: {
        ...config.ios,
        config: {
          ...config.ios?.config,
          googleMapsApiKey: iosGoogleMapsApiKey,
        },
      },
    } : {}),
  };
};
