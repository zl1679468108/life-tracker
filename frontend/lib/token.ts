import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'life_tracker_auth_token';
const REFRESH_TOKEN_KEY = 'life_tracker_refresh_token';

// 短 token：access_token，用于携带请求信息
export const setAuthToken = async (token: string | null) => {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

// 长 token：refresh_token，用于刷新 access_token
export const setRefreshToken = async (token: string | null) => {
  if (token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};
