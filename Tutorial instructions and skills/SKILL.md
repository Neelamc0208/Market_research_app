---
name: servicenow-sdk-builder
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

## Prerequisites — Check FIRST

Before generating any code, verify the project is set up:

1. **Check for `.env` file** in the project root. It must contain:
   ```
   SN_INSTANCE=<instance-name>.service-now.com
   SN_USERNAME=<username>
   SN_PASSWORD=<password>
   SN_APP_SCOPE=x_<vendor>_<app>
   ```
   If `.env` is missing, tell the user to create one and stop. Never hardcode credentials.

2. **Check for `now.config.json`** in the project root. It should contain:
   ```json
   {
     "scope": "x_<vendor>_<app>",
     "scopeId": "<sys_id_of_app>"
   }
   ```
   If using TypeScript, it also needs:
   ```json
   {
     "transpiledSourceDir": "dist/src",
     "scope": "x_<vendor>_<app>",
     "scopeId": "<sys_id>"
   }
   ```

3. **Check for `package.json`** with SDK dependencies. Minimum:
   ```json
   {
     "type": "module",
     "scripts": {
       "build": "now-sdk build",
       "deploy": "now-sdk deploy",
       "fetch": "now-sdk fetch",
       "dependencies": "now-sdk dependencies"
     },
     "devDependencies": {
       "@servicenow/sdk": "^4.0.0",
       "@servicenow/glide": "^27.0.0"
     }
   }
   ```
   For TypeScript projects, also include:
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

4. **If the project doesn't exist yet**, scaffold it:
   ```bash
   npx @servicenow/sdk init
   ```
   Then guide the user through selecting a template and configuring auth:
   ```bash
   npx @servicenow/sdk auth --add <instance-url> --type basic --alias <alias>
   ```

If all prerequisites are met, proceed with code generation.

---

## Project Structure

All Fluent files go in `src/fluent/` with the `.now.ts` extension.
Organize by concern:

```
my-sn-app/
├── now.config.json
├── package.json
├── tsconfig.json              # if TypeScript
├── .env                       # credentials (gitignored!)
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
│   ├── server/                # JS/TS modules (.server.js)
│   └── client/                # front-end code (if fullstack)
├── @types/                    # auto-generated type defs
└── metadata/                  # auto-generated XML (build output)
```

---

## Core Fluent Patterns

Read `references/fluent-patterns.md` for the full API reference with examples
covering Tables, Flows, Business Rules, Script Includes, ACLs, Records, and more.

The most important patterns for email parsing apps are summarized below.

### Table Definition

```typescript
import {
  Table, StringColumn, ReferenceColumn, IntegerColumn,
  DateTimeColumn, JournalColumn, ChoiceColumn
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
    x_vendor_app_body_text: JournalColumn({
      label: 'Email Body'
    }),
    x_vendor_app_status: ChoiceColumn({
      label: 'Processing Status',
      choices: [
        { value: 'new', label: 'New' },
        { value: 'parsed', label: 'Parsed' },
        { value: 'error', label: 'Error' }
      ],
      defaultValue: 'new'
    })
  }
})
```

Key rules for tables:
- Table name MUST start with the app scope prefix: `x_<vendor>_<app>_`
- Column names MUST also be prefixed with the scope
- Available column types: `StringColumn`, `IntegerColumn`, `BooleanColumn`,
  `DateTimeColumn`, `ReferenceColumn`, `ChoiceColumn`, `JournalColumn`,
  `DecimalColumn`, `URLColumn`, `HTMLColumn`, `DurationColumn`, `TimeColumn`,
  `FieldListColumn`, `GlideListColumn`
- Use `ReferenceColumn` with `reference: '<table_name>'` for foreign keys

### Flow with Inbound Email Trigger

```typescript
import { action, Flow, wfa, trigger } from '@servicenow/sdk/automation'

export const emailParserFlow = Flow(
  {
    $id: Now.ID['email_parser_flow'],
    name: 'Email Parser Flow',
    description: 'Parses inbound emails and extracts data to custom table',
  },
  wfa.trigger(
    trigger.application.inboundEmail,
    { $id: Now.ID['inbound_email_trigger'] },
    {
      // Condition filters on sys_email fields
      // e.g. match emails with specific subject patterns
      condition: 'subject LIKE order%',
      record_type: 'new'  // 'new' | 'reply' | 'forward'
    }
  ),
  (params) => {
    // Access email data via trigger data pills
    const emailSubject = wfa.dataPill(params.trigger.email.subject, 'string')
    const emailBody = wfa.dataPill(params.trigger.email.body_text, 'string')
    const emailFrom = wfa.dataPill(params.trigger.email.from, 'string')

    // Log for debugging
    wfa.action(
      action.core.log,
      { $id: Now.ID['log_email_received'] },
      {
        log_level: 'info',
        log_message: `Processing email from: ${emailFrom}`
      }
    )

    // Create record in custom table
    wfa.action(
      action.core.createRecord,
      { $id: Now.ID['create_parsed_record'] },
      {
        table: 'x_vendor_app_email_data',
        values: {
          x_vendor_app_sender: emailFrom,
          x_vendor_app_subject: emailSubject,
          x_vendor_app_body_text: emailBody,
          x_vendor_app_status: 'new'
        }
      }
    )
  }
)
```

Key rules for flows:
- Every element needs a unique `$id` using `Now.ID['unique_key']`
- The `$id` keys must be unique across the entire application
- Trigger types: `trigger.record.created`, `trigger.record.updated`,
  `trigger.application.inboundEmail`, `trigger.schedule.daily`, etc.
- Use `wfa.dataPill()` to reference runtime values from trigger or prior actions
- Use `wfa.flowLogic.if()` / `wfa.flowLogic.elseIf()` / `wfa.flowLogic.else()` for branching
- Actions: `action.core.log`, `action.core.createRecord`,
  `action.core.updateRecord`, `action.core.lookupRecord`,
  `action.core.sendNotification`, etc.

### Flow Logic — Branching

```typescript
wfa.flowLogic.if(
  {
    $id: Now.ID['check_condition'],
    condition: `${wfa.dataPill(params.trigger.current.severity, 'string')}=1`
  },
  () => {
    // actions for when condition is true
    wfa.action(action.core.log, { $id: Now.ID['log_high'] }, {
      log_level: 'warn',
      log_message: 'High severity detected'
    })
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

### Step 5: Build and Deploy Instructions
Provide the exact commands:
```bash
npm run build          # compiles Fluent to metadata XML
npm run deploy         # pushes to the ServiceNow instance
```

If there are errors, help debug. Common issues:
- Scope prefix mismatch between `now.config.json` and code
- Missing `$id` or duplicate `$id` values
- Auth profile not set up (`npx @servicenow/sdk auth --add ...`)
- Node version too old (requires v20+)

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

- NEVER put credentials in `.now.ts` files or commit `.env` to version control
- Ensure `.gitignore` includes `.env`, `metadata/`, `dist/`, `node_modules/`
- Inbound email flows run as the email sender by default. If the sender
  is unknown, the flow runs as Guest. For elevated operations, use a
  subflow that runs as System
- Always apply ACLs to custom tables to restrict access appropriately

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| `Auth profile not found` | Run `npx @servicenow/sdk auth --add <url> --type basic --alias dev` |
| `Scope mismatch` | Ensure table/column names match `now.config.json` scope |
| `Duplicate $id` | Every `Now.ID['key']` must be unique across the entire app |
| `Build fails on .ts` | Check `tsconfig.json` has `"outDir": "dist/src"` and `transpiledSourceDir` is set |
| `Deploy 403` | Verify user has `admin` or `app_developer` role on the instance |
| `Flow not triggering` | Check Email Filter plugin is active; verify `record_type` matches |
| `Guest user errors` | Use subflow with `run_as: 'system'` for privileged operations |

---

## Additional References

For deeper patterns beyond email parsing, read:
- `references/fluent-patterns.md` — Full Table, Flow, BusinessRule, ScriptInclude,
  ACL, Record, and RestApi patterns with examples
- `references/flow-advanced.md` — Advanced flow patterns: subflows, parallel blocks,
  for-each loops, error handling, and approval flows
- ServiceNow SDK docs: https://www.servicenow.com/docs/bundle/yokohama-application-development/page/build/servicenow-sdk/concept/servicenow-sdk-landing.html
- SDK examples repo: https://github.com/ServiceNow/sdk-examples
- Fluent MCP server (for additional AI-assisted dev): https://github.com/modesty/fluent-mcp
