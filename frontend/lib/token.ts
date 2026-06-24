import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'life_tracker_auth_token';

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
