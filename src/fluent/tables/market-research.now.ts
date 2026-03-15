import {
    Table,
    StringColumn,
    BooleanColumn,
    ReferenceColumn,
} from '@servicenow/sdk/core'

/**
 * Market Research — one record per competitor row extracted from the email.
 *
 * Flow creates a single seed record (is_parsed = false).
 * The Business Rule parses the HTML body from the linked Email Data record,
 * updates the seed with the first competitor's data, and inserts one
 * additional record per remaining competitor — all with is_parsed = true.
 */
export const x_1433234_marketin_market_research = Table({
    name: 'x_1433234_marketin_market_research',
    label: 'Market Research',
    schema: {
        // ── Competitor fields (mapped from email HTML table columns) ─────────
        x_1433234_marketin_competitor: StringColumn({
            label: 'Competitor',
            maxLength: 255,
        }),
        x_1433234_marketin_segment: StringColumn({
            label: 'Segment',
            maxLength: 100,
        }),
        x_1433234_marketin_pricing_tier: StringColumn({
            label: 'Pricing Tier',
            maxLength: 100,
        }),
        x_1433234_marketin_market_share: StringColumn({
            label: 'Market Share',
            maxLength: 50,
        }),
        x_1433234_marketin_nps: StringColumn({
            label: 'NPS',
            maxLength: 20,
        }),
        x_1433234_marketin_qoq_growth: StringColumn({
            label: 'QoQ Growth',
            maxLength: 20,
        }),
        x_1433234_marketin_key_insight: StringColumn({
            label: 'Key Insight',
            maxLength: 1000,
        }),

        // ── Metadata ─────────────────────────────────────────────────────────
        x_1433234_marketin_email_ref: ReferenceColumn({
            label: 'Source Email',
            referenceTable: 'x_1433234_marketin_email_data',
        }),
        x_1433234_marketin_is_parsed: BooleanColumn({
            label: 'Is Parsed',
        }),
    },
})
