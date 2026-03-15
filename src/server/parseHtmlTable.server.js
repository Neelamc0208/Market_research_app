/**
 * parseHtmlTable — shared server-side HTML table parser utility.
 *
 * Can be referenced from any server script via Now.include() or
 * copied directly into a Script Include for reuse across scopes.
 *
 * Usage (within a Script Include or BR script):
 *   var rows = parseHtmlRows(htmlString);
 *   // rows → string[][]  (one inner array per <tr>, one string per <td>)
 *
 * Column order for Market Research emails:
 *   [0] Competitor  [1] Segment  [2] Pricing Tier  [3] Market Share
 *   [4] NPS         [5] QoQ Growth                 [6] Key Insight
 */

/**
 * Strip HTML tags and decode common entities from a cell string.
 * @param {string} html
 * @returns {string}
 */
function stripTags(html) {
    return html
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x2212;/g, '-')   // Unicode minus sign → hyphen
        .replace(/&[a-z]+;/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Parse all data rows from an HTML table string.
 * Header rows (containing <th> elements) are automatically skipped.
 *
 * @param {string} html  - Raw HTML containing at least one <table>
 * @returns {string[][]} - 2-D array: rows × cells (plain text values)
 */
function parseHtmlRows(html) {
    var results = [];
    var trRegex = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;
    var tdRegex = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi;
    var trMatch;

    while ((trMatch = trRegex.exec(html)) !== null) {
        var rowHtml = trMatch[1];
        if (/<th/i.test(rowHtml)) { continue; } // skip header rows

        var cells = [];
        var tdMatch;
        tdRegex.lastIndex = 0; // reset inner regex for each row
        while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
            cells.push(stripTags(tdMatch[1]));
        }

        if (cells.length > 0) {
            results.push(cells);
        }
    }

    return results;
}
