window.nativeWorkflowConfig = {
  "title": "Funeral Home Operations Manager",
  "features": [
    {
      "id": "analyze",
      "endpoint": "/ai/analyze",
      "title": "Analyze",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "feature",
          "type": "text",
          "required": false,
          "label": "Feature",
          "presets": [
            "Case readiness review",
            "Service coordination plan",
            "Operational risk review"
          ],
          "manual": false
        },
        {
          "key": "data",
          "type": "json",
          "required": false,
          "label": "Data",
          "presets": [
            {
              "case_number": "EH-DEMO-1001",
              "service_type": "traditional_funeral",
              "service_date": "2026-10-18",
              "open_items": [
                "burial permit",
                "clergy confirmation"
              ],
              "family_preferences": [
                "Catholic mass",
                "military honors"
              ]
            },
            {
              "case_number": "EH-DEMO-1002",
              "service_type": "celebration_of_life",
              "estimated_attendees": 140,
              "vendors": [
                "florist",
                "caterer",
                "AV technician"
              ],
              "constraints": [
                "wheelchair access",
                "livestream"
              ]
            },
            {
              "case_number": "EH-DEMO-1003",
              "disposition": "cremation",
              "jurisdiction": "TX",
              "authorizations": {
                "next_of_kin": true,
                "cremation": false
              },
              "deadline_hours": 36
            }
          ],
          "manual": false
        },
        {
          "key": "prompt",
          "type": "text",
          "required": false,
          "label": "Prompt",
          "presets": [
            "Summarize readiness, list blockers by urgency, and assign the next three actions.",
            "Create a coordination plan with owners, deadlines, dependencies, and family communication checkpoints.",
            "Identify compliance and operational risks, explain assumptions, and recommend mitigations without bypassing approvals."
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 999
      }
    },
    {
      "id": "generate-obituary",
      "endpoint": "/ai/generate-obituary",
      "title": "Generate obituary",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "case_id",
          "type": "text",
          "required": true,
          "label": "Case id",
          "presets": [
            "Example case id 1",
            "Example case id 2",
            "Example case id 3"
          ],
          "manual": true,
          "resource": "cases"
        },
        {
          "key": "details",
          "type": "json",
          "required": false,
          "label": "Details",
          "presets": [
            {
              "preferred_name": "Margaret Sullivan",
              "biography": "Retired elementary teacher and longtime Austin volunteer.",
              "family_notes": "Warm, faith-centered tone; mention Irish heritage and love of baking.",
              "service_information": "Funeral Mass at St. Patrick’s Catholic Church on October 18 at 10:00 AM.",
              "donations": "St. Vincent de Paul Society in lieu of flowers."
            },
            {
              "preferred_name": "James Henderson",
              "biography": "Korean War veteran and civil engineer who mentored young veterans.",
              "family_notes": "Lead with service, devotion to family, and dry humor.",
              "service_information": "Military honors at the Texas State Veterans Cemetery on October 21 at 2:00 PM.",
              "donations": "VFW Post 8787 Scholarship Fund."
            },
            {
              "preferred_name": "Dorothy Chambers",
              "biography": "Entrepreneur, caterer, and mentor to women-owned businesses.",
              "family_notes": "Celebratory voice; include jazz, gardening, and community service.",
              "service_information": "Celebration of life at Eternal Haven Chapel on October 23 at 11:00 AM.",
              "donations": "MD Anderson Cancer Center."
            }
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1013
      },
      "confirm": "Generate and save this native draft or assessment for the selected actual record?"
    },
    {
      "id": "compliance-check",
      "endpoint": "/ai/compliance-check",
      "title": "Compliance check",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "state_code",
          "type": "text",
          "required": false,
          "label": "State code",
          "presets": [
            "TX",
            "CA",
            "FL"
          ],
          "manual": false
        },
        {
          "key": "case_data",
          "type": "json",
          "required": false,
          "label": "Case data",
          "presets": [
            {
              "case_number": "EH-DEMO-2001",
              "disposition": "burial",
              "place_of_death": "Austin, TX",
              "service_date": "2026-10-18",
              "documents_on_file": [
                "pronouncement",
                "family authorization"
              ]
            },
            {
              "case_number": "EH-DEMO-2002",
              "disposition": "cremation",
              "place_of_death": "Los Angeles, CA",
              "service_date": "2026-10-20",
              "documents_on_file": [
                "death certificate worksheet"
              ],
              "transport_across_county_lines": true
            },
            {
              "case_number": "EH-DEMO-2003",
              "disposition": "shipping_out_of_state",
              "place_of_death": "Miami, FL",
              "destination": "Atlanta, GA",
              "service_date": "2026-10-22",
              "documents_on_file": [
                "pronouncement",
                "embalming authorization"
              ]
            }
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1061
      }
    },
    {
      "id": "grief-recommendation",
      "endpoint": "/ai/grief-recommendation",
      "title": "Grief recommendation",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "situation",
          "type": "text",
          "required": false,
          "label": "Situation",
          "presets": [
            "An adult daughter is two weeks after her mother’s funeral, reports disrupted sleep and difficulty returning to work, and asks for local and virtual support options. Provide supportive next steps and clear crisis-escalation guidance.",
            "A widower is one month after the service, has limited transportation, prefers faith-based support, and is open to phone check-ins. Recommend accessible resources and a compassionate contact cadence.",
            "Parents are approaching the first anniversary of an adult child’s death and report renewed intense grief. Suggest trauma-informed supports, remembrance activities, and signs that warrant licensed clinical care."
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1076
      }
    },
    {
      "id": "pricing-estimate",
      "endpoint": "/ai/pricing-estimate",
      "title": "Pricing estimate",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "services",
          "type": "json",
          "required": false,
          "label": "Services",
          "presets": [
            [
              {
                "name": "Basic services of funeral director and staff",
                "quantity": 1
              },
              {
                "name": "Visitation",
                "hours": 4
              },
              {
                "name": "Funeral ceremony",
                "quantity": 1
              },
              {
                "name": "Hearse transportation",
                "miles": 25
              }
            ],
            [
              {
                "name": "Direct cremation",
                "quantity": 1
              },
              {
                "name": "Memorial service",
                "quantity": 1
              },
              {
                "name": "Livestream",
                "quantity": 1
              }
            ],
            [
              {
                "name": "Graveside service",
                "quantity": 1
              },
              {
                "name": "Preparation and refrigeration",
                "days": 3
              },
              {
                "name": "Out-of-state transportation coordination",
                "quantity": 1
              }
            ]
          ],
          "manual": false
        },
        {
          "key": "merchandise",
          "type": "json",
          "required": false,
          "label": "Merchandise",
          "presets": [
            [
              {
                "name": "Standard hardwood casket",
                "quantity": 1
              },
              {
                "name": "Memorial folders",
                "quantity": 100
              }
            ],
            [
              {
                "name": "Classic bronze urn",
                "quantity": 1
              },
              {
                "name": "Keepsake urns",
                "quantity": 3
              },
              {
                "name": "Photo tribute",
                "quantity": 1
              }
            ],
            [
              {
                "name": "Burial vault",
                "quantity": 1
              },
              {
                "name": "Register book",
                "quantity": 1
              },
              {
                "name": "Grave marker coordination",
                "quantity": 1
              }
            ]
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1091
      }
    },
    {
      "id": "embalming-report",
      "endpoint": "/ai/embalming-report",
      "title": "Embalming report",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "embalming_id",
          "type": "text",
          "required": true,
          "label": "Embalming id",
          "presets": [
            "Example embalming id 1",
            "Example embalming id 2",
            "Example embalming id 3"
          ],
          "manual": true,
          "resource": "embalming"
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1108
      }
    },
    {
      "id": "aftercare-email",
      "endpoint": "/ai/aftercare-email",
      "title": "Aftercare email",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "case_id",
          "type": "text",
          "required": true,
          "label": "Case id",
          "presets": [
            "Example case id 1",
            "Example case id 2",
            "Example case id 3"
          ],
          "manual": true,
          "resource": "cases"
        },
        {
          "key": "weeks_since_service",
          "type": "number",
          "required": false,
          "label": "Weeks since service",
          "presets": [
            2,
            4,
            26
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1141
      }
    },
    {
      "id": "preneed-conversion-summary",
      "endpoint": "/ai/preneed-conversion-summary",
      "title": "Preneed conversion summary",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "preneed_id",
          "type": "text",
          "required": true,
          "label": "Preneed id",
          "presets": [
            "Example preneed id 1",
            "Example preneed id 2",
            "Example preneed id 3"
          ],
          "manual": true,
          "resource": "preneed"
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1175
      }
    },
    {
      "id": "grief-stage-classifier",
      "endpoint": "/ai/grief-stage-classifier",
      "title": "Grief stage classifier",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "aftercare_id",
          "type": "text",
          "required": true,
          "label": "Aftercare id",
          "presets": [
            "Example aftercare id 1",
            "Example aftercare id 2",
            "Example aftercare id 3"
          ],
          "manual": true,
          "resource": "aftercare"
        },
        {
          "key": "family_response_text",
          "type": "text",
          "required": false,
          "label": "Family response text",
          "presets": [
            "I am sleeping only a few hours, but my sister checks on me daily. I would like information about a local grief group and a phone call next week.",
            "Most days I can manage work, but weekends feel overwhelming. I am open to individual counseling and a virtual support group.",
            "The anniversary is approaching and I have stopped answering friends. I feel hopeless and need someone to contact me today."
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1204
      },
      "confirm": "Generate and save this native draft or assessment for the selected actual record?"
    },
    {
      "id": "permit-checklist",
      "endpoint": "/ai/permit-checklist",
      "title": "Permit checklist",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "case_id",
          "type": "text",
          "required": true,
          "label": "Case id",
          "presets": [
            "Example case id 1",
            "Example case id 2",
            "Example case id 3"
          ],
          "manual": true,
          "resource": "cases"
        },
        {
          "key": "state_code",
          "type": "text",
          "required": true,
          "label": "State code",
          "presets": [
            "TX",
            "CA",
            "FL"
          ],
          "manual": false
        },
        {
          "key": "service_type",
          "type": "text",
          "required": true,
          "label": "Service type",
          "presets": [
            "traditional burial",
            "cremation with memorial service",
            "out-of-state transport and burial"
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1243
      }
    },
    {
      "id": "preneed-at-risk",
      "endpoint": "/ai/preneed-at-risk",
      "title": "Preneed at risk",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [],
      "source": {
        "file": "server/index.js",
        "line": 1316
      }
    },
    {
      "id": "memorial-upsell",
      "endpoint": "/ai/memorial-upsell",
      "title": "Memorial upsell",
      "description": "Use one of the complete examples or enter reviewed case context. Generating never bypasses record, authorization, publication, or approval controls.",
      "fields": [
        {
          "key": "case_id",
          "type": "text",
          "required": true,
          "label": "Case id",
          "presets": [
            "Example case id 1",
            "Example case id 2",
            "Example case id 3"
          ],
          "manual": true,
          "resource": "cases"
        },
        {
          "key": "family_budget",
          "type": "number",
          "required": false,
          "label": "Family budget",
          "presets": [
            3500,
            1500,
            7500
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/index.js",
        "line": 1352
      }
    },
    {
      "id": "preneed-conversion-advisor",
      "endpoint": "/preneed-conversion/recommend",
      "title": "Pre-need conversion advisor",
      "description": "Build a compassionate product mix and contact cadence from a reviewed family profile. Recommendations remain advisory and require staff review.",
      "fields": [
        {
          "key": "family_id",
          "type": "text",
          "required": false,
          "label": "Family reference",
          "presets": [
            "FAMILY-DEMO-101",
            "FAMILY-DEMO-202",
            "FAMILY-DEMO-303"
          ],
          "manual": false
        },
        {
          "key": "contact_name",
          "type": "text",
          "required": false,
          "label": "Contact name",
          "presets": [
            "Elaine Carter",
            "Michael Nguyen",
            "Rosa Martinez"
          ],
          "manual": false
        },
        {
          "key": "age",
          "type": "number",
          "required": false,
          "label": "Age",
          "presets": [
            72,
            58,
            66
          ],
          "manual": false
        },
        {
          "key": "income_band",
          "type": "text",
          "required": false,
          "label": "Income band",
          "presets": [
            "middle",
            "upper-middle",
            "low"
          ],
          "manual": false
        },
        {
          "key": "family_size",
          "type": "number",
          "required": false,
          "label": "Family size",
          "presets": [
            3,
            5,
            2
          ],
          "manual": false
        },
        {
          "key": "religion",
          "type": "text",
          "required": false,
          "label": "Religion or cultural preference",
          "presets": [
            "Catholic",
            "Buddhist and secular blended service",
            "Non-denominational with Mexican-American traditions"
          ],
          "manual": false
        },
        {
          "key": "prior_arrangement",
          "type": "json",
          "required": false,
          "label": "Prior arrangement on file",
          "presets": [
            true,
            false,
            true
          ],
          "manual": false
        },
        {
          "key": "preferences",
          "type": "json",
          "required": false,
          "label": "Stated preferences",
          "presets": [
            {
              "service_type": "traditional",
              "budget_usd": 9000,
              "priorities": [
                "family viewing",
                "parish funeral mass"
              ],
              "contact_channel": "phone"
            },
            {
              "service_type": "cremation",
              "budget_usd": 6500,
              "priorities": [
                "memorial service",
                "livestream",
                "keepsake urns"
              ],
              "contact_channel": "email"
            },
            {
              "service_type": "graveside",
              "budget_usd": 4800,
              "priorities": [
                "simple arrangements",
                "Spanish-language materials"
              ],
              "contact_channel": "in_person"
            }
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/routes/preneedConversionAgent.js",
        "line": 43
      }
    },
    {
      "id": "multi-state-permit-autofiler",
      "endpoint": "/permit-autofiler/orchestrate",
      "title": "Multi-state permit auto-filer plan",
      "description": "Create a filing plan only. Unconfigured registry credentials remain explicit, and staff must perform and verify every external filing.",
      "fields": [
        {
          "key": "case_id",
          "type": "text",
          "required": true,
          "label": "Case",
          "presets": [
            "",
            "",
            ""
          ],
          "manual": true,
          "resource": "cases"
        },
        {
          "key": "decedent_state",
          "type": "text",
          "required": false,
          "label": "Decedent state",
          "presets": [
            "TX",
            "CA",
            "FL"
          ],
          "manual": false
        },
        {
          "key": "disposition_state",
          "type": "text",
          "required": false,
          "label": "Disposition state",
          "presets": [
            "OK",
            "NV",
            "GA"
          ],
          "manual": false
        },
        {
          "key": "disposition_type",
          "type": "text",
          "required": false,
          "label": "Disposition type",
          "presets": [
            "out-of-state burial",
            "cremation with interstate shipment",
            "out-of-state burial"
          ],
          "manual": false
        },
        {
          "key": "cause_of_death",
          "type": "text",
          "required": false,
          "label": "Cause of death",
          "presets": [
            "Natural causes; physician certification pending",
            "Natural causes; no medical examiner hold",
            "Accident; medical examiner release received"
          ],
          "manual": false
        }
      ],
      "source": {
        "file": "server/routes/multiStatePermitAutoFiler.js",
        "line": 43
      }
    }
  ],
  "resources": [
    {
      "key": "ai-history",
      "endpoint": "/ai-history?limit=50",
      "label": "Saved AI results",
      "fields": [],
      "delete": false,
      "source": "Authenticated AI result history; read-only in this workspace."
    },
    {
      "key": "obituaries",
      "endpoint": "/obituaries?limit=50",
      "label": "Saved obituaries (including AI drafts)",
      "fields": [],
      "delete": false,
      "source": "Existing authenticated obituary records; read-only in this workspace."
    },
    {
      "key": "cases",
      "endpoint": "/cases",
      "label": "Cases",
      "fields": [],
      "delete": false,
      "source": "Existing authenticated resource API; record mutations remain in native governed screens."
    },
    {
      "key": "embalming",
      "endpoint": "/embalming",
      "label": "Embalming",
      "fields": [],
      "delete": false,
      "source": "Existing authenticated resource API; record mutations remain in native governed screens."
    },
    {
      "key": "preneed",
      "endpoint": "/preneed",
      "label": "Preneed",
      "fields": [],
      "delete": false,
      "source": "Existing authenticated resource API; record mutations remain in native governed screens."
    },
    {
      "key": "aftercare",
      "endpoint": "/aftercare",
      "label": "Aftercare",
      "fields": [],
      "delete": false,
      "source": "Existing authenticated resource API; record mutations remain in native governed screens."
    }
  ]
};
