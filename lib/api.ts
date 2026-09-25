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
  getTelemetryEvents: async (_limit = 50) => [],

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

  getDemoStatus: async () => {
    const [health, system] = await Promise.all([
      request<HealthResponse>('/api/health'),
      request<SystemStatusResponse>('/api/system/status'),
    ]);

    return {
      health,
      system,
      source: 'real-backend',
      api_base_url: getBaseUrl(),
    } as unknown as DemoStatusResponse;
  },

  triggerSpeedScenario: () =>
    request<{ triggered?: boolean; scenario?: string; register?: string; value?: number; incident_id?: string }>(
      '/api/demo/scenarios/speed',
      { method: 'POST' }
    ),

  triggerModeScenario: () =>
    request<{ triggered?: boolean; scenario?: string; register?: string; value?: number; incident_id?: string }>(
      '/api/demo/scenarios/mode',
      { method: 'POST' }
    ),

  resetDemo: () =>
    request<{ success?: boolean; message?: string; state?: unknown }>(
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
