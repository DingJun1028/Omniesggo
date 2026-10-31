const fs = require('fs');
const iconv = require('iconv-lite');

// Map of common Big5 sequences misread as UTF-8 back to Chinese
// These are patterns observed in the codebase
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
    "璚": "環", // common variant
    "璝": "型", // common variant
    "摰": "實",
    "隞": "以",
    "雿": "作",
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
    "螛": "實"
};

function recoverContent(content) {
    let recovered = content;
    // Method 1: Pattern replacement (surgical)
    for (const [corrupted, clean] of Object.entries(REPLACEMENTS)) {
        const regex = new RegExp(corrupted, 'g');
        recovered = recovered.replace(regex, clean);
    }

    // Method 2: Try to re-decode if the whole block is Big5
    // But since the file is mixed (code is ASCII/UTF-8, comments/strings are garbled),
    // we have to be careful.
    
    return recovered;
}

const filesToRepair = [
    'c:/Project/esggo/lib/adk/right-wings.ts',
    'c:/Project/esggo/guide_raw.txt'
];

filesToRepair.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    console.log(`Processing ${filePath}...`);
    const buffer = fs.readFileSync(filePath);
    
    // Check if iconv is available, else use string replacement
    try {
        let content = buffer.toString('utf8');
        let repaired = recoverContent(content);
        
        fs.writeFileSync(filePath, repaired, 'utf8');
        console.log(`Repaired ${filePath}`);
    } catch (e) {
        console.error(`Error repairing ${filePath}:`, e);
    }
});
