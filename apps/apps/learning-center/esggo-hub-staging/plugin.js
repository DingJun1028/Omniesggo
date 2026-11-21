/**
 * ESGGO Hub — one plugin, four surfaces, plus a Python backend.
 *   chip (status bar) · pane (right) · ⌘K command · page route + sidebar nav
 * Pane + page pull project-health data from the plugin's own backend via
 * ctx.rest('/status') → GET /api/plugins/esggo-hub/status.
 *
 * Drop in: <hermes home>/desktop-plugins/esggo-hub/plugin.js
 * Backend: <hermes home>/plugins/esggo-hub/dashboard/{manifest.json,plugin_api.py}
 * Config:  add `plugins.enabled: [esggo-hub]` to config.yaml, then restart gateway.
 * Then ⌘K → "Reload desktop plugins".
 *
 * Plain ESM, loaded uncompiled — jsx() calls, not JSX syntax.
 * Only these imports resolve: @hermes/plugin-sdk, react, react/jsx-runtime.
 *
 * FIX (reinstall): removed `as const` after the theme object — that is
 * TypeScript syntax and throws a load-time SyntaxError in the uncompiled
 * plain-JS loader. Plugins must be valid plain ESM.
 */

import {
  host,
  haptic,
  useValue,
  useQuery,
  queryClient,
  STATUSBAR_AREAS,
  PANES_AREA,
  ROUTES_AREA,
  SIDEBAR_NAV_AREA,
  PALETTE_AREA,
  Tip,
  cn,
  Button,
  Skeleton,
  Contribute,
  KEYBINDS_AREA,
  TITLEBAR_AREAS,
  THEMES_AREA
} from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'

const ID = 'esggo-hub'
const PAGE_PATH = '/esggo-hub'
// Fixed link from project memory (do not hardcode course-site hero link — removed).
const HOMEWORK_FORM = 'https://forms.gle/B5hSmQSBi3t24Tn38'

// Query key shared by pane + page; invalidated on every socket tick.
const STATUS_KEY = [ID, 'status']

// ── 1. status bar chip ─────────────────────────────────────────────────────

function HubChip() {
  const gateway = useValue(host.state.gateway)
  const dot = gateway === 'open' ? 'var(--ui-accent)' : 'var(--ui-text-quaternary)'

  return jsx(Tip, {
    label: `gateway: ${gateway} — 點擊查看詳情`,
    children: jsx('button', {
      type: 'button',
      className: cn(
        'inline-flex h-full items-center gap-1 px-1.5 text-[0.6875rem] transition-colors',
        'text-(--ui-text-tertiary) hover:bg-(--ui-stroke-secondary) hover:text-foreground'
      ),
      onClick: () => {
        haptic('tap')
        host.notify({
          kind: 'info',
          title: 'ESGGO Hub',
          message: `gateway: ${gateway}`,
          detail: `model: ${host.state.model.get()}\ncwd: ${host.state.cwd.get()}`
        })
      },
      children: [
        jsx('span', { className: 'h-1.5 w-1.5 rounded-full', style: { background: dot } }),
        'ESGGO'
      ]
    })
  })
}

// ── registration: chip + 3 backend-backed surfaces ─────────────────────────

export default {
  id: ID, // must match the folder name
  name: 'ESGGO Hub',
  register(ctx) {
    // Live tick channel (accelerator only; polling fallback below stays).
    // ctx.socket is a no-op on OAuth remotes, so the 15s poll covers that case.
    ctx.socket('/events', () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY })
    })

    // Shared query — polls the plugin's own backend every 15s.
    // ctx.rest is scoped to /api/plugins/esggo-hub.
    function useHub() {
      return useQuery({
        queryKey: STATUS_KEY,
        queryFn: () => ctx.rest('/status'),
        refetchInterval: 15000,
        retry: false
      })
    }

    function Stat({ k, v }) {
      return jsxs('div', {
        className: 'flex items-center justify-between gap-2',
        children: [
          jsx('span', { className: 'text-(--ui-text-quaternary)', children: k }),
          jsx('span', {
            className: 'truncate text-(--ui-text-secondary)',
            title: String(v),
            children: String(v)
          })
        ]
      })
    }

    function Card({ label, value }) {
      return jsxs('div', {
        className: 'rounded-md border border-(--ui-stroke-secondary) p-3',
        children: [
          jsx('div', { className: 'text-(--ui-text-quaternary) text-xs', children: label }),
          jsx('div', {
            className: 'mt-1 truncate text-(--ui-text-secondary)',
            title: String(value),
            children: String(value)
          })
        ]
      })
    }

    function LoadingOrError({ isLoading, isError }) {
      if (isLoading) {
        return jsxs('div', {
          className: 'flex flex-col gap-2 p-3',
          children: [
            jsx(Skeleton, { className: 'h-4 w-3/4' }),
            jsx(Skeleton, { className: 'h-4 w-1/2' }),
            jsx(Skeleton, { className: 'h-4 w-2/3' })
          ]
        })
      }
      if (isError) {
        return jsx('div', {
          className: 'm-3 rounded-md border border-(--ui-stroke-secondary) p-3 text-(--ui-text-tertiary) text-sm',
          children: '後端未啟用：請將 esggo-hub 加入 config.yaml 的 plugins.enabled 並重啟 gateway。'
        })
      }
      return null
    }

    // ── 2. right layout pane ──
    function HubPane() {
      const { data, isLoading, isError } = useHub()
      const guard = jsx(LoadingOrError, { isLoading, isError })
      if (guard) return guard
      return jsxs('div', {
        className: 'flex h-full flex-col gap-2 p-3 text-sm',
        children: [
          jsx('div', { className: 'font-medium', children: 'ESGGO Hub' }),
          jsx(Stat, { k: 'branch', v: data.branch }),
          jsx(Stat, { k: 'commit', v: data.last_commit }),
          jsx(Stat, { k: 'status', v: data.dirty ? '有異動' : '乾淨' }),
          jsx(Stat, { k: 'dist', v: data.dist_built ? '已建置' : '未建置' }),
          jsx(Stat, { k: 'src', v: `${data.src_files} 個 jsx` }),
          jsx('div', { className: 'mt-auto text-(--ui-text-quaternary) text-xs', children: '每 15s 重新整理' })
        ]
      })
    }

    // ── 4. full page route ──
    function HubPage() {
      const { data, isLoading, isError } = useHub()
      const guard = jsx(LoadingOrError, { isLoading, isError })
      if (guard) return guard
      return jsxs('div', {
        className: 'flex h-full flex-col gap-4 p-6',
        children: [
          // Mount-scoped titlebar control — lives and dies with this page.
          jsx(Contribute, {
            area: TITLEBAR_AREAS.center,
            id: 'esggo-hub:homework',
            children: jsx(Button, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => {
                haptic('tap')
                navigator.clipboard?.writeText(HOMEWORK_FORM).then(
                  () => host.notify({ kind: 'info', message: '作業上傳連結已複製' }),
                  () => host.notify({ kind: 'error', message: '複製失敗' })
                )
              },
              children: '複製作業上傳連結'
            })
          }),
          jsx('div', { className: 'text-lg font-semibold', children: 'ESGGO Hub' }),
          jsx('div', { className: 'text-(--ui-text-tertiary)', children: '課程平台專案狀態' }),
          jsxs('div', {
            className: 'grid grid-cols-2 gap-3',
            children: [
              jsx(Card, { label: 'Branch', value: data.branch }),
              jsx(Card, { label: 'Commit', value: data.last_commit }),
              jsx(Card, { label: 'Dist', value: data.dist_built ? '已建置' : '未建置' }),
              jsx(Card, { label: 'Firestore rules', value: data.firestore_rules ? '有' : '無' })
            ]
          }),
          jsx(Button, {
            onClick: () => host.notify({ kind: 'info', title: '專案路徑', message: String(data.path) }),
            children: '顯示專案路徑'
          })
        ]
      })
    }

    ctx.registerMany([
      // 1. status bar chip
      {
        id: 'chip',
        area: STATUSBAR_AREAS.right,
        order: 130,
        render: () => jsx(HubChip, {})
      },
      // 2. right layout pane
      {
        id: 'pane',
        area: PANES_AREA,
        title: 'esggo hub',
        data: { placement: 'right', width: '260px' },
        render: () => jsx(HubPane, {})
      },
      // 4. full page route
      {
        id: 'page',
        area: ROUTES_AREA,
        data: { path: PAGE_PATH },
        render: () => jsx(HubPage, {})
      },
      // 4. sidebar nav row
      {
        id: 'nav',
        area: SIDEBAR_NAV_AREA,
        data: { path: PAGE_PATH, label: 'ESGGO Hub', codicon: 'dashboard' }
      },
      // 3. ⌘K palette command
      {
        id: 'open',
        area: PALETTE_AREA,
        data: {
          id: 'esggo-hub.open',
          label: 'Open ESGGO Hub',
          keywords: ['esggo', 'hub', 'dashboard', '柏克萊'],
          run: () => host.navigate(PAGE_PATH)
        }
      },
      // keybind: refresh the hub data (user-rebindable in settings)
      {
        id: 'refresh',
        area: KEYBINDS_AREA,
        data: {
          id: 'esggo-hub.refresh',
          label: 'Refresh ESGGO Hub',
          category: 'ESGGO Hub',
          defaults: ['mod+shift+r'],
          run: () => queryClient.invalidateQueries({ queryKey: STATUS_KEY })
        }
      },
      // theme: ESGGO custom theme (uses CSS vars, dark = light palette)
      {
        id: 'esggo-theme',
        area: THEMES_AREA,
        data: {
          name: 'esggo',
          label: 'ESGGO',
          description: 'ESGGO 2026 Berkeley course theme',
          colors: {
            background: '#0a0f1f',
            foreground: '#f5f5f5',
            card: '#151a30',
            cardForeground: '#e0e0e0',
            muted: '#7a7a9a',
            mutedForeground: '#b0b0b0',
            popover: '#151a30',
            popoverForeground: '#e0e0e0',
            primary: '#3b82f6',
            primaryForeground: '#ffffff',
            secondary: '#64748b',
            secondaryForeground: '#f8fafc',
            accent: '#10b981',
            accentForeground: '#ffffff',
            border: '#252b44',
            input: '#252b44',
            ring: '#3b82f6',
            destructive: '#ef4444',
            destructiveForeground: '#ffffff',
            sidebarBackground: '#0a0f1f',
            sidebarBorder: '#252b44',
            userBubble: '#e0e0e0',
            userBubbleBorder: '#64748b'
          }
        }
      }
    ])
  }
}
