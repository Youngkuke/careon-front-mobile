import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

  if (!androidGoogleMapsApiKey && !iosGoogleMapsApiKey) {
    return config;
  }

  return {
    ...config,
    ...(androidGoogleMapsApiKey ? {
      android: {
        ...config.android,
        config: {
          ...config.android?.config,
          googleMaps: { apiKey: androidGoogleMapsApiKey },
        },
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
