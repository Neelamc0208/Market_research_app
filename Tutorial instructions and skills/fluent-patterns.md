# Fluent API Patterns Reference

Comprehensive reference for all supported ServiceNow Fluent APIs.
Organized by metadata type. Every example uses correct imports and naming.

## Table of Contents

1. [Tables and Columns](#tables-and-columns)
2. [Flows and Triggers](#flows-and-triggers)
3. [Business Rules](#business-rules)
4. [Script Includes](#script-includes)
5. [ACLs](#acls)
6. [Records (Static Data)](#records)
7. [Roles](#roles)
8. [Application Menu and Modules](#application-menu)
9. [Scripted REST APIs](#scripted-rest-apis)
10. [UI Pages](#ui-pages)

---

## 1. Tables and Columns

Import from `@servicenow/sdk/core`.

### Available Column Types

```typescript
import {
  Table,
  StringColumn,          // Short text, max 255 by default
  IntegerColumn,         // Whole numbers
  BooleanColumn,         // True/false
  DateTimeColumn,        // Date + time
  DateColumn,            // Date only
  TimeColumn,            // Time only
  ReferenceColumn,       // Foreign key to another table
  ChoiceColumn,          // Dropdown with predefined values
  JournalColumn,         // Large text / activity journal
  HTMLColumn,            // Rich HTML content
  URLColumn,             // URL field
  DecimalColumn,         // Decimal numbers with scale
  DurationColumn,        // Duration (days/hours/min/sec)
  FieldListColumn,       // List of field names
  GlideListColumn,       // Glide list
  EmailColumn,           // Email address field
  PhoneColumn,           // Phone number field
  PriceColumn,           // Currency/price field
} from '@servicenow/sdk/core'
```

### Full Table Example

```typescript
export const x_vendor_app_orders = Table({
  name: 'x_vendor_app_orders',
  label: 'Orders',
  // Optional: extend an existing table
  // extends: 'task',
  schema: {
    x_vendor_app_order_number: StringColumn({
      label: 'Order Number',
      maxLength: 40,
      unique: true,
      mandatory: true,
      readOnly: true
    }),
    x_vendor_app_customer_name: StringColumn({
      label: 'Customer Name',
      maxLength: 255,
      mandatory: true
    }),
    x_vendor_app_customer_email: StringColumn({
      label: 'Customer Email',
      maxLength: 255
    }),
    x_vendor_app_order_total: DecimalColumn({
      label: 'Order Total',
      scale: 2
    }),
    x_vendor_app_order_date: DateTimeColumn({
      label: 'Order Date'
    }),
    x_vendor_app_status: ChoiceColumn({
      label: 'Status',
      choices: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      defaultValue: 'pending'
    }),
    x_vendor_app_assigned_to: ReferenceColumn({
      label: 'Assigned To',
      reference: 'sys_user'
    }),
    x_vendor_app_notes: JournalColumn({
      label: 'Notes'
    }),
    x_vendor_app_priority: IntegerColumn({
      label: 'Priority'
    }),
    x_vendor_app_is_urgent: BooleanColumn({
      label: 'Urgent',
      defaultValue: false
    })
  }
})
```

### Column Options Reference

Common options across all column types:
- `label` (string, required) — Display label
- `mandatory` (boolean) — Field is required
- `readOnly` (boolean) — Cannot be edited after creation
- `unique` (boolean) — Must be unique across records
- `defaultValue` — Default value for new records

Type-specific:
- `StringColumn`: `maxLength` (number, default 255)
- `DecimalColumn`: `scale` (number, decimal places)
- `ReferenceColumn`: `reference` (string, target table name)
- `ChoiceColumn`: `choices` (array of {value, label}), `defaultValue`

---

## 2. Flows and Triggers

Import from `@servicenow/sdk/automation`.

### Flow Structure

```typescript
import { action, Flow, wfa, trigger } from '@servicenow/sdk/automation'

export const myFlow = Flow(
  // 1. Flow metadata
  {
    $id: Now.ID['my_flow'],
    name: 'My Flow Name',
    description: 'What this flow does'
  },
  // 2. Trigger definition
  wfa.trigger(
    trigger.<category>.<type>,
    { $id: Now.ID['my_trigger'] },
    { /* trigger config */ }
  ),
  // 3. Flow body (actions + logic)
  (params) => {
    // Access trigger data pills via params.trigger
    // Call actions, use flow logic
  }
)
```

### Trigger Types

#### Record Triggers
```typescript
// On record creation
wfa.trigger(
  trigger.record.created,
  { $id: Now.ID['on_create'] },
  { table: 'incident', condition: 'priority=1', run_flow_in: 'background' }
)

// On record update
wfa.trigger(
  trigger.record.updated,
  { $id: Now.ID['on_update'] },
  { table: 'incident', condition: 'state=2' }
)
```

#### Inbound Email Trigger
```typescript
wfa.trigger(
  trigger.application.inboundEmail,
  { $id: Now.ID['email_trigger'] },
  {
    condition: 'subject LIKE order%',  // filter on sys_email fields
    record_type: 'new'                 // 'new' | 'reply' | 'forward'
  }
)
```

Data pills available from inbound email trigger:
- `params.trigger.email.subject` — Email subject line
- `params.trigger.email.body_text` — Plain text body
- `params.trigger.email.body` — HTML body
- `params.trigger.email.from` — Sender address
- `params.trigger.email.recipients` — To addresses
- `params.trigger.email.cc` — CC addresses
- `params.trigger.email.sys_id` — sys_email record ID
- `params.trigger.email.importance` — Email priority

#### Schedule Triggers
```typescript
wfa.trigger(
  trigger.schedule.daily,
  { $id: Now.ID['daily_trigger'] },
  { time: '08:00:00', timezone: 'America/New_York' }
)
```

### Common Actions

```typescript
// Create a record
wfa.action(
  action.core.createRecord,
  { $id: Now.ID['create_rec'] },
  {
    table: 'x_vendor_app_my_table',
    values: {
      field_name: 'value',
      ref_field: wfa.dataPill(params.trigger.current.sys_id, 'string')
    }
  }
)

// Update a record
wfa.action(
  action.core.updateRecord,
  { $id: Now.ID['update_rec'] },
  {
    table: 'incident',
    sys_id: wfa.dataPill(params.trigger.current.sys_id, 'string'),
    values: { state: '6' }
  }
)

// Look up a record
wfa.action(
  action.core.lookupRecord,
  { $id: Now.ID['lookup_rec'] },
  {
    table: 'sys_user',
    conditions: { email: wfa.dataPill(params.trigger.email.from, 'string') }
  }
)

// Log a message
wfa.action(
  action.core.log,
  { $id: Now.ID['log_msg'] },
  {
    log_level: 'info',  // 'info' | 'warn' | 'error'
    log_message: `Processing: ${wfa.dataPill(params.trigger.current.number, 'string')}`
  }
)

// Send notification
wfa.action(
  action.core.sendNotification,
  { $id: Now.ID['send_notif'] },
  {
    table_name: 'incident',
    record: wfa.dataPill(params.trigger.current.sys_id, 'string'),
    notification: 'incident.creation'
  }
)
```

### Flow Logic

```typescript
(params) => {
  // IF / ELSE IF / ELSE
  wfa.flowLogic.if(
    {
      $id: Now.ID['if_high_priority'],
      condition: `${wfa.dataPill(params.trigger.current.priority, 'string')}=1`
    },
    () => {
      // high priority actions
    }
  )
  wfa.flowLogic.elseIf(
    {
      $id: Now.ID['elif_medium'],
      condition: `${wfa.dataPill(params.trigger.current.priority, 'string')}=2`
    },
    () => {
      // medium priority actions
    }
  )
  wfa.flowLogic.else(
    { $id: Now.ID['else_low'] },
    () => {
      // low priority actions
    }
  )
}
```

---

## 3. Business Rules

```typescript
import { BusinessRule } from '@servicenow/sdk/core'

export const validateOrder = BusinessRule({
  $id: Now.ID['validate_order_br'],
  name: 'Validate Order Before Insert',
  table: 'x_vendor_app_orders',
  when: 'before',              // 'before' | 'after' | 'async' | 'display'
  insert: true,
  update: true,
  delete: false,
  query: false,
  condition: 'current.x_vendor_app_order_total > 0',
  active: true,
  order: 100,
  script: `
    (function executeRule(current, previous) {
      if (!current.x_vendor_app_customer_email.toString().includes('@')) {
        current.setAbortAction(true);
        gs.addErrorMessage('Invalid email address');
      }
    })(current, previous);
  `
})
```

---

## 4. Script Includes

For server-side JS/TS modules, use `.server.js` or `.server.ts` files in `src/server/`.
These are standard ServiceNow script includes that can be called from flows,
business rules, and other server-side contexts.

```typescript
// src/server/emailParser.server.ts
import { GlideRecord } from '@servicenow/glide'

export class EmailParser {
  /**
   * Extract order number from email body using regex
   */
  extractOrderNumber(body: string): string | null {
    const match = body.match(/ORD-\d{6,}/);
    return match ? match[0] : null;
  }

  /**
   * Extract amount from email body
   */
  extractAmount(body: string): number | null {
    const match = body.match(/\$[\d,]+\.?\d{0,2}/);
    if (!match) return null;
    return parseFloat(match[0].replace(/[$,]/g, ''));
  }

  /**
   * Parse a structured email body into key-value pairs
   */
  parseStructuredEmail(body: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = body.split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        if (key && value) {
          result[key] = value;
        }
      }
    }
    return result;
  }
}
```

---

## 5. ACLs

```typescript
import { Acl } from '@servicenow/sdk/core'

// Table-level read ACL
Acl({
  $id: Now.ID['email_data_read_acl'],
  type: 'record',
  table: 'x_vendor_app_email_data',
  operation: 'read',
  roles: ['itil', 'admin'],
  active: true
})

// Table-level write ACL
Acl({
  $id: Now.ID['email_data_write_acl'],
  type: 'record',
  table: 'x_vendor_app_email_data',
  operation: 'write',
  roles: ['admin'],
  active: true
})
```

---

## 6. Records (Static Data)

Use the `Record` API to insert static/seed data.

```typescript
import { Record } from '@servicenow/sdk/core'

Record({
  $id: Now.ID['default_config'],
  table: 'x_vendor_app_config',
  data: {
    x_vendor_app_setting_name: 'email_parse_enabled',
    x_vendor_app_setting_value: 'true',
    x_vendor_app_description: 'Enable/disable email parsing'
  }
})
```

---

## 7. Roles

```typescript
import { Role } from '@servicenow/sdk/core'

Role({
  $id: Now.ID['email_admin_role'],
  name: 'x_vendor_app_email_admin',
  description: 'Can manage parsed email data'
})

Role({
  $id: Now.ID['email_viewer_role'],
  name: 'x_vendor_app_email_viewer',
  description: 'Can view parsed email data'
})
```

---

## 8. Application Menu and Modules

```typescript
import { ApplicationMenu, Module } from '@servicenow/sdk/core'

const menu = ApplicationMenu({
  $id: Now.ID['app_menu'],
  title: 'Email Parser',
  hint: 'Email parsing application',
  order: 100
})

Module({
  $id: Now.ID['parsed_emails_module'],
  title: 'Parsed Emails',
  menu: menu,
  table: 'x_vendor_app_email_data',
  order: 100
})

Module({
  $id: Now.ID['config_module'],
  title: 'Configuration',
  menu: menu,
  table: 'x_vendor_app_config',
  order: 200
})
```

---

## 9. Scripted REST APIs

```typescript
import { RestApi, RestApiResource } from '@servicenow/sdk/core'

const api = RestApi({
  $id: Now.ID['email_api'],
  name: 'Email Parser API',
  api_id: 'x_vendor_app_email_api',
  api_namespace: 'x_vendor_app'
})

RestApiResource({
  $id: Now.ID['get_parsed_emails'],
  rest_api: api,
  name: 'Parsed Emails',
  relative_path: '/parsed-emails',
  http_method: 'GET',
  script: `
    (function process(request, response) {
      var gr = new GlideRecord('x_vendor_app_email_data');
      gr.orderByDesc('sys_created_on');
      gr.setLimit(50);
      gr.query();
      var results = [];
      while (gr.next()) {
        results.push({
          sys_id: gr.getUniqueValue(),
          sender: gr.getValue('x_vendor_app_sender'),
          subject: gr.getValue('x_vendor_app_subject'),
          status: gr.getValue('x_vendor_app_status')
        });
      }
      response.setStatus(200);
      response.setBody({ result: results });
    })(request, response);
  `
})
```

---

## 10. UI Pages

```typescript
import { UiPage } from '@servicenow/sdk/core'
import indexPage from '../client/index.html'

UiPage({
  $id: Now.ID['email_dashboard'],
  endpoint: 'x_vendor_app_email_dashboard.do',
  description: 'Email Parser Dashboard',
  category: 'general',
  html: indexPage,
  direct: true
})
```

The front-end code lives in `src/client/` and is bundled automatically
by the SDK's built-in Rollup bundler.
