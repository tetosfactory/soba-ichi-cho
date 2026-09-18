// One shared portrait atlas keeps character artwork consistent across all scenes.
const names = ['月見の銀二', 'コロッケの揚羽', 'イカ天の権蔵', '海老天の丈二',
  'サラリーマン山田', '職人サトシ', '学生タクヤ', 'ご隠居キヨシ', 'OLエリ',
  '板前ケンジ', '釣り人タケシ', 'トラッカー熊田', '御曹司タカシ', '横取り猫の小鉄'];

export function portrait(name, extra = '') {
  const index = Math.max(0, names.indexOf(name));
  return `<span class="anime-portrait ${extra}" role="img" aria-label="${name}" style="--portrait-x:${index % 4 * 100 / 3}%;--portrait-y:${Math.floor(index / 4) * 100 / 3}%"></span>`;
}

export const titleIntro = `<div class="title-hero">
  <div class="hero-copy"><span class="eyebrow">SOBA ICHICHO / KITCHEN STORIES</span>
  <h3>一杯に、<br>本気をそそげ。</h3><p>湯気の向こうに、今日の物語。<br>個性豊かな常連たちを、最高の一杯で迎えよう。</p>
  <span class="hero-tag">蕎麦屋のおしごと × スピードアクション</span></div>
  <span class="anime-portrait hero-chef" role="img" aria-label="蕎麦屋の看板シェフ" style="--portrait-x:66.666667%;--portrait-y:100%"></span>
</div><div class="rival-line"><span>噂の立食い師たち</span>${names.slice(0,4).map(name => portrait(name)).join('')}<small>その一杯で、勝負。</small></div>`;
