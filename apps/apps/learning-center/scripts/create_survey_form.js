/**
 * 建立 Berkeley ESG 滿意度調查表（Google Form）
 * 使用方式：
 * 1. 開啟 https://script.google.com/
 * 2. 新專案
 * 3. 把這個檔案內容貼上，存成 createSurveyForm
 * 4. 執行 createSurveyForm
 * 5. 完成後在 執行紀錄 會看到 Form URL / Edit URL
 */

function createSurveyForm() {
  const form = FormApp.create('Berkeley ESG 每週課後滿意度調查表');
  const desc =
    '感謝您完成本週課程。這份調查用於了解學員對本週教學內容、講師表現、教材與行政支持的感受，作為後續課程優化依據。問卷約需 35 分鐘；除非您自願填寫姓名，回覆將以匿名方式彙整。';
  form.setDescription(desc);

  // 基本資料
  addTextItem(form, '課程週次', '例如：第 1 週', true);
  addTextItem(form, '上課日期', '例如：2026/07/21', true);
  addTextItem(form, '本週主題', '', true);
  addTextItem(form, '講師姓名', '', true);
  addTextItem(form, '學員姓名', '選填', false);
  addTextItem(form, '所屬組織', '選填', false);

  // 一
  addSectionHeader(form, '一、課程內容與學習價值', '請依下列尺度勾選：1＝非常不同意　2＝不同意　3＝普通　4＝同意　5＝非常同意');
  addLinearScale(form, '本週課程主題與內容安排清楚，容易掌握學習重點。');
  addLinearScale(form, '本週課程幫助我深化對 ESG 策略、創新或實務議題的理解。');
  addLinearScale(form, '本週所學對我的工作、組織或專案具有實際應用價值。');

  // 二
  addSectionHeader(form, '二、講師教學品質', '請依下列尺度勾選：1＝非常不同意　2＝不同意　3＝普通　4＝同意　5＝非常同意');
  addLinearScale(form, '講師對本週主題具有充分的專業知識與實務經驗。');
  addLinearScale(form, '講師能清楚說明重要概念、框架與案例。');
  addLinearScale(form, '講師能有效引導學員思考，並回應學員問題。');
  addLinearScale(form, '講師提供的觀點或工具有助於我形成下一步行動方向。');

  // 三
  addSectionHeader(form, '三、教材與學習支持', '請依下列尺度勾選：1＝非常不同意　2＝不同意　3＝普通　4＝同意　5＝非常同意');
  addLinearScale(form, '講義、課前學習包或延伸資料有助於我理解本週內容。');
  addLinearScale(form, '課程中的案例、討論或練習有助於將概念轉化為實務。');

  // 四
  addSectionHeader(form, '四、行政團隊與課務支持', '請依下列尺度勾選：1＝非常不同意　2＝不同意　3＝普通　4＝同意　5＝非常同意');
  addLinearScale(form, '行政團隊能清楚並及時提供課程時間、連結、教材與重要通知。');
  addLinearScale(form, 'Zoom、錄影、AI 同傳或其他線上學習工具整體運作順暢。');
  addLinearScale(form, '行政團隊能適時回應本週課程相關問題與需求。');

  // 五
  addSectionHeader(form, '五、開放式回饋', '若某題不適用或您無法評估，可不勾選，並於下方補充說明。');
  addParagraphItem(form, '本週課程中，對您最有價值的主題、觀點、案例或工具是什麼？為什麼？');
  addParagraphItem(form, '本週課程在內容、教學方式、教材或行政安排上，有哪些地方可以改善？');
  addParagraphItem(form, '您希望下週課程或後續學習能進一步回應哪一個問題？');

  const result = { url: form.getPublishedUrl(), editUrl: form.getEditUrl(), id: form.getId() };
  console.log(JSON.stringify(result));
  return result;
}

function addTextItem(form, title, placeholder, required) {
  const item = form.addTextItem();
  item.setTitle(title).setRequired(!!required);
  if (placeholder) item.setHelpText(placeholder);
}

function addLinearScale(form, title) {
  const item = form.addScaleItem();
  item.setTitle(title).setBounds(1, 5).setLabels('非常不同意', '非常同意');
}

function addParagraphItem(form, title) {
  const item = form.addParagraphTextItem();
  item.setTitle(title).setRequired(false);
}

function addSectionHeader(form, title, description) {
  const item = form.addSectionHeaderItem();
  item.setTitle(title);
  if (description) item.setHelpText(description);
}

/**
 * 可選：把這支 script 部署成 web app 後，它會直接回傳已建立表單的網址
 * Deployment -> New deployment -> Select type: Web app
 * Execute as: Me, Who has access: Anyone
 */
function doGet() {
  const result = createSurveyForm();
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
