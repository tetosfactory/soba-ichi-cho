// 客クラス（通常のお客・月見の銀二・コロッケのお銀・イカ天の権蔵）

export const DASHI_TYPES = {
  katsuo:  { id: 'katsuo',  name: 'かつお出汁', color: '#c27b38', labelColor: '#8a4b10' },
  niboshi: { id: 'niboshi', name: '煮干し出汁', color: '#687885', labelColor: '#3c4a56' },
  kombu:   { id: 'kombu',   name: 'こんぶ出汁', color: '#4a7c59', labelColor: '#2d5c3a' }, // Level 2
  soda:    { id: 'soda',    name: '宗田節出汁', color: '#8b4513', labelColor: '#5c2d0c' }  // Level 3
};

export const NOODLE_TYPES = {
  nihachi: { id: 'nihachi', name: '二八そば', color: '#9b8067', cookDuration: 3500 },
  juwari:  { id: 'juwari',  name: '十割そば', color: '#5e4b3c', cookDuration: 4000 },
  hegi:    { id: 'hegi',    name: 'へぎ蕎麦', color: '#7ab87a', cookDuration: 4500 }, // Level 2
  inaka:   { id: 'inaka',   name: '田舎そば', color: '#4a3728', cookDuration: 5000 }  // Level 3
};

export const TOPPING_TYPES = {
  raw_egg: { id: 'raw_egg', name: '生卵',     color: '#f5cd47', icon: '🥚' },
  korokke: { id: 'korokke', name: 'コロッケ', color: '#c87941', icon: '🧆' }, // Level 2
  ikaten:  { id: 'ikaten',  name: 'イカ天',   color: '#e8c374', icon: '🦑' }  // Level 3
};

const CUSTOMER_AVATARS = [
  { name: 'サラリーマン山田', avatar: '👨‍💼', quote: '腹減った！早くね！' },
  { name: '職人サトシ',       avatar: '👷',   quote: 'うまい出汁を頼むよ' },
  { name: '学生タクヤ',       avatar: '🧑‍🎓', quote: '安くてうまいやつで！' },
  { name: 'ご隠居キヨシ',     avatar: '👨‍🦳', quote: '熱々の蕎麦をおくれ' },
  { name: 'OLエリ',           avatar: '👩‍💼', quote: '月見そばが食べたいな' },
  { name: '板前ケンジ',       avatar: '👨‍🍳', quote: 'へぎ蕎麦とコロッケ頼む' }, // Level 2常連
  { name: '釣り人タケシ',     avatar: '🎣',   quote: '宗田節にイカ天、染みるねぇ' }, // Level 3常連
  { name: 'トラッカー熊田',   avatar: '🚚',   quote: '田舎そばの大盛り、ガツンとくれ！' } // Level 3常連
];

const SPICY_LOVER_QUOTES = [
  'トウガラシ増しで刺激的な蕎麦にしてくれ！🌶️',
  '汗が吹き飛ぶほど辛いやつ、期待してるぜ！🔥',
  '今日は無性にカプサイシンを欲してるんだ…増しで！',
  'ピリッと辛いトウガラシ増しがたまらんのだよ！🌶️'
];

export class Customer {
  constructor(id, isGinji = false, isOgin = false, isGonzo = false, difficulty = 'normal', level = 1) {
    this.id = id;
    this.isGinji = isGinji;
    this.isOgin  = isOgin;
    this.isGonzo = isGonzo;
    this.isTachiguishi = isGinji || isOgin || isGonzo;
    this.difficulty = difficulty;
    this.level = level;

    // 通常のお客さんの中で約25%の確率で「隠れ激辛好き（辛党）」になる
    this.isSpicyLover = !this.isTachiguishi && Math.random() < 0.25;

    let patienceMultiplier = 1.0;
    let requiredCatch = 8;

    if (difficulty === 'easy') {
      patienceMultiplier = 10.0;
      requiredCatch = 3;
    } else if (difficulty === 'normal') {
      patienceMultiplier = 2.0;
      requiredCatch = 5;
    } else {
      patienceMultiplier = 1.0;
      requiredCatch = 8;
    }

    const basePatience = this.isTachiguishi ? 25 : (20 + Math.random() * 10);
    this.patience    = basePatience * patienceMultiplier;
    this.maxPatience = this.patience;

    this.state         = 'waiting';
    this.escapeProgress      = 0;
    this.catchClicks         = 0;
    this.requiredCatchClicks = requiredCatch;

    if (isGinji) {
      // ── 月見の銀二 ──────────────────────────────────────
      this.name   = '月見の銀二';
      this.avatar = '🕵️‍♂️';
      this.quote  = '……いつもの、かつお十割の月見だ。';
      this.order  = {
        dashi: 'katsuo',
        noodle: 'juwari',
        toppings: ['raw_egg'],
        negiLevel: 'normal',
        togarashiLevel: 'normal'
      };
      this.price  = 500;

    } else if (isOgin) {
      // ── コロッケのお銀（Level 2） ─────────────────────
      this.name   = 'コロッケのお銀';
      this.avatar = '💃';
      this.quote  = 'コロッケはね、サクサクじゃないと意味がないの。';
      this.order  = {
        dashi: 'kombu',
        noodle: 'nihachi',
        toppings: ['korokke'],
        negiLevel: 'normal',
        togarashiLevel: 'normal'
      };
      this.price  = 600;

    } else if (isGonzo) {
      // ── イカ天の権蔵（Level 3） ─────────────────────
      this.name   = 'イカ天の権蔵';
      this.avatar = '🦑';
      this.quote  = '……イカ天はな、カラッと揚がってなきゃ話にならねぇ。';
      this.order  = {
        dashi: 'soda',
        noodle: 'inaka',
        toppings: ['ikaten'],
        negiLevel: 'normal',
        togarashiLevel: 'normal'
      };
      this.price  = 700;

    } else {
      const template = CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)];
      this.name   = template.name;
      this.avatar = template.avatar;
      this.order  = this.generateRandomOrder();
      this.quote  = this.isSpicyLover
        ? SPICY_LOVER_QUOTES[Math.floor(Math.random() * SPICY_LOVER_QUOTES.length)]
        : template.quote;
      this.price  = this.calculatePrice(this.order);
    }
  }

  // 難易度・レベルに合わせたメニューからランダム注文を生成
  generateRandomOrder() {
    const dashis = ['katsuo', 'niboshi'];
    if (this.level >= 2) dashis.push('kombu');
    if (this.level >= 3) dashis.push('soda');

    const noodles = ['nihachi', 'juwari'];
    if (this.level >= 2) noodles.push('hegi');
    if (this.level >= 3) noodles.push('inaka');

    const dashi  = dashis[Math.floor(Math.random() * dashis.length)];
    const noodle = noodles[Math.floor(Math.random() * noodles.length)];

    // メニュータイプ
    const menuTypes = ['kake', 'tsukimi'];
    if (this.level >= 2) menuTypes.push('korokke');
    if (this.level >= 3) menuTypes.push('ikaten');

    const selectedMenu = menuTypes[Math.floor(Math.random() * menuTypes.length)];

    let toppings = [];
    if (selectedMenu === 'tsukimi') {
      toppings = ['raw_egg'];
    } else if (selectedMenu === 'korokke') {
      toppings = ['korokke'];
    } else if (selectedMenu === 'ikaten') {
      toppings = ['ikaten'];
    }

    // ネギの好み（通常: 70% normal, 20% nashi, 10% mashi）
    let negiLevel = 'normal';
    const negiRand = Math.random();
    if (negiRand < 0.20) {
      negiLevel = 'nashi';
    } else if (negiRand < 0.30) {
      negiLevel = 'mashi';
    }

    // トウガラシの好み
    let togarashiLevel = 'normal';
    if (this.isSpicyLover) {
      togarashiLevel = 'mashi'; // 辛党は確定でトウガラシ増し
    } else {
      const chiliRand = Math.random();
      if (chiliRand < 0.15) {
        togarashiLevel = 'nashi';
      } else if (chiliRand < 0.25) {
        togarashiLevel = 'mashi';
      }
    }

    return { dashi, noodle, toppings, negiLevel, togarashiLevel };
  }

  calculatePrice(order) {
    let base = 350;
    if (order.noodle === 'juwari') base += 50;
    if (order.noodle === 'hegi')   base += 80;
    if (order.noodle === 'inaka')  base += 100;

    if (order.toppings.includes('raw_egg')) base += 50;
    if (order.toppings.includes('korokke')) base += 100;
    if (order.toppings.includes('ikaten'))  base += 120;

    if (order.negiLevel === 'mashi')      base += 30;
    if (order.togarashiLevel === 'mashi') base += 20;

    return base;
  }

  getOrderName() {
    const dashiName  = DASHI_TYPES[this.order.dashi]?.name.replace('出汁', '') || '';
    const noodleName = NOODLE_TYPES[this.order.noodle]?.name || '';

    let toppingName = 'かけ';
    if (this.order.toppings.includes('ikaten')) {
      toppingName = 'イカ天';
    } else if (this.order.toppings.includes('korokke')) {
      toppingName = 'コロッケ';
    } else if (this.order.toppings.includes('raw_egg')) {
      toppingName = '月見';
    }

    let extra = '';
    if (this.order.negiLevel === 'mashi') extra += ' ネギ増し';
    if (this.order.negiLevel === 'nashi') extra += ' ネギ抜き';
    if (this.order.togarashiLevel === 'mashi') extra += ' 🌶️増し';
    if (this.order.togarashiLevel === 'nashi') extra += ' 🌶️抜き';

    return `${dashiName}・${noodleName}の${toppingName}そば${extra}`;
  }

  getRecipeIcons() {
    const dashiLabel   = DASHI_TYPES[this.order.dashi]
      ? `🥣${DASHI_TYPES[this.order.dashi].name.replace('出汁', '')}`
      : '?';
    const noodleLabel  = NOODLE_TYPES[this.order.noodle]
      ? `🍜${NOODLE_TYPES[this.order.noodle].name}`
      : '?';
    
    let toppingLabels = this.order.toppings.map(t => TOPPING_TYPES[t]?.icon + TOPPING_TYPES[t]?.name).join(' ');
    if (!toppingLabels) toppingLabels = '具なし';

    // ネギバッジ
    let negiBadge = '';
    if (this.order.negiLevel === 'mashi') {
      negiBadge = `<span class="recipe-badge negi-mashi-badge">🥬ネギ増し</span>`;
    } else if (this.order.negiLevel === 'nashi') {
      negiBadge = `<span class="recipe-badge negi-nashi-badge">🥬ネギ抜き</span>`;
    }

    // トウガラシバッジ
    let chiliBadge = '';
    if (this.order.togarashiLevel === 'mashi') {
      chiliBadge = `<span class="recipe-badge chili-mashi-badge">🌶️増し</span>`;
    } else if (this.order.togarashiLevel === 'nashi') {
      chiliBadge = `<span class="recipe-badge chili-nashi-badge">🌶️抜き</span>`;
    }

    let spiceRow = '';
    if (negiBadge || chiliBadge) {
      spiceRow = `<div class="recipe-row spice-row">${negiBadge}${chiliBadge}</div>`;
    } else {
      spiceRow = `<div class="recipe-row spice-row recipe-row-empty"><span class="recipe-badge recipe-badge-empty"></span></div>`;
    }

    return `
      <div class="recipe-column">
        <div class="recipe-row"><span class="recipe-badge noodle-badge">${noodleLabel}</span></div>
        <div class="recipe-row"><span class="recipe-badge dashi-badge">${dashiLabel}</span></div>
        <div class="recipe-row"><span class="recipe-badge topping-badge">${toppingLabels}</span></div>
        ${spiceRow}
      </div>
    `;
  }

  checkOrder(bowl) {
    if (!bowl.dashi || !bowl.noodle) return false;
    if (bowl.dashi  !== this.order.dashi)  return false;
    if (bowl.noodle !== this.order.noodle) return false;

    // トッピング（生卵、コロッケ、イカ天）の完全一致チェック
    if (bowl.toppings.length !== this.order.toppings.length) return false;
    const allToppingsMatch = this.order.toppings.every(t => bowl.toppings.includes(t));
    if (!allToppingsMatch) return false;

    // 1. 立食い師へのトウガラシ増しトラップ撃退
    if (this.isTachiguishi && bowl.togarashiLevel === 'mashi') {
      return 'spicy_defeat';
    }

    // 2. 立食い師への完璧茹で感服
    if (this.isTachiguishi && bowl.isPerfectCooked && bowl.togarashiLevel === 'normal' && bowl.negiLevel === 'normal') {
      return 'perfect_defeat';
    }

    // 立食い師は通常ネギ/トウガラシはnormalを要求
    if (this.isTachiguishi) {
      if (bowl.negiLevel !== 'normal' || bowl.togarashiLevel !== 'normal') {
        return false;
      }
      return true; // 食い逃げ開始へ
    }

    // 3. 激辛好き客へのトウガラシ増しボーナス！
    if (this.isSpicyLover) {
      if (bowl.togarashiLevel !== 'mashi') return false;
      if (bowl.negiLevel !== this.order.negiLevel) return false;
      return 'spicy_lover_success';
    }

    // 4. 通常客: ネギ・トウガラシのレベルが一致しているか
    if (bowl.negiLevel !== this.order.negiLevel) {
      return false;
    }
    if (bowl.togarashiLevel !== this.order.togarashiLevel) {
      return false;
    }

    // 5. 通常合格
    return true;
  }
}

