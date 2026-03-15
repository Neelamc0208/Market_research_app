import { BusinessRule } from '@servicenow/sdk/core'

/**
 * Market Research HTML Parser — Business Rule
 *
 * Fires AFTER INSERT on x_1433234_marketin_market_research when is_parsed = false.
 * The script:
 *   1. Reads the HTML body from the linked Email Data record
 *   2. Extracts every <tr>/<td> from the competitor table
 *   3. Updates the seed record with the first competitor's data  (is_parsed → true)
 *   4. Inserts one new record per additional competitor           (is_parsed = true)
 *
 * Setting is_parsed = true on every written record is the recursion guard —
 * the filterCondition prevents the BR from re-firing on those rows.
 */
BusinessRule({
    $id: Now.ID['market_research_html_parser_br'],
    name: 'Market Research HTML Parser',
    active: true,
    table: 'x_1433234_marketin_market_research',
    when: 'after',
    action: ['insert'],
    // Only run when the seed record has NOT yet been parsed
    filterCondition: 'x_1433234_marketin_is_parsedINFALSE@javascript:false',
    order: 100,
    script: Now.include('./market-research-parser.server.js'),
})
