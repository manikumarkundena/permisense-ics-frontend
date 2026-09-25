import type {
  HealthResponse,
  SystemStatusResponse,
  TelemetryEvent,
  IncidentSummary,
  IncidentDetail,
  IncidentStatus,
  ResponsePlan,
  RecoveryVerificationResult,
  DemoStatusResponse,
  CopilotBriefResponse,
  CopilotChatResponse,
} from './types';

export class ApiError extends Error {
  status: number;
  detail?: string;
  endpoint: string;

  constructor(status: number, message: string, endpoint: string, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.endpoint = endpoint;
  }
}

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured. Point the frontend at the real PermiSense API.');
  }
  return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      let detailMsg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        detailMsg = errorJson.detail || errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch {
        const text = await res.text();
        if (text) detailMsg = text;
      }
      throw new ApiError(res.status, `Request to ${endpoint} failed: ${detailMsg}`, endpoint, detailMsg);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    throw new ApiError(0, `Network failure requesting ${endpoint}: ${message}`, endpoint, message);
  }
}

function unwrapList<T>(payload: T[] | { incidents?: T[]; events?: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.incidents)) return payload.incidents;
  if (Array.isArray(payload.events)) return payload.events;
  return [];
}

export const apiClient = {
  getHealth: () => request<HealthResponse>('/api/health'),
  getSystemStatus: () => request<SystemStatusResponse>('/api/system/status'),

  // Telemetry history is not exposed by the authoritative backend.
  // Live telemetry arrives through /ws/events instead.
  getTelemetryEvents: async (limit = 80) => {
    const payload = await request<TelemetryEvent[] | { events?: TelemetryEvent[] }>(
      `/api/telemetry/events?limit=${limit}`
    );
    return unwrapList(payload);
  },

  getIncidents: async () => {
    const payload = await request<IncidentSummary[] | { incidents?: IncidentSummary[] }>(
      '/api/incidents'
    );
    return unwrapList(payload);
  },

  getIncident: (incidentId: string) =>
    request<IncidentDetail>(`/api/incidents/${encodeURIComponent(incidentId)}`),

  updateIncidentStatus: (incidentId: string, status: IncidentStatus) =>
    request<IncidentSummary>(`/api/incidents/${encodeURIComponent(incidentId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: String(status).toLowerCase() }),
    }),

  getResponsePlan: (incidentId: string) =>
    request<ResponsePlan>(`/api/incidents/${encodeURIComponent(incidentId)}/response`),

  approveResponse: (incidentId: string, action: string, approvedBy = 'operator') =>
    request<{ success?: boolean; status: string; response?: unknown }>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ action, approved_by: approvedBy }),
      }
    ),

  verifyRecovery: (incidentId: string) =>
    request<RecoveryVerificationResult>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response/verify`,
      { method: 'POST' }
    ),

  getDemoStatus: async (): Promise<DemoStatusResponse> => {
    const payload = await request<{
      status: 'ready' | 'offline' | 'degraded';
      plc: string | DemoStatusResponse['plc'];
      process: DemoStatusResponse['process'];
      controls?: DemoStatusResponse['controls'];
      scenarios?: {
        speed?: string;
        mode?: string;
        speed_attack_active?: boolean;
        mode_attack_active?: boolean;
        last_scenario_time?: string | null;
      };
      error?: string;
    }>('/api/demo/status');

    // Normalize the live backend response once so every UI surface consumes
    // the same contract. The backend returns raw PLC status strings; the
    // frontend route may return the richer PLC object.
    const plc =
      typeof payload.plc === 'string'
        ? {
            id: 'PLC-01',
            name: 'PermiSense Virtual PLC',
            protocol: 'Modbus/TCP',
            host: 'backend',
            port: 5020,
            connection: payload.plc,
          }
        : payload.plc;

    const controls = payload.controls ?? {
      motor_enable: 0,
      operating_mode: 0,
      speed_setpoint: 0,
      acceleration_limit: 0,
      production_target: 0,
      overspeed_limit: 75,
      high_load_limit: 80,
      jam_timeout: 5,
      config_version: 0,
    };

    const process =
      payload.process === 'unavailable'
        ? 'unavailable'
        : {
            ...payload.process,
            state_label:
              payload.process.state_label ??
              ({ 0: 'STOPPED', 1: 'RUNNING', 2: 'IDLE', 3: 'FAULT' } as Record<number, string>)[payload.process.state] ??
              `STATE_${payload.process.state}`,
          };

    return {
      status: payload.status,
      plc,
      process,
      controls,
      scenarios: {
        speed_attack_active:
          payload.scenarios?.speed_attack_active ??
          (Number(controls.speed_setpoint) > Number(controls.overspeed_limit)),
        mode_attack_active:
          payload.scenarios?.mode_attack_active ??
          (Number(controls.operating_mode) === 0),
        last_scenario_time: payload.scenarios?.last_scenario_time ?? null,
      },
      error: payload.error,
    };
  },

  triggerSpeedScenario: () =>
    request<{ scenario?: string; description?: string; result?: { register_address?: number; previous_value?: number; value?: number; execution?: string; allowlisted?: boolean } }>(
      '/api/demo/scenarios/speed',
      { method: 'POST' }
    ),

  triggerModeScenario: () =>
    request<{ scenario?: string; description?: string; result?: { register_address?: number; previous_value?: number; value?: number; execution?: string; allowlisted?: boolean } }>(
      '/api/demo/scenarios/mode',
      { method: 'POST' }
    ),

  resetDemo: () =>
    request<{ success?: boolean; message?: string; description?: string; state?: unknown }>(
      '/api/demo/reset',
      { method: 'POST' }
    ),

  generateCopilotBrief: (incidentId: string) =>
    request<CopilotBriefResponse>(
      `/api/incidents/${encodeURIComponent(incidentId)}/copilot`,
      { method: 'POST' }
    ),

  askCopilot: (incidentId: string, question: string) =>
    request<CopilotChatResponse>(
      `/api/incidents/${encodeURIComponent(incidentId)}/copilot/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      }
    ),
};
