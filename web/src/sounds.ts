// Звуковая система Endless Pixel Blackjack
// By Huckof1

// Бесплатные 8-bit звуки (можно заменить на свои)
// Источники: Mixkit, Uppbeat, itch.io

const SOUND_URLS = {
  // Карточные звуки
  deal: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3", // card flip
  chip: "https://assets.mixkit.co/active_storage/sfx/1999/1999-preview.mp3", // chip sound

  // Результаты
  win: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3", // success
  lose: "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3", // fail
  blackjack: "https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3", // jackpot

  // UI
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", // click

  // Фоновая музыка (локальный файл)
  bgMusic: "/1.mp3",
  gameMusic: "/2.mp3",
};

// Типы звуков
type SoundType = keyof typeof SOUND_URLS;

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  private duckedMusicVolume: number = 0.15;
  private duckTimeout: number | null = null;
  private isInitialized: boolean = false;
  private fadeTimer: number | null = null;
  private musicA: HTMLAudioElement | null = null;
  private musicB: HTMLAudioElement | null = null;
  private idleA: HTMLAudioElement | null = null;
  private idleB: HTMLAudioElement | null = null;
  private gameA: HTMLAudioElement | null = null;
  private gameB: HTMLAudioElement | null = null;
  private musicActive: "A" | "B" | null = null;
  private musicCrossfade: number | null = null;
  private isCrossfading: boolean = false;
  private readonly loopFadeMs: number = 900;

  constructor() {
    // Загрузка состояния из localStorage
    const savedMuted = localStorage.getItem("soundMuted");
    this.isMuted = savedMuted === "true";
    const savedSfx = localStorage.getItem("soundVolumeSfx");
    const savedMusic = localStorage.getItem("soundVolumeMusic");
    if (savedSfx) this.sfxVolume = Math.max(0, Math.min(1, Number(savedSfx)));
    if (savedMusic) this.musicVolume = Math.max(0, Math.min(1, Number(savedMusic)));
    this.duckedMusicVolume = Math.max(0, Math.min(1, this.musicVolume * 0.5));
  }

  // Инициализация звуков (вызывается при первом взаимодействии)
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Создаём аудио элементы для каждого звука
      for (const [key, url] of Object.entries(SOUND_URLS)) {
        if (key === "bgMusic") {
          const audioA = new Audio();
          audioA.preload = "auto";
          audioA.src = url;
          audioA.loop = false;
          audioA.volume = 0;
          const audioB = new Audio();
          audioB.preload = "auto";
          audioB.src = url;
          audioB.loop = false;
          audioB.volume = 0;
          this.idleA = audioA;
          this.idleB = audioB;
          this.musicA = audioA;
          this.musicB = audioB;
        } else if (key === "gameMusic") {
          const audioA = new Audio();
          audioA.preload = "auto";
          audioA.src = url;
          audioA.loop = false;
          audioA.volume = 0;
          const audioB = new Audio();
          audioB.preload = "auto";
          audioB.src = url;
          audioB.loop = false;
          audioB.volume = 0;
          this.gameA = audioA;
          this.gameB = audioB;
        } else {
          const audio = new Audio();
          audio.preload = "auto";
          audio.src = url;
          audio.volume = this.sfxVolume;
          this.sounds.set(key as SoundType, audio);
        }
      }

      this.isInitialized = true;
      console.log("Sound system initialized");
    } catch (error) {
      console.warn("Failed to initialize sounds:", error);
    }
  }

  // Воспроизвести звук
  play(type: SoundType): void {
    if (this.isMuted || !this.isInitialized) return;

    if (type === "bgMusic") {
      this.startMusic();
      return;
    }

    const sound = this.sounds.get(type);
    if (!sound) return;

    try {
      // Для SFX: сбрасываем и воспроизводим
      if (type !== "bgMusic") {
        this.duckMusic();
        sound.currentTime = 0;
      }
      sound.play().catch(() => {
        // Игнорируем ошибки autoplay
      });
    } catch (error) {
      console.warn(`Failed to play sound: ${type}`);
    }
  }

  // Остановить звук
  stop(type: SoundType): void {
    const sound = this.sounds.get(type);
    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
  }

  // Включить/выключить звук
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem("soundMuted", String(this.isMuted));

    // Останавливаем музыку при выключении
    if (this.isMuted) {
      this.stop("bgMusic");
    }

    return this.isMuted;
  }

  // Проверка статуса
  getMuted(): boolean {
    return this.isMuted;
  }

  // Запуск фоновой музыки
  startMusic(): void {
    if (!this.isMuted) {
      const music = this.musicActive === "A" ? this.musicA : this.musicActive === "B" ? this.musicB : this.musicA;
      if (!music) return;
      this.musicActive = this.musicActive || "A";
      music.currentTime = 0;
      music.volume = 0;
      music.play().catch(() => {
        // ignore autoplay errors
      });
      this.attachLoopHandler(music);
      if (this.fadeTimer) {
        window.clearInterval(this.fadeTimer);
      }
      const target = this.musicVolume;
      const step = Math.max(0.01, target / 30);
      this.fadeTimer = window.setInterval(() => {
        if (music.volume >= target - 0.001) {
          music.volume = target;
          if (this.fadeTimer) window.clearInterval(this.fadeTimer);
          this.fadeTimer = null;
          return;
        }
        music.volume = Math.min(target, music.volume + step);
      }, 100);
    }
  }

  private setMusicPair(mode: "idle" | "game"): void {
    if (mode === "game") {
      this.musicA = this.gameA;
      this.musicB = this.gameB;
    } else {
      this.musicA = this.idleA;
      this.musicB = this.idleB;
    }
    this.musicActive = null;
  }

  startIdleMusic(): void {
    this.stopMusic();
    this.setMusicPair("idle");
    this.startMusic();
  }

  startGameMusic(): void {
    this.stopMusic();
    this.setMusicPair("game");
    this.startMusic();
  }

  // Остановка фоновой музыки
  stopMusic(): void {
    if (this.fadeTimer) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.musicCrossfade) {
      window.clearInterval(this.musicCrossfade);
      this.musicCrossfade = null;
    }
    this.isCrossfading = false;
    if (this.musicA) {
      this.musicA.pause();
      this.musicA.currentTime = 0;
    }
    if (this.musicB) {
      this.musicB.pause();
      this.musicB.currentTime = 0;
    }
  }

  // Установка громкости
  setVolume(sfx: number, music: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.duckedMusicVolume = Math.max(0, Math.min(1, this.musicVolume * 0.5));
    localStorage.setItem("soundVolumeSfx", String(this.sfxVolume));
    localStorage.setItem("soundVolumeMusic", String(this.musicVolume));

    // Обновляем громкость существующих звуков
    this.sounds.forEach((audio, key) => {
      audio.volume = this.sfxVolume;
    });
    if (this.musicA) this.musicA.volume = Math.min(this.musicA.volume, this.musicVolume);
    if (this.musicB) this.musicB.volume = Math.min(this.musicB.volume, this.musicVolume);
  }

  getVolume(): { sfx: number; music: number } {
    return { sfx: this.sfxVolume, music: this.musicVolume };
  }

  // Временное приглушение музыки при SFX
  private duckMusic(): void {
    const music = this.musicActive === "A" ? this.musicA : this.musicB;
    if (!music) return;

    music.volume = this.duckedMusicVolume;
    if (this.duckTimeout) {
      window.clearTimeout(this.duckTimeout);
    }
    this.duckTimeout = window.setTimeout(() => {
      music.volume = this.musicVolume;
    }, 500);
  }

  private attachLoopHandler(music: HTMLAudioElement): void {
    music.ontimeupdate = () => {
      if (!music.duration || this.isCrossfading) return;
      const remaining = music.duration - music.currentTime;
      if (remaining <= this.loopFadeMs / 1000) {
        this.crossfadeToNext();
      }
    };
  }

  private crossfadeToNext(): void {
    if (this.isCrossfading) return;
    const from = this.musicActive === "A" ? this.musicA : this.musicB;
    const to = this.musicActive === "A" ? this.musicB : this.musicA;
    if (!from || !to) return;

    this.isCrossfading = true;
    to.currentTime = 0;
    to.volume = 0;
    to.play().catch(() => {
      // ignore autoplay errors
    });
    this.attachLoopHandler(to);

    const steps = Math.max(1, Math.floor(this.loopFadeMs / 50));
    let i = 0;
    if (this.musicCrossfade) window.clearInterval(this.musicCrossfade);
    this.musicCrossfade = window.setInterval(() => {
      i += 1;
      const t = i / steps;
      const target = this.musicVolume;
      from.volume = Math.max(0, target * (1 - t));
      to.volume = Math.min(target, target * t);
      if (i >= steps) {
        if (this.musicCrossfade) window.clearInterval(this.musicCrossfade);
        this.musicCrossfade = null;
        from.pause();
        from.currentTime = 0;
        this.musicActive = this.musicActive === "A" ? "B" : "A";
        this.isCrossfading = false;
      }
    }, 50);
  }
}

// Экспорт singleton
export const soundManager = new SoundManager();

// Хелперы для удобного использования
export const playSound = (type: SoundType) => soundManager.play(type);
export const stopSound = (type: SoundType) => soundManager.stop(type);
