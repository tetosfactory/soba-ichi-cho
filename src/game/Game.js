// メインゲーム管理エンジン

import { Customer } from './Customer.js';
import { Bowl, NoodlePot } from './Kitchen.js';
import { sound } from './Sound.js';

export class SobaGame {
  constructor(uiCallbacks) {
    this.ui = uiCallbacks;

    // ゲーム基本状態
    this.difficulty = 'normal'; // 'easy' | 'normal' | 'hard'
    this.score = 0;             // 累計売上（日をまたいで引き継ぐ）
    this.targetScore = 10000;   // 第1ステージ目標（固定1万円）
    this.timeRemaining = 90;    // 1日のタイム（秒）
    this.day = 1;               // 現在の日数（1, 2, 3 ...）
    this.stage = 1;             // 現在のステージ（1 or 2）
    this.level = 1;             // 解放レベル（1 or 2）
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

  // ─── セーブ / ロード ────────────────────────────────────────────

  saveProgress() {
    const saveData = {
      day:        this.day,
      stage:      this.stage,
      level:      this.level,
      difficulty: this.difficulty,
      score:      this.score,
      repScore:   this.repScore,
      stats:      { ...this.stats },
      savedAt:    Date.now()
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

  // ─── ゲーム開始メソッド ─────────────────────────────────────────

  /** 最初から始める（全リセット） */
  startNewGame() {
    this.stage = 1;
    this.day   = 1;
    this.score = 0;
    this.repScore = 100;
    this.level = 1;
    this.level2UnlockedNotified = false;
    this.stats = { servedCount: 0, ginjiDefeated: 0, ginjiEscaped: 0, earnings: 0 };
    this._startSession();
  }

  /** セーブデータから再開 */
  startFromSave() {
    const saveData = this.loadProgress();
    if (!saveData) return this.startNewGame();

    this.difficulty = saveData.difficulty || 'normal';
    this.stage      = saveData.stage || 1;
    this.day        = saveData.day   || 1;
    this.level      = saveData.level || (this.stage >= 2 ? 2 : 1);
    this.score      = saveData.score || 0;
    this.repScore   = saveData.repScore || 100;
    this.stats      = saveData.stats || { servedCount: 0, ginjiDefeated: 0, ginjiEscaped: 0, earnings: 0 };
    this.level2UnlockedNotified = this.level >= 2;
    this._startSession();
  }

  /** 翌日へ進む（スコア・評判・統計を引き継ぐ） */
  startNextDay() {
    this.day++;
    this._startSession();
  }

  /** 第2ステージ開始 */
  startStage2() {
    this.stage = 2;
    this.level = 2;
    this.level2UnlockedNotified = true;
    this._startSession();
  }

  /** 内部: 1日分のセッション開始（タイマーリセット含む） */
  _startSession() {
    if (this.stage === 1) {
      this.targetScore = 10000;
      if      (this.difficulty === 'easy')   this.timeRemaining = 120;
      else if (this.difficulty === 'normal') this.timeRemaining = 90;
      else                                   this.timeRemaining = 75;
    } else {
      this.targetScore = 20000;
      if      (this.difficulty === 'easy')   this.timeRemaining = 150;
      else if (this.difficulty === 'normal') this.timeRemaining = 120;
      else                                   this.timeRemaining = 90;
    }

    this.isPlaying = true;
    this.ginjiSpawnedToday = 0;

    this.customers = [null, null, null];
    this.bowls.forEach(b => b.clear());
    this.pots.nihachi.reset();
    this.pots.juwari.reset();
    this.pots.hegi.reset();

    this.spawnCustomer();
    setTimeout(() => { if (this.isPlaying) this.spawnCustomer(); }, 1500);

    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => this.tick(), 1000);

    if (this.spawnTimer) clearInterval(this.spawnTimer);
    const spawnInterval = this.difficulty === 'easy' ? 6000 : (this.difficulty === 'normal' ? 4500 : 3500);
    this.spawnTimer = setInterval(() => this.checkSpawn(), spawnInterval);

    sound.startBGM();
    this.ui.onGameStateChange(this);
  }

  /** ゲームを中断してタイトルへ */
  quitGame() {
    this._stopTimers();
    sound.stopBGM();
    this.saveProgress();

    this.customers = [null, null, null];
    this.bowls.forEach(b => b.clear());
    this.pots.nihachi.reset();
    this.pots.juwari.reset();
    this.pots.hegi.reset();

    this.ui.onGameStateChange(this);
  }

  // ─── ゲームループ ───────────────────────────────────────────────

  tick() {
    if (!this.isPlaying) return;

    this.timeRemaining--;

    const patienceDecrement = this.difficulty === 'easy' ? 0.1 : (this.difficulty === 'normal' ? 0.5 : 1.0);

    this.customers.forEach((customer, index) => {
      if (!customer) return;

      if (customer.state === 'waiting') {
        const decrement = customer.isTachiguishi ? 1.0 : patienceDecrement;
        customer.patience -= decrement;
        if (customer.patience <= 0) {
          sound.playAngry();
          this.customers[index] = null;
          this.repScore = Math.max(0, this.repScore - 15);
          this.ui.showToast(`${customer.name}は怒って帰ってしまった…`, 'error');
        }
      } else if (customer.state === 'escaping') {
        let escapeStep = this.difficulty === 'easy' ? 5 : (this.difficulty === 'normal' ? 10 : 15);
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
      this.endDay();
    }

    this.ui.onGameStateChange(this);
  }

  checkSpawn() {
    if (!this.isPlaying) return;
    const emptySeatIndex = this.customers.findIndex(c => c === null);
    if (emptySeatIndex !== -1) this.spawnCustomer(emptySeatIndex);
  }

  spawnCustomer(seatIndex = -1) {
    const targetSeat = seatIndex !== -1 ? seatIndex : this.customers.findIndex(c => c === null);
    if (targetSeat === -1) return;

    let isGinji = false;
    let isOgin  = false;

    if (this.ginjiSpawnedToday < 3 && Math.random() < 0.35) {
      this.ginjiSpawnedToday++;
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

  // ─── 調理アクション ─────────────────────────────────────────────

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
    if (!pot || (pot.state !== 'ready' && pot.state !== 'boiling')) return;
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

  // ─── 目標金額チェック ───────────────────────────────────────────

  /**
   * 売上加算のたびに呼び出す。
   * 1万円（第1ステージ）に達したらゲームを即停止。
   * @returns {boolean} 目標達成してゲームを止めたらtrue
   */
  checkScoreGoal() {
    if (!this.isPlaying) return false;

    if (this.stage === 1 && this.score >= 10000) {
      this._triggerGoalReached();
      return true;
    } else if (this.stage === 2 && this.score >= this.targetScore) {
      this._triggerStage2Clear();
      return true;
    }
    return false;
  }

  /** 第1ステージ 目標1万円達成 */
  _triggerGoalReached() {
    this._stopTimers();
    sound.stopBGM();

    // セーブ: stage=2, day=次の日として保存（続けるボタンで第2ステージへ）
    const savedDay = this.day;
    this.stage = 2;
    this.day++;
    this.level = 2;
    this.level2UnlockedNotified = true;
    this.saveProgress();
    // ポップアップ表示用に元に戻す
    this.stage = 1;
    this.day = savedDay;

    if (this.ui.onGoalReached) this.ui.onGoalReached(this);
  }

  /** 第2ステージ クリア */
  _triggerStage2Clear() {
    this._stopTimers();
    sound.stopBGM();
    this.saveProgress();
    if (this.ui.onStage2Clear) this.ui.onStage2Clear(this);
  }

  _stopTimers() {
    this.isPlaying = false;
    if (this.gameTimer)  { clearInterval(this.gameTimer);  this.gameTimer  = null; }
    if (this.spawnTimer) { clearInterval(this.spawnTimer); this.spawnTimer = null; }
  }

  // ─── 客への提供 ─────────────────────────────────────────────────

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
      if (this.checkScoreGoal()) return;
      setTimeout(() => { if (!this.isPlaying) return; this.customers[seatIndex] = null; this.ui.onGameStateChange(this); }, 2500);

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
      if (this.checkScoreGoal()) return;
      setTimeout(() => { if (!this.isPlaying) return; this.customers[seatIndex] = null; this.ui.onGameStateChange(this); }, 2500);

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
        const perfectBonus = bowl.isPerfectCooked ? 150 : 0;
        const totalGet = customer.price + patienceTip + perfectBonus;
        this.score += totalGet;
        this.stats.earnings += totalGet;
        this.stats.servedCount++;
        if (perfectBonus > 0) {
          this.ui.showToast(`🌟 完璧な茹で加減！ +${totalGet}円（チップ+${patienceTip}円 ＋ 茹でボーナス+${perfectBonus}円）`, 'success');
        } else {
          this.ui.showToast(`提供成功！ +${totalGet}円（チップ+${patienceTip}円）`, 'success');
        }
        bowl.clear();
        this.customers[seatIndex] = null;
        if (this.checkScoreGoal()) return;
      }
    } else {
      sound.playAngry();
      const cleanToppings = bowl.toppings.filter(t => t !== 'spicy_chili');
      let mismatch = '';
      const dashiNames    = { katsuo: 'かつお出汁', niboshi: '煮干し出汁', kombu: 'こんぶ出汁' };
      const noodleNames   = { nihachi: '二八そば', juwari: '十割そば', hegi: 'へぎ蕎麦' };
      const toppingNamesMap = { negi: 'ネギ', raw_egg: '生卵', korokke: 'コロッケ' };
      if (bowl.dashi !== customer.order.dashi) {
        mismatch = `出汁が違う！（${dashiNames[bowl.dashi] || bowl.dashi}→${dashiNames[customer.order.dashi] || customer.order.dashi}が必要）`;
      } else if (bowl.noodle !== customer.order.noodle) {
        mismatch = `麺が違う！（${noodleNames[customer.order.noodle] || customer.order.noodle}が必要）`;
      } else if (cleanToppings.length < customer.order.toppings.length) {
        const missing = customer.order.toppings.filter(t => !cleanToppings.includes(t));
        mismatch = `${missing.map(t => toppingNamesMap[t] || t).join('と')}が足りない！`;
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
      if (this.checkScoreGoal()) return;
      setTimeout(() => {
        if (!this.isPlaying) return;
        this.customers[seatIndex] = null;
        this.ui.onGameStateChange(this);
      }, 1500);
    }

    this.ui.onGameStateChange(this);
  }

  // ─── その日の営業終了（タイム切れ or 評判0） ────────────────────

  /**
   * タイム切れ or 評判0 → その日の営業終了
   * 売上が1円でもあればその日はクリア → 翌日へ続けられる
   * 売上0 or 評判0 → 失敗
   */
  endDay() {
    this._stopTimers();
    sound.stopBGM();

    const isSuccess = this.score > 0 && this.repScore > 0;

    if (isSuccess) {
      // 翌日の状態としてオートセーブ
      this.day++;
      this.saveProgress();
      this.day--; // ポップアップ表示用に一時的に戻す
    }

    this.ui.onGameOver(isSuccess, this);
  }
}