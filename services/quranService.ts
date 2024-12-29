import axios from 'axios';

const API_BASE_URL = 'https://equran.id/api/v2';

export const getSurahList = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surat`);
    return response.data; // Assuming the data is directly in the response
  } catch (error) {
    console.error('Error fetching Surah list:', error);
    return null; // Or throw the error if you prefer
  }
};

export const getSurahDetail = async (surahNumber: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/surat/${surahNumber}`);
      return response.data; // Assuming the data is directly in the response
    } catch (error) {
      console.error('Error fetching Surah detail:', error);
      return null; // Or throw the error if you prefer
    }
  };

  export const getTafsDetail = async (tafNumber: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tafsir/${tafNumber}`);
      return response.data; // Assuming the data is directly in the response
    } catch (error) {
      console.error('Error fetching Tafsir detail:', error);
      return null; // Or throw the error if you prefer
    }
  }