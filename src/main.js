// メインエントリーポイント＆UIバインディング

import confetti from 'canvas-confetti';
import { SobaGame } from './game/Game.js';
import { DASHI_TYPES, NOODLE_TYPES, TOPPING_TYPES } from './game/Customer.js';
import { sound } from './game/Sound.js';

document.addEventListener('DOMContentLoaded', () => {
  // UI要素の取得
  const statMode = document.getElementById('stat-mode');
  const statLevel = document.getElementById('stat-level');
  const statDay = document.getElementById('stat-day');
  const statTime = document.getElementById('stat-time');
  const statScore = document.getElementById('stat-score');
  const statRep = document.getElementById('stat-rep');
  const repBarFill = document.getElementById('rep-bar-fill');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const btnQuitGame = document.getElementById('btn-quit-game');

  const seatsContainer = document.getElementById('seats-container');
  const bowlsContainer = document.getElementById('bowls-container');
  const toastContainer = document.getElementById('toast-container');

  const cutinOverlay = document.getElementById('cutin-overlay');
  const cutinTitle = document.getElementById('cutin-title');
  const cutinAvatar = document.getElementById('cutin-avatar');
  const cutinName = document.getElementById('cutin-name');
  const cutinText = document.getElementById('cutin-text');
  
  const specialOverlay = document.getElementById('special-overlay');
  const specialIcon = document.getElementById('special-icon');
  const specialMsg = document.getElementById('special-msg');

  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnContinueGame = document.getElementById('btn-continue-game');

  // 茹で釜ボタン
  const btnBoilNihachi = document.getElementById('btn-boil-nihachi');
  const btnGetNihachi  = document.getElementById('btn-get-nihachi');
  const potNihachiFill = document.getElementById('pot-nihachi-fill');

  const btnBoilJuwari  = document.getElementById('btn-boil-juwari');
  const btnGetJuwari   = document.getElementById('btn-get-juwari');
  const potJuwariFill  = document.getElementById('pot-juwari-fill');

  const potHegiEl      = document.getElementById('pot-hegi');
  const btnBoilHegi    = document.getElementById('btn-boil-hegi');
  const btnGetHegi     = document.getElementById('btn-get-hegi');
  const potHegiFill    = document.getElementById('pot-hegi-fill');

  // 食材ボタン
  const btnDashiKatsuo  = document.getElementById('btn-dashi-katsuo');
  const btnDashiNiboshi = document.getElementById('btn-dashi-niboshi');
  const btnDashiKombu   = document.getElementById('btn-dashi-kombu');
  const btnTopNegi      = document.getElementById('btn-top-negi');
  const btnTopEgg       = document.getElementById('btn-top-egg');
  const btnTopKorokke   = document.getElementById('btn-top-korokke');
  const btnTopChili     = document.getElementById('btn-top-chili');
  const btnTrash        = document.getElementById('btn-trash');

  const menuTagKorokke  = document.getElementById('menu-tag-korokke');

  // 初期スロットDOMの固定生成（チラつき防止）
  for (let i = 0; i < 3; i++) {
    const slotEl = document.createElement('div');
    slotEl.className = 'seat-slot';
    slotEl.id = `seat-slot-${i}`;
    slotEl.innerHTML = `<div class="empty-seat-msg" style="color: #666; font-size: 0.85rem;">空席</div>`;
    seatsContainer.appendChild(slotEl);
  }

  // 難易度選択イベント
  let selectedDifficulty = 'easy';
  const diffButtons = document.querySelectorAll('.btn-diff');
  diffButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      diffButtons.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      selectedDifficulty = targetBtn.getAttribute('data-diff');
    });
  });

  // UIコールバック定義
  const uiCallbacks = {
    onGameStateChange: (game) => render(game),
    showToast: (msg, type = 'info') => showToastMessage(msg, type),
    showCutin: (msg) => showCutinNotice(msg),
    showSpecialEffect: (type, msg) => showSpecial(type, msg),
    onGameOver: (isSuccess, game) => handleGameOver(isSuccess, game),
    onGoalReached: (game) => handleGoalReached(game),
    onStage2Clear: (game) => handleStage2Clear(game)
  };

  const game = new SobaGame(uiCallbacks);
  window.game = game;

  let currentModalMode = 'title'; // 'title' | 'day_clear' | 'goal_reached' | 'stage2_clear' | 'game_over'

  // オートセーブデータのUI更新
  function updateSaveDataUI() {
    const saveData = game.loadProgress();
    if (saveData && btnContinueGame) {
      btnContinueGame.classList.remove('hidden');
      const stageText = (saveData.stage >= 3) ? 'エンドレス営業' : `第${saveData.stage || 1}ステージ`;
      const dayNum = saveData.day || 1;
      btnContinueGame.textContent = `▶️ 続きから始める (${dayNum}日目 / ${stageText} / 売上${saveData.score.toLocaleString()}円)`;
    } else if (btnContinueGame) {
      btnContinueGame.classList.add('hidden');
    }
  }

  // 初期画面でのセーブチェック
  updateSaveDataUI();

  // 全画面リクエスト（ゲーム開始時）
  function tryRequestFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen
      || el.webkitRequestFullscreen
      || el.mozRequestFullScreen
      || el.msRequestFullscreen;
    if (req) {
      req.call(el).catch(() => {});
    }
  }

  // イベントバインディング：最初から始める
  btnStartGame.addEventListener('click', () => {
    tryRequestFullscreen();
    game.clearSaveData();
    modalOverlay.classList.add('hidden');
    game.setDifficulty(selectedDifficulty);
    currentModalMode = 'playing';
    game.startNewGame();
  });

  // イベントバインディング：続きから始める / 続ける
  if (btnContinueGame) {
    btnContinueGame.addEventListener('click', () => {
      tryRequestFullscreen();
      modalOverlay.classList.add('hidden');

      if (currentModalMode === 'goal_reached') {
        currentModalMode = 'playing';
        game.startStage2();
      } else if (currentModalMode === 'stage2_clear') {
        currentModalMode = 'playing';
        game.startEndless();
      } else if (currentModalMode === 'day_clear') {
        currentModalMode = 'playing';
        game.startNextDay();
      } else {
        currentModalMode = 'playing';
        game.startFromSave();
      }
    });
  }

  // イベントバインディング：ゲームをやめる
  if (btnQuitGame) {
    btnQuitGame.addEventListener('click', () => {
      game.quitGame();
      currentModalMode = 'title';
      modalTitle.textContent = 'そば一丁！';
      resetModalToStart();
      modalOverlay.classList.remove('hidden');
      updateSaveDataUI();
      showToastMessage('本日の営業を中断してタイトル画面に戻りました（オートセーブ完了）', 'info');
    });
  }

  btnSoundToggle.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
  });

  // 調理アクション
  btnDashiKatsuo.addEventListener('click',  () => game.addDashi('katsuo'));
  btnDashiNiboshi.addEventListener('click', () => game.addDashi('niboshi'));
  btnDashiKombu.addEventListener('click',   () => {
    if (game.level < 2) {
      showToastMessage('🔒 こんぶ出汁は第2ステージ（目標1万円達成後）で解放されます！', 'warning');
      return;
    }
    game.addDashi('kombu');
  });

  btnTopNegi.addEventListener('click',     () => game.addTopping('negi'));
  btnTopEgg.addEventListener('click',      () => game.addTopping('raw_egg'));
  btnTopKorokke.addEventListener('click',  () => {
    if (game.level < 2) {
      showToastMessage('🔒 コロッケは第2ステージ（目標1万円達成後）で解放されます！', 'warning');
      return;
    }
    game.addTopping('korokke');
  });
  btnTopChili.addEventListener('click',    () => game.addTopping('spicy_chili'));
  btnTrash.addEventListener('click',       () => game.discardBowl());

  btnBoilNihachi.addEventListener('click', () => game.boilNoodle('nihachi'));
  btnGetNihachi.addEventListener('click',  () => game.addNoodleToBowl('nihachi'));

  btnBoilJuwari.addEventListener('click',  () => game.boilNoodle('juwari'));
  btnGetJuwari.addEventListener('click',   () => game.addNoodleToBowl('juwari'));

  btnBoilHegi.addEventListener('click',    () => {
    if (game.level < 2) {
      showToastMessage('🔒 へぎ蕎麦は第2ステージ（目標1万円達成後）で解放されます！', 'warning');
      return;
    }
    game.boilNoodle('hegi');
  });
  btnGetHegi.addEventListener('click',     () => {
    if (game.level < 2) return;
    game.addNoodleToBowl('hegi');
  });

  const diffNames = {
    easy: 'かんたん',
    normal: 'ふつう',
    hard: 'むずかしい'
  };

  // 画面描画
  function render(game) {
    try {
      // ヘッダー情報
      const isEndless = game.stage >= 3;
      if (statMode) statMode.textContent = diffNames[game.difficulty] || 'かんたん';
      if (statLevel) statLevel.textContent = `Lv.${game.level}`;
      if (statDay) statDay.textContent = isEndless ? `${game.day}日目 (エンドレス)` : `${game.day}日目 (第${game.stage}ステージ)`;
      if (statTime) statTime.textContent = `${game.timeRemaining} 秒`;
      if (statScore) statScore.textContent = isEndless ? `${game.score.toLocaleString()}円 (エンドレス)` : `${game.score.toLocaleString()}円 / ${game.targetScore.toLocaleString()}円`;
      if (statRep) statRep.textContent = `${game.repScore}%`;
      if (repBarFill) repBarFill.style.width = `${game.repScore}%`;

      // レベル2解放状態のUI切り替え（伏せ字 ↔ 解放）
      const isL2 = game.level >= 2;

      // へぎ蕎麦（茹で釜）
      if (potHegiEl) potHegiEl.classList.toggle('level2-locked', !isL2);
      if (btnBoilHegi) btnBoilHegi.disabled = !isL2;
      const potHegiLabel = document.getElementById('pot-hegi-label');
      if (potHegiLabel) {
        potHegiLabel.innerHTML = isL2 ? 'へぎ蕎麦 <small>(Lv.2)</small>' : '🔒 ？？？ <small>(第2ステージ)</small>';
      }

      // こんぶ出汁
      if (btnDashiKombu) {
        btnDashiKombu.classList.toggle('level2-locked', !isL2);
        btnDashiKombu.disabled = !isL2;
        const iconEl = document.getElementById('icon-dashi-kombu');
        const textEl = document.getElementById('text-dashi-kombu');
        if (iconEl) {
          iconEl.className = isL2 ? 'soup-icon kombu-icon' : 'soup-icon';
          iconEl.textContent = isL2 ? '' : '🔒';
        }
        if (textEl) {
          textEl.innerHTML = isL2 ? 'こんぶ出汁 <small>(Lv.2)</small>' : '🔒 ？？？ <small>(第2ステージ)</small>';
        }
      }

      // コロッケ
      if (btnTopKorokke) {
        btnTopKorokke.classList.toggle('level2-locked', !isL2);
        btnTopKorokke.disabled = !isL2;
        const iconEl = document.getElementById('icon-top-korokke');
        const textEl = document.getElementById('text-top-korokke');
        if (iconEl) {
          iconEl.textContent = isL2 ? '🧆' : '🔒';
        }
        if (textEl) {
          textEl.innerHTML = isL2 ? 'コロッケ <small>(Lv.2)</small>' : '🔒 ？？？ <small>(第2ステージ)</small>';
        }
      }

      // お品書き（壁札）
      if (menuTagKorokke) {
        menuTagKorokke.classList.toggle('level2-locked', !isL2);
        menuTagKorokke.innerHTML = isL2 ? 'コロッケそば <small>500円</small>' : '🔒 ？？？そば <small>第2ステージ</small>';
      }

      // 茹で釜ゲージとボタン状態更新（二八 / 十割 / へぎ）
      updatePotUI(game.pots.nihachi, potNihachiFill, btnGetNihachi);
      updatePotUI(game.pots.juwari,  potJuwariFill,  btnGetJuwari);
      if (isL2) {
        updatePotUI(game.pots.hegi, potHegiFill, btnGetHegi);
      }

      // カウンター席の描画（差分更新）
      if (seatsContainer) {
        game.customers.forEach((customer, seatIndex) => {
          const slotEl = document.getElementById(`seat-slot-${seatIndex}`);
          if (!slotEl) return;

          if (!customer) {
            if (slotEl.dataset.customerId !== 'none') {
              slotEl.dataset.customerId = 'none';
              slotEl.dataset.customerState = 'none';
              slotEl.innerHTML = `<div class="empty-seat-msg" style="color: #666; font-size: 0.85rem;">空席</div>`;
            }
            return;
          }

          // stateが変化していれば再描画（idだけでなくstateも一致確認）
          if (slotEl.dataset.customerId === String(customer.id) &&
              slotEl.dataset.customerState === customer.state) {
            // 既存カードのゲージや状態更新のみ
            const patienceFill = slotEl.querySelector('.patience-fill');
            if (patienceFill) {
              const pct = Math.max(0, (customer.patience / customer.maxPatience) * 100);
              patienceFill.style.width = `${pct}%`;
            }
            const escapeFill = slotEl.querySelector('.escape-fill');
            if (escapeFill) {
              escapeFill.style.width = `${customer.escapeProgress}%`;
            }
            return;
          }

          // 新規生成（IDまたはstateが変化したとき）
          slotEl.dataset.customerId = String(customer.id);
          slotEl.dataset.customerState = customer.state;
          slotEl.innerHTML = '';

          const cardEl = document.createElement('div');
          cardEl.className = 'customer-card';
          if (customer.isGinji) cardEl.classList.add('ginji-card');
          if (customer.isOgin)  cardEl.classList.add('ogin-card');
          if (customer.isSpicyLover) cardEl.classList.add('spicy-lover-card');

          if (customer.state === 'waiting') {
            const pct = Math.max(0, (customer.patience / customer.maxPatience) * 100);
            const spicyTagHtml = customer.isSpicyLover ? '<span class="spicy-tag">🌶️ 刺激求む</span>' : '';
            const spicyQuoteHtml = customer.isSpicyLover ? `<div class="spicy-quote">💬 「${customer.quote}」</div>` : '';

            cardEl.innerHTML = `
              <div class="customer-speech">
                <div class="order-title">${customer.getOrderName()}</div>
                ${spicyQuoteHtml}
                <div class="recipe-hint">${customer.getRecipeIcons()}</div>
              </div>
              <div class="customer-avatar">${customer.avatar}</div>
              <div class="customer-name">${customer.name} ${spicyTagHtml}</div>
              <div class="patience-bar">
                <div class="patience-fill" style="width: ${pct}%;"></div>
              </div>
              <button class="btn-serve" id="btn-serve-${seatIndex}">へいお待ち！</button>
            `;
            slotEl.appendChild(cardEl);

            const btnServe = cardEl.querySelector(`#btn-serve-${seatIndex}`);
            if (btnServe) {
              btnServe.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                game.serveToCustomer(seatIndex);
              });
            }

          } else if (customer.state === 'escaping') {
            cardEl.innerHTML = `
              <div class="customer-speech alert-speech">
                <div class="order-title text-danger">食い逃げ中！</div>
                <div class="order-quote">「ごちそうさん！」</div>
              </div>
              <div class="customer-avatar">${customer.avatar}</div>
              <div class="customer-name text-danger">${customer.name}</div>
              <div class="escape-bar">
                <div class="escape-fill" style="width: ${customer.escapeProgress}%;"></div>
              </div>
              <button class="btn-catch" id="btn-catch-${seatIndex}">お会計！（連打：${customer.catchClicks}/${customer.requiredCatchClicks}）</button>
            `;
            slotEl.appendChild(cardEl);

            const btnCatch = cardEl.querySelector(`#btn-catch-${seatIndex}`);
            if (btnCatch) {
              btnCatch.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                game.attemptCatchGinji(seatIndex);
              });
            }

          } else if (customer.state === 'defeated') {
            cardEl.innerHTML = `
              <div class="customer-avatar">😵</div>
              <div class="customer-name">${customer.name}</div>
              <div style="color: #4cd964; font-weight: bold; margin-top: 5px;">参りました！</div>
            `;
            slotEl.appendChild(cardEl);
          }
        });
      }

      // 盛り付けどんぶりの描画
      if (bowlsContainer) {
        bowlsContainer.innerHTML = '';
        game.bowls.forEach((bowl, index) => {
          const bowlEl = document.createElement('div');
          bowlEl.className = 'bowl-item';
          if (index === game.selectedBowlIndex) bowlEl.classList.add('selected');

          const dashiInfo  = bowl.dashi  ? DASHI_TYPES[bowl.dashi]   : null;
          const noodleInfo = bowl.noodle ? NOODLE_TYPES[bowl.noodle] : null;

          // スープ要素
          let soupHtml = '';
          if (dashiInfo) {
            soupHtml = `<div class="bowl-soup-fill soup-${bowl.dashi}" style="background-color: ${dashiInfo.color};"></div>`;
          }

          // 麺要素
          let noodleHtml = '';
          if (noodleInfo) {
            const perfectMark = bowl.isPerfectCooked ? '🌟' : '';
            noodleHtml = `<div class="bowl-noodle-fill" style="background-color: ${noodleInfo.color};">${perfectMark}${noodleInfo.name}</div>`;
          }

          // トッピング要素
          let toppingsHtml = '';
          if (bowl.toppings.length > 0) {
            const icons = bowl.toppings.map(t => TOPPING_TYPES[t]?.icon || '').join('');
            toppingsHtml = `<div class="bowl-toppings-icons">${icons}</div>`;
          }

          // 出汁だけ入っている/具なしの時のテキスト表示補助
          let emptyCenterText = '';
          if (!noodleInfo && !dashiInfo) {
            emptyCenterText = `<span style="z-index:4; font-size:0.75rem; color:#888; font-weight:bold;">空</span>`;
          } else if (dashiInfo && !noodleInfo) {
            emptyCenterText = `<span style="z-index:4; font-size:0.75rem; color:#fff; font-weight:bold; text-shadow:1px 1px 2px #000;">🥣${dashiInfo.name.replace('出汁','')}</span>`;
          }

          bowlEl.innerHTML = `
            ${soupHtml}
            ${noodleHtml}
            ${toppingsHtml}
            ${emptyCenterText}
            <div class="bowl-select-tag">丼 ${index + 1}</div>
          `;

          bowlEl.addEventListener('click', () => game.selectBowl(index));
          bowlsContainer.appendChild(bowlEl);
        });
      }
    } catch (err) {
      console.error('[render ERROR]', err);
    }
  }

  function updatePotUI(pot, fillEl, btnGetEl) {
    if (!pot || !fillEl || !btnGetEl) return;
    fillEl.style.width = `${pot.progress}%`;
    fillEl.classList.toggle('in-perfect', pot.state === 'boiling' && pot.isPerfect);
    btnGetEl.disabled = pot.state === 'idle';

    if (pot.state === 'boiling' && pot.isPerfect) {
      btnGetEl.textContent = '🌟今すぐ湯切り！';
      btnGetEl.classList.add('btn-get-perfect');
    } else if (pot.state === 'boiling') {
      btnGetEl.textContent = '湯切りする';
      btnGetEl.classList.remove('btn-get-perfect');
    } else if (pot.state === 'ready') {
      btnGetEl.textContent = '丼へ盛る';
      btnGetEl.classList.remove('btn-get-perfect');
    } else {
      btnGetEl.textContent = '丼へ盛る';
      btnGetEl.classList.remove('btn-get-perfect');
    }
  }

  // トースト表示
  function showToastMessage(text, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = text;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // 立食い師襲来カットイン演出
  function showCutinNotice(msg) {
    if (msg.includes('お銀')) {
      if (cutinTitle)  cutinTitle.textContent  = '⚡ 立食い師 襲来 ⚡';
      if (cutinAvatar) cutinAvatar.textContent = '💃';
      if (cutinName)   cutinName.textContent   = 'コロッケのお銀';
      if (cutinText)   cutinText.textContent   = '「コロッケはね、サクサクじゃないと意味がないの。」';
    } else {
      if (cutinTitle)  cutinTitle.textContent  = '⚡ 立食い師 襲来 ⚡';
      if (cutinAvatar) cutinAvatar.textContent = '🕵️‍♂️';
      if (cutinName)   cutinName.textContent   = '月見の銀二';
      if (cutinText)   cutinText.textContent   = '「……いつもの、かつお十割の月見だ。」';
    }

    cutinOverlay.classList.remove('hidden');
    sound.playGinjiAlert();
    setTimeout(() => {
      cutinOverlay.classList.add('hidden');
    }, 2200);
  }

  // 特殊反撃演出
  function showSpecial(type, msg) {
    specialOverlay.classList.remove('hidden');
    if (type === 'chili') {
      specialIcon.textContent = '🌶️🔥';
    } else {
      specialIcon.textContent = '🌟✨';
    }
    specialMsg.textContent = msg;

    setTimeout(() => {
      specialOverlay.classList.add('hidden');
    }, 2200);
  }

  // 目標金額1万円到達時のポップアップ
  function handleGoalReached(game) {
    currentModalMode = 'goal_reached';
    sound.playFanfare();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

    modalOverlay.classList.remove('hidden');
    modalTitle.textContent = '目標金額に達しました';
    modalBody.innerHTML = `
      <div class="result-box success">
        <h3>🎉 第1ステージ 目標1万円達成！ 🎉</h3>
        <p class="score-result">累計売上: <span>${game.score}円</span></p>
        <p>営業日数: ${game.day} 日目 | 提供客数: ${game.stats.servedCount} 人 | 立食い師撃退数: ${game.stats.ginjiDefeated} 人</p>
        <p class="comment">
          見事目標金額の1万円に達しました！<br>
          <small style="color: #ffd166;">※進行状況は自動的にオートセーブされました。</small><br><br>
          「続ける」を押すと、新食材（こんぶ出汁・へぎ蕎麦・コロッケ）と強敵『コロッケのお銀』が登場する<b>第二ステージ</b>が開始します！
        </p>
      </div>
    `;
    btnStartGame.textContent = '最初から始める';
    btnContinueGame.textContent = '▶️ 続ける（第二ステージ開始）';
    btnContinueGame.classList.remove('hidden');
  }

  function handleStage2Clear(game) {
    currentModalMode = 'stage2_clear';
    sound.playFanfare();

    // 連続花吹雪（エンディング演出）
    const duration = 2500;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      confetti({
        particleCount: 40,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 250);

    // 称号決定ロジック
    let rankName = '🍜 天下一品・立ち食い蕎麦職人';
    if (game.stats.ginjiDefeated >= 4 && game.day <= 3) {
      rankName = '🌟 神速無敗の立ち食い仙人';
    } else if (game.stats.ginjiDefeated >= 4) {
      rankName = '⚔️ 立食い師キラー・蕎麦奉行';
    } else if (game.day <= 2) {
      rankName = '⚡ 電光石火のワンオペ大将';
    } else if (game.score >= 25000) {
      rankName = '💰 億万長者・蕎麦御殿当主';
    }

    modalOverlay.classList.remove('hidden');
    modalTitle.textContent = '🏆 祝・全ステージ制覇！ 🏆';
    modalBody.innerHTML = `
      <div class="ending-box">
        <div class="ending-badge">✨ 堂々完結 / GAME CLEAR ✨</div>
        <div class="ending-story">
          「月見の銀二」や「コロッケのお銀」ら伝説の立食い師たちをその神速の茹で技と激辛七味で見事ねじ伏せ、目標売上<b>20,000円</b>の大台を突破！<br>
          江戸前立ち食い蕎麦の粋と情熱を極めたあなたの店は、今や天下に轟く伝説の名店となった――。
        </div>

        <div class="ending-stats-grid">
          <div class="ending-stat-card">
            <div class="ending-stat-label">💰 最終総売上</div>
            <div class="ending-stat-val">${game.score.toLocaleString()}円</div>
          </div>
          <div class="ending-stat-card">
            <div class="ending-stat-label">📅 達成営業日数</div>
            <div class="ending-stat-val">${game.day} 日目</div>
          </div>
          <div class="ending-stat-card">
            <div class="ending-stat-label">🥢 提供した蕎麦</div>
            <div class="ending-stat-val">${game.stats.servedCount} 杯</div>
          </div>
          <div class="ending-stat-card">
            <div class="ending-stat-label">🛡️ 立食い師撃退数</div>
            <div class="ending-stat-val">${game.stats.ginjiDefeated} 人</div>
          </div>
        </div>

        <div class="ending-rank-box">
          <div class="ending-rank-title">🎖️ 認定称号 🎖️</div>
          <div class="ending-rank-name">${rankName}</div>
        </div>
      </div>
    `;
    btnStartGame.textContent = '🔄 最初から始める（NEW GAME）';
    btnContinueGame.textContent = `▶️ エンドレス営業を続ける（${game.day + 1}日目へ）`;
    btnContinueGame.classList.remove('hidden');
  }

  // 1日の営業終了（タイムアップ or 評判0）
  function handleGameOver(isSuccess, game) {
    modalOverlay.classList.remove('hidden');
    btnStartGame.textContent = '最初から始める';

    if (isSuccess) {
      currentModalMode = 'day_clear';
      sound.playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      const isEndless = game.stage >= 3;
      const stageName = isEndless ? 'エンドレス営業' : `第${game.stage}ステージ`;
      const scoreSub = isEndless ? '' : ` (目標: ${game.targetScore.toLocaleString()}円)`;

      modalTitle.textContent = `🎉 ${game.day}日目 営業クリア！ 🎉`;
      modalBody.innerHTML = `
        <div class="result-box success">
          <h3>本日の営業成果 (${game.day}日目 / ${stageName})</h3>
          <p class="score-result">現在の累計売上: <span>${game.score.toLocaleString()}円</span>${scoreSub}</p>
          <p>評判度: <b>${game.repScore}%</b> | 提供客数: ${game.stats.servedCount} 人</p>
          <p>立食い師撃退数: ${game.stats.ginjiDefeated} 人</p>
          <p class="comment">
            見事本日の営業を黒字で終えました！<br>
            <small style="color: #ffd166;">※売上と進行状況はオートセーブされました。</small><br><br>
            「続ける」を押すと、売上を引き継いで<b>${game.day + 1}日目</b>の営業が始まります！
          </p>
        </div>
      `;
      btnContinueGame.textContent = `▶️ 続ける（${game.day + 1}日目へ）`;
      btnContinueGame.classList.remove('hidden');
    } else {
      currentModalMode = 'game_over';
      sound.playAngry();
      modalTitle.textContent = '💀 閉店追い込まれ… 💀';
      modalBody.innerHTML = `
        <div class="result-box fail">
          <h3>本日の結果 (${game.day}日目)</h3>
          <p class="score-result">最終売上: <span>${game.score.toLocaleString()}円</span></p>
          <p>最終評判: ${game.repScore}%</p>
          <p class="comment">売上がないか、評判失墜で店を畳むことになってしまった…</p>
        </div>
      `;
      btnContinueGame.classList.add('hidden');
    }
  }

  // モーダルをタイトル（初期）状態に戻す
  function resetModalToStart() {
    modalBody.innerHTML = `
      <p>ワンオペで立ち食い蕎麦屋を切り盛りしよう！</p>

      <div class="difficulty-select-section">
        <p><b>難易度を選んでください</b></p>
        <div class="difficulty-options" id="diff-opts-inner">
          <button class="btn-diff active" data-diff="easy">
            <span class="diff-title">かんたん</span>
            <small>（待ち時間たっぷり！初心者向け）</small>
          </button>
          <button class="btn-diff" data-diff="normal">
            <span class="diff-title">ふつう</span>
            <small>（ちょうど良いお手軽バランス）</small>
          </button>
          <button class="btn-diff" data-diff="hard">
            <span class="diff-title">むずかしい</span>
            <small>（スピード勝負！上級者向け）</small>
          </button>
        </div>
      </div>

      <div class="instruction-box">
        <h4>⚠️ イレギュラー警報：立食い師たちの襲来！</h4>
        <ul>
          <li><b>『月見の銀二』</b>：注文は「かつお出汁 + 十割そば + ネギ + 生卵」</li>
          <li><b>『？？？（謎の立食い師）』</b>（第2ステージ登場）：目標1万円達成後に現れる強敵！</li>
          <li>撃退法：<b>【激辛七味】</b>を入れるか、<b>ジャスト茹で</b>で感動させよ！</li>
          <li>逃げ出したら<b>「お会計」連打</b>で捕まえろ！</li>
        </ul>
      </div>
    `;
    btnStartGame.textContent = '最初から始める！';

    // 難易度ボタンの再バインド（innerHTMLを書き換えたため）
    const newDiffBtns = document.querySelectorAll('#diff-opts-inner .btn-diff');
    newDiffBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        newDiffBtns.forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        selectedDifficulty = targetBtn.getAttribute('data-diff');
      });
    });
  }
});

