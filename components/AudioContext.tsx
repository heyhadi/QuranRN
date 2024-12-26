import React, { createContext, useState, useEffect, useContext } from 'react';
import { Audio } from 'expo-av';

interface AudioContextProps {
  sound: Audio.Sound | null;
  currentIndex: number | null;
  playSound: (audioUrl: string, ayahIndex: number) => Promise<void>;
  stopSound: () => void;
}

const AudioContext = createContext<AudioContextProps | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentIndex, setCurrentAyahIndex] = useState<number | null>(null);

  const playSound = async (audioUrl: string, ayahIndex: number) => {
    if (sound && currentIndex === ayahIndex) {
      stopSound();
      return;
    }

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(newSound);
      setCurrentAyahIndex(ayahIndex);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          stopSound();
        }
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
    setSound(null);
    setCurrentAyahIndex(null);
  };

  useEffect(() => {
    return sound ? () => {
      sound.unloadAsync();
    } : undefined
  }, [sound])

  return (
    <AudioContext.Provider value={{ sound, currentIndex, playSound, stopSound }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};