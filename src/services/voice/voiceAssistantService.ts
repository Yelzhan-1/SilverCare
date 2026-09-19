import { medicationRepository } from '../../repositories/medicationRepository';
import { scheduleRepository } from '../../repositories/scheduleRepository';
import { speechService } from '../speechService';

export interface AssistantAnswer {
  query: string;
  response: string;
  actionType?: 'medication' | 'schedule' | 'memory' | 'emergency';
}

export class VoiceAssistantService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.lang = 'ru-RU';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  async startListening(
    onResult: (text: string) => void,
    onError: (err: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Голосовой ввод не поддерживается в этом браузере. Используйте быстрые кнопки вопросов.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      this.isListening = false;
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (e: any) => {
      this.isListening = false;
      onError('Не удалось распознать голос. Пожалуйста, повторите ещё раз.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
    } catch {
      this.isListening = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async answerQuestion(rawQuery: string): Promise<AssistantAnswer> {
    const q = rawQuery.toLowerCase().trim();

    // 1. Next medication query
    if (q.includes('лекарств') || q.includes('прием') || q.includes('таблетк') || q.includes('когда')) {
      const schedules = await medicationRepository.getSchedules();
      const meds = await medicationRepository.getMedications();
      const nextSchedule = schedules.find((s) => s.enabled && s.time >= '18:00') || schedules[0];
      const med = meds.find((m) => m.id === nextSchedule.medicationId);

      const resp = `Следующий приём запланирован на ${nextSchedule.time}. Это ${med?.name || 'Аспирин Кардио'}, ${med?.dosage || '1 таблетка'}.`;
      await speechService.speak(resp);
      return {
        query: rawQuery,
        response: resp,
        actionType: 'medication',
      };
    }

    // 2. Daily schedule query
    if (q.includes('сделать') || q.includes('план') || q.includes('день') || q.includes('расписани')) {
      const dayList = await scheduleRepository.getSchedule();
      const remaining = dayList.filter((item) => !item.completed);

      const resp = `На сегодня осталось дел: ${remaining.length}. В 18:00 приём Аспирина, в 21:00 отдых и вечерняя запись в дневник.`;
      await speechService.speak(resp);
      return {
        query: rawQuery,
        response: resp,
        actionType: 'schedule',
      };
    }

    // 3. Memory workout query
    if (q.includes('памят') || q.includes('упражнен') || q.includes('тренировк') || q.includes('мозг')) {
      const resp = 'На сегодня запланирована 10-минутная разминка памяти: запоминание картинок, тест на внимание и флэш-карточки. Ваш средний результат отличный — 8 из 10!';
      await speechService.speak(resp);
      return {
        query: rawQuery,
        response: resp,
        actionType: 'memory',
      };
    }

    // 4. Family / Son Alexey query
    if (q.includes('сын') || q.includes('алексе') || q.includes('близк') || q.includes('семь')) {
      const resp = 'Ваш сын Алексей на связи. Его телефон сохранён в контактах. Он передавал пожелания хорошего дня!';
      await speechService.speak(resp);
      return {
        query: rawQuery,
        response: resp,
        actionType: 'emergency',
      };
    }

    // Default friendly response
    const defaultResp = 'Я слышу вас, Анна Павловна! Вы чувствуете себя хорошо? Все лекарства под контролем, расписание в порядке.';
    await speechService.speak(defaultResp);
    return {
      query: rawQuery,
      response: defaultResp,
    };
  }
}

export const voiceAssistantService = new VoiceAssistantService();
