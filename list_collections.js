const admin = require("firebase-admin");
require('dotenv').config({ path: '.env.local' });

try {
  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
    process.exit(1);
  }
  
  if (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) {
    serviceAccount = serviceAccount.slice(1, -1);
  }
  serviceAccount = JSON.parse(serviceAccount);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = admin.firestore();
  
  db.listCollections().then(collections => {
    collections.forEach(collection => {
      console.log('Collection:', collection.id);
    });
    process.exit(0);
  }).catch(e => {
    console.error("Error listing collections:", e);
    process.exit(1);
  });
} catch (e) {
  console.error(e);
}
