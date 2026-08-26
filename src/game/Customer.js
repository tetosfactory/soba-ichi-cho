// 客クラス（通常のお客・月見の銀二・コロッケのお銀）

export const DASHI_TYPES = {
  katsuo: { id: 'katsuo', name: 'かつお出汁', color: '#c27b38', labelColor: '#8a4b10' },
  niboshi: { id: 'niboshi', name: '煮干し出汁', color: '#687885', labelColor: '#3c4a56' },
  kombu:   { id: 'kombu',  name: 'こんぶ出汁', color: '#4a7c59', labelColor: '#2d5c3a' }  // Level 2
};

export const NOODLE_TYPES = {
  nihachi: { id: 'nihachi', name: '二八そば',   color: '#9b8067', cookDuration: 3500 },
  juwari:  { id: 'juwari',  name: '十割そば',   color: '#5e4b3c', cookDuration: 4000 },
  hegi:    { id: 'hegi',    name: 'へぎ蕎麦',   color: '#7ab87a', cookDuration: 4500 }  // Level 2
};

export const TOPPING_TYPES = {
  negi:        { id: 'negi',        name: 'ネギ',       color: '#5eb347', icon: '🥬' },
  raw_egg:     { id: 'raw_egg',     name: '生卵',       color: '#f5cd47', icon: '🥚' },
  korokke:     { id: 'korokke',     name: 'コロッケ',   color: '#c87941', icon: '🧆' },  // Level 2
  spicy_chili: { id: 'spicy_chili', name: '激辛七味',   color: '#e63946', icon: '🌶️' }
};

const CUSTOMER_AVATARS = [
  { name: 'サラリーマン山田', avatar: '👨‍💼', quote: '腹減った！早くね！' },
  { name: '職人サトシ',       avatar: '👷',   quote: 'うまい出汁を頼むよ' },
  { name: '学生タクヤ',       avatar: '🧑‍🎓', quote: '安くてうまいやつで！' },
  { name: 'ご隠居キヨシ',     avatar: '👨‍🦳', quote: '熱々の蕎麦をおくれ' },
  { name: 'OLエリ',           avatar: '👩‍💼', quote: '月見そばが食べたいな' },
  { name: '板前ケンジ',       avatar: '👨‍🍳', quote: 'へぎ蕎麦とコロッケ頼む' }  // Level 2常連
];

const SPICY_LOVER_QUOTES = [
  '刺激的な辛〜い蕎麦が食べたいな…🌶️',
  '汗が吹き飛ぶほど辛いやつ、期待してるぜ！🔥',
  '今日は無性にカプサイシンを欲してるんだ…！',
  'ピリッと辛い隠し味、入れてくれてもいいんだぜ？🌶️'
];

export class Customer {
  constructor(id, isGinji = false, isOgin = false, difficulty = 'normal', level = 1) {
    this.id = id;
    this.isGinji = isGinji;
    this.isOgin  = isOgin;
    this.isTachiguishi = isGinji || isOgin;
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
      this.order  = { dashi: 'katsuo', noodle: 'juwari', toppings: ['negi', 'raw_egg'] };
      this.price  = 500;

    } else if (isOgin) {
      // ── コロッケのお銀（Level 2） ─────────────────────
      this.name   = 'コロッケのお銀';
      this.avatar = '💃';
      this.quote  = 'コロッケはね、サクサクじゃないと意味がないの。';
      this.order  = { dashi: 'kombu', noodle: 'nihachi', toppings: ['negi', 'korokke'] };
      this.price  = 600;

    } else {
      const template = CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)];
      this.name   = template.name;
      this.avatar = template.avatar;
      this.quote  = this.isSpicyLover
        ? SPICY_LOVER_QUOTES[Math.floor(Math.random() * SPICY_LOVER_QUOTES.length)]
        : template.quote;
      this.order  = this.generateRandomOrder();
      this.price  = this.calculatePrice(this.order);
    }
  }

  // 難易度・レベルに合わせたメニューからランダム注文を生成
  generateRandomOrder() {
    // Level 1: katsuo / niboshi のみ。Level 2: kombu も追加
    const dashis  = this.level >= 2
      ? ['katsuo', 'niboshi', 'kombu']
      : ['katsuo', 'niboshi'];
    const noodles = this.level >= 2
      ? ['nihachi', 'juwari', 'hegi']
      : ['nihachi', 'juwari'];

    const dashi  = dashis[Math.floor(Math.random() * dashis.length)];
    const noodle = noodles[Math.floor(Math.random() * noodles.length)];

    // メニュータイプ
    const menuTypes = this.level >= 2
      ? ['kake', 'negi', 'tsukimi', 'korokke']
      : ['kake', 'negi', 'tsukimi'];
    const selectedMenu = menuTypes[Math.floor(Math.random() * menuTypes.length)];

    let toppings = [];
    if (selectedMenu === 'negi') {
      toppings = ['negi'];
    } else if (selectedMenu === 'tsukimi') {
      toppings = ['negi', 'raw_egg'];
    } else if (selectedMenu === 'korokke') {
      toppings = ['negi', 'korokke'];
    }

    return { dashi, noodle, toppings };
  }

  calculatePrice(order) {
    let base = 350;
    if (order.noodle === 'juwari') base += 50;
    if (order.noodle === 'hegi')   base += 80;
    if (order.toppings.includes('negi'))    base += 50;
    if (order.toppings.includes('raw_egg')) base += 50;
    if (order.toppings.includes('korokke')) base += 100;
    return base;
  }

  getOrderName() {
    const dashiName  = DASHI_TYPES[this.order.dashi].name.replace('出汁', '');
    const noodleName = NOODLE_TYPES[this.order.noodle].name;

    let toppingName = 'かけ';
    if (this.order.toppings.includes('korokke')) {
      toppingName = 'コロッケ';
    } else if (this.order.toppings.includes('negi') && this.order.toppings.includes('raw_egg')) {
      toppingName = '月見';
    } else if (this.order.toppings.includes('negi')) {
      toppingName = 'ネギ';
    }

    return `${dashiName}・${noodleName}の${toppingName}そば`;
  }

  getRecipeIcons() {
    const dashiLabel   = DASHI_TYPES[this.order.dashi]
      ? `🥣${DASHI_TYPES[this.order.dashi].name.replace('出汁', '')}`
      : '?';
    const noodleLabel  = NOODLE_TYPES[this.order.noodle]
      ? `🍜${NOODLE_TYPES[this.order.noodle].name}`
      : '?';
    const cleanTops    = this.order.toppings.filter(t => t !== 'spicy_chili');
    let toppingLabels  = cleanTops.map(t => TOPPING_TYPES[t].icon + TOPPING_TYPES[t].name).join(' ');
    if (!toppingLabels) toppingLabels = '具なし';

    // Order: noodle first, then dashi, then toppings
    return `<span class="recipe-noodle">${noodleLabel}</span> | <span class="recipe-dashi">${dashiLabel}</span> | <span class="recipe-toppings">${toppingLabels}</span>`;
  }

  checkOrder(bowl) {
    if (!bowl.dashi || !bowl.noodle) return false;
    if (bowl.dashi  !== this.order.dashi)  return false;
    if (bowl.noodle !== this.order.noodle) return false;

    const hasChili = bowl.toppings.includes('spicy_chili');

    // 1. 立食い師への激辛七味トラップ
    if (this.isTachiguishi && hasChili) {
      return 'spicy_defeat';
    }

    const cleanToppings = bowl.toppings.filter(t => t !== 'spicy_chili');
    if (cleanToppings.length !== this.order.toppings.length) return false;
    const allMatch = this.order.toppings.every(t => cleanToppings.includes(t));
    if (!allMatch) return false;

    // 2. 激辛好き客への激辛七味トッピングボーナス！
    if (this.isSpicyLover && hasChili) {
      return 'spicy_lover_success';
    }

    // 3. 辛党ではない普通客に七味が入っていた場合は不合格（辛すぎて食べられない）
    if (!this.isTachiguishi && !this.isSpicyLover && hasChili) {
      return false;
    }

    // 4. 立食い師への完璧茹で感服
    if (this.isTachiguishi && bowl.isPerfectCooked) {
      return 'perfect_defeat';
    }

    // 5. 通常合格（辛党客に七味がなくても通常通り合格）
    return true;
  }
}
