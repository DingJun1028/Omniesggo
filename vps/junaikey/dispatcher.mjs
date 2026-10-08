// vps/junaikey/dispatcher.mjs
// ============================================================
// Backend dispatcher + selection logic
// ============================================================
export function createDispatcher({ localBackend, ncbBackend, NCB_TOKEN, NCB_PROJECT, JUNAKEY_BACKEND }) {
  let _active = null;

  async function select() {
    if (_active) return _active;
    if (JUNAKEY_BACKEND === 'local') {
      _active = localBackend; return _active;
    }
    if (JUNAKEY_BACKEND === 'ncb') {
      if (await ncbBackend.health()) { _active = ncbBackend; return _active; }
      throw new Error(`JUNAKEY_BACKEND=ncb but NCB unhealthy: ${ncbBackend.lastError}`);
    }
    // auto
    if (NCB_TOKEN && NCB_PROJECT && (await ncbBackend.health())) {
      _active = ncbBackend;
    } else {
      _active = localBackend;
    }
    return _active;
  }

  function resetCache() {
    _active = null;
  }

  return { select, resetCache };
}
