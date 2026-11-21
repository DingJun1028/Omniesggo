/**
 * replaySync.gs — 課程回放自動化（Google Apps Script）
 * ============================================================
 * 功能：監聽一支 Google Drive 資料夾，自動抓出裡面影片的 FILE_ID，
 *       並在影片一新增就寫入一筆「自動化設定紀錄」，最後以 JSONP 回傳
 *       前端「課程回放」頁面所需的影片清單（id / week / title / date）。
 *
 * 這份腳本要做兩件事：
 *   1) doGet()        —— 被前端 JSONP 呼叫，回傳最新影片清單（即時、無快取層）。
 *   2) 安裝觸發器     —— 監聽 onDriveChange，只要有新檔案進資料夾就自動處理。
 *
 * 部署流程請見 docs/REPLAY_AUTOMATION.md（繁體中文）。
 */

// ===== 只需改這裡 =====
var CONFIG = {
  // 教學影片資料夾 ID（網址 drive.google.com/drive/folders/<這段> 中的那段）
  FOLDER_ID: '1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy',

  // 自動化設定想要寫入的試算表（第一次執行會自動建立，之後會重用）。
  // 留空 '' 會自動在 Google Drive 根目錄建立「ESG回放自動化設定」試算表。
  SETTINGS_SHEET_ID: '',

  // 影片判斷：只處理這些 MIME 類型的檔案。
  VIDEO_MIME: [
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/x-matroska', 'video/mpeg'
  ],

  // 預設週次/標題規則：若檔名含「第N週/Week N」會自動標週次；否則用「第 N 週」依序編號。
  DEFAULT_WEEK_PREFIX: '第 '
};

// ===== 內部常數 =====
var SHEET_NAME = 'replay_videos';

/**
 * 主入口：前端 JSONP 呼叫。
 * 網址範例： https://script.google.com/macros/s/<ID>/exec?callback=onReplayData_abc
 */
function doGet(e) {
  var list = buildVideoList();
  var callback = e && e.parameter && e.parameter.callback;
  var payload = JSON.stringify({ updatedAt: new Date().toISOString(), videos: list });

  if (callback) {
    // JSONP：把資料包進 callback(...) 讓 <script> 直接執行。
    return ContentService.createTextOutput(callback + '(' + payload + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  // 沒有 callback（除錯用，直接在瀏覽器開）就回傳純 JSON。
  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 監聽到 Drive 變更時自動執行（事件觸發器 onDriveChange）。
 * 這裡只需要「重新整理設定紀錄」——真正的清單由 doGet 即時產生，
 * 所以觸發器的主要工作是：把新影片記錄下來（含週次/標題/日期），
 * 並確保資料夾內每支影片都設定為「任何知道連結的人都能檢視」。
 */
function onDriveChange(e) {
  var files = listVideoFiles();
  var sheet = getSettingsSheet();
  var existing = readAllRows(sheet);
  var existingIds = existing.map(function (r) { return r.id; });

  files.forEach(function (f) {
    if (existingIds.indexOf(f.id) === -1) {
      // 新影片：自動設定共用 + 寫入設定紀錄
      ensurePublicView(f.id);
      var row = {
        id: f.id,
        week: inferWeek(f.name, existing.length + 1),
        title: inferTitle(f.name),
        date: formatDate(f.date)
      };
      appendRow(sheet, row);
      existingIds.push(f.id);
    }
  });
}

/** 組出前端要的陣列。優先用試算表裡「管理員手動編輯過」的設定，否則用自動推測值。 */
function buildVideoList() {
  var files = listVideoFiles();
  var sheet = getSettingsSheet();
  var overrides = {};
  readAllRows(sheet).forEach(function (r) {
    if (r.id) overrides[r.id] = r;
  });

  return files.map(function (f, i) {
    var o = overrides[f.id];
    if (o) {
      return {
        id: f.id,
        week: o.week || inferWeek(f.name, i + 1),
        title: o.title || inferTitle(f.name),
        date: o.date || formatDate(f.date)
      };
    }
    return {
      id: f.id,
      week: inferWeek(f.name, i + 1),
      title: inferTitle(f.name),
      date: formatDate(f.date)
    };
  });
}

/** 列出資料夾內所有影片檔（依建立時間由舊到新）。 */
function listVideoFiles() {
  var folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
  var out = [];
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    var mime = f.getMimeType();
    if (CONFIG.VIDEO_MIME.indexOf(mime) !== -1) {
      out.push({ id: f.getId(), name: f.getName(), date: f.getDateCreated() });
    }
  }
  out.sort(function (a, b) { return a.date - b.date; });
  return out;
}

/** 從檔名推測週次：含「第3週」「Week 3」就抓，否則回傳第 (序號) 週。 */
function inferWeek(name, index) {
  var m = name.match(/第\s*(\d+)\s*週/i) || name.match(/week\s*(\d+)/i);
  if (m) return '第 ' + m[1] + ' 週';
  return CONFIG.DEFAULT_WEEK_PREFIX + index + ' 週';
}

/** 影片標題：去掉副檔名，把底線/連字號轉成空白。 */
function inferTitle(name) {
  return name.replace(/\.[^.]+$/, '') // 去副檔名
             .replace(/[_-]+/g, ' ')
             .replace(/\s+/g, ' ')
             .trim() || '未命名課程影片';
}

function formatDate(d) {
  if (!d) return '';
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

/** 確保檔案對「任何知道連結的人」開放檢視（回放 iframe 需要）。 */
function ensurePublicView(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    // 設定「知道連結的人可以檢視」
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // 權限不足時記錄，不中斷流程
    Logger.log('無法設定共用（需資料夾擁有者權限）：' + fileId + ' -> ' + err);
  }
}

// ===== 試算表（自動化設定紀錄）工具 =====
function getSettingsSheet() {
  var ss;
  if (CONFIG.SETTINGS_SHEET_ID) {
    ss = SpreadsheetApp.openById(CONFIG.SETTINGS_SHEET_ID);
  } else {
    var existing = DriveApp.getFilesByName('ESG回放自動化設定');
    if (existing.hasNext()) {
      ss = SpreadsheetApp.openById(existing.next().getId());
    } else {
      ss = SpreadsheetApp.create('ESG回放自動化設定');
    }
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'week', 'title', 'date']);
  }
  return sheet;
}

function readAllRows(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var header = data[0].map(function (h) { return String(h).trim(); });
  return data.slice(1).map(function (row) {
    var obj = {};
    header.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheet, row) {
  sheet.appendRow([row.id, row.week, row.title, row.date]);
}

/**
 * 一鍵安裝：建立「Drive 變更」觸發器，並把現有影片寫入設定。
 * 在 Apps Script 編輯器直接執行 install() 即可。
 */
function install() {
  // 清掉舊觸發器避免重複
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onDriveChange') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onDriveChange')
    .onChange()
    .create();
  // 先處理一次現有影片
  onDriveChange();
  Logger.log('安裝完成：已建立 Drive 監聽觸發器，並處理現有影片。');
}

/** 除錯用：在編輯器執行，直接看目前會回傳的清單。 */
function testBuild() {
  Logger.log(JSON.stringify(buildVideoList(), null, 2));
  return buildVideoList();
}
