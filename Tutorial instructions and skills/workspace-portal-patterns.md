# Workspace Portal Patterns — UiPage + @servicenow/react-components

Patterns for building modern **Workspace-style portals** on ServiceNow using
`UiPage` (React) with the official HDS component library
`@servicenow/react-components`.

This is distinct from Service Portal (AngularJS). Use this when the user asks
for a "workspace", "UI Builder-style portal", or a "React-based portal with
HDS components".

---

## Key Distinction: Workspace Portal vs Service Portal

| | Workspace Portal (`UiPage`) | Service Portal (`SPWidget`) |
|---|---|---|
| Framework | React + TypeScript | AngularJS |
| Components | `@servicenow/react-components` (HDS) | Bootstrap 3 + custom CSS |
| Data access | REST API via `fetch()` + `window.g_ck` | `$sp`, `$http` AngularJS services |
| Styling | Plain CSS / CSS modules | SCSS (scoped per widget) |
| URL | `/<instance>/<endpoint>.do` | `/<instance>/<portal_url_suffix>.do` |
| Fluent type | `UiPage` | `SPWidget` + `sp_portal` records |

---

## Package: @servicenow/react-components

Version used and confirmed working: **v0.1.8**

```bash
npm install @servicenow/react-components
```

### ⚠️ CRITICAL: Import from individual subpaths, NOT from the root

The root index (`@servicenow/react-components`) only exports `createComponent`
and `useRecord`. All UI components must be imported from their own subpath:

```typescript
// ❌ WRONG — build error: "Module has no exported member 'Button'"
import { Button, Icon, Tabs } from '@servicenow/react-components'

// ✅ CORRECT — import each component from its own subpath
import { Button } from '@servicenow/react-components/Button'
import { Icon }   from '@servicenow/react-components/Icon'
import { Tabs }   from '@servicenow/react-components/Tabs'
import { Loader } from '@servicenow/react-components/Loader'
import { Alert }  from '@servicenow/react-components/Alert'
```

The package's exports map is: `"./*": "./dist/*.js"` — every component lives
in its own dist file.

### Available Components (confirmed subpaths)

| Component | Import path | Notes |
|---|---|---|
| `Button` | `@servicenow/react-components/Button` | `variant`, `size`, `icon`, `label`, `onClicked`, `disabled` |
| `Icon` | `@servicenow/react-components/Icon` | `icon` (IconName), `size` (sm/md/lg/xl) |
| `Tabs` | `@servicenow/react-components/Tabs` | `items`, `selectedItem`, `onSelectedItemSet` |
| `Loader` | `@servicenow/react-components/Loader` | `label`, `size` |
| `Alert` | `@servicenow/react-components/Alert` | `status` (critical/high/warning/info), `content` |

---

## Icon Names — Valid IconName Type

The `icon` prop is strictly typed as `IconName` (1704+ valid values). Many
intuitive names are **invalid** and will cause a TypeScript build error.

### Common invalid → valid replacements

| ❌ Invalid (build fails) | ✅ Valid replacement |
|---|---|
| `refresh-outline` | `sync-outline` |
| `check-circle-fill` | `circle-check-fill` |
| `warning-fill` | `fire-fill` |
| `paper-plane-fill` | `send-fill` |
| `sort-fill` | `sort-ascending-fill` |
| `search-outline` | `magnifying-glass-outline` |
| `arrow-back-fill` | `arrow-left-outline` |
| `chevron-right-outline` | `chevron-right-fill` |

**If unsure about an icon name**, grep the generated type definition:
```bash
grep -r "sort" node_modules/@servicenow/react-components/dist/Icon/index.d.ts | head -20
# Or search the full IconName union:
grep "YOUR_GUESS" @types/... or node_modules/@servicenow/react-components/**/*.d.ts
```

---

## Tabs Component — Event Handler Pattern

```typescript
// ⚠️ onSelectedItemSet receives a CustomEvent with nested payload
<Tabs
    items={[{ id: 'tab1', label: 'Tab 1' }, { id: 'tab2', label: 'Tab 2' }]}
    selectedItem={activeTab}
    onSelectedItemSet={e => setActiveTab(e.detail.payload.value as string)}
/>
```

The event detail path is: `e.detail.payload.value` (NOT `e.target.value` or
`e.detail.value`).

---

## UiPage Fluent Definition

```typescript
import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import workspacePage from '../../client/workspace/workspace.html'

UiPage({
    $id: Now.ID['incident-workspace-page'],
    endpoint: 'x_<vendor>_<app>_incident_workspace.do',
    description: 'Incident Workspace — Now Experience UI with HDS components',
    category: 'general',
    html: workspacePage,
    direct: true,
})
```

- **`direct: true`** — serves the page directly without a portal wrapper
- **`endpoint`** — must be scoped with the app prefix; accessed at `/<instance>/<endpoint>`
- **`html:`** — reference to the HTML entry file (use `Now.attach` or a direct import)

---

## HTML Entry File

```html
<!-- src/client/workspace/workspace.html -->
<html>
<head>
    <title>Incident Workspace</title>
    <sdk:now-ux-globals></sdk:now-ux-globals>
    <script src="./workspace-main.tsx" type="module"></script>
</head>
<body>
    <div id="workspace-root"></div>
</body>
</html>
```

- **`<sdk:now-ux-globals>`** — injects HDS platform globals (required for
  `now-*` web components to resolve at runtime)
- Script `src` points to the React entry file relative to the HTML file

---

## React Entry File

```typescript
// src/client/workspace/workspace-main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import WorkspaceApp from './WorkspaceApp'

const root = document.getElementById('workspace-root')!
createRoot(root).render(<WorkspaceApp />)
```

---

## REST API Access from React

ServiceNow REST API in a UiPage context uses `window.g_ck` as the CSRF token:

```typescript
// src/client/services/IncidentService.ts
export function val(field: any): string {
    if (!field) return ''
    if (typeof field === 'object' && 'value' in field) return String(field.value)
    return String(field)
}

export function display(field: any): string {
    if (!field) return ''
    if (typeof field === 'object' && 'display_value' in field) return String(field.display_value)
    if (typeof field === 'object' && 'value' in field) return String(field.value)
    return String(field)
}

export class IncidentService {
    private base = '/api/now/table/incident'
    private headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserToken': (window as any).g_ck ?? '',
    }

    async list() {
        const params = new URLSearchParams({
            sysparm_display_value: 'all',
            sysparm_limit: '100',
            sysparm_fields: 'sys_id,number,short_description,state,priority,impact,urgency,category,opened_at,resolved_at,caller_id',
            sysparm_order_by_desc: 'opened_at',
        })
        const r = await fetch(`${this.base}?${params}`, { headers: this.headers })
        if (!r.ok) throw new Error(`Failed to load incidents (${r.status})`)
        return (await r.json()).result
    }

    async getNotes(sysId: string) {
        const params = new URLSearchParams({
            sysparm_query: `element_id=${sysId}^elementINcomments,work_notes`,
            sysparm_fields: 'element,value,sys_created_by,sys_created_on',
            sysparm_order_by: 'sys_created_on',
        })
        const r = await fetch(`/api/now/table/sys_journal_field?${params}`, { headers: this.headers })
        if (!r.ok) throw new Error(`Failed to load notes (${r.status})`)
        return (await r.json()).result
    }

    async addComment(sysId: string, comment: string) {
        const r = await fetch(`${this.base}/${sysId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ comments: comment }),
        })
        if (!r.ok) throw new Error(`Failed to post comment (${r.status})`)
        return (await r.json()).result
    }

    async create(payload: Record<string, string>) {
        const r = await fetch(this.base, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload),
        })
        if (!r.ok) throw new Error(`Failed to create incident (${r.status})`)
        return (await r.json()).result
    }

    async escalate(sysId: string, reason: string) {
        const r = await fetch(`${this.base}/${sysId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ urgency: '1', priority: '1', work_notes: `[Escalated] ${reason}` }),
        })
        if (!r.ok) throw new Error(`Escalation failed (${r.status})`)
        return (await r.json()).result
    }
}
```

Key points:
- `sysparm_display_value: 'all'` returns both `value` (raw) and `display_value` (formatted)
- Use helper `val()` to read raw values, `display()` for human-readable values
- CSRF token: `(window as any).g_ck` — available in UiPage context at runtime
- User context: `(window as any).NOW?.user` → `{ firstName, lastName, userID }`

---

## Project File Structure for Workspace Portal

```
my-sn-app/
└── src/
    ├── fluent/
    │   └── ui-pages/
    │       └── workspace-portal.now.ts       ← UiPage Fluent definition
    └── client/
        └── workspace/
            ├── workspace.html                ← HTML entry point
            ├── workspace-main.tsx            ← React mount
            ├── WorkspaceApp.tsx              ← Shell / router component
            ├── WorkspaceApp.css              ← Global styles
            ├── views/
            │   ├── IncidentListView.tsx      ← List with filter tabs + search + table
            │   ├── IncidentDetailView.tsx    ← Detail with meta bar + tabs + activity
            │   └── NewIncidentView.tsx       ← Create form
            └── services/
                └── IncidentService.ts        ← REST client + val/display helpers
```

---

## Recommended App Shell Pattern

```typescript
// WorkspaceApp.tsx
type View = 'list' | 'detail' | 'new'

export default function WorkspaceApp() {
    const [view, setView] = useState<View>('list')
    const [selected, setSelected] = useState<any>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const service = useMemo(() => new IncidentService(), [])

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 4000)
    }

    return (
        <div className="ws-shell">
            <header className="ws-chrome">...</header>
            <div className="ws-subheader">...</div>
            <main className="ws-content">
                {view === 'list'   && <IncidentListView   ... />}
                {view === 'detail' && <IncidentDetailView ... />}
                {view === 'new'    && <NewIncidentView    ... />}
            </main>
            {toast && <div className={`ws-toast ${toast.ok ? 'ws-toast-ok' : 'ws-toast-err'}`}>...</div>}
        </div>
    )
}
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Module has no exported member 'Button'` | Import from subpath: `import { Button } from '@servicenow/react-components/Button'` |
| `"sort-fill" is not assignable to type IconName` | Use `sort-ascending-fill`; check `icons.d.ts` for valid names |
| `"search-outline" is not assignable to type IconName` | Use `magnifying-glass-outline` |
| `"warning-fill" is not assignable to type IconName` | Use `fire-fill` |
| `"paper-plane-fill" is not assignable to type IconName` | Use `send-fill` |
| `"refresh-outline" is not assignable to type IconName` | Use `sync-outline` |
| `"check-circle-fill" is not assignable to type IconName` | Use `circle-check-fill` |
| Tab switch does nothing / wrong event path | Use `e.detail.payload.value` in `onSelectedItemSet`, not `e.detail.value` |
| Page loads but shows blank content | Check `<sdk:now-ux-globals>` is in the HTML `<head>` |
| `window.g_ck` is undefined | Only available at runtime in ServiceNow context; fine locally |
| Portal returns 404 | Check `endpoint` in `UiPage({})` matches the URL suffix you're hitting |
