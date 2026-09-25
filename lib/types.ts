/**
 * PermiSense: Cyber-Physical Incident Intelligence & Response
 * TypeScript Definitions matching authoritative OpenAPI & Backend Contracts
 */

export type ProcessStateCode = 0 | 1 | 2 | 3 | 4 | 5;

export const PROCESS_STATE_MAP: Record<ProcessStateCode, string> = {
  0: 'STOPPED',
  1: 'STARTING',
  2: 'RUNNING',
  3: 'DEGRADED',
  4: 'JAMMED',
  5: 'FAULT',
};

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RECOVERED' | 'CLOSED';
export type ResponseApprovalState = 'PENDING' | 'APPROVED';
export type ResponseExecutionState = 'PENDING' | 'EXECUTING' | 'EXECUTED';
export type RecoveryState = 'UNRECOVERED' | 'VERIFYING' | 'RECOVERED';

export interface SystemComponentStatus {
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNAVAILABLE';
  protocol?: string;
  ip?: string;
  port?: number;
  connection?: string;
  last_check?: string;
  details?: Record<string, unknown>;
}

export interface SystemStatusResponse {
  status: 'HEALTHY' | 'WARNING' | 'ALERT' | 'OFFLINE';
  timestamp: string;
  version: string;
  runtime_mode: string;
  components: {
    plc: SystemComponentStatus;
    gateway: SystemComponentStatus;
    database: SystemComponentStatus;
    copilot: SystemComponentStatus;
  };
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
  mode: string;
}

export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  channel: 'MODBUS_DPI' | 'PLC_TELEMETRY' | 'CORRELATION_ENGINE' | 'RESPONSE_EXEC';
  source: string;
  event_type: 'CONTROL_WRITE' | 'PROCESS_SAMPLE' | 'OVERSPEED_ALERT' | 'MODE_CHANGE' | 'RESPONSE_APPLIED';
  register?: string;
  register_name?: string;
  value?: number;
  unit?: string;
  message: string;
  raw_payload?: Record<string, unknown>;
}

export interface ControlChangeEvidence {
  register: string;
  register_name: string;
  previous_value: number;
  new_value: number;
  unit: string;
  timestamp: string;
  source_ip: string;
  protocol: 'Modbus/TCP';
  function_code: number;
  authorized: boolean;
}

export interface ProcessDeviationEvidence {
  register: string;
  register_name: string;
  baseline: number;
  peak_observed: number;
  threshold: number;
  unit: string;
  deviation_pct: number;
  onset_delay_ms: number;
  physical_sensor: string;
}

export interface DetectionEvidence {
  rule_id: string;
  rule_name: string;
  confidence: 'DETERMINISTIC' | 'STATISTICAL' | 'BEHAVIORAL';
  detector: string;
  detection_timestamp: string;
}

export interface CorrelationEvidence {
  correlated_events_count: number;
  correlation_rule: string;
  time_delta_ms: number;
  causality_score: number; // calculated on backend
}

export interface MitreAttackEvidence {
  technique_id: string;
  technique_name: string;
  tactic: string;
  description: string;
  mitigation_id?: string;
}

export interface OperationalImpact {
  summary: string;
  physical_process_state: string;
  safe_limit: number;
  observed_value: number;
  unit: string;
  affected_subsystems: string[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  contributed: number;
  reason: string;
}

export interface OperationalRisk {
  score: number; // 0-100 backend calculated
  level: IncidentSeverity;
  calculation_timestamp: string;
  factors: RiskFactor[];
}

export interface EvidenceGraphNode {
  id: string;
  type: 'EVENT' | 'ASSET' | 'BEHAVIOR' | 'THREAT' | 'PROCESS' | 'IMPACT' | 'RISK' | 'ACTION';
  label: string;
  sublabel?: string;
  status?: 'ALERT' | 'WARNING' | 'NOMINAL' | 'INFO';
  metadata?: Record<string, string | number>;
}

export interface EvidenceGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
}

export interface ResponsePlan {
  incident_id: string;
  recommended_action: string;
  description: string;
  register: string;
  register_name: string;
  current_value: number;
  target_value: number;
  unit: string;
  approval_requirement: 'MANDATORY_HUMAN_OPERATOR';
  verification_register: string;
  verification_threshold: string;
  approval_state: ResponseApprovalState;
  execution_state: ResponseExecutionState;
  recovery_state: RecoveryState;
  approved_by: string | null;
  executed_at: string | null;
  verified_at: string | null;
}

export interface RecoveryVerificationResult {
  recovered: boolean;
  status: RecoveryState;
  verified_at: string;
  control_readback: {
    register: string;
    expected: number;
    actual: number;
    match: boolean;
  };
  process_telemetry: {
    register: string;
    register_name: string;
    measured_value: number;
    safe_bound: string;
    within_bounds: boolean;
    unit: string;
  };
  incident_status: IncidentStatus;
  message: string;
}

export interface IncidentSummary {
  incident_id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  asset_id: string;
  process_name: string;
  timestamp: string;
  summary: string;
  risk_score: number;
}

export interface IncidentDetail extends IncidentSummary {
  asset: {
    id: string;
    name: string;
    type: string;
    zone: string;
    vendor: string;
    firmware: string;
  };
  process: {
    name: string;
    register_speed: string;
    register_setpoint: string;
    nominal_speed: number;
    max_safe_speed: number;
  };
  control_change: ControlChangeEvidence;
  process_deviation: ProcessDeviationEvidence;
  detection: DetectionEvidence;
  correlation: CorrelationEvidence;
  mitre_attack: MitreAttackEvidence[];
  operational_impact: OperationalImpact;
  risk: OperationalRisk;
  evidence_graph: EvidenceGraph;
  response_plan: ResponsePlan;
}

export interface VirtualPlcStatus {
  id: string;
  name: string;
  protocol: 'Modbus/TCP';
  host: string;
  port: number;
  connection: 'CONNECTED' | 'DISCONNECTED';
  cycle_time_ms: number;
  scans_completed: number;
}

export interface VirtualProcessMetrics {
  speed: number;        // R30001
  current: number;      // R30002
  load: number;         // R30003
  position: number;     // R30004
  workpieces: number;   // R30005
  jam: boolean;         // R30006
  state: ProcessStateCode; // R30007
  state_label: string;
}

export interface VirtualControls {
  motor_enable: boolean;       // R40001
  operating_mode: number;      // R40002 (1=Auto, 2=Jog, 3=Unrestricted Manual)
  speed_setpoint: number;      // R40003 (Nominal 50 RPM, safe max 75)
  acceleration_limit: number;  // R40004
  production_target: number;   // R40005
  overspeed_limit: number;     // R40006
  high_load_limit: number;     // R40007
  jam_timeout: number;         // R40008
  config_version: number;      // R40009
}

export interface DemoStatusResponse {
  status: 'ONLINE' | 'OFFLINE';
  timestamp: string;
  cell_name: string;
  plc: VirtualPlcStatus;
  process: VirtualProcessMetrics;
  controls: VirtualControls;
  scenarios: {
    speed_attack_active: boolean;
    mode_attack_active: boolean;
    last_scenario_time: string | null;
  };
}

export interface CopilotBriefResponse {
  incident_id: string;
  generated_at: string;
  summary: string;
  evidence_breakdown: string[];
  operational_impact: string;
  recommended_action: string;
  confidence_and_limitations: string;
  model: string;
}

export interface CopilotChatResponse {
  incident_id: string;
  question: string;
  answer: string;
  evidence_used: string[];
  action_advisory: string;
  limitations: string;
}
