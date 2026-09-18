# そば一丁！ ビジュアル刷新

深い青緑・アイボリー・朱色の配色。アニメ風の常連客9人、立食い師4人、小鉄、シェフ2人を4×4の共通アトラスで管理します。接客カード、タイトル、襲来演出で使用しています。

- 素材: `public/art/characters.png`
- 描画と人物対応: `src/visuals.js`
- UI: `src/modern.css`
- 生成: 組み込み image_gen ツール。下記プロンプトで生成した画像を加工せず配置し、CSSで各セルを表示。
- 動作確認: 390×844で開始、茹でる、湯切り、出汁、薬味抜き、提供成功（448円加算）。PC表示と銀二の登場演出も確認。全ステージ通しプレイ、iOS/Android実機は未実施。
- 小さい画面では調理エリアを縦にスクロール可能。画面切り替え時の自動全画面化を解除し、ブラウザーの表示サイズを保持。

## 画像生成プロンプト

Use case: stylized-concept. Production asset for Japanese mobile soba cooking game. Create one precisely aligned 4 column by 4 row character portrait atlas, square image, 16 equal square tiles edge to edge, no gutters, no borders, no text. Each tile a polished original contemporary Japanese anime bust portrait, beautifully drawn expressive eyes, crisp ink and sophisticated cel shading, warm cream background identical in all tiles, centered entire head with generous headroom, chest at bottom. Unified premium anime game art direction with deep teal, coral, gold accents. Row 1 left to right: mysterious handsome silver-haired man in dark fedora and trench coat; confident beautiful adult woman with black bob, red kimono jacket and butterfly hair ornament; rugged older fisherman with gray beard and indigo bandana; handsome blond adult man in black designer jacket and sunglasses. Row 2: young male office worker in navy suit; cheerful male construction worker wearing yellow helmet; young adult male student in hoodie; kind elderly man with white hair and round glasses. Row 3: fashionable adult office woman with chestnut ponytail; male Japanese chef with white headband; cheerful fisherman in olive fishing hat; sturdy truck driver in dark cap. Row 4: elegant young adult male heir in white suit; mischievous orange tabby cat with red scarf; cheerful young adult female soba chef with dark ponytail and teal apron holding bowl; cheerful young adult male soba chef with dark hair and teal apron. All portraits distinct, attractive, clean readable silhouettes at small size. No letters, logos or watermarks.
