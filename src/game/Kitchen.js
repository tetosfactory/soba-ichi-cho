// 厨房・盛り付けステーション＆茹で釜管理

export class Bowl {
  constructor(id) {
    this.id = id;
    this.dashi = null; // 'katsuo' | 'niboshi'
    this.noodle = null; // 'nihachi' | 'juwari'
    this.isPerfectCooked = false; // パーフェクトな茹で加減
    this.toppings = []; // ['negi', 'raw_egg', 'spicy_chili']
  }

  isReady() {
    return this.dashi !== null && this.noodle !== null;
  }

  clear() {
    this.dashi = null;
    this.noodle = null;
    this.isPerfectCooked = false;
    this.toppings = [];
  }
}

export class NoodlePot {
  constructor(id, type) {
    this.id = id;
    this.type = type; // 'nihachi' or 'juwari'
    this.state = 'idle'; // idle, boiling, ready, burnt
    this.progress = 0; // 0 to 100
    this.targetStart = 70; // 70%〜90%がジャスト茹で加減
    this.targetEnd = 90;
    this.isPerfect = false;
    this.timer = null;
  }

  startBoiling(onUpdate, onComplete) {
    if (this.state !== 'idle') return;
    this.state = 'boiling';
    this.progress = 0;
    this.isPerfect = false;

    const interval = 50; // ms
    const totalDuration = 3500; // 3.5秒で茹であがる

    this.timer = setInterval(() => {
      this.progress += (interval / totalDuration) * 100;
      
      if (this.progress >= this.targetStart && this.progress <= this.targetEnd) {
        this.isPerfect = true;
      } else {
        this.isPerfect = false;
      }

      if (this.progress >= 100) {
        this.state = 'ready';
        clearInterval(this.timer);
        this.timer = null;
      }
      onUpdate(this);
    }, interval);
  }

  reset() {
    if (this.timer) clearInterval(this.timer);
    this.state = 'idle';
    this.progress = 0;
    this.isPerfect = false;
  }
}
