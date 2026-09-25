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
  if (!envUrl) return '';
  return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
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
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    throw new ApiError(0, `Network failure requesting ${endpoint}: ${message}`, endpoint, message);
  }
}

export const apiClient = {
  getHealth: () => request<HealthResponse>('/api/health'),
  
  getSystemStatus: () => request<SystemStatusResponse>('/api/system/status'),

  getTelemetryEvents: (limit = 50) =>
    request<TelemetryEvent[]>(`/api/telemetry/events?limit=${limit}`),

  getIncidents: () => request<IncidentSummary[]>('/api/incidents'),

  getIncident: (incidentId: string) =>
    request<IncidentDetail>(`/api/incidents/${encodeURIComponent(incidentId)}`),

  updateIncidentStatus: (incidentId: string, status: IncidentStatus) =>
    request<IncidentSummary>(`/api/incidents/${encodeURIComponent(incidentId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getResponsePlan: (incidentId: string) =>
    request<ResponsePlan>(`/api/incidents/${encodeURIComponent(incidentId)}/response`),

  approveResponse: (incidentId: string, action: string, approvedBy = 'operator') =>
    request<{ success: boolean; action_executed: string; executed_at: string; status: string }>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ action, approved_by: approvedBy }),
      }
    ),

  verifyRecovery: (incidentId: string) =>
    request<RecoveryVerificationResult>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response/verify`,
      {
        method: 'POST',
      }
    ),

  getDemoStatus: () => request<DemoStatusResponse>('/api/demo/status'),

  triggerSpeedScenario: () =>
    request<{ triggered: boolean; scenario: string; register: string; value: number; incident_id: string }>(
      '/api/demo/scenarios/speed',
      { method: 'POST' }
    ),

  triggerModeScenario: () =>
    request<{ triggered: boolean; scenario: string; register: string; value: number; incident_id: string }>(
      '/api/demo/scenarios/mode',
      { method: 'POST' }
    ),

  resetDemo: () =>
    request<{ success: boolean; message: string; state: DemoStatusResponse }>(
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
