# Global Scope App Patterns — Lessons Learned

Real-world lessons from building a production global-scope ServiceNow app
with `@servicenow/sdk` v4.4. Use this alongside `fluent-patterns.md` whenever
`now.config.json` has `"scope": "global"`.

---

## 1. Naming Rules — Global Scope (CRITICAL)

Global scope has **different naming rules** from scoped apps (`x_vendor_app`).
These are enforced by the SDK linter and will fail the build if wrong.

### Table Names → must start with `u_`
```
✅  u_truck_order
✅  u_truck_menu_item
❌  x_truck_order        ← x_ is for scoped apps only (SDK error TS11)
❌  truck_order          ← no prefix (SDK error TS11)
```

### Column/Field Names → must also start with `u_`
```
✅  u_status
✅  u_customer_name
❌  status               ← SDK error TS303
❌  customer_name        ← SDK error TS303
```

### SDK Lint Error Reference
| Error | Meaning | Fix |
|-------|---------|-----|
| `TS11` | Table name doesn't start with `u_` | Rename to `u_<name>` |
| `TS303` | Column name doesn't start with `u_` | Rename all columns to `u_<field>` |
| `TS213` | Export const name doesn't match table name | See Section 2 |

---

## 2. Table Definition

### Export Name Must Exactly Match Table Name
```typescript
import '@servicenow/sdk/global'
import { Table, StringColumn, DecimalColumn, BooleanColumn,
         IntegerColumn, DateTimeColumn, ChoiceColumn } from '@servicenow/sdk/core'

// ✅ export const name MUST be identical to the 'name' string
export const u_truck_order = Table({
    name: 'u_truck_order',
    label: 'Truck Order',
    schema: {
        u_number:        StringColumn({ label: 'Order Number', maxLength: 20 }),
        u_customer_name: StringColumn({ label: 'Customer Name', maxLength: 100 }),
        u_status: ChoiceColumn({
            label: 'Status',
            choices: {
                new:         { label: 'New' },
                in_progress: { label: 'In Progress' },
                completed:   { label: 'Completed' },
                cancelled:   { label: 'Cancelled' },
            },
            default: 'new',
        }),
        u_total:              DecimalColumn({ label: 'Total' }),
        u_completed_at:       DateTimeColumn({ label: 'Completed At' }),
    },
})
```

### What Does NOT Exist on Table
```typescript
// ❌ These properties don't exist in the SDK type — remove them
Table({ labelPlural: '...' })          // not a valid property
StringColumn({ display: true })        // not a valid property on StringColumn
```

### ReferenceColumn — Use `referenceTable`, Not `reference` or `referenceKey`
```typescript
import { ReferenceColumn } from '@servicenow/sdk/core'

// ✅ Correct
u_order: ReferenceColumn({
    label: 'Order',
    referenceTable: 'u_truck_order',   // 'referenceTable' is the correct key
    mandatory: true,
}),

// ❌ Wrong — both of these will fail
ReferenceColumn({ reference: 'u_truck_order' })      // SDK error TS2561
ReferenceColumn({ referenceKey: 'u_truck_order' })   // SDK error TS2345 (referenceTable missing)
```

---

## 3. Business Rules

### `action` Is an Array, Not an Object
```typescript
import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'

BusinessRule({
    $id: Now.ID['my_rule_id'],
    name: 'My Rule',
    table: 'u_my_table',
    active: true,
    when: 'before',                        // 'before' | 'after' | 'async' | 'display'
    action: ['insert', 'update'],          // ✅ array of strings
    script: `
(function executeRule(current, previous) {
    // Use u_ prefixed field names in getValue / setValue
    var val = current.getValue('u_my_field');
    current.setValue('u_other_field', val);
})(current, previous);
`,
})

// ❌ Wrong — object syntax doesn't exist
action: { insert: true, update: true }    // SDK error TS2353 ('insert' does not exist in array type)
// ❌ Wrong — plural doesn't exist
actions: ['insert']                       // SDK error TS2561 (did you mean 'action'?)
```

### Aborting + Timestamp Pattern (Status Validation)
```typescript
script: `
(function executeRule(current, previous) {
    var oldStatus = previous.getValue('u_status');
    var newStatus = current.getValue('u_status');
    if (oldStatus === newStatus) return;

    var validTransitions = {
        'new':         ['in_progress', 'cancelled'],
        'in_progress': ['completed'],
        'completed':   [],
        'cancelled':   []
    };

    var allowed = validTransitions[oldStatus] || [];
    if (allowed.indexOf(newStatus) === -1) {
        current.setAbortAction(true);
        gs.addErrorMessage('Invalid transition: ' + oldStatus + ' → ' + newStatus);
        return;
    }

    if (newStatus === 'completed') {
        current.setValue('u_completed_at', new GlideDateTime());
    }
})(current, previous);
`
```

### Cascade Update — Prevent Recursive Firing
When an `after` rule updates a parent record, use `setWorkflow(false)`:
```javascript
var parentGr = new GlideRecord('u_truck_order');
if (parentGr.get(orderId)) {
    parentGr.setValue('u_total', newTotal);
    parentGr.setWorkflow(false);   // prevents other BRs from re-firing
    parentGr.update();
}
```

---

## 4. Seed Records

### `data` Not `values`, and Use Native JS Types
```typescript
import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['seed_record_unique_id'],
    table: 'u_truck_menu_item',
    data: {                              // ✅ 'data', NOT 'values'
        u_item_name:  'Classic BLT',
        u_description: 'Bacon, lettuce, tomato on sourdough',
        u_price:  8.50,                  // ✅ number — NOT '8.50'
        u_active: true,                  // ✅ boolean — NOT 'true'
        u_item_id: 1,                    // ✅ number — NOT '1'
    },
})

// ❌ Wrong property name
Record({ values: { ... } })             // SDK error TS2353

// ❌ Wrong types — SDK validates against column schema
Record({ data: { u_price: '8.50' } })   // TS2322: string not assignable to number
Record({ data: { u_active: 'true' } })  // TS2322: string not assignable to boolean
```

---

## 5. UI Pages (React + TypeScript Portals)

### Fluent Definition
```typescript
import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import myPortalPage from '../../client/myapp/index.html'

UiPage({
    $id: Now.ID['my_portal_page'],
    endpoint: 'my_portal.do',       // accessible at /<instance>/my_portal.do
    description: 'My Portal',
    category: 'general',
    html: myPortalPage,
    direct: true,
})
```

### HTML Entry Point — Required Tag
```html
<html>
<head>
  <title>My Portal</title>
  <sdk:now-ux-globals></sdk:now-ux-globals>  <!-- injects window.g_ck and SN globals -->
  <script src="./main.tsx" type="module"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### Multiple Portals in One Project
Each portal needs its own subdirectory under `src/client/`:
```
src/client/
  portal-one/
    index.html   ← referenced by UiPage Fluent file
    main.tsx
    App.tsx
  portal-two/
    index.html
    main.tsx
    App.tsx
```
The SDK bundles each HTML entry point separately — no extra config needed.

---

## 6. React — Calling the ServiceNow Table REST API

### Auth Token
`window.g_ck` is injected by `<sdk:now-ux-globals>`. Always pass it:
```typescript
headers: {
    'Accept': 'application/json',
    'X-UserToken': window.g_ck,
    // Add for POST/PATCH:
    'Content-Type': 'application/json',
}
```

### Field Names in REST Requests Match the `u_` Column Names
```typescript
// PATCH — update a record
body: JSON.stringify({ u_status: 'in_progress' })

// POST — create a record
body: JSON.stringify({
    u_customer_name: 'Alex',
    u_status: 'new',
})

// GET — specify fields with sysparm_fields
sysparm_fields: 'sys_id,u_number,u_status,u_total'
```

### Reference Fields — `sysparm_display_value=all`
```typescript
// Request
sysparm_display_value: 'all'

// Response shape for a reference field
{
  "u_menu_item": {
    "value": "abc123sys_id",
    "display_value": "Classic BLT"
  }
}

// TypeScript interface
u_menu_item: { display_value: string; value: string }
```

### Today's Records Encoded Query
```
sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()
```

### Auto-Refresh Pattern (5-second polling)
```typescript
useEffect(() => {
    const interval = setInterval(() => {
        void fetchData()
    }, 5000)
    return () => clearInterval(interval)
}, [fetchData])
```

---

## 7. File Structure for Global Apps

```
my-global-app/
├── now.config.json            ← "scope": "global"
├── package.json
├── src/
│   ├── fluent/
│   │   ├── index.now.ts       ← leave empty; SDK auto-discovers all *.now.ts
│   │   ├── tables/
│   │   │   └── u-my-table.now.ts
│   │   ├── business-rules/
│   │   │   └── my-rule.now.ts
│   │   ├── records/
│   │   │   └── seed-data.now.ts
│   │   └── ui-pages/
│   │       └── my-portal.now.ts
│   └── client/
│       └── myapp/
│           ├── index.html
│           ├── main.tsx
│           ├── App.tsx
│           ├── myapp.css
│           ├── components/
│           └── services/
```

> The `index.now.ts` barrel file is optional — the SDK auto-discovers all `*.now.ts`
> files recursively under `src/fluent/`. Do NOT import them in the barrel, as that
> can cause duplicate registration errors.

---

## 8. Complete Error → Fix Lookup

| SDK Error | What triggered it | Exact fix |
|-----------|------------------|-----------|
| `TS11: table name must start with u_` | Table named `x_foo` or `foo` | Rename to `u_foo` |
| `TS303: column name must start with u_` | Field named `status` instead of `u_status` | Prefix every column with `u_` |
| `TS213: export name must match table name` | `export const myConst = Table({name: 'u_foo'})` | Change to `export const u_foo = Table(...)` |
| `TS2561: 'actions' does not exist, did you mean 'action'` | `actions: { insert: true }` | Change to `action: ['insert']` |
| `TS2353: 'insert' does not exist in array type` | `action: { insert: true }` | Change to `action: ['insert', 'update']` |
| `TS2561: 'reference' does not exist, did you mean 'referenceKey'` then `referenceTable missing` | `ReferenceColumn({ reference: '...' })` | Use `referenceTable: 'u_table_name'` |
| `TS2353: 'values' does not exist` on Record | `Record({ values: {...} })` | Change `values` to `data` |
| `TS2322: string not assignable to number` in Record | `data: { u_price: '8.50' }` | Use `data: { u_price: 8.50 }` |
| `TS2322: string not assignable to boolean` in Record | `data: { u_active: 'true' }` | Use `data: { u_active: true }` |
| `RecordPlugin: Failed to cast UndefinedShape to ObjectShape` | `values` used instead of `data` | Change to `data: { ... }` |
| `Cannot find module 'react'` | `node_modules` not installed | Run `npm install` |
