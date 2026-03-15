# Advanced Flow Patterns Reference

Patterns for complex workflows beyond basic create/update flows.

## Table of Contents

1. [Subflows](#subflows)
2. [Error Handling in Flows](#error-handling)
3. [Inbound Email — Complete Pipeline](#inbound-email-pipeline)
4. [Parallel Execution](#parallel-execution)
5. [For-Each Loops](#for-each-loops)
6. [Common Email Parsing Patterns](#email-parsing-patterns)

---

## 1. Subflows

Use subflows to isolate privileged operations. Inbound email flows run as
the email sender (or Guest if unknown), so use a subflow with elevated
privileges for database operations.

```typescript
import { action, Flow, Subflow, wfa, trigger } from '@servicenow/sdk/automation'

// Subflow that runs as System for privileged operations
export const processEmailSubflow = Subflow(
  {
    $id: Now.ID['process_email_subflow'],
    name: 'Process Email Data',
    description: 'Creates parsed record with system privileges',
    run_as: 'system'
  },
  // Input parameters
  {
    sender: { type: 'string' },
    subject: { type: 'string' },
    body: { type: 'string' },
    email_sys_id: { type: 'string' }
  },
  (params) => {
    wfa.action(
      action.core.createRecord,
      { $id: Now.ID['create_email_record'] },
      {
        table: 'x_vendor_app_email_data',
        values: {
          x_vendor_app_sender: wfa.dataPill(params.inputs.sender, 'string'),
          x_vendor_app_subject: wfa.dataPill(params.inputs.subject, 'string'),
          x_vendor_app_body_text: wfa.dataPill(params.inputs.body, 'string'),
          x_vendor_app_status: 'parsed'
        }
      }
    )
  }
)

// Main flow that triggers on inbound email
export const emailTriggerFlow = Flow(
  {
    $id: Now.ID['email_trigger_flow'],
    name: 'Inbound Email Handler',
    description: 'Catches inbound email and delegates to subflow'
  },
  wfa.trigger(
    trigger.application.inboundEmail,
    { $id: Now.ID['email_trigger'] },
    { condition: 'subject LIKE support%', record_type: 'new' }
  ),
  (params) => {
    // Call the subflow with extracted email data
    wfa.action(
      action.subflow.execute,
      { $id: Now.ID['call_process_subflow'] },
      {
        subflow: 'process_email_subflow',
        inputs: {
          sender: wfa.dataPill(params.trigger.email.from, 'string'),
          subject: wfa.dataPill(params.trigger.email.subject, 'string'),
          body: wfa.dataPill(params.trigger.email.body_text, 'string'),
          email_sys_id: wfa.dataPill(params.trigger.email.sys_id, 'string')
        }
      }
    )
  }
)
```

---

## 2. Error Handling

Wrap critical sections in try blocks and use status fields to track failures.

```typescript
(params) => {
  // Attempt record creation
  const createResult = wfa.action(
    action.core.createRecord,
    { $id: Now.ID['try_create'] },
    {
      table: 'x_vendor_app_email_data',
      values: { /* ... */ }
    }
  )

  // Check if creation succeeded, log errors
  wfa.flowLogic.if(
    {
      $id: Now.ID['check_create_success'],
      condition: `${wfa.dataPill(createResult.record.sys_id, 'string')}=NULL`
    },
    () => {
      wfa.action(
        action.core.log,
        { $id: Now.ID['log_error'] },
        {
          log_level: 'error',
          log_message: 'Failed to create parsed email record'
        }
      )
    }
  )
}
```

---

## 3. Inbound Email — Complete Pipeline

End-to-end pattern for a production email parsing app:

```typescript
import { action, Flow, Subflow, wfa, trigger } from '@servicenow/sdk/automation'

/**
 * Complete email parsing pipeline:
 * 1. Trigger on inbound email matching pattern
 * 2. Extract structured data from email body
 * 3. Validate extracted data
 * 4. Create record in custom table
 * 5. Associate email record with created record
 * 6. Move attachments
 * 7. Notify relevant parties
 */
export const emailPipelineFlow = Flow(
  {
    $id: Now.ID['email_pipeline_flow'],
    name: 'Email Processing Pipeline',
    description: 'Full pipeline for parsing and storing inbound email data'
  },
  wfa.trigger(
    trigger.application.inboundEmail,
    { $id: Now.ID['pipeline_email_trigger'] },
    {
      condition: 'subject LIKE %invoice%^ORsubject LIKE %order%^ORsubject LIKE %receipt%',
      record_type: 'new'
    }
  ),
  (params) => {
    const emailFrom = wfa.dataPill(params.trigger.email.from, 'string')
    const emailSubject = wfa.dataPill(params.trigger.email.subject, 'string')
    const emailBody = wfa.dataPill(params.trigger.email.body_text, 'string')
    const emailSysId = wfa.dataPill(params.trigger.email.sys_id, 'string')

    // Step 1: Log receipt
    wfa.action(
      action.core.log,
      { $id: Now.ID['log_receipt'] },
      {
        log_level: 'info',
        log_message: `Email received from ${emailFrom}: ${emailSubject}`
      }
    )

    // Step 2: Create the parsed data record
    const newRecord = wfa.action(
      action.core.createRecord,
      { $id: Now.ID['create_data_record'] },
      {
        table: 'x_vendor_app_email_data',
        values: {
          x_vendor_app_sender: emailFrom,
          x_vendor_app_subject: emailSubject,
          x_vendor_app_body_text: emailBody,
          x_vendor_app_received_date: wfa.dataPill(params.trigger.email.sys_created_on, 'string'),
          x_vendor_app_status: 'new'
        }
      }
    )

    // Step 3: Associate email with created record
    wfa.action(
      action.core.associateRecordToEmail,
      { $id: Now.ID['associate_email'] },
      {
        email: emailSysId,
        target_table: 'x_vendor_app_email_data',
        target_record: wfa.dataPill(newRecord.record.sys_id, 'string')
      }
    )

    // Step 4: Move email attachments to the record
    wfa.action(
      action.core.moveEmailAttachmentToRecord,
      { $id: Now.ID['move_attachments'] },
      {
        email: emailSysId,
        target_table: 'x_vendor_app_email_data',
        target_record: wfa.dataPill(newRecord.record.sys_id, 'string')
      }
    )

    // Step 5: Conditionally notify based on subject keywords
    wfa.flowLogic.if(
      {
        $id: Now.ID['check_urgent'],
        condition: `${emailSubject} LIKE %urgent%`
      },
      () => {
        wfa.action(
          action.core.sendNotification,
          { $id: Now.ID['notify_urgent'] },
          {
            table_name: 'x_vendor_app_email_data',
            record: wfa.dataPill(newRecord.record.sys_id, 'string')
          }
        )
      }
    )
  }
)
```

---

## 4. Parallel Execution

Run multiple independent actions simultaneously:

```typescript
wfa.flowLogic.parallelBlock(
  { $id: Now.ID['parallel_notifications'] },
  // Branch 1
  () => {
    wfa.action(action.core.sendNotification,
      { $id: Now.ID['notify_team'] },
      { /* ... */ }
    )
  },
  // Branch 2
  () => {
    wfa.action(action.core.log,
      { $id: Now.ID['log_processing'] },
      { log_level: 'info', log_message: 'Processing in parallel' }
    )
  }
)
```

---

## 5. For-Each Loops

Iterate over a collection of records:

```typescript
const lookupResult = wfa.action(
  action.core.lookupRecords,
  { $id: Now.ID['find_related'] },
  {
    table: 'x_vendor_app_email_data',
    conditions: { x_vendor_app_status: 'new' }
  }
)

wfa.flowLogic.forEach(
  { $id: Now.ID['process_each'] },
  lookupResult.records,
  (record) => {
    wfa.action(
      action.core.updateRecord,
      { $id: Now.ID['mark_processed'] },
      {
        table: 'x_vendor_app_email_data',
        sys_id: wfa.dataPill(record.sys_id, 'string'),
        values: { x_vendor_app_status: 'parsed' }
      }
    )
  }
)
```

---

## 6. Common Email Parsing Patterns

### Pattern: Key-Value Extraction
For emails with structured content like:
```
Order Number: ORD-123456
Customer: John Smith
Amount: $1,250.00
Date: 2025-03-15
```

Use a Script Include with regex to parse, then call it from a flow
via a Script action or a custom Spoke action.

### Pattern: Subject-Based Routing
```typescript
wfa.flowLogic.if(
  {
    $id: Now.ID['route_invoice'],
    condition: `${emailSubject} LIKE %invoice%`
  },
  () => { /* create invoice record */ }
)
wfa.flowLogic.elseIf(
  {
    $id: Now.ID['route_order'],
    condition: `${emailSubject} LIKE %order%`
  },
  () => { /* create order record */ }
)
wfa.flowLogic.else(
  { $id: Now.ID['route_general'] },
  () => { /* create general inquiry record */ }
)
```

### Pattern: Sender Verification
Look up the sender in sys_user to determine routing:
```typescript
const senderLookup = wfa.action(
  action.core.lookupRecord,
  { $id: Now.ID['lookup_sender'] },
  {
    table: 'sys_user',
    conditions: { email: emailFrom }
  }
)

wfa.flowLogic.if(
  {
    $id: Now.ID['known_sender'],
    condition: `${wfa.dataPill(senderLookup.record.sys_id, 'string')}!=NULL`
  },
  () => {
    // Known user — assign record to their department
  }
)
wfa.flowLogic.else(
  { $id: Now.ID['unknown_sender'] },
  () => {
    // Unknown sender — flag for manual review
  }
)
```

### Important: Email Security Considerations

- Inbound email flows execute as the sender. If the sender is not
  recognized in sys_user, the flow runs as **Guest**.
- For any write operations, always use a **Subflow** with `run_as: 'system'`
  to avoid ACL issues.
- Enable the **Email Filter plugin** (`com.glide.email_filter`) to prevent
  trigger failures on upgraded instances.
- Set the system property `glide.hub.flow.inbound_email_trigger.show_advanced`
  to `true` to access ordering and stop-processing controls.
