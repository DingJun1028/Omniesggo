// 5T-Traceable: 法定主體身分單一真實來源（SSOT）
//
// 為什麼需要這個檔案：
// 本專案先前在 contact.jsx 與 Footer.jsx 各自硬寫聯絡資訊，且與公司實際
// 登記資料不符（網站寫 886 2 7743 1006 / hello@ftgtours.com / 台北市中山區，
// 實際為 02-8512-3099 / service@ftg-tours.com.tw / 新北市三重區）。
// 隱私權政策依法必須揭露「蒐集者之姓名或名稱」，若政策與頁面各寫各的，
// 就是自曝矛盾。改為單一 SSOT，之後要改資料只動這裡。
//
// source_origin: 使用者提供之公司登記資料（2026-09-30 貼附）
// 註: 統一編號 93794912 已通過 checksum 驗算（各位和 48 + 末碼 2 = 50，為 10 的倍數）。
//     checksum 只證明號碼格式自洽，不代表政府登記內容正確；
//     如有變更請以財政部稅捐稽徵機關 / 公司變更登記證明書為準。

export const COMPANY = {
  // --- 登記主體 ---
  legalName: '墾趣旅行社股份有限公司',
  shortName: '墾趣旅遊',
  brandEn: 'FTG TOURS',
  taxId: '93794912',                 // 統一編號
  registryNo: '859500',               // 公司註冊編號
  licenseNo: '交觀甲第07142號',         // 交通部觀光局旅行社業執照
  assuranceNo: '品保北2656號',         // 中華民國旅行業品質保證協會
  representative: '林婉玲',            // 代表人

  // --- 聯絡 ---
  // 2026-09-30 用戶指示：隱私權政策與服務條款一律以「新北三重」為準。
  postalCode: '24158',
  city: '新北市',
  district: '三重區',
  street: '興德路123之11號10樓',
  address: '24158 新北市三重區興德路123之11號10樓',
  // 5T-Tangible: 英文版的地址。實測事故：address 只有中文版，Footer 直接
  // 印 COMPANY.address，導致切英文後頁尾仍是一整串繁中（13 條路由每頁都
  // 出現，是全站最顯眼的殘留）。
  // 這裡只做「同一個地址的英文排版」，不是另一個地址：郵遞區號、城市、
  // 區、路名、樓層全部對應上面同一組欄位。國際郵件請以英文版為準。
  addressEn: '10F, No. 123-11, Xingde Rd., Sanchong District, New Taipei City 24158, Taiwan',
  phone: '02-8512-3099',
  fax: '02-8512-3089',
  email: 'service@ftg-tours.com.tw',
  lineId: '@ftg-tours',
};

// 政策生效日：與頁面建立日一致。日後修訂務必同步更新此日期。
export const POLICY_EFFECTIVE_DATE = '2026-09-30';

// 機器人樣式識別字串（聯絡機器人如引述本政策時應自稱本名）
export const SITE_NAME = 'FTG TOURS 墾趣旅遊';
