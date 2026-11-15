const fs = require('fs');

const REPLACEMENTS = {
    "瘞豢": "永續",
    "瘞貊": "基礎",
    "": "發",
    "": "大",
    "": "報",
    "鈭": "人",
    "蝬": "網",
    "撠": "就",
    "銝": "下",
    "敺": "往",
    "蝯": "終",
    "撱": "建",
    "璆": "產",
    "皞": "環",
    "蝑": "等",
    "霈": "配",
    "瑼": "檢",
    "璅": "型",
    "憭": "多",
    "蝭": "結",
    "甇": "正",
    "雿": "作",
    "頧": "轉",
    "瘛": "智",
    "甈": "次",
    "憪": "委",
    "璚": "環",
    "璝": "型",
    "摰": "實",
    "隞": "以",
    "隤": "說",
    "鞎": "資",
    "鞈": "訊",
    "頛": "領",
    "頞": "跨",
    "頲": "項",
    "頵": "項",
    "頽": "類",
    "顄": "類",
    "蝳": "統",
    "蝵": "綜",
    "蝹": "統",
    "蝺": "管",
    "蝻": "範",
    "蝽": "管",
    "蠑": "範",
    "螿": "績",
    "螁": "編",
    "螄": "繼",
    "螇": "綜",
    "螉": "績",
    "螊": "績",
    "螏": "緝",
    "螐": "績",
    "螗": "誠",
    "螚": "實",
    "螛": "實",
    // New patterns found in guide_raw.txt
    "勗": "告",
    "": "範",
    "": "定",
    "豢": "時",
    "敶": "頻",
    "": "率",
    "餌": "次",
    "砍": "公",
    "": "司",
    "終": "組", // sometimes 終 matches 組 in context
    "": "織",
    "嗆": "管",
    "祥": "理",
    "以": "介", // 以 -> 介 in "介紹"?
    "晶": "紹",
    "": "核",
    "": "心",
    "": "願",
    "敹": "景",
    "": "承",
    "平": "諾",
    "箇": "立",
    "拙": "基",
    "拿": "礎",
    "": "信",
    "人": "任",
    "箸": "架",
    "": "構",
    "靽": "維",
    "∩": "及",
    "遙": "度",
    "蝞": "策",
    "∠": "略",
    "銋": "治",
    "脣": "管",
    "等": "指",
    "": "引",
    "": "準",
    "": "與",
    "": "邊",
    "產": "界",
    "剝": "定"
};

const filePath = 'c:/Project/esggo/guide_raw.txt';
if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

for (const [corrupted, clean] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(corrupted, 'g');
    content = content.replace(regex, clean);
}

// Clean up remaining ? if they are obviously broken
content = content.replace(/\?{2,}/g, '...'); 

fs.writeFileSync(filePath, content, 'utf8');
console.log('Enhanced recovery complete.');
