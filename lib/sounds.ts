export const playSound = (soundName: 'delivered' | 'loading') => {
  if (typeof window === 'undefined') return;

  try {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Sound playback failed:', err));
  } catch (error) {
    console.warn('Error playing sound:', error);
  }
};
