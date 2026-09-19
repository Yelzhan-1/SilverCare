class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private russianVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural Russian voices
    const ruVoices = voices.filter((v) => v.lang.startsWith('ru') || v.lang.includes('RU'));
    if (ruVoices.length > 0) {
      // Prefer Google or Premium voice if available
      const preferred = ruVoices.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Milena') || v.name.includes('Yuri'));
      this.russianVoice = preferred || ruVoices[0];
    }
  }

  public speakMedicationAlert(medicationName: string, dosage: string): Promise<void> {
    const text = `Время принять лекарство. ${medicationName}. ${dosage}.`;
    return this.speak(text);
  }

  public speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('SpeechSynthesis is not supported in this environment');
        resolve();
        return;
      }

      this.stop();

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        // Slower rate for maximum clarity for elderly listeners
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (this.russianVoice) {
          utterance.voice = this.russianVoice;
        } else {
          this.initVoice();
          if (this.russianVoice) {
            utterance.voice = this.russianVoice;
          }
        }

        utterance.onend = () => {
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error or interrupted:', e);
          this.currentUtterance = null;
          resolve();
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis failed to speak:', err);
        resolve();
      }
    });
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new SpeechService();
