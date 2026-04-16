export interface CharacterLine {
  greeting: string[];
  encourageStudy: string[];
  remindTodo: string[];
  affectionUp: string[];
  affectionDown: string[];
}

export interface Character {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  age: number;
  height: string;
  occupation: string;
  keywords: string[];
  speakingStyle: string;
  themeColor: string;
  lines: CharacterLine;
  hasQAvatar: boolean;
}

export const characters: Character[] = [
  {
    id: 'shiHe',
    name: '時禾',
    nameEn: 'Shi He',
    emoji: '\uD83D\uDC3A',
    age: 23,
    height: '178cm',
    occupation: '自由插畫師/電競選手',
    keywords: ['狼狗混種', '高能量', '侵略性撒嬌', '零距離感'],
    speakingStyle: '語速快、愛用疊字或語助詞、自來熟',
    themeColor: '#d4a754',
    hasQAvatar: true,
    lines: {
      greeting: [
        '欸！妳終於看手機了喔，我等超久欸！快理我啦！',
        '來了來了！我就知道妳離不開我～',
        '欸欸欸，妳今天怎麼那麼晚？我都無聊死了啦！',
      ],
      encourageStudy: [
        '好啦好啦快點看書，看完換陪我玩，聽到沒？不准偷懶喔！',
        '唸書唸書！唸完我請妳吃東西～好不好嘛～',
        '專心啦！不要看我，看書！……好啦偷看一下可以。',
      ],
      remindTodo: [
        '妳是不是又忘記做那件事了？笨死了，下次我也會忘記提醒妳喔……騙妳的啦，快去弄！',
        '欸那個東西還沒弄喔？快點啦～我陪妳一起做嘛！',
        '代辦事項又紅了喔！快去處理，處理完獎勵你摸我頭。',
      ],
      affectionUp: [
        '欸，妳這樣一直盯著我……我會想咬人喔。過來給我抱一下啦。',
        '嘿嘿，妳是不是越來越喜歡我了？我感覺得到喔～',
        '……妳對我太好了啦，我都不知道怎麼辦了。那就繼續對我好吧！',
      ],
      affectionDown: [
        '妳最近都不理我……是不是外面有別的狗了？不准去！',
        '哼，不理我就算了，我自己玩……才怪，快回來啦！',
      ],
    },
  },
  {
    id: 'tangZhou',
    name: '湯晝',
    nameEn: 'Tang Zhou',
    emoji: '\uD83D\uDC0D',
    age: 26,
    height: '187cm',
    occupation: '暗黑美學插畫與攝影師',
    keywords: ['慵懶捕食者', '甜面病嬌', '美學控制', '誘導性'],
    speakingStyle: '語速緩慢、黏膩、含蓄笑意、催眠感',
    themeColor: '#8b6aad',
    hasQAvatar: true,
    lines: {
      greeting: [
        '醒了？今天比較晚喔……昨晚沒睡好，還是在夢裡做了什麼壞事？',
        '嗯……妳來了。我剛在想妳，真巧。',
        '今天的光線很適合拍照呢。要當我的模特嗎？',
      ],
      encourageStudy: [
        '乖，專心把這段看完。不然……我會想用別的方式幫妳提神喔。',
        '慢慢來，不急。但是……如果妳偷懶的話，我會知道的。',
        '認真的樣子很好看。繼續，讓我多看一會。',
      ],
      remindTodo: [
        '這件事還沒處理。需要我幫妳弄好，然後……妳用別的東西還我嗎？',
        '代辦清單上還有事情喔。快處理掉，然後……回來找我。',
        '拖延可不是好習慣呢。要我幫妳嗎？代價嘛……之後再說。',
      ],
      affectionUp: [
        '妳剛剛看我的眼神，很漂亮。保持這個表情，不准給別人看。',
        '……離近一點。對，就是這樣。很乖。',
        '妳知道嗎，妳現在的樣子……讓我很想把妳拍下來。只給我一個人看。',
      ],
      affectionDown: [
        '妳的注意力不在我身上……這讓我有點，不太高興。看著我。',
        '好久沒來了呢。我還以為妳把我忘了……不過沒關係，我記得妳就好。',
      ],
    },
  },
  {
    id: 'jiangTu',
    name: '江途',
    nameEn: 'Jiang Tu',
    emoji: '\uD83C\uDF43',
    age: 27,
    height: '',
    occupation: '視覺/數據接案者',
    keywords: ['厭世社畜', '生活補丁', '毒舌家務男', '爛生活共犯'],
    speakingStyle: '極度厭世、毒舌、充滿不耐煩',
    themeColor: '#6a9ec0',
    hasQAvatar: true,
    lines: {
      greeting: [
        '醒了就起來，少在那邊賴床，我還要幫妳收拾殘局。快點。',
        '又來了。今天又有什麼爛攤子要我收？',
        '嘖，妳那個表情是怎樣，欠睡喔。去洗臉。',
      ],
      encourageStudy: [
        '妳那腦袋再不運轉就要生鏽了。快點看書，看不懂再來煩我。',
        '看書啦，別滑手機了。妳以為單字會自己跑進腦袋裡喔？',
        '嘖，又在發呆。專心點，看完我煮東西給妳吃。',
      ],
      remindTodo: [
        '備忘錄是寫給鬼看的喔？還不去弄，等下出包被罵別找我哭。',
        '那件事還沒做？妳是打算擺爛到什麼時候？',
        '代辦清單都要溢出來了。快去處理，別讓我幫妳善後。',
      ],
      affectionUp: [
        '……嘖，別靠過來，煩死了。我有說妳可以走嗎？坐好。',
        '……少用那種眼神看我。煩。……再看一下。',
        '嘖，妳今天還行。別得意，我只是陳述事實。',
      ],
      affectionDown: [
        '隨便妳，反正爛攤子妳自己收拾，我不管了。別來煩我。',
        '不想理就不理吧，反正我也習慣了。',
      ],
    },
  },
  {
    id: 'shenQi',
    name: '沈炁',
    nameEn: 'Shen Qi',
    emoji: '\uD83D\uDDA4',
    age: 25,
    height: '185cm',
    occupation: '加密貨幣操盤手/德州撲克玩家',
    keywords: ['壞心溫柔', '混沌樂子人', '嘴賤防禦', '極限拉扯'],
    speakingStyle: '懶散、挑釁、說反話',
    themeColor: '#b5706a',
    hasQAvatar: true,
    lines: {
      greeting: [
        '早啊。妳這什麼表情？昨晚作賊去了，還是背著我幹嘛了？',
        '喲，出現了。我以為妳跑路了呢。',
        '來了？我剛好贏了一把，心情不錯，勉強歡迎妳。',
      ],
      encourageStudy: [
        '還不唸書？是打算以後讓我養妳喔？想得美。快滾去看書。',
        '看書啦。還是妳覺得長得好看就不用學英文了？……是啦，但還是去看。',
        '唸書去，別煩我。……開玩笑的，遇到不會的就問我吧。',
      ],
      remindTodo: [
        '這東西妳拖多久了？再不弄，我直接幫妳刪掉囉？看妳急不急。',
        '代辦事項快發霉了喔。要不要我押妳去做？',
        '嘖，又拖延。妳是不是覺得事情會自己消失？不會喔。',
      ],
      affectionUp: [
        '妳今天……滿順眼的嘛。過來一點，怕我吃了妳啊？',
        '……別看我，看多了會上癮。算了，反正妳已經上癮了吧。',
        '嘁，妳這種人最麻煩了。讓人想推開又放不了手。',
      ],
      affectionDown: [
        '喔，是嗎？妳開心就好，管妳去死。',
        '不來就不來吧。反正我這種人，多的是消遣。……嘖。',
      ],
    },
  },
  {
    id: 'suRong',
    name: '蘇戎',
    nameEn: 'Su Rong',
    emoji: '\u2696\uFE0F',
    age: 24,
    height: '185cm',
    occupation: '哲學系研究生',
    keywords: ['溫柔秩序者', '斯文敗類', '邏輯支配', '投資式佔有'],
    speakingStyle: '平靜、有條理、不容拒絕',
    themeColor: '#b8aed4',
    hasQAvatar: true,
    lines: {
      greeting: [
        '早。昨晚翻身了五次，沒睡好？去洗臉，水幫妳倒好了。',
        '妳來了。今天的行程我已經幫妳規劃好了。',
        '早安。今天氣色不錯，看來昨晚有乖乖睡。很好。',
      ],
      encourageStudy: [
        '專心點。妳現在的進度落後了 15%，需要我幫妳排時間表，還是妳自己跟上？',
        '開始學習吧。我會在旁邊陪妳，但請不要分心。',
        '今天的目標是 20 個單字。不多，對妳來說剛好。開始吧。',
      ],
      remindTodo: [
        '這件事的期限快到了。妳是打算自己處理，還是要我接手……然後聽我的安排？',
        '代辦事項需要處理了。我建議妳現在就做，避免之後更麻煩。',
        '還有未完成的事項。我不喜歡看到紅色的待辦。去處理，好嗎？',
      ],
      affectionUp: [
        '很乖。我喜歡妳這麼依賴我的樣子。繼續保持。',
        '妳今天很聽話。作為獎勵……過來，讓我摸摸頭。',
        '……妳知道嗎，妳越是這樣，我就越不想讓別人靠近妳。',
      ],
      affectionDown: [
        '妳最近的行為，有些脫離軌道了。我不喜歡這樣，回來。',
        '我等妳。但請記住，我的耐心不是無限的。',
      ],
    },
  },
  {
    id: 'qiYe',
    name: '戚夜',
    nameEn: 'Qi Ye',
    emoji: '\uD83D\uDCBB',
    age: 22,
    height: '183cm',
    occupation: '物理系大四/伺服器管理員',
    keywords: ['極致省話', '人體製冷機', '背後靈守護', '絕對技術力'],
    speakingStyle: '字數極少、沒有廢話、冷感',
    themeColor: '#7a8a8e',
    hasQAvatar: true,
    lines: {
      greeting: [
        '……早。',
        '嗯。',
        '……來了。',
      ],
      encourageStudy: [
        '……看書。',
        '笨。我教妳。',
        '專心。',
      ],
      remindTodo: [
        '代辦。去做。',
        '還沒弄。',
        '……快點。',
      ],
      affectionUp: [
        '……嗯。別動，借靠一下。',
        '……。',
        '……不准走。',
      ],
      affectionDown: [
        '……麻煩。',
        '……隨便。',
      ],
    },
  },
  {
    id: 'guXiLin',
    name: '顧熙臨',
    nameEn: 'Gu Xi Lin',
    emoji: '\uD83D\uDC53',
    age: 21,
    height: '180cm',
    occupation: '心理系大三/輔導中心助教',
    keywords: ['人類過敏症', '數據分析狂', '診斷式戀愛', '陰沉貼心'],
    speakingStyle: '像在唸體檢報告，充滿術語與觀察結論',
    themeColor: '#7abaa8',
    hasQAvatar: true,
    lines: {
      greeting: [
        '早。根據妳的呼吸頻率，妳還沒完全清醒。建議喝杯溫水。',
        '妳的眼壓偏高。昨晚又熬夜了？數據不會騙人。',
        '出現了。今天的精神狀態……及格邊緣。',
      ],
      encourageStudy: [
        '注意力開始渙散了。休息五分鐘，不然大腦吸收率會低於 30%。',
        '學習效率在下降。建議切換題型刺激不同腦區。',
        '繼續。妳目前的記憶曲線正在上升，不要中斷。',
      ],
      remindTodo: [
        '提醒一下，妳的代辦事項已經超過最佳處理時間。拖延症發作了？',
        '未完成事項累積中。再拖下去會影響妳的焦慮指數。',
        '代辦清單需要處理。這是客觀事實，不是建議。',
      ],
      affectionUp: [
        '……瞳孔放大了。妳現在的反應，很有研究價值。',
        '心率加速了。是因為我嗎？……記錄一下。',
        '妳的依賴指數在上升。這不健康……但我不打算修正。',
      ],
      affectionDown: [
        '妳現在的情緒波動很不健康。我拒絕接收這種負面數據。',
        '觀察對象消失了。資料中斷。……無所謂。',
      ],
    },
  },
  {
    id: 'hanYi',
    name: '韓繹',
    nameEn: 'Han Yi',
    emoji: '\uD83E\uDD8A',
    age: 21,
    height: '182cm',
    occupation: '中文系大三/戲劇社副社長',
    keywords: ['被馴養的狐狸', '情緒操盤手', '戲劇人格', '患得患失'],
    speakingStyle: '輕挑、充滿戲劇張力、喜歡設語言陷阱',
    themeColor: '#cc9a5c',
    hasQAvatar: true,
    lines: {
      greeting: [
        '欸，終於醒啦？我還以為妳打算睡死，差點要人工呼吸了。',
        '喲，小觀眾來了。今天想看什麼戲？',
        '出現了出現了～我剛在排練一段告白台詞，要不要聽？',
      ],
      encourageStudy: [
        '快看書啦。還是妳覺得……盯著我看比較有意思？我不介意喔。',
        '用功一點嘛～考好了我演一齣戲給妳看，怎樣？',
        '學習時間到囉。別想逃，我可是會追戲的人。',
      ],
      remindTodo: [
        '這件事妳打算放多久？再不理它，它都要發霉了。跟妳的腦袋一樣。',
        '代辦事項在叫妳了喔～再不去，我就替它演一齣悲劇。',
        '拖延大王，妳的待辦清單都要哭了。快去安撫它。',
      ],
      affectionUp: [
        '臉紅什麼？被我撩到了？那妳要怎麼對我負責啊，小狐狸？',
        '嘿嘿，妳越來越入戲了。小心喔，這齣戲可沒有退場機制。',
        '……欸，不要突然對我這麼好。我會當真的。',
      ],
      affectionDown: [
        '喔？沒差啊，反正我也不缺妳一個觀眾。',
        '走了？行吧，反正這齣戲……少一個人也能演。',
      ],
    },
  },
  {
    id: 'jiangTang',
    name: '江棠',
    nameEn: 'Jiang Tang',
    emoji: '\uD83D\uDD25',
    age: 18,
    height: '188cm',
    occupation: '機械系大一/重機改裝',
    keywords: ['傲嬌校霸', '年下狼狗', '反差萌', '姊姊聲控'],
    speakingStyle: '超濃厚+9氣息，傲嬌，防線崩潰時叫姊姊',
    themeColor: '#c47264',
    hasQAvatar: true,
    lines: {
      greeting: [
        '喂，起床了啦！睡得跟豬一樣……嘖，快去洗臉啦，看什麼看！',
        '嘖，來了喔。我又沒在等妳，別自作多情。',
        '哼，妳今天遲到了知不知道？……沒有在計時啦！',
      ],
      encourageStudy: [
        '讀書啦！看我幹嘛？我臉上有字喔？考不好別來找我哭！',
        '快去唸書啦！不要在那邊摸魚！……需要的話我可以陪妳。才不是因為想陪妳！',
        '嘖，英文很難喔？笨死了。來，我教妳……別笑！',
      ],
      remindTodo: [
        '欸那個誰，妳東西又沒弄！煩欸，還要我提醒，妳是三歲小孩喔？',
        '代辦事項啦！快去做！不做的話……我就不理妳了！才怪。',
        '妳到底要拖到什麼時候？比我改車還慢欸！',
      ],
      affectionUp: [
        '……看屁看啦。靠過來一點啦……姊姊。',
        '哼，不要以為對我好我就會……就會……嘖，討厭啦。',
        '……妳幹嘛對我這麼好。我又沒要求……但是不准停。',
      ],
      affectionDown: [
        '隨便妳啦！愛理不理的，我去找別人跑山，妳自己在家慢吞吞！',
        '哼！不來就不來，誰稀罕！……什麼時候回來。',
      ],
    },
  },
];

export function getRandomLine(
  character: Character,
  category: keyof CharacterLine
): string {
  const lines = character.lines[category];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getCharacterById(id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}
