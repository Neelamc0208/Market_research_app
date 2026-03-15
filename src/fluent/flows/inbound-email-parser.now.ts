import { action, Flow, wfa, trigger } from '@servicenow/sdk/automation'

/**
 * Inbound Email Parser Flow
 *
 * Triggers on any email whose subject contains "Market Research".
 * Creates:
 *   1. One record in x_1433234_marketin_email_data  (full email archive)
 *   2. One seed record in x_1433234_marketin_market_research (is_parsed omitted → false)
 *      → the After-Insert Business Rule picks this up and does the HTML parsing.
 */
export const marketResearchEmailFlow = Flow(
    {
        $id: Now.ID['market_research_email_flow'],
        name: 'Market Research Inbound Email Parser',
        description: 'Parses inbound Market Research emails and seeds structured competitor records',
    },
    wfa.trigger(
        trigger.application.inboundEmail,
        { $id: Now.ID['market_research_email_trigger'] },
        {
            // Encoded query — no spaces around operator
            email_conditions: 'subjectLIKEMarket Research',
        }
    ),
    (params) => {
        // ── Step 1: log receipt ───────────────────────────────────────────────
        wfa.action(
            action.core.log,
            { $id: Now.ID['log_market_research_email'] },
            {
                log_level: 'info',
                log_message: `Market Research email received from: ${wfa.dataPill(params.trigger.from_address, 'string')} | Subject: ${wfa.dataPill(params.trigger.subject, 'string')}`,
            }
        )

        // ── Step 2: archive the raw email in Email Data ───────────────────────
        const emailRecord = wfa.action(
            action.core.createRecord,
            { $id: Now.ID['create_email_data_record'] },
            {
                table_name: 'x_1433234_marketin_email_data',
                values: TemplateValue({
                    x_1433234_marketin_sender: wfa.dataPill(params.trigger.from_address, 'string'),
                    x_1433234_marketin_subject: wfa.dataPill(params.trigger.subject, 'string'),
                    x_1433234_marketin_body_html: wfa.dataPill(params.trigger.inbound_email.body, 'reference'),
                    x_1433234_marketin_email_sys_id: wfa.dataPill(params.trigger.inbound_email.sys_id, 'reference'),
                    x_1433234_marketin_parse_status: 'pending',
                }),
            }
        )

        // ── Step 3: create seed Market Research record (is_parsed = false) ────
        //    The After-Insert BR will read the email body via email_ref and
        //    expand this seed into one record per competitor row.
        wfa.action(
            action.core.createRecord,
            { $id: Now.ID['create_seed_market_research_record'] },
            {
                table_name: 'x_1433234_marketin_market_research',
                values: TemplateValue({
                    x_1433234_marketin_email_ref: wfa.dataPill(emailRecord.record, 'reference'),
                    x_1433234_marketin_is_parsed: false,
                }),
            }
        )
    }
)
