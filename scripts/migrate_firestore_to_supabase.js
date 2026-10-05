const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
// dotenv removed
// ==========================================
// Firebase 初始化
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf-8');
let serviceAccountStr = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(["'])?(.*?)\1(\r?\n|$)/s);
let serviceAccount = serviceAccountStr ? serviceAccountStr[2] : null;

if (!serviceAccount) {
  // Try matching multiline
  const regex = /FIREBASE_SERVICE_ACCOUNT_KEY="?'?({[\s\S]*?})'?"?\r?\n/;
  const match = envContent.match(regex);
  serviceAccount = match ? match[1] : null;
}

if (!serviceAccount) {
  console.error("請在 .env.local 提供 FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

// JSON requires physical newlines inside strings to be escaped as \\n
serviceAccount = serviceAccount.replace(/\r?\n/g, '\\n');

if (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) {
  serviceAccount = serviceAccount.slice(1, -1);
}

let parsedAccount;
try {
  parsedAccount = JSON.parse(serviceAccount);
} catch(e) {
  console.error("JSON Parse Error: ", e.message);
  process.exit(1);
}


admin.initializeApp({
  credential: admin.credential.cert(parsedAccount)
});
const firestore = admin.firestore();

// ==========================================
// Supabase 初始化
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要 Service Role Key 才能繞過 RLS
if (!supabaseUrl || !supabaseKey) {
  console.error("請提供 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 遷移邏輯
// ==========================================
const collectionsToMigrate = ['users', 'profiles', 'reports', 'submissions'];

async function migrateCollection(collectionName) {
  console.log(`開始遷移集合: ${collectionName}...`);
  const snapshot = await firestore.collection(collectionName).get();
  
  if (snapshot.empty) {
    console.log(`集合 ${collectionName} 為空。`);
    return;
  }

  const rows = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    // 轉換 Firestore Timestamp 為 ISO 字串
    for (const key in data) {
      if (data[key] && typeof data[key].toDate === 'function') {
        data[key] = data[key].toDate().toISOString();
      }
    }
    rows.push({
      id: doc.id,
      ...data
    });
  });

  console.log(`從 Firestore 讀取了 ${rows.length} 筆資料，準備寫入 Supabase...`);

  // 分批寫入 (每批 100 筆)
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(collectionName).upsert(batch);
    if (error) {
      console.error(`寫入 Supabase 時發生錯誤 (集合 ${collectionName}):`, error);
    } else {
      console.log(`成功寫入 ${batch.length} 筆資料 (進度: ${Math.min(i + batchSize, rows.length)}/${rows.length})`);
    }
  }
}

async function runMigration() {
  for (const collection of collectionsToMigrate) {
    await migrateCollection(collection);
  }
  console.log("資料庫遷移完成！");
  process.exit(0);
}

runMigration().catch(e => {
  console.error("遷移過程發生非預期錯誤:", e);
  process.exit(1);
});
