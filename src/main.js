// メインエントリーポイント＆UIバインディング

import './style.css';
import './modern.css';
import { portrait, titleIntro } from './visuals.js';
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

  modalBody.insertAdjacentHTML('afterbegin', titleIntro);

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

  const potInakaEl     = document.getElementById('pot-inaka');
  const btnBoilInaka   = document.getElementById('btn-boil-inaka');
  const btnGetInaka    = document.getElementById('btn-get-inaka');
  const potInakaFill   = document.getElementById('pot-inaka-fill');

  // 食材ボタン
  const btnDashiKatsuo  = document.getElementById('btn-dashi-katsuo');
  const btnDashiNiboshi = document.getElementById('btn-dashi-niboshi');
  const btnDashiKombu   = document.getElementById('btn-dashi-kombu');
  const btnDashiSoda    = document.getElementById('btn-dashi-soda');

  const btnTopEgg       = document.getElementById('btn-top-egg');
  const btnTopKorokke   = document.getElementById('btn-top-korokke');
  const btnTopIkaten    = document.getElementById('btn-top-ikaten');
  const btnTopEbiten    = document.getElementById('btn-top-ebiten');

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
    showNeko: (toppingName, bowlNum) => showNekoCutin(toppingName, bowlNum),
    onGameOver: (isSuccess, game) => handleGameOver(isSuccess, game),
    onGoalReached: (game) => handleGoalReached(game),
    onStage2Clear: (game) => handleStage2Clear(game),
    onStage3Clear: (game) => handleStage3Clear(game),
    onStage4Clear: (game) => handleStage4Clear(game)
  };

  const game = new SobaGame(uiCallbacks);
  window.game = game;

  let currentModalMode = 'title'; // 'title' | 'day_clear' | 'goal_reached' | 'stage2_clear' | 'stage3_clear' | 'stage4_clear' | 'game_over'

  // オートセーブデータのUI更新
  function updateSaveDataUI() {
    const saveData = game.loadProgress();
    if (saveData && btnContinueGame) {
      btnContinueGame.classList.remove('hidden');
      const stageText = (saveData.stage >= 5) ? 'エンドレス営業' : `第${saveData.stage || 1}ステージ`;
      const dayNum = saveData.day || 1;
      btnContinueGame.textContent = `▶️ 続きから始める (${dayNum}日目 / ${stageText} / 売上${saveData.score.toLocaleString()}円)`;
    } else if (btnContinueGame) {
      btnContinueGame.classList.add('hidden');
    }
  }

  // 初期画面でのセーブチェック
  updateSaveDataUI();

  // URLクエリによるデバッグステージ起動サポート (?debugStage=4)
  const urlParams = new URLSearchParams(window.location.search);
  const debugStageParam = urlParams.get('debugStage');
  if (debugStageParam) {
    const dStage = parseInt(debugStageParam, 10);
    if (dStage >= 1 && dStage <= 5) {
      game.stage = dStage;
      game.level = Math.min(4, dStage);
      if (dStage === 4) {
        game.targetScore = 40000;
        game.score = 39200; // あと1杯でクリア
      }
    }
  }

  // イベントバインディング：最初から始める
  btnStartGame.addEventListener('click', () => {
    // Keep the browser viewport stable when starting or resuming.
    game.clearSaveData();
    modalOverlay.classList.add('hidden');
    game.setDifficulty(selectedDifficulty);
    currentModalMode = 'playing';
    game.startNewGame();
  });

  // イベントバインディング：続きから始める / 続ける
  if (btnContinueGame) {
    btnContinueGame.addEventListener('click', () => {
      // Keep the browser viewport stable when starting or resuming.
      modalOverlay.classList.add('hidden');

      if (currentModalMode === 'goal_reached') {
        currentModalMode = 'playing';
        game.startStage2();
      } else if (currentModalMode === 'stage2_clear') {
        currentModalMode = 'playing';
        game.startStage3();
      } else if (currentModalMode === 'stage3_clear') {
        currentModalMode = 'playing';
        game.startStage4();
      } else if (currentModalMode === 'stage4_clear') {
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
  btnDashiSoda.addEventListener('click',    () => {
    if (game.level < 3) {
      showToastMessage('🔒 宗田節出汁は第3ステージ（目標2万円達成後）で解放されます！', 'warning');
      return;
    }
    game.addDashi('soda');
  });

  btnTopEgg.addEventListener('click',      () => game.addTopping('raw_egg'));
  btnTopKorokke.addEventListener('click',  () => {
    if (game.level < 2) {
      showToastMessage('🔒 コロッケは第2ステージ（目標1万円達成後）で解放されます！', 'warning');
      return;
    }
    game.addTopping('korokke');
  });
  btnTopIkaten.addEventListener('click',   () => {
    if (game.level < 3) {
      showToastMessage('🔒 イカ天は第3ステージ（目標2万円達成後）で解放されます！', 'warning');
      return;
    }
    game.addTopping('ikaten');
  });
  if (btnTopEbiten) {
    btnTopEbiten.addEventListener('click', () => {
      if (game.level < 4) {
        showToastMessage('🔒 海老天は第3ステージクリア（目標3万円達成）後、第4ステージで解放されます！', 'warning');
        return;
      }
      game.addTopping('ebiten');
    });
  }

  // 丼ステーションのイベント委任（ネギ増し/抜き、唐辛子増し/抜き、破棄、丼選択）
  bowlsContainer.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      const bowlIdx = parseInt(actionBtn.getAttribute('data-bowl'), 10);
      if (isNaN(bowlIdx)) return;

      if (action === 'negi-mashi') {
        game.setNegiLevel('mashi', bowlIdx);
      } else if (action === 'negi-nashi') {
        game.setNegiLevel('nashi', bowlIdx);
      } else if (action === 'chili-mashi') {
        game.setTogarashiLevel('mashi', bowlIdx);
      } else if (action === 'chili-nashi') {
        game.setTogarashiLevel('nashi', bowlIdx);
      } else if (action === 'trash') {
        game.discardBowl(bowlIdx);
      }
      return;
    }

    const bowlItem = e.target.closest('.bowl-item, .bowl-slot-unit');
    if (bowlItem) {
      const bowlIdx = parseInt(bowlItem.getAttribute('data-bowl'), 10);
      if (!isNaN(bowlIdx)) {
        game.selectBowl(bowlIdx);
      }
    }
  });

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

  btnBoilInaka.addEventListener('click',   () => {
    if (game.level < 3) {
      showToastMessage('🔒 田舎そばは第3ステージ（目標2万円達成後）で解放されます！', 'warning');
      return;
    }
    game.boilNoodle('inaka');
  });
  btnGetInaka.addEventListener('click',    () => {
    if (game.level < 3) return;
    game.addNoodleToBowl('inaka');
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
      const isEndless = game.stage >= 5;
      if (statMode) statMode.textContent = diffNames[game.difficulty] || 'かんたん';
      if (statDay) statDay.textContent = isEndless ? `${game.day}日目(∞)` : `${game.day}日目(第${game.stage})`;
      if (statTime) statTime.textContent = `${game.timeRemaining}秒`;
      if (statScore) statScore.textContent = isEndless ? `${game.score.toLocaleString()}円` : `${game.score.toLocaleString()} / ${game.targetScore.toLocaleString()}円`;
      if (statRep) statRep.textContent = `${game.repScore}%`;
      if (repBarFill) repBarFill.style.width = `${game.repScore}%`;

      // 解放状態のUI切り替え（伏せ字 ↔ 解放）
      const isL2 = game.level >= 2;
      const isL3 = game.level >= 3;
      const isL4 = game.level >= 4;

      // へぎ蕎麦（茹で釜 Lv.2）
      if (potHegiEl) potHegiEl.classList.toggle('level2-locked', !isL2);
      if (btnBoilHegi) btnBoilHegi.disabled = !isL2;
      const potHegiLabel = document.getElementById('pot-hegi-label');
      if (potHegiLabel) {
        potHegiLabel.innerHTML = isL2 ? 'へぎ蕎麦 <small>(Lv.2)</small>' : '🔒 ？？？';
      }

      // 田舎そば（茹で釜 Lv.3）
      if (potInakaEl) potInakaEl.classList.toggle('level3-locked', !isL3);
      if (btnBoilInaka) btnBoilInaka.disabled = !isL3;
      const potInakaLabel = document.getElementById('pot-inaka-label');
      if (potInakaLabel) {
        potInakaLabel.innerHTML = isL3 ? '田舎そば <small>(Lv.3)</small>' : '🔒 ？？？';
      }

      // こんぶ出汁 (Lv.2)
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
          textEl.innerHTML = isL2 ? 'こんぶ出汁' : '🔒 ？？？';
        }
      }

      // 宗田節出汁 (Lv.3)
      if (btnDashiSoda) {
        btnDashiSoda.classList.toggle('level3-locked', !isL3);
        btnDashiSoda.disabled = !isL3;
        const iconEl = document.getElementById('icon-dashi-soda');
        const textEl = document.getElementById('text-dashi-soda');
        if (iconEl) {
          iconEl.className = isL3 ? 'soup-icon soda-icon' : 'soup-icon';
          iconEl.textContent = isL3 ? '' : '🔒';
        }
        if (textEl) {
          textEl.innerHTML = isL3 ? '宗田節出汁' : '🔒 ？？？';
        }
      }

      // コロッケ (Lv.2)
      if (btnTopKorokke) {
        btnTopKorokke.classList.toggle('level2-locked', !isL2);
        btnTopKorokke.disabled = !isL2;
        const iconEl = document.getElementById('icon-top-korokke');
        const textEl = document.getElementById('text-top-korokke');
        if (iconEl) {
          iconEl.textContent = isL2 ? '🧆' : '🔒';
        }
        if (textEl) {
          textEl.innerHTML = isL2 ? 'コロッケ' : '🔒 ？？？';
        }
      }

      // イカ天 (Lv.3)
      if (btnTopIkaten) {
        btnTopIkaten.classList.toggle('level3-locked', !isL3);
        btnTopIkaten.disabled = !isL3;
        const iconEl = document.getElementById('icon-top-ikaten');
        const textEl = document.getElementById('text-top-ikaten');
        if (iconEl) {
          iconEl.textContent = isL3 ? '🦑' : '🔒';
        }
        if (textEl) {
          textEl.innerHTML = isL3 ? 'イカ天' : '🔒 ？？？';
        }
      }

      // 海老天 (Lv.4)
      if (btnTopEbiten) {
        btnTopEbiten.classList.toggle('level4-locked', !isL4);
        btnTopEbiten.disabled = !isL4;
        const iconEl = document.getElementById('icon-top-ebiten');
        const textEl = document.getElementById('text-top-ebiten');
        if (iconEl) {
          iconEl.textContent = isL4 ? '🦐' : '🔒';
        }
        if (textEl) {
          textEl.innerHTML = isL4 ? '海老天' : '🔒 ？？？';
        }
      }

      // 茹で釜ゲージとボタン状態更新（二八 / 十割 / へぎ / 田舎）
      updatePotUI(game.pots.nihachi, potNihachiFill, btnGetNihachi);
      updatePotUI(game.pots.juwari,  potJuwariFill,  btnGetJuwari);
      if (isL2) {
        updatePotUI(game.pots.hegi, potHegiFill, btnGetHegi);
      }
      if (isL3) {
        updatePotUI(game.pots.inaka, potInakaFill, btnGetInaka);
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
            const patienceInd = slotEl.querySelector('.patience-indicator');
            if (patienceInd && customer.state === 'waiting') {
              const pct = Math.max(0, (customer.patience / customer.maxPatience) * 100);
              const sec = Math.ceil(customer.patience);
              if (pct < 30) {
                patienceInd.className = 'patience-indicator status-danger';
                patienceInd.innerHTML = `
                  <div class="patience-mood-line">😠 💢 限界寸前！</div>
                  <div class="patience-time-line">残り ${sec}秒</div>
                `;
              } else if (pct < 60) {
                patienceInd.className = 'patience-indicator status-warn';
                patienceInd.innerHTML = `
                  <div class="patience-mood-line">😐 まだかな…</div>
                  <div class="patience-time-line">待ち ${sec}秒</div>
                `;
              } else {
                patienceInd.className = 'patience-indicator status-fine';
                patienceInd.innerHTML = `
                  <div class="patience-mood-line">😄 ご機嫌</div>
                  <div class="patience-time-line">待ち ${sec}秒</div>
                `;
              }
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
          if (customer.isGonzo) cardEl.classList.add('gonzo-card');
          if (customer.isJoji)  cardEl.classList.add('joji-card');
          if (customer.isSpicyLover) cardEl.classList.add('spicy-lover-card');

          if (customer.state === 'waiting') {
            const pct = Math.max(0, (customer.patience / customer.maxPatience) * 100);
            const sec = Math.ceil(customer.patience);
            const spicyTagHtml = customer.isSpicyLover ? '<span class="spicy-tag">🌶️ 辛党</span>' : '';

            let indClass = 'status-fine';
            let indMood = '😄 ご機嫌';
            let indTime = `待ち ${sec}秒`;
            if (pct < 30) {
              indClass = 'status-danger';
              indMood = '😠 💢 限界寸前！';
              indTime = `残り ${sec}秒`;
            } else if (pct < 60) {
              indClass = 'status-warn';
              indMood = '😐 まだかな…';
              indTime = `待ち ${sec}秒`;
            }

            cardEl.innerHTML = `
              <div class="customer-speech">
                <div class="recipe-hint">${customer.getRecipeIcons()}</div>
              </div>
              <div class="customer-avatar">${portrait(customer.name)}</div>
              <div class="customer-name">${customer.name} ${spicyTagHtml}</div>
              <div class="customer-quote-box">「${customer.quote}」</div>
              <div class="patience-bar">
                <div class="patience-fill" style="width: ${pct}%;"></div>
              </div>
              <button class="btn-serve" id="btn-serve-${seatIndex}">へいお待ち！</button>
              <div class="patience-indicator ${indClass}">
                <div class="patience-mood-line">${indMood}</div>
                <div class="patience-time-line">${indTime}</div>
              </div>
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
              </div>
              <div class="customer-avatar">${portrait(customer.name)}</div>
              <div class="customer-name text-danger">${customer.name}</div>
              <div class="customer-quote-box text-danger">「ごちそうさん！」</div>
              <div class="escape-bar">
                <div class="escape-fill" style="width: ${customer.escapeProgress}%;"></div>
              </div>
              <button class="btn-catch" id="btn-catch-${seatIndex}">お会計！（連打：${customer.catchClicks}/${customer.requiredCatchClicks}）</button>
              <div class="patience-indicator status-danger">
                <div class="patience-mood-line">🚨 逃走中！</div>
                <div class="patience-time-line">連打で阻止</div>
              </div>
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
              <div class="customer-avatar defeated-portrait">${portrait(customer.name)}</div>
              <div class="customer-name">${customer.name}</div>
              <div class="customer-quote-box">「参りました…！」</div>
            `;
            slotEl.appendChild(cardEl);
          }
        });
      }

      // 盛り付けどんぶりステーションの描画（画像2レイアウト：各丼の脇にネギ・唐辛子・破棄）
      if (bowlsContainer) {
        bowlsContainer.innerHTML = '';
        game.bowls.forEach((bowl, index) => {
          const isSelected = index === game.selectedBowlIndex;
          const unitEl = document.createElement('div');
          unitEl.className = `bowl-slot-unit ${isSelected ? 'unit-selected' : ''}`;
          unitEl.setAttribute('data-bowl', index);

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

          // トッピング要素（具材）
          let toppingsHtml = '';
          if (bowl.toppings.length > 0) {
            const icons = bowl.toppings.map(t => TOPPING_TYPES[t]?.icon || '').join('');
            toppingsHtml = `<div class="bowl-toppings-icons">${icons}</div>`;
          }

          // 薬味インジケーター（ネギ・唐辛子の状態）
          const negiTxt = bowl.negiLevel === 'mashi' ? '🥬増' : (bowl.negiLevel === 'nashi' ? '🥬抜' : '🥬');
          const chiliTxt = bowl.togarashiLevel === 'mashi' ? '🌶️増' : (bowl.togarashiLevel === 'nashi' ? '🌶️抜' : '🌶️');
          const spiceHtml = `<div class="bowl-spice-indicators">${negiTxt} ${chiliTxt}</div>`;

          // 出汁だけ入っている/具なしの時のテキスト表示補助
          let emptyCenterText = '';
          if (!noodleInfo && !dashiInfo) {
            emptyCenterText = `<span style="z-index:4; font-size:0.75rem; color:#888; font-weight:bold;">空</span>`;
          } else if (dashiInfo && !noodleInfo) {
            emptyCenterText = `<span style="z-index:4; font-size:0.72rem; color:#fff; font-weight:bold; text-shadow:1px 1px 2px #000;">🥣${dashiInfo.name.replace('出汁','')}</span>`;
          }

          // 各薬味ボタンのアクティブ判定
          const isNegiMashi = bowl.negiLevel === 'mashi';
          const isNegiNashi = bowl.negiLevel === 'nashi';
          const isChiliMashi = bowl.togarashiLevel === 'mashi';
          const isChiliNashi = bowl.togarashiLevel === 'nashi';

          unitEl.innerHTML = `
            <!-- 左カラム: ネギ増し/抜き + 高さ揃えスペーサー -->
            <div class="bowl-side-col bowl-left-col">
              <button class="bowl-action-btn negi-side-btn ${isNegiMashi ? 'active-spice' : ''}" 
                      data-action="negi-mashi" data-bowl="${index}" title="丼${index + 1}: ネギ増し">
                🥬+
              </button>
              <button class="bowl-action-btn negi-side-btn ${isNegiNashi ? 'active-spice' : ''}" 
                      data-action="negi-nashi" data-bowl="${index}" title="丼${index + 1}: ネギ抜き">
                🥬✕
              </button>
              <div class="bowl-side-spacer"></div>
            </div>

            <!-- 中央カラム: どんぶり本体 -->
            <div class="bowl-center-col">
              <div class="bowl-item ${isSelected ? 'selected' : ''}" data-bowl="${index}">
                ${soupHtml}
                ${noodleHtml}
                ${toppingsHtml}
                ${spiceHtml}
                ${emptyCenterText}
              </div>
              <div class="bowl-select-tag">丼 ${index + 1}</div>
            </div>

            <!-- 右カラム: 唐辛子増し/抜き ＆ 破棄 -->
            <div class="bowl-side-col bowl-right-col">
              <button class="bowl-action-btn chili-side-btn chili-mashi-btn ${isChiliMashi ? 'active-spice' : ''}" 
                      data-action="chili-mashi" data-bowl="${index}" title="丼${index + 1}: 唐辛子増し">
                🌶️+
              </button>
              <button class="bowl-action-btn chili-side-btn ${isChiliNashi ? 'active-spice' : ''}" 
                      data-action="chili-nashi" data-bowl="${index}" title="丼${index + 1}: 唐辛子抜き">
                🌶️✕
              </button>
              <button class="bowl-trash-circle-btn" data-action="trash" data-bowl="${index}" title="丼${index + 1}を破棄">
                <span class="trash-icon">🗑️</span>
                <span class="trash-txt">破棄</span>
              </button>
            </div>
          `;

          bowlsContainer.appendChild(unitEl);
        });
      }

    } catch (err) {
      console.error('[render ERROR]', err);
    }
  }

  function updatePotUI(pot, fillEl, btnGetEl) {
    if (!fillEl || !btnGetEl) return;
    fillEl.style.width = `${pot.progress}%`;

    const isPerfectZone = pot.isPerfect;
    if (isPerfectZone) {
      fillEl.classList.add('perfect-fill');
    } else {
      fillEl.classList.remove('perfect-fill');
    }

    if (pot.state === 'idle') {
      btnGetEl.disabled = true;
      btnGetEl.textContent = '丼へ盛る';
      btnGetEl.classList.remove('btn-get-perfect');
    } else if (pot.state === 'ready' && isPerfectZone) {
      btnGetEl.disabled = false;
      btnGetEl.textContent = '🌟今すぐ湯切り！';
      btnGetEl.classList.add('btn-get-perfect');
    } else if (pot.state === 'boiling') {
      btnGetEl.disabled = false;
      btnGetEl.textContent = '湯切りする';
      btnGetEl.classList.remove('btn-get-perfect');
    } else if (pot.state === 'ready') {
      btnGetEl.disabled = false;
      btnGetEl.textContent = '丼へ盛る';
      btnGetEl.classList.remove('btn-get-perfect');
    } else {
      btnGetEl.disabled = true;
      btnGetEl.textContent = '丼へ盛る';
      btnGetEl.classList.remove('btn-get-perfect');
    }
  }

  // トースト表示（画面上部中央に最新1件を表示、ゲームプレイを遮らない）
  let toastTimer = null;
  function showToastMessage(text, type = 'info') {
    if (!toastContainer) return;
    toastContainer.innerHTML = '';
    if (toastTimer) clearTimeout(toastTimer);

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = text;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 1600);
  }

  // 立食い師襲来カットイン演出
  function showCutinNotice(msg) {
    if (cutinTitle) cutinTitle.textContent = '⚡ 立食い師 襲来 ⚡';

    if (msg.includes('丈二')) {
      if (cutinAvatar) cutinAvatar.textContent = '🍤🕶️';
      if (cutinName)   cutinName.textContent   = '海老天の丈二';
      if (cutinText)   cutinText.textContent   = '「……一本揚げの海老天こそ蕎麦の華。見極めさせてもらおうか。」';
    } else if (msg.includes('権蔵')) {
      if (cutinAvatar) cutinAvatar.textContent = '🦑';
      if (cutinName)   cutinName.textContent   = 'イカ天の権蔵';
      if (cutinText)   cutinText.textContent   = '「……イカ天はな、カラッと揚がってなきゃ話にならねぇ。」';
    } else if (msg.includes('揚羽') || msg.includes('お銀')) {
      if (cutinAvatar) cutinAvatar.textContent = '🦋';
      if (cutinName)   cutinName.textContent   = 'コロッケの揚羽';
      if (cutinText)   cutinText.textContent   = '「コロッケはね、サクサクじゃないと意味がないの。揚げ加減、見させてもらうわよ。」';
    } else {
      if (cutinAvatar) cutinAvatar.textContent = '🕵️‍♂️';
      if (cutinName)   cutinName.textContent   = '月見の銀二';
      if (cutinText)   cutinText.textContent   = '「……いつもの、かつお十割の月見だ。」';
    }

    if (cutinAvatar && cutinName) cutinAvatar.innerHTML = portrait(cutinName.textContent);
    cutinOverlay.classList.remove('hidden');
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

  // 横取り猫「小鉄」の襲来演出
  function showNekoCutin(toppingName, bowlNum) {
    if (bowlNum) {
      showToastMessage(`🐾 ニャーン！横取り猫の『小鉄』に丼${bowlNum}の【${toppingName}】を横取りされた！`, 'warning');
      if (cutinText) cutinText.textContent = `「ニャ〜オ！（丼${bowlNum}の${toppingName}をサッとくわえて逃げ去った！）」`;
    } else {
      showToastMessage(`🐾 ニャーン！横取り猫の『小鉄』に仕込み台の【${toppingName}】を横取りされた！`, 'warning');
      if (cutinText) cutinText.textContent = `「ニャ〜オ！（カウンターの仕込み${toppingName}をサッとくわえて逃げ去った！）」`;
    }
    if (cutinTitle)  cutinTitle.textContent  = '🐾 トッピング横取り！ 🐾';
    if (cutinName)   cutinName.textContent   = '横取り猫の小鉄';

    if (cutinAvatar && cutinName) cutinAvatar.innerHTML = portrait(cutinName.textContent);
    cutinOverlay.classList.remove('hidden');
    setTimeout(() => {
      cutinOverlay.classList.add('hidden');
    }, 2000);
  }

  // 目標金額1万円到達時（第1ステージクリア）のポップアップ
  function handleGoalReached(game) {
    currentModalMode = 'goal_reached';
    sound.playFanfare();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

    modalOverlay.classList.remove('hidden');
    modalTitle.textContent = '目標金額に達しました';
    modalBody.innerHTML = `
      <div class="result-box success">
        <h3>🎉 第1ステージ 目標1万円達成！ 🎉</h3>
        <p class="score-result">累計売上: <span>${game.score.toLocaleString()}円</span></p>
        <p>営業日数: ${game.day} 日目 | 提供客数: ${game.stats.servedCount} 人 | 立食い師撃退数: ${game.stats.ginjiDefeated} 人</p>
        <p class="comment">
          見事目標金額の1万円に達しました！<br>
          <small style="color: #ffd166;">※進行状況は自動的にオートセーブされました。</small><br><br>
          「続ける」を押すと、新食材（こんぶ出汁・へぎ蕎麦・コロッケ）と立食い師『コロッケの揚羽』が登場する<b>第二ステージ（目標2万5千円）</b>が開始します！
        </p>
      </div>
    `;
    btnStartGame.textContent = '最初から始める';
    btnContinueGame.textContent = '▶️ 続ける（第二ステージ開始）';
    btnContinueGame.classList.remove('hidden');
  }

  // 目標金額2万円到達時（第2ステージクリア）のポップアップ
  function handleStage2Clear(game) {
    currentModalMode = 'stage2_clear';
    sound.playFanfare();
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });

    modalOverlay.classList.remove('hidden');
    modalTitle.textContent = '第二ステージ 目標達成！';
    modalBody.innerHTML = `
      <div class="result-box success">
        <h3>🎉 第2ステージ 目標2万5千円達成！ 🎉</h3>
        <p class="score-result">累計売上: <span>${game.score.toLocaleString()}円</span></p>
        <p>営業日数: ${game.day} 日目 | 提供客数: ${game.stats.servedCount} 人 | 立食い師撃退数: ${game.stats.ginjiDefeated} 人</p>
        <p class="comment">
          「コロッケの揚羽」の罠を見事かわし、目標売上2万5千円を突破！<br>
          <small style="color: #ffd166;">※進行状況は自動的にオートセーブされました。</small><br><br>
          「続ける」を押すと、新食材（<b>宗田節出汁・田舎そば・イカ天</b>）と歴戦の立食い師<b>『イカ天の権蔵』</b>が待ち受ける<b>第三ステージ（目標3万5千円）</b>に突入します！
        </p>
      </div>
    `;
    btnStartGame.textContent = '最初から始める';
    btnContinueGame.textContent = '▶️ 続ける（第三ステージ開始）';
    btnContinueGame.classList.remove('hidden');
  }

  // 目標金額3万円到達時（第3ステージクリア）のポップアップ
  function handleStage3Clear(game) {
    currentModalMode = 'stage3_clear';
    sound.playFanfare();
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });

    modalOverlay.classList.remove('hidden');
    modalTitle.textContent = '第三ステージ 目標達成！';
    modalBody.innerHTML = `
      <div class="result-box success">
        <h3>🎉 第3ステージ 目標3万5千円達成！ 🎉</h3>
        <p class="score-result">累計売上: <span>${game.score.toLocaleString()}円</span></p>
        <p>営業日数: ${game.day} 日目 | 提供客数: ${game.stats.servedCount} 人 | 立食い師撃退数: ${game.stats.ginjiDefeated} 人</p>
        <p class="comment">
          荒くれ者「イカ天の権蔵」を納得させ、大台の目標売上3万5千円を突破！<br>
          <small style="color: #ffd166;">※進行状況は自動的にオートセーブされました。</small><br><br>
          いよいよ最終決戦！「続ける」を押すと、新トッピング（<b>海老天 🦐</b>）と最強の立食い師<b>『海老天の丈二』</b>が待ち受ける<b>極限の第4ステージ（目標5万円）</b>に突入します！
        </p>
      </div>
    `;
    btnStartGame.textContent = '最初から始める';
    btnContinueGame.textContent = '▶️ 続ける（第4ステージ開始！）';
    btnContinueGame.classList.remove('hidden');
  }

  // 目標金額4万円到達時（第4ステージクリア ＆ 真・全ステージ制覇グランドフィナーレ）
  function handleStage4Clear(game) {
    currentModalMode = 'stage4_clear';
    sound.playFanfare();

    // 連続花吹雪（グランドフィナーレ演出）
    const duration = 3500;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      confetti({
        particleCount: 60,
        startVelocity: 35,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      });
    }, 220);

    // 称号決定ロジック
    let rankName = '🍜 天下一品・立ち食い蕎麦職人';
    if (game.stats.ginjiDefeated >= 8 && game.day <= 5) {
      rankName = '🌟 神速無敗の立ち食い神主';
    } else if (game.stats.ginjiDefeated >= 7) {
      rankName = '⚔️ 天下無双のワンオペ覇王';
    } else if (game.day <= 4) {
      rankName = '⚡ 電光石火の立ち食いレジェンド';
    } else if (game.score >= 50000) {
      rankName = '💰 巨万の富・江戸前蕎麦御殿当主';
    } else {
      rankName = '👑 立ち食い蕎麦の生ける伝説';
    }

    modalOverlay.classList.remove('hidden');
    modalTitle.textContent = '🏆 祝・全ステージ完全制覇！ 🏆';
    modalBody.innerHTML = `
      <div class="ending-box">
        <div class="ending-badge">✨ 堂々完結 / GRAND FINALE ✨</div>
        <div class="ending-story">
          「月見の銀二」「コロッケの揚羽」「イカ天の権蔵」、そして最強最後の刺客「海老天の丈二」ら全立食い師たちを、その神速の茹で技と激辛撃退で見事ねじ伏せ、大目標売上<b>50,000円</b>の至高の金字塔を打ち立てた！<br>
          江戸前立ち食い蕎麦の粋と情熱を極めたあなたの店は、日本全土に語り継がれる不滅の伝説となった――。
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

      const isEndless = game.stage >= 5;
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
      ${titleIntro}
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

      <details class="instruction-box"><summary>遊び方・立食い師攻略ガイド</summary>
        <h4>⚠️ イレギュラー警報：立食い師たちの襲来！</h4>
        <ul>
          <li><b>『月見の銀二』</b>：かつお出汁 + 十割そば + 月見（第1ステージ目標1万円）</li>
          <li><b>『コロッケの揚羽』</b>：こんぶ出汁 + 二八そば + コロッケ（第2ステージ目標2万5千円）</li>
          <li><b>『イカ天の権蔵』</b>：宗田節出汁 + 田舎そば + イカ天（第3ステージ目標3万5千円）</li>
          <li><b>『海老天の丈二』</b>：宗田節出汁 + 田舎そば + 海老天（第4ステージ目標5万円）</li>
          <li>🐾<b>『横取り猫の小鉄』</b>：第2ステージ以降、丼に乗せた具材をサッと横取り！</li>
          <li>撃退法：<b>【唐辛子増し】</b>にして提供するか、<b>ジャスト湯切り</b>で感動させよ！</li>
          <li>※ネギと唐辛子は<b>全丼デフォルト</b>で投入済。注文に応じて「増し/抜き」で調整！</li>
          <li>逃げ出したら<b>「お会計」連打</b>で捕まえろ！（※丈二は足が速く捕縛難度UP）</li>
        </ul>
      </details>
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


