import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '3cb71a4b903f4c9dae97765ab904b6de'
                    }
                    create_email_data_record: {
                        table: 'sys_hub_action_instance_v2'
                        id: '54fc2cb369424dda95d0c0a1d02d0b8b'
                    }
                    create_seed_market_research_record: {
                        table: 'sys_hub_action_instance_v2'
                        id: 'bf6b6cac64b54e7bb4155200ea6b3739'
                    }
                    email_archive_module: {
                        table: 'sys_app_module'
                        id: '6b71b16480e44c93825b8eb719781fe7'
                    }
                    log_market_research_email: {
                        table: 'sys_hub_action_instance_v2'
                        id: '616c1e3f0e8341e3828bfb548e17300d'
                    }
                    market_research_app_menu: {
                        table: 'sys_app_application'
                        id: '45bf1c6e25d54131bf2b5187e5cb5e9c'
                    }
                    market_research_data_module: {
                        table: 'sys_app_module'
                        id: 'f43d696d97bc47f3a6e9e98a88e4a71b'
                    }
                    market_research_email_flow: {
                        table: 'sys_hub_flow'
                        id: '82412877885c4144a5be0395453f3a43'
                    }
                    market_research_email_trigger: {
                        table: 'sys_hub_trigger_instance_v2'
                        id: '3a91bbb98d80467687b0b388027098fd'
                    }
                    market_research_html_parser_br: {
                        table: 'sys_script'
                        id: 'ff26655a7ce146fa8043ed262a6a4054'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'bac82b524f1d470f90ee03f883486769'
                    }
                    src_server_parseHtmlTable_server_js: {
                        table: 'sys_module'
                        id: '3935df5afd5440f0bafcd8e182a5856d'
                    }
                }
                composite: [
                    {
                        table: 'sys_dictionary'
                        id: '055ba4dc3f2c429a92695555f5c7a007'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_qoq_growth'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0fd69762d4e24de99b62bc3acbb7f1c6'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_parse_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '18a9ccf6611d4f11a1c0aa21107e1087'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_parse_status'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1bcf2c6c7a71444c91a942673a6a12ab'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_email_ref'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1caa6e607016407eaa2923b94e6925ca'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_is_parsed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1cd767edecbb4b4998d0b6c943145919'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_competitor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '202a63da460f44caa7aa081399a61d48'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_subject'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '27c406eadd474ee6a5cd08688577be8a'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '296347aa42a74160805e7b8a5b5e9458'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_pricing_tier'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2bdee55355884195ba2f8952cab5748c'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_segment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2ff1c3ef0cf1489c8923edda72193ae7'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '33437f4b2904467fa6413d6785737bef'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_nps'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '415e0a07ae2549eab246514ae7844ae6'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_email_sys_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4664d16a04c04597af9cf2b144b77b28'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_email_sys_id'
                        }
                    },
                    {
                        table: 'sys_ui_policy'
                        id: '476e31f201f7416cab192f29bc2773bb'
                        key: {
                            table: 'x_1433234_marketin_market_research'
                            short_description: 'Hide Source Email field from Market Research form'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '50fdbf7cc6bc4167b47ed5ca420ff206'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '52dd1d6d462148609631a1a343d331bf'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_received_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '53f16f210c4544dbb86e4884282141b4'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_is_parsed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '58ab70a385b04285bb8440a8aacf014a'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5af1ce37816e4d31aa3e6c2a5679cb2e'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_competitor'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '67a33f8c62384b7fb9013dff436f54b0'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6943cced00a04f59a3803469a12262e4'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_sender'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7a19893dfa6b4c95b247c5cfb89efc9e'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_market_share'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8e1120bde4884fc6952e171e1e81cfc2'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_received_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8e5c4a20348344aa92c2148b89346596'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b0a5dd85c6e5497486e0de3a1652d640'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_segment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b0f08b0b252b4fce8375f8ed34e201b5'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_market_share'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b5d9b504976e46709d9d7fd329078e50'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_pricing_tier'
                        }
                    },
                    {
                        table: 'sys_ui_policy_action'
                        id: 'b94664a7f0c74f95adb6c0a9ca5d2afb'
                        key: {
                            ui_policy: {
                                id: '476e31f201f7416cab192f29bc2773bb'
                                key: {
                                    table: 'x_1433234_marketin_market_research'
                                    short_description: 'Hide Source Email field from Market Research form'
                                }
                            }
                            field: 'x_1433234_marketin_email_ref'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c06860f85e8540c69ec2882672392fb3'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_body_html'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c1d9d8d5cd7545aa8b63965cd9b34cee'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_key_insight'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'c5b5ff6921974fe2b809b72290f35d4a'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cfe666f19ca449a0a1d385721951582e'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_sender'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd05435a8a9774896b0fba7b134036dc6'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_nps'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd746599a77614c3eb8f8dd78bed4dbbb'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_subject'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'df9c2a13eb5b42f592225150977f2748'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_qoq_growth'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'e3b5696dc7f14d8e8b9f8cdeaa9e01ab'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e9207a6bdddc4445bef53f5cd0d278c6'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_email_ref'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f8e2ade316fb475aa7d1d613c6d8d905'
                        key: {
                            name: 'x_1433234_marketin_email_data'
                            element: 'x_1433234_marketin_body_html'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fa42ab98e43b4964a860c12764d3b373'
                        key: {
                            name: 'x_1433234_marketin_market_research'
                            element: 'x_1433234_marketin_key_insight'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
