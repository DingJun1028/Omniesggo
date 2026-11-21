// Vitest global setup — runs before every test file.
// React 19 requires this flag before act() may be used outside a test renderer.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// 5T-Trustworthy: 補齊 window.localStorage。
//
// 實測事故（兩層原因疊加）：
//   1. happy-dom 預設 URL 是 'about:blank'，屬 opaque origin，本來就沒有
//      localStorage。已在 vite.config.js 用 environmentOptions.happyDOM.url
//      給它一個 https origin。
//   2. 但 Node 22+ 自帶一個實驗性 globalThis.localStorage，若沒有
//      --localstorage-file 會被判定 unavailable；它蓋在 happy-dom 的實作
//      前面，於是視窗裡看到的仍是 undefined。啟動時的 warning 就是線索：
//        ExperimentalWarning: localStorage is not available because
//        --localstorage-file was not provided.
//
// 影響：本專案的 LanguageContext 與 ErrorBoundary 都要讀 localStorage
// （key: 'ftg_lang'），所以 home.test.jsx 在 beforeEach 的
// window.localStorage.clear() 直接 TypeError，6 個測試整片紅掉 ——
// 與產品行為無關，純粹是測試環境少了瀏覽器本來就有的 API。
//
// 修法是在 setup 補一個記憶體版 Storage，而不是改測試去 mock 掉那行：
// 測到的仍是真的「讀得到／寫得回」語系持久化，未來要驗證
// 「切英文後重整仍是英文」也不需要 special-case。
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map();
  const storage = {
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: (k) => { store.delete(String(k)); },
    clear: () => { store.clear(); },
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
  // 部分測試從 globalThis 存取，兩邊指同一個實例。
  if (!globalThis.localStorage) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  }
}
