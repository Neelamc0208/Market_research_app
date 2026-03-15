// @ts-nocheck
/**
 * Business Rule script — Market Research HTML Parser
 *
 * Executed after insert on x_1433234_marketin_market_research
 * when is_parsed == false (seed record created by the Inbound Email Flow).
 *
 * Column mapping from email HTML table:
 *   col 0 → competitor        col 4 → nps
 *   col 1 → segment           col 5 → qoq_growth
 *   col 2 → pricing_tier      col 6 → key_insight
 *   col 3 → market_share
 */
(function executeRule(current, previous) {

    /* ── 0. Recursion guard ────────────────────────────────────────────────── */
    if (current.x_1433234_marketin_is_parsed.toString() === 'true') {
        return;
    }

    /* ── 1. Fetch the HTML body from the linked Email Data record ──────────── */
    var emailRef = current.x_1433234_marketin_email_ref.toString();
    if (!emailRef) {
        gs.warn('MarketResearchParser: seed record has no email_ref — skipping');
        _markParsed(current);
        return;
    }

    var emailGr = new GlideRecord('x_1433234_marketin_email_data');
    if (!emailGr.get(emailRef)) {
        gs.warn('MarketResearchParser: Email Data record not found for sys_id ' + emailRef);
        _markParsed(current);
        return;
    }

    var bodyHtml = emailGr.x_1433234_marketin_body_html.toString();
    if (!bodyHtml) {
        gs.warn('MarketResearchParser: body_html is empty for email ' + emailRef);
        _markParsed(current);
        return;
    }

    /* ── 2. Parse HTML table rows ──────────────────────────────────────────── */
    var rows = _parseHtmlRows(bodyHtml);
    gs.info('MarketResearchParser: found ' + rows.length + ' data row(s) in email ' + emailRef);

    if (rows.length === 0) {
        _markParsed(current);
        // stamp email as parsed
        _updateEmailStatus(emailRef, 'parsed');
        return;
    }

    /* ── 3. Update seed record with first competitor ───────────────────────── */
    _applyRowToRecord(current, rows[0]);
    current.x_1433234_marketin_is_parsed.setValue(true);
    current.setWorkflow(false);   // suppress re-triggering of workflows
    current.update();

    /* ── 4. Insert one record per remaining competitor ─────────────────────── */
    for (var i = 1; i < rows.length; i++) {
        var gr = new GlideRecord('x_1433234_marketin_market_research');
        gr.initialize();
        _applyRowToRecord(gr, rows[i]);
        gr.x_1433234_marketin_email_ref.setValue(emailRef);
        gr.x_1433234_marketin_is_parsed.setValue(true); // prevents BR re-fire
        gr.insert();
    }

    /* ── 5. Mark the source email as parsed ─────────────────────────────────── */
    _updateEmailStatus(emailRef, 'parsed');

    /* ════════════════════════════════════════════════════════════════════════
     * Helper functions
     * ════════════════════════════════════════════════════════════════════════ */

    /**
     * Strip all HTML tags from a string and decode common entities.
     * @param {string} html
     * @returns {string}
     */
    function _stripTags(html) {
        return html
            .replace(/<[^>]+>/g, '')          // remove tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .replace(/&#x2212;/g, '-')         // minus sign (used in −1.8%)
            .replace(/&[a-z]+;/gi, '')         // strip remaining entities
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Parse every data <tr> from an HTML string and return a 2-D array of
     * cell text values.  Header rows (containing <th> elements) are skipped.
     * @param {string} html
     * @returns {string[][]}
     */
    function _parseHtmlRows(html) {
        var results = [];

        // Match every <tr>…</tr> block (non-greedy, case-insensitive, dotall)
        var trRegex = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;
        var tdRegex = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi;
        var trMatch;

        while ((trMatch = trRegex.exec(html)) !== null) {
            var rowHtml = trMatch[1];

            // Skip header rows
            if (/<th/i.test(rowHtml)) {
                continue;
            }

            var cells = [];
            var tdMatch;
            // Reset lastIndex for inner regex
            tdRegex.lastIndex = 0;
            while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
                cells.push(_stripTags(tdMatch[1]));
            }

            if (cells.length > 0) {
                results.push(cells);
            }
        }

        return results;
    }

    /**
     * Map a parsed row array onto a GlideRecord's competitor fields.
     * Col order matches the sample email table:
     *   0=Competitor  1=Segment  2=Pricing Tier  3=Market Share
     *   4=NPS  5=QoQ Growth  6=Key Insight
     * @param {GlideRecord} gr
     * @param {string[]} row
     */
    function _applyRowToRecord(gr, row) {
        gr.x_1433234_marketin_competitor.setValue(row[0] || '');
        gr.x_1433234_marketin_segment.setValue(row[1] || '');
        gr.x_1433234_marketin_pricing_tier.setValue(row[2] || '');
        gr.x_1433234_marketin_market_share.setValue(row[3] || '');
        gr.x_1433234_marketin_nps.setValue(row[4] || '');
        gr.x_1433234_marketin_qoq_growth.setValue(row[5] || '');
        gr.x_1433234_marketin_key_insight.setValue(row[6] || '');
    }

    /**
     * Mark a seed record as parsed without triggering further rules.
     * @param {GlideRecord} gr
     */
    function _markParsed(gr) {
        gr.x_1433234_marketin_is_parsed.setValue(true);
        gr.setWorkflow(false);
        gr.update();
    }

    /**
     * Update the parse_status field on the source Email Data record.
     * @param {string} emailSysId
     * @param {string} status  e.g. 'parsed' | 'error'
     */
    function _updateEmailStatus(emailSysId, status) {
        var eg = new GlideRecord('x_1433234_marketin_email_data');
        if (eg.get(emailSysId)) {
            eg.x_1433234_marketin_parse_status.setValue(status);
            eg.setWorkflow(false);
            eg.update();
        }
    }

})(current, previous);
