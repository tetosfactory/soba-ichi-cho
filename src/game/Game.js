// メインゲーム管理エンジン

import { Customer } from './Customer.js';
import { Bowl, NoodlePot } from './Kitchen.js';
import { sound } from './Sound.js';

export class SobaGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks;

    // ゲーム基本状態
    this.difficulty = 'normal'; // 'easy' | 'normal' | 'hard'
    this.score = 0;
    this.targetScore = 1500;
    this.timeRemaining = 90;
    this.day = 1;
    this.level = 1; // 1 | 2
    this.isPlaying = false;
    this.repScore = 100;
    this.level2UnlockedNotified = false;

    // 戦績
    this.stats = {
      servedCount: 0,
      ginjiDefeated: 0,
      ginjiEscaped: 0,
      earnings: 0
    };

    // カウンター席（最大3人）
    this.maxSeats = 3;
    this.customers = [null, null, null];

    // 盛り付けどんぶり
    this.bowls = [new Bowl(0), new Bowl(1), new Bowl(2)];
    this.selectedBowlIndex = 0;

    // 茹で釜 (二八 / 十割 / へぎ)
    this.pots = {
      nihachi: new NoodlePot('nihachi', 'nihachi'),
      juwari:  new NoodlePot('juwari', 'juwari'),
      hegi:    new NoodlePot('hegi', 'hegi')
    };

    // タイマーID
    this.gameTimer = null;
    this.spawnTimer = null;
    this.ginjiSpawnedToday = 0;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  saveProgress(nextDay = null) {
    const saveData = {
      day: nextDay !== null ? nextDay : this.day,
      level: this.level,
      difficulty: this.difficulty,
      score: this.score,
      repScore: this.repScore,
      stats: { ...this.stats },
      savedAt: Date.now()
    };
    try {
      localStorage.setItem('soba_game_autosave', JSON.stringify(saveData));
    } catch (e) {
      console.warn('オートセーブ失敗:', e);
    }
  }

  loadProgress() {
    try {
      const data = localStorage.getItem('soba_game_autosave');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  hasSaveData() {
    return !!this.loadProgress();
  }

  clearSaveData() {
    try {
      localStorage.removeItem('soba_game_autosave');
    } catch (e) {}
  }

  startFromSave() {
    const saveData = this.loadProgress();
    if (!saveData) return this.startNewGame(1);

    this.difficulty = saveData.difficulty || 'normal';
    this.level = saveData.level || 1;
    this.score = saveData.score || 0;
    this.repScore = saveData.repScore || 100;
    this.stats = saveData.stats || { servedCount: 0, ginjiDefeated: 0, ginjiEscaped: 0, earnings: 0 };
    this.level2UnlockedNotified = this.level >= 2;

    this.startNewGame(saveData.day || 1, true);
  }

  startNewGame(day = 1, isContinue = false) {
    this.day = day;
    if (!isContinue) {
      this.score = 0;
      this.level = 1;
      this.level2UnlockedNotified = false;
      this.repScore = 100;
      this.stats = {
        servedCount: 0,
        ginjiDefeated: 0,
        ginjiEscaped: 0,
        earnings: 0
      };
    }

    // 難易度に応じた設定調整
    if (this.difficulty === 'easy') {
      this.targetScore = this.score + (1000 + day * 400);
      this.timeRemaining = 120;
    } else if (this.difficulty === 'normal') {
      this.targetScore = this.score + (1500 + day * 600);
      this.timeRemaining = 90;
    } else {
      // hard
      this.targetScore = this.score + (2000 + day * 800);
      this.timeRemaining = 75;
    }

    this.isPlaying = true;
    this.ginjiSpawnedToday = 0;

    this.customers = [null, null, null];
    this.bowls.forEach(b => b.clear());

    // 茹で釜をリセット
    this.pots.nihachi.reset();
    this.pots.juwari.reset();
    this.pots.hegi.reset();

    // 最初の客をスポーン
    this.spawnCustomer();
    setTimeout(() => this.spawnCustomer(), 1500);

    // ループスタート
    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => this.tick(), 1000);

    if (this.spawnTimer) clearInterval(this.spawnTimer);
    const spawnInterval = this.difficulty === 'easy' ? 6000 : (this.difficulty === 'normal' ? 4500 : 3500);
    this.spawnTimer = setInterval(() => this.checkSpawn(), spawnInterval);

    sound.startBGM();
    this.ui.onGameStateChange(this);
  }

  quitGame() {
    this.isPlaying = false;
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
    sound.stopBGM();
    this.saveProgress(this.day);

    // 客・丼・釜の状態を完全クリア
    this.customers = [null, null, null];
    this.bowls.forEach(b => b.clear());
    this.pots.nihachi.reset();
    this.pots.juwari.reset();
    this.pots.hegi.reset();

    this.ui.onGameStateChange(this);
  }

  tick() {
    if (!this.isPlaying) return;

    this.timeRemaining--;

    // 難易度別の忍耐度減算量（easy=0.1、normal=0.5、hard=1.0）
    const patienceDecrement = this.difficulty === 'easy' ? 0.1 : (this.difficulty === 'normal' ? 0.5 : 1.0);

    // 客の忍耐度を減らす＆食い逃げ状態処理
    this.customers.forEach((customer, index) => {
      if (!customer) return;

      if (customer.state === 'waiting') {
        // 立食い師の忍耐度は難易度に関わらず固定値で減算
        const decrement = customer.isTachiguishi ? 1.0 : patienceDecrement;
        customer.patience -= decrement;
        if (customer.patience <= 0) {
          sound.playAngry();
          this.customers[index] = null;
          this.repScore = Math.max(0, this.repScore - 15);
          this.ui.showToast(`${customer.name}は怒って帰ってしまった…`, 'error');
        }
      } else if (customer.state === 'escaping') {
        // 難易度による食い逃げスピード調整
        let escapeStep = 15;
        if (this.difficulty === 'easy') escapeStep = 5;
        else if (this.difficulty === 'normal') escapeStep = 10;

        customer.escapeProgress += escapeStep;
        if (customer.escapeProgress >= 100) {
          customer.state = 'left';
          this.customers[index] = null;
          this.stats.ginjiEscaped++;
          this.repScore = Math.max(0, this.repScore - 30);
          sound.playAngry();
          this.ui.showToast(`『${customer.name}』に食い逃げされた！代金-${customer.price}円＆評判大ダウン！`, 'danger');
        }
      }
    });

    if (this.timeRemaining <= 0 || this.repScore <= 0) {
      this.endGame();
    }

    this.ui.onGameStateChange(this);
  }

  checkSpawn() {
    if (!this.isPlaying) return;
    const emptySeatIndex = this.customers.findIndex(c => c === null);
    if (emptySeatIndex !== -1) {
      this.spawnCustomer(emptySeatIndex);
    }
  }

  spawnCustomer(seatIndex = -1) {
    const targetSeat = seatIndex !== -1 ? seatIndex : this.customers.findIndex(c => c === null);
    if (targetSeat === -1) return;

    let isGinji = false;
    let isOgin  = false;

    // スポーン処理
    if (this.ginjiSpawnedToday < 3 && Math.random() < 0.35) {
      this.ginjiSpawnedToday++;
      
      // レベル2なら「コロッケのお銀」も現れる可能性
      if (this.level >= 2 && Math.random() < 0.5) {
        isOgin = true;
        sound.playGinjiAlert();
        this.ui.showCutin('立食い師『コロッケのお銀』が現れた！無銭飲食に気をつけろ！');
      } else {
        isGinji = true;
        sound.playGinjiAlert();
        this.ui.showCutin('立食い師『月見の銀二』が現れた！無銭飲食に気をつけろ！');
      }
    }

    const newCustomer = new Customer(Date.now(), isGinji, isOgin, this.difficulty, this.level);
    this.customers[targetSeat] = newCustomer;
    this.ui.onGameStateChange(this);
  }

  selectBowl(index) {
    this.selectedBowlIndex = index;
    this.ui.onGameStateChange(this);
  }

  addDashi(dashiType) {
    if (!this.isPlaying) return;
    const currentBowl = this.bowls[this.selectedBowlIndex];
    if (currentBowl.dashi) {
      this.ui.showToast('この丼にはすでに出汁が入っています！別の丼を選ぶか、捨ててやり直してください', 'warning');
      return;
    }
    currentBowl.dashi = dashiType;
    sound.playPour();
    this.ui.onGameStateChange(this);
  }

  boilNoodle(noodleType) {
    const pot = this.pots[noodleType];
    if (!pot || pot.state !== 'idle') return;

    sound.playNoodleBoil();
    pot.startBoiling(
      () => this.ui.onGameStateChange(this),
      () => this.ui.onGameStateChange(this)
    );
  }

  addNoodleToBowl(noodleType) {
    if (!this.isPlaying) return;
    const pot = this.pots[noodleType];
    const currentBowl = this.bowls[this.selectedBowlIndex];

    if (!pot || (pot.state !== 'ready' && pot.state !== 'boiling')) {
      return;
    }
    if (currentBowl.noodle) {
      this.ui.showToast('この丼にはすでに麺が入っています！別の丼を選んでください', 'warning');
      return;
    }

    const wasPerfect = pot.isPerfect;
    currentBowl.noodle = noodleType;
    currentBowl.isPerfectCooked = wasPerfect;
    pot.reset();

    if (wasPerfect) {
      sound.playServeSuccess();
      this.ui.showToast('🌟 ジャスト湯切り！完璧な茹で加減！', 'success');
    } else {
      sound.playTopping();
    }
    this.ui.onGameStateChange(this);
  }

  addTopping(toppingType) {
    if (!this.isPlaying) return;
    const currentBowl = this.bowls[this.selectedBowlIndex];
    if (currentBowl.toppings.includes(toppingType)) return;

    currentBowl.toppings.push(toppingType);
    if (toppingType === 'spicy_chili') {
      sound.playChiliSpicy();
    } else {
      sound.playTopping();
    }
    this.ui.onGameStateChange(this);
  }

  discardBowl() {
    if (!this.isPlaying) return;
    const currentBowl = this.bowls[this.selectedBowlIndex];
    if (!currentBowl.dashi && !currentBowl.noodle && currentBowl.toppings.length === 0) return;

    currentBowl.clear();
    sound.playTrash();
    this.ui.showToast('どんぶりの蕎麦を破棄しました（-50円）', 'info');
    this.score = Math.max(0, this.score - 50);
    this.ui.onGameStateChange(this);
  }

  checkLevelUp() {
    // 累計売上 10,000 円以上でレベル2へ昇格！
    if (this.level < 2 && this.score >= 10000) {
      this.level = 2;
      if (!this.level2UnlockedNotified) {
        this.level2UnlockedNotified = true;
        sound.playServeSuccess();
        this.ui.showCutin('🎉 レベル2達成！こんぶ出汁・へぎ蕎麦・コロッケが解放されました！');
        this.ui.showToast('🎉 レベル2到達！新メニュー＆『コロッケのお銀』登場！', 'success');
      }
    }
  }

  serveToCustomer(seatIndex) {
    const customer = this.customers[seatIndex];
    const bowl = this.bowls[this.selectedBowlIndex];

    if (!customer || customer.state !== 'waiting') return;

    if (!bowl.isReady()) {
      this.ui.showToast('出汁と麺を入れてから提供してください！', 'warning');
      return;
    }

    const result = customer.checkOrder(bowl);

    if (result === 'spicy_defeat') {
      sound.playChiliSpicy();
      setTimeout(() => sound.playGinjiDefeat(), 300);

      const reward = customer.price + 300;
      this.score += reward;
      this.stats.earnings += reward;
      this.stats.ginjiDefeated++;
      this.stats.servedCount++;

      customer.state = 'defeated';
      this.ui.showSpecialEffect('chili', `「グはッ！？この激辛七味は…！降参だぁぁ！」`);
      this.ui.showToast(`${customer.name}撃退！ 激辛七味で反撃成功！（+${reward}円獲得）`, 'success');
      
      bowl.clear();
      this.checkLevelUp();
      setTimeout(() => {
        this.customers[seatIndex] = null;
        this.ui.onGameStateChange(this);
      }, 2500);

    } else if (result === 'perfect_defeat') {
      sound.playServeSuccess();
      setTimeout(() => sound.playGinjiDefeat(), 200);

      const reward = customer.price + 200;
      this.score += reward;
      this.stats.earnings += reward;
      this.stats.ginjiDefeated++;
      this.stats.servedCount++;

      this.ui.showSpecialEffect('perfect', `「うーむ…この見事な茹で加減…完敗だ！」`);
      this.ui.showToast(`至高の蕎麦で${customer.name}を心服させた！（+${reward}円獲得）`, 'success');

      bowl.clear();
      this.checkLevelUp();
      setTimeout(() => {
        this.customers[seatIndex] = null;
        this.ui.onGameStateChange(this);
      }, 2500);

    } else if (result === true) {
      if (customer.isTachiguishi) {
        customer.state = 'escaping';
        customer.escapeProgress = 0;
        sound.playGinjiAlert();
        this.ui.showToast(`『${customer.name}』が食い逃げを開始した！「お会計」連打で捕まえろ！`, 'warning');
        bowl.clear();
      } else {
        sound.playServeSuccess();
        sound.playCoin();

        const patienceTip = Math.floor((customer.patience / customer.maxPatience) * 100);
        // ジャスト茹でボーナス（150円）
        const perfectBonus = bowl.isPerfectCooked ? 150 : 0;
        const totalGet = customer.price + patienceTip + perfectBonus;

        this.score += totalGet;
        this.stats.earnings += totalGet;
        this.stats.servedCount++;

        this.checkLevelUp();

        if (perfectBonus > 0) {
          this.ui.showToast(
            `🌟 完璧な茹で加減！ +${totalGet}円（チップ+${patienceTip}円 ＋ 茹でボーナス+${perfectBonus}円）`,
            'success'
          );
        } else {
          this.ui.showToast(`提供成功！ +${totalGet}円（チップ+${patienceTip}円）`, 'success');
        }
        bowl.clear();
        this.customers[seatIndex] = null;
      }
    } else {
      // 不一致の詳細を特定してメッセージ表示
      sound.playAngry();
      const cleanToppings = bowl.toppings.filter(t => t !== 'spicy_chili');
      let mismatch = '';
      
      const dashiNames = { katsuo: 'かつお出汁', niboshi: '煮干し出汁', kombu: 'こんぶ出汁' };
      const noodleNames = { nihachi: '二八そば', juwari: '十割そば', hegi: 'へぎ蕎麦' };
      const toppingNamesMap = { negi: 'ネギ', raw_egg: '生卵', korokke: 'コロッケ' };

      if (bowl.dashi !== customer.order.dashi) {
        const wantedDashi = dashiNames[bowl.dashi] || bowl.dashi;
        const neededDashi = dashiNames[customer.order.dashi] || customer.order.dashi;
        mismatch = `出汁が違う！（${wantedDashi}→${neededDashi}が必要）`;
      } else if (bowl.noodle !== customer.order.noodle) {
        const neededNoodle = noodleNames[customer.order.noodle] || customer.order.noodle;
        mismatch = `麺が違う！（${neededNoodle}が必要）`;
      } else if (cleanToppings.length < customer.order.toppings.length) {
        const missing = customer.order.toppings.filter(t => !cleanToppings.includes(t));
        const missingNames = missing.map(t => toppingNamesMap[t] || t).join('と');
        mismatch = `${missingNames}が足りない！`;
      } else if (cleanToppings.length > customer.order.toppings.length) {
        mismatch = 'トッピングが多すぎる！';
      } else {
        mismatch = 'トッピングが違う！';
      }
      this.ui.showToast(`注文と違う！ ${mismatch}`, 'error');
    }

    this.ui.onGameStateChange(this);
  }

  attemptCatchGinji(seatIndex) {
    const customer = this.customers[seatIndex];
    if (!customer || customer.state !== 'escaping') return;

    customer.catchClicks++;
    sound.playNoodleBoil();

    if (customer.catchClicks >= customer.requiredCatchClicks) {
      sound.playServeSuccess();
      sound.playCoin();

      const reward = customer.price;
      this.score += reward;
      this.stats.earnings += reward;
      this.stats.ginjiDefeated++;

      customer.state = 'defeated';
      this.ui.showToast(`間一髪！${customer.name}を捕まえて代金${reward}円を回収した！`, 'success');

      this.checkLevelUp();

      setTimeout(() => {
        this.customers[seatIndex] = null;
        this.ui.onGameStateChange(this);
      }, 1500);
    }

    this.ui.onGameStateChange(this);
  }

  endGame() {
    this.isPlaying = false;
    if (this.gameTimer) clearInterval(this.gameTimer);
    if (this.spawnTimer) clearInterval(this.spawnTimer);
    sound.stopBGM();

    const isSuccess = this.score >= this.targetScore && this.repScore > 0;
    if (isSuccess) {
      this.saveProgress(this.day + 1);
    }
    this.ui.onGameOver(isSuccess, this);
  }
}
