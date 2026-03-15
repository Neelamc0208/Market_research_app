import { UiPolicy } from '@servicenow/sdk/core'

/**
 * Hide the "Source Email" (email_ref) field on the Market Research form.
 * The field is an internal reference used by the parser — not useful for end users.
 */
UiPolicy({
    $id: Now.ID['hide_source_email_field_policy'],
    table: 'x_1433234_marketin_market_research',
    shortDescription: 'Hide Source Email field from Market Research form',
    active: true,
    onLoad: true,
    global: true,
    actions: [
        {
            field: 'x_1433234_marketin_email_ref',
            visible: false,
            mandatory: false,
        },
    ],
})
