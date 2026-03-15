import {
    Table,
    StringColumn,
    HtmlColumn,
    DateTimeColumn,
} from '@servicenow/sdk/core'

/**
 * Email Data — archive of every inbound "Market Research" email.
 * The Inbound Email Flow writes one record here per email received.
 */
export const x_1433234_marketin_email_data = Table({
    name: 'x_1433234_marketin_email_data',
    label: 'Email Data',
    schema: {
        x_1433234_marketin_sender: StringColumn({
            label: 'Sender',
            maxLength: 255,
            mandatory: true,
        }),
        x_1433234_marketin_subject: StringColumn({
            label: 'Subject',
            maxLength: 500,
        }),
        x_1433234_marketin_received_at: DateTimeColumn({
            label: 'Received At',
        }),
        x_1433234_marketin_body_html: HtmlColumn({
            label: 'Body (HTML)',
        }),
        x_1433234_marketin_email_sys_id: StringColumn({
            label: 'sys_email Sys ID',
            maxLength: 32,
        }),
        x_1433234_marketin_parse_status: StringColumn({
            label: 'Parse Status',
            maxLength: 40,
        }),
    },
})
