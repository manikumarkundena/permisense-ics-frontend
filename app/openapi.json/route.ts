import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const openApiSchema = {
  openapi: '3.0.3',
  info: {
    title: 'PermiSense API',
    description: 'Cyber-Physical Incident Intelligence & Response API for Industrial Control Systems. Detect the threat. Trace the impact. Decide the response.',
    version: '1.4.0',
    contact: {
      name: 'PermiSense Engineering Team',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Default Server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Backend Health Check',
        description: 'Returns real readiness and operational status of the PermiSense server.',
        responses: {
          '200': {
            description: 'Health status object',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'degraded'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                    mode: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/system/status': {
      get: {
        summary: 'Get Industrial System Status',
        description: 'Returns actual connectivity and telemetry health of PLC-01, Passive DPI Gateway, Database, and Copilot.',
        responses: {
          '200': {
            description: 'Component status dictionary',
          },
        },
      },
    },
    '/api/telemetry/events': {
      get: {
        summary: 'Retrieve Telemetry Events',
        description: 'Returns historical and real-time stream of Modbus DPI and PLC process telemetry events.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'Array of telemetry events',
          },
        },
      },
    },
    '/api/incidents': {
      get: {
        summary: 'List Correlated Incidents',
        description: 'Returns all persisted correlated cyber-physical incidents.',
        responses: {
          '200': {
            description: 'Array of incident summaries',
          },
        },
      },
    },
    '/api/incidents/{incident_id}': {
      get: {
        summary: 'Get Incident Evidence Detail',
        description: 'Returns full evidence graph, control write details, process deviation, MITRE ATT&CK techniques, and operational risk.',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Complete incident detail',
          },
          '404': {
            description: 'Incident not found',
          },
        },
      },
    },
    '/api/incidents/{incident_id}/status': {
      patch: {
        summary: 'Update Incident Operator Status',
        description: 'Updates incident workflow state (OPEN, INVESTIGATING, CONTAINED, RECOVERED, CLOSED).',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RECOVERED', 'CLOSED'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated incident summary' },
        },
      },
    },
    '/api/incidents/{incident_id}/response': {
      get: {
        summary: 'Get Response Plan',
        description: 'Retrieves backend-generated allowlisted response plan for the incident.',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Response plan details' },
        },
      },
    },
    '/api/incidents/{incident_id}/response/approve': {
      post: {
        summary: 'Approve & Execute Allowlisted Response',
        description: 'Requires explicit human operator approval. Validates action against allowlist and executes Modbus remediation write.',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'approved_by'],
                properties: {
                  action: { type: 'string' },
                  approved_by: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Execution receipt' },
          '400': { description: 'Disallowed or invalid action' },
        },
      },
    },
    '/api/incidents/{incident_id}/response/verify': {
      post: {
        summary: 'Verify Process Recovery',
        description: 'Performs telemetry and Modbus readback to independently verify process returned to nominal bounds.',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Verification result' },
        },
      },
    },
    '/api/demo/status': {
      get: {
        summary: 'Get Demo Industrial Cell Status',
        description: 'Returns real-time status of virtual PLC-01, conveyor drive metrics, and control registers.',
        responses: {
          '200': { description: 'Virtual cell status' },
        },
      },
    },
    '/api/demo/scenarios/speed': {
      post: {
        summary: 'Trigger Unauthorized Speed Scenario',
        description: 'Performs real Modbus/TCP write to R40003: 50 -> 90 RPM to demonstrate detection, correlation, and response chain.',
        responses: {
          '200': { description: 'Scenario triggered' },
        },
      },
    },
    '/api/demo/scenarios/mode': {
      post: {
        summary: 'Trigger Mode Modification Scenario',
        description: 'Performs real Modbus/TCP write to R40002: Auto -> Manual to demonstrate safety interlock bypass detection.',
        responses: {
          '200': { description: 'Scenario triggered' },
        },
      },
    },
    '/api/demo/reset': {
      post: {
        summary: 'Reset Virtual Cell',
        description: 'Resets virtual PLC registers and conveyor simulation to clean safe baseline.',
        responses: {
          '200': { description: 'Reset confirmation' },
        },
      },
    },
    '/api/incidents/{incident_id}/copilot': {
      post: {
        summary: 'Generate Evidence-Grounded Brief',
        description: 'Uses Google Gemini 2.5 Flash to summarize persisted incident evidence without making independent security decisions.',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Structured AI brief' },
        },
      },
    },
    '/api/incidents/{incident_id}/copilot/chat': {
      post: {
        summary: 'Evidence-Grounded Incident Q&A',
        description: 'Ask questions grounded strictly in the incident evidence graph and telemetry records.',
        parameters: [
          {
            name: 'incident_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: {
                  question: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Grounded answer' },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSchema);
}
