import { ApplicationMenu, Record } from '@servicenow/sdk/core'

/**
 * Application Menu — "Market Research"
 * Appears in the ServiceNow application navigator.
 */
export const marketResearchAppMenu = ApplicationMenu({
    $id: Now.ID['market_research_app_menu'],
    title: 'Market Research',
    active: true,
    order: 100,
    description: 'Browse structured competitor data extracted from inbound Market Research emails',
})

/**
 * Module: Market Research Data
 * Lists all parsed competitor records.
 */
Record({
    $id: Now.ID['market_research_data_module'],
    table: 'sys_app_module',
    data: {
        title: 'Market Research Data',
        name: 'x_1433234_marketin_market_research',
        application: marketResearchAppMenu,
        link_type: 'LIST',
        active: true,
        order: 100,
    },
})

/**
 * Module: Email Archive
 * Lists all inbound email records that triggered the parser.
 */
Record({
    $id: Now.ID['email_archive_module'],
    table: 'sys_app_module',
    data: {
        title: 'Email Archive',
        name: 'x_1433234_marketin_email_data',
        application: marketResearchAppMenu,
        link_type: 'LIST',
        active: true,
        order: 200,
    },
})
