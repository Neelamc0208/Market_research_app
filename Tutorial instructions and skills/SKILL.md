---
name: sndev
description: >
  Build ServiceNow applications using the ServiceNow SDK and Fluent API (TypeScript).
  Use this skill whenever the user asks to create, scaffold, or generate ServiceNow apps,
  tables, flows, business rules, script includes, ACLs, or any Fluent-based metadata.
  Also trigger when the user mentions: "ServiceNow SDK", "Fluent API", "now-sdk",
  "@servicenow/sdk", "inbound email flow", "ServiceNow table", "Flow Designer code",
  "workflow-as-code", or wants to parse/process emails in ServiceNow.
  Even if the user just says "create a ServiceNow app" or "build me a flow" — use this skill.
---

# ServiceNow SDK Application Builder

This skill enables Claude Code to generate production-ready ServiceNow applications
using the ServiceNow SDK (now-sdk) and the Fluent DSL. Fluent is a TypeScript-based
domain-specific language that compiles to ServiceNow metadata XML. It covers tables,
flows, business rules, script includes, ACLs, REST APIs, and more.

## Important: Authentication is handled externally

The user has already authenticated with their ServiceNow instance using the SDK CLI.
Auth credentials are stored in the system keychain — NOT in project files.
You do NOT need to create `.env` files or handle credentials.

If the user needs to set up a new auth profile, point them to:
```bash
now-sdk auth save <alias> --host https://<instance>.service-now.com --username <user> --default
```
But do NOT run auth commands yourself. The user handles this manually.

---

## Prerequisites — Verify Before Generating Code

Before writing any Fluent code, quickly check the project has the basics:

1. **`now.config.json`** must exist in the project root with at minimum:
   ```json
   {
     "scope": "x_<vendor>_<app>",
     "scopeId": "<sys_id_of_app>"
   }
   ```
   For TypeScript projects, also needs:
   ```json
   {
     "transpiledSourceDir": "dist/src"
   }
   ```

2. **`package.json`** must have SDK dependencies:
   ```json
   {
     "type": "module",
     "scripts": {
       "build": "now-sdk build",
       "install-app": "now-sdk install",
       "transform": "now-sdk transform",
       "dependencies": "now-sdk dependencies"
     },
     "devDependencies": {
       "@servicenow/sdk": "^4.0.0",
       "@servicenow/glide": "^27.0.0"
     }
   }
   ```
   For TypeScript, add:
   ```json
   {
     "scripts": {
       "build": "rm -rf dist && tsc -b && now-sdk build"
     },
     "devDependencies": {
       "typescript": "^5.5.0"
     }
   }
   ```

3. **If the project doesn't exist yet**, the user should scaffold it with:
   ```bash
   npx @servicenow/sdk init
   ```
   This walks through template selection and links the auth profile.

If prerequisites are met, proceed directly to writing Fluent code.

---

## Project Structure

All Fluent files go in `src/fluent/` with the `.now.ts` extension.
Organize by concern:

```
my-sn-app/
├── now.config.json
├── package.json
├── tsconfig.json              # if TypeScript
├── src/
│   ├── fluent/
│   │   ├── tables/
│   │   │   └── email-data.now.ts
│   │   ├── flows/
│   │   │   └── inbound-email-parser.now.ts
│   │   ├── business-rules/
│   │   ├── script-includes/
│   │   ├── acls/
│   │   └── index.now.ts       # barrel exports (optional)
│   ├── server/                # JS/TS modules (.server.js or .server.ts)
│   └── client/                # front-end code (if fullstack)
├── @types/                    # auto-generated type defs (via `now-sdk dependencies`)
└── metadata/                  # auto-generated XML (build output, do not edit)
```

---

## SDK CLI Commands Reference (v3.0+ / v4.x)

These are the commands Claude Code should use or instruct the user to run:

| Command | Purpose | Example |
|---------|---------|---------|
| `now-sdk build` | Compile Fluent → metadata XML | `now-sdk build` |
| `now-sdk install` | Build + pack + deploy to instance | `now-sdk install --auth <alias>` |
| `now-sdk transform` | Download/sync metadata from instance to local | `now-sdk transform --auth <alias>` |
| `now-sdk dependencies` | Fetch table defs and type info from instance | `now-sdk dependencies --auth <alias>` |
| `now-sdk init` | Scaffold a new app or convert existing | `npx @servicenow/sdk init` |
| `now-sdk pack` | Package build output into installable archive | `now-sdk pack` |
| `now-sdk auth save` | Store auth credentials in system keychain | User handles manually |

### Build and Install Workflow

The standard development cycle is:

```bash
# 1. Write or modify Fluent code in src/fluent/*.now.ts

# 2. Build — compiles Fluent to metadata XML
now-sdk build

# 3. Install — packages and deploys to the instance
now-sdk install --auth <alias>
```

Build flags:
- `--debug true` — include debug info
- `--generate-deletes true` — remove records from instance that were deleted locally
- `--lint true` — run linting during build
- `--frozenKeys` — fail if keys.ts needs updating (useful for CI)

Install flags:
- `--auth <alias>` — which auth profile to use
- `--open-browser true` — open the app in browser after install

### Syncing from Instance

To pull changes made on the instance back to local:
```bash
now-sdk transform --auth <alias>
```
This downloads metadata and converts supported types to Fluent `.now.ts` files
in `src/fluent/generated/`.

### Fetching Type Definitions

To get table schemas and type info for IntelliSense:
```bash
now-sdk dependencies --auth <alias>
```
This populates `@types/servicenow/` with type definitions for GlideRecord etc.

---

## Core Fluent Patterns

Read `references/fluent-patterns.md` for the full API reference with examples
covering Tables, Flows, Business Rules, Script Includes, ACLs, Records, and more.

The most important patterns for email parsing apps are summarized below.

### Table Definition

```typescript
import {
  Table, StringColumn, ReferenceColumn, IntegerColumn,
  DateTimeColumn, HtmlColumn, ChoiceColumn
} from '@servicenow/sdk/core'

export const x_vendor_app_email_data = Table({
  name: 'x_vendor_app_email_data',
  label: 'Parsed Email Data',
  schema: {
    x_vendor_app_sender: StringColumn({
      label: 'Sender',
      maxLength: 255,
      mandatory: true
    }),
    x_vendor_app_subject: StringColumn({
      label: 'Subject',
      maxLength: 500
    }),
    x_vendor_app_received_date: DateTimeColumn({
      label: 'Received Date'
    }),
    x_vendor_app_body_text: HtmlColumn({
      label: 'Email Body'
    }),
    x_vendor_app_status: ChoiceColumn({
      label: 'Processing Status',
      // ⚠️ choices is an OBJECT (keys = values), NOT an array
      choices: {
        new:    { label: 'New' },
        parsed: { label: 'Parsed' },
        error:  { label: 'Error' },
      },
      default: 'new'   // ⚠️ use 'default', NOT 'defaultValue'
    })
  }
})
```

Key rules for tables:
- Table name MUST start with the app scope prefix: `x_<vendor>_<app>_`
- Column names MUST also be prefixed with the scope
- Available column types: `StringColumn`, `IntegerColumn`, `BooleanColumn`,
  `DateTimeColumn`, `ReferenceColumn`, `ChoiceColumn`, `HtmlColumn`,
  `DecimalColumn`, `URLColumn`, `DurationColumn`, `TimeColumn`,
  `FieldListColumn`, `GlideListColumn`
- **`HtmlColumn`** — NOT `HTMLColumn` (casing matters, build will fail)
- **`ChoiceColumn`** choices must be an object `{ key: { label } }`, NOT an array
- **`ChoiceColumn`** default value uses `default:`, NOT `defaultValue:`
- Use `ReferenceColumn` with `reference: '<table_name>'` for foreign keys

### Flow with Inbound Email Trigger

```typescript
import { action, Flow, wfa, trigger } from '@servicenow/sdk/automation'

export const emailParserFlow = Flow(
  {
    $id: Now.ID['email_parser_flow'],
    name: 'Email Parser Flow',
    // ⚠️ description must be a single string literal — NO string concatenation with +
    description: 'Parses inbound emails and extracts data to custom table',
  },
  wfa.trigger(
    trigger.application.inboundEmail,
    { $id: Now.ID['inbound_email_trigger'] },
    {
      // ⚠️ Use 'email_conditions' (NOT 'condition' or 'record_type')
      // ⚠️ Encoded query format: NO spaces around operator — 'subjectLIKEorder%'
      email_conditions: 'subjectLIKEorder%',
      target_table: 'incident',   // optional: table for reply record
    }
  ),
  (params) => {
    // ⚠️ Inbound email trigger data pills — direct on params.trigger (NOT params.trigger.email.*)
    //   params.trigger.from_address  — sender email address
    //   params.trigger.subject       — email subject
    //   params.trigger.body_text     — plain-text body
    //   params.trigger.inbound_email — reference to sys_email record (for .body, .sys_id, etc.)
    //   params.trigger.user          — reference to sys_user who sent the email

    // Log for debugging
    wfa.action(
      action.core.log,
      { $id: Now.ID['log_email_received'] },
      {
        log_level: 'info',
        log_message: `Processing email from: ${wfa.dataPill(params.trigger.from_address, 'string')}`,
      }
    )

    // Create record in custom table
    // ⚠️ createRecord uses 'table_name' (NOT 'table') and values: TemplateValue({}) (NOT a plain object)
    wfa.action(
      action.core.createRecord,
      { $id: Now.ID['create_parsed_record'] },
      {
        table_name: 'x_vendor_app_email_data',
        values: TemplateValue({
          x_vendor_app_sender:    wfa.dataPill(params.trigger.from_address, 'string'),
          x_vendor_app_subject:   wfa.dataPill(params.trigger.subject, 'string'),
          x_vendor_app_body_text: wfa.dataPill(params.trigger.body_text, 'string'),
          x_vendor_app_status:    'new',
        }),
      }
    )
  }
)
```

Key rules for flows:
- Every element needs a unique `$id` using `Now.ID['unique_key']`
- The `$id` keys must be unique across the entire application
- `description` must be a **single string literal** — string concatenation with `+` will cause a build error
- Trigger types: `trigger.record.created`, `trigger.record.updated`,
  `trigger.application.inboundEmail`, `trigger.schedule.daily`, etc.
- **Inbound email trigger config**: use `email_conditions` with encoded query (no spaces around operator).
  Valid fields: `email_conditions`, `target_table`, `order`, `stop_condition_evaluation`
- **Inbound email data pills** — accessed directly on `params.trigger`:
  - `params.trigger.from_address` — sender address (string)
  - `params.trigger.subject` — subject line (string)
  - `params.trigger.body_text` — plain-text body (string)
  - `params.trigger.inbound_email` — the `sys_email` record reference (use `.body`, `.sys_id`, etc.)
  - `params.trigger.user` — `sys_user` reference for the sender
  - **WRONG**: `params.trigger.email.subject` / `params.trigger.email.from` — these do NOT exist
- **`createRecord`** inputs: `table_name` (NOT `table`) + `values: TemplateValue({...})` (NOT a plain object)
- **`TemplateValue`** is a global — no import needed
- Use `wfa.dataPill()` to reference runtime values from trigger or prior actions
- Use `wfa.flowLogic.if()` / `wfa.flowLogic.elseIf()` / `wfa.flowLogic.else()` for branching
- Actions: `action.core.log`, `action.core.createRecord`, `action.core.createTask`,
  `action.core.lookUpRecord` (capital U), `action.core.sendEmail`,
  `action.core.getAttachmentsOnRecord`, `action.core.copyAttachment`

### Flow Logic — Branching

```typescript
wfa.flowLogic.if(
  {
    $id: Now.ID['check_condition'],
    condition: `${wfa.dataPill(params.trigger.current.severity, 'string')}=1`
  },
  () => {
    // actions for when condition is true
  }
)

wfa.flowLogic.else(
  { $id: Now.ID['else_block'] },
  () => {
    // actions for all other cases
  }
)
```

---

## Email Parsing Workflow — Step by Step

When the user asks to build an email parsing application, follow this sequence:

### Step 1: Analyze the Sample Email
Ask the user for a sample email (or they may have already provided one).
Extract the fields that should be captured. Common fields include:
- Sender address
- Subject line
- Date/time received
- Key data from the body (order numbers, amounts, names, IDs, etc.)
- Attachments (flag presence)

### Step 2: Design the Table Schema
Based on the extracted fields, generate a Table definition with appropriate
column types. Use the app scope prefix throughout. Explain your column choices.

### Step 3: Generate the Inbound Email Flow
Create the Flow with:
- An inbound email trigger with appropriate conditions
- Parsing logic (via script actions or direct field mapping)
- Record creation in the custom table
- Error handling with a status field
- Optional: notification on parse failure

### Step 4: Add Supporting Elements (if needed)
Depending on complexity, also generate:
- **Business Rule**: for post-insert processing or validation
- **Script Include**: for reusable parsing logic (regex extraction, etc.)
- **ACL**: to control who can read/write the parsed data table

### Step 5: Build and Install
Run the build and install commands:
```bash
now-sdk build
now-sdk install --auth <alias>
```

If there are errors, help debug. Common issues:
- Scope prefix mismatch between `now.config.json` and Fluent code
- Missing `$id` or duplicate `$id` values
- Node version too old (requires v20+)
- Build lint errors — check imports and type usage

---

## Naming Conventions

These are mandatory for ServiceNow SDK apps:

| Element      | Pattern                                | Example                              |
|-------------|----------------------------------------|--------------------------------------|
| Table name  | `x_<vendor>_<app>_<name>`             | `x_acme_emailp_parsed_data`         |
| Column name | `x_<vendor>_<app>_<field>`            | `x_acme_emailp_sender_address`      |
| Flow $id    | Unique snake_case key                  | `email_parser_flow`                  |
| Action $id  | Descriptive snake_case                 | `create_parsed_email_record`         |
| File name   | kebab-case with `.now.ts` extension    | `inbound-email-parser.now.ts`        |

Always derive `<vendor>` and `<app>` from the `scope` field in `now.config.json`.

---

## Security Reminders

- NEVER put credentials in source files — auth is in the system keychain
- Ensure `.gitignore` includes `metadata/`, `dist/`, `node_modules/`, `.now/`
- Inbound email flows run as the email sender by default. If the sender
  is unknown, the flow runs as Guest. For elevated operations, use a
  subflow that runs as System
- Always apply ACLs to custom tables to restrict access appropriately
- Enable the Email Filter plugin (`com.glide.email_filter`) for reliable
  inbound email trigger execution

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| `Auth profile not found` | User runs: `now-sdk auth save <alias> --host <url> --username <user> --default` |
| `Scope mismatch` | Table/column name prefixes must match `now.config.json` scope |
| `Duplicate $id` | Every `Now.ID['key']` must be unique across the entire app |
| `Build fails on .ts` | Check `tsconfig.json` has `"outDir": "dist/src"` and `transpiledSourceDir` is set in `now.config.json` |
| `Install 403` | Verify user has `admin` or `app_developer` role on the instance |
| `Flow not triggering` | Check Email Filter plugin is active; verify `email_conditions` encoded query is correct (e.g. `subjectLIKEfoo`) |
| `TS2724: no exported member 'HTMLColumn'` | Use `HtmlColumn` — the correct export name (casing matters) |
| `TS2353: 'value' does not exist in ChoiceConfig` | `ChoiceColumn` choices must be an object `{ key: { label } }` not an array; and use `default:` not `defaultValue:` |
| `TS2769: 'table' does not exist` on createRecord | Use `table_name:` and `values: TemplateValue({...})` — not `table:` and not a plain object |
| `TS243: Unknown instance type in Flow` | Trigger data pills are on `params.trigger.subject` / `.from_address` / `.body_text` directly — not `params.trigger.email.*` |
| `TS303: Failed to parse property` on description | `description` must be a single string literal — multi-line `+` concatenation is not supported in Fluent |
| `Guest user errors` | Use subflow with `run_as: 'system'` for privileged operations |
| `Transform conflicts` | Generated files in `src/fluent/generated/` — migrate to proper files if needed |
| `Missing types` | Run `now-sdk dependencies --auth <alias>` to fetch type defs |
| `Module has no exported member 'Button'` (react-components) | Import from subpath: `import { Button } from '@servicenow/react-components/Button'` — root index only exports `createComponent` and `useRecord` |
| `"sort-fill" is not assignable to type IconName` | Use `sort-ascending-fill`; many intuitive icon names are invalid — grep `icons.d.ts` for valid names |
| `"search-outline" / "warning-fill" / "paper-plane-fill"` invalid IconName | Replace: `search-outline`→`magnifying-glass-outline`, `warning-fill`→`fire-fill`, `paper-plane-fill`→`send-fill`, `refresh-outline`→`sync-outline`, `check-circle-fill`→`circle-check-fill` |
| Tabs `onSelectedItemSet` does nothing | Use `e.detail.payload.value` (not `e.detail.value`) to read the selected tab id |
| `SPWidget is not exported` | Update SDK: `npm install @servicenow/sdk@latest` |
| Widget not rendering on page | Verify `sp_instance` has correct `widget` and `column` sys_id references |
| Widget renders as stacked list instead of grid | CSS `display:grid` doesn't work in SP — use Bootstrap `row`/`col-md-*` classes in HTML template |
| Widget SCSS styles silently not applying | Nested `&__modifier` BEM SCSS is unreliable in SP — use flat class selectors only (see official sample-widget.scss) |
| Async widget fails silently | `async: true` on `sp_instance` swallows errors — use `async: false` until widget is confirmed working |
| Shared CSS class missing in widget | Widget CSS is isolated per widget — redefine shared utility classes (e.g. `.cp-inner`) in each widget's own SCSS |
| `data` empty in client script | Server script must write to `data.<field>` (not a local variable) |
| `Now.include()` file not found | Path is relative to the `.now.ts` file, not the project root |
| `Now.attach()` file not found | Path is relative to the `.now.ts` file, not the project root |
| Portal returns 404 | Check `url_suffix` in `sp_portal` record matches the URL you are hitting |
| Wrong portal type used | Use `SPWidget` + `sp_portal` for Service Portal (AngularJS). Use `UiPage` for React portals only. |

---

---

## When Build Fails — Check SDK Examples First

**IMPORTANT**: If `now-sdk build` fails with an error you are not sure about, fetch the
relevant official SDK example file below using `WebFetch` **before** guessing at a fix.
The examples are the authoritative source of correct Fluent syntax.

### Official SDK Example Files (fetch raw content on demand)

| What you're building | File to fetch |
|---|---|
| Inbound email flow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/flow-trigger-inbound-email.now.ts` |
| Record trigger flow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/flow-trigger-record.now.ts` |
| Service catalog flow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/flow-trigger-catalog-item.now.ts` |
| SLA task flow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/flow-trigger-sla-task.now.ts` |
| Knowledge mgmt flow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/flow-trigger-knowledge-management.now.ts` |
| Remote table query flow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/flow-trigger-remote-table-query.now.ts` |
| Subflow | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/flow-sample/src/fluent/subflow-sample.now.ts` |
| Simple table | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-simple.now.ts` |
| Table with custom columns | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-custom-column.now.ts` |
| Table extending another | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/table-sample/src/fluent/table-extends.now.ts` |
| Business rule | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/businessrule-sample/src/fluent/business-rule-1.now.ts` |
| ACL | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/main/acl-sample/src/fluent/index.now.ts` |
| Service Portal — portal record | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample/src/fluent/portal/sp_portal.now.ts` |
| Service Portal — widget definition | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample/src/fluent/widgets/sample-widget.now.ts` |
| Service Portal — server script | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample/src/fluent/widgets/sample-widget.server.js` |
| Service Portal — client script | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample/src/fluent/widgets/sample-widget.client.js` |
| Service Portal — HTML template | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample/src/fluent/widgets/sample-widget.html` |
| Service Portal — page record | `https://raw.githubusercontent.com/ServiceNow/sdk-examples/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample/src/fluent/page/sp_page_8e66560affd4b210fd87ffffffffffe6.now.ts` |

### How to use these during debugging

1. Build fails with an unfamiliar error → identify which example type matches the failing code
2. Use `WebFetch` to fetch the raw URL from the table above
3. Compare the example's exact syntax against the failing code and fix accordingly
4. Re-run `now-sdk build`

The full examples index is at: `https://github.com/ServiceNow/sdk-examples`

---

## Additional References

For deeper patterns beyond email parsing, read:
- `references/fluent-patterns.md` — Full Table, Flow, BusinessRule, ScriptInclude,
  ACL, Record, RestApi, and Service Portal (SPWidget) patterns with examples
- `references/flow-advanced.md` — Advanced flow patterns: subflows, parallel blocks,
  for-each loops, error handling, and approval flows
- `references/service-portal-patterns.md` — **Complete Service Portal reference**:
  SPWidget, sp_portal, sp_page, sp_container/row/column/instance, server/client scripts,
  AngularJS templates, SCSS, build/deploy, and troubleshooting
- `references/global-app-patterns.md` — Global-scope app patterns, UiPage (React portals),
  REST API calls from React, naming rules for global scope
- `references/workspace-portal-patterns.md` — **Workspace Portal reference**: UiPage + `@servicenow/react-components` (HDS), correct subpath imports, valid IconName values, Tabs event pattern, REST API service pattern, full file structure, and troubleshooting

### Service Portal vs UI Page — IMPORTANT
When the user asks to build a **Service Portal** (classic `sp_widget`, AngularJS,
`/<portal>.do` URLs): use `SPWidget` + `Record` for `sp_portal`/`sp_page`.
When the user asks for a **custom React portal** (modern, `UiPage`): use `UiPage`.
These are completely different APIs. Default to **Service Portal / SPWidget** unless
the user explicitly wants React.

- ServiceNow SDK docs: https://www.servicenow.com/docs/r/application-development/servicenow-sdk/define-metadata-code-fluent-sdk.html
- **Service Portal Fluent API docs:** https://www.servicenow.com/docs/r/application-development/servicenow-sdk/fluent-service-portal-api.html
- Build & install docs: https://www.servicenow.com/docs/r/application-development/servicenow-sdk/build-deploy-application-now-sdk.html
- SDK examples repo: https://github.com/ServiceNow/sdk-examples
- **Service Portal example:** https://github.com/ServiceNow/sdk-examples/tree/626cd89b9df8386d518361ae2647f46abd356360/service-portal-sample
- Fluent MCP server (for AI-assisted dev): https://github.com/modesty/fluent-mcp
- SDK releases & changelog: https://github.com/ServiceNow/sdk/releases
