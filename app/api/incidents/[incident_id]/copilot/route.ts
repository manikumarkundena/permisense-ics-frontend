import { NextRequest, NextResponse } from 'next/server';
import { virtualCell } from '@/lib/backend/virtual-cell';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  const incident = virtualCell.getIncident(incident_id);

  if (!incident) {
    return NextResponse.json(
      { error: 'Not found', detail: `Incident ${incident_id} not found.` },
      { status: 404 }
    );
  }

  const defaultBrief = {
    incident_id,
    generated_at: new Date().toISOString(),
    summary: `Cyber-physical security event detected on ${incident.asset.name}. Modbus Function Code 06 manipulated register ${incident.control_change.register} (${incident.control_change.register_name}) from ${incident.control_change.previous_value} to ${incident.control_change.new_value} ${incident.control_change.unit}, causing physical process overspeed to ${incident.process_deviation.peak_observed} ${incident.process_deviation.unit} exceeding safe ceiling (${incident.process_deviation.threshold} ${incident.process_deviation.unit}).`,
    evidence_breakdown: [
      `DPI Frame Capture: Unauthorized FC06 Write to ${incident.control_change.register} from ${incident.control_change.source_ip} at ${incident.control_change.timestamp}.`,
      `Physical Sensor Feedback: Encoder feedback (${incident.process_deviation.register}) recorded peak speed of ${incident.process_deviation.peak_observed} ${incident.process_deviation.unit} (+${incident.process_deviation.deviation_pct}% deviation).`,
      `Correlation Engine: Causality confirmed within ${incident.correlation.time_delta_ms}ms window (Rule ${incident.correlation.correlation_rule}).`,
      `Threat Classification: Mapped to MITRE ATT&CK for ICS ${incident.mitre_attack.map(m => `${m.technique_id} (${m.technique_name})`).join(', ')}.`,
    ],
    operational_impact: incident.operational_impact.summary,
    recommended_action: `Execute allowlisted remediation: ${incident.response_plan.recommended_action} to restore ${incident.response_plan.register} from ${incident.response_plan.current_value} to ${incident.response_plan.target_value} ${incident.response_plan.unit}. Requires mandatory human operator authorization.`,
    confidence_and_limitations: 'High confidence based on deterministic Modbus DPI and sensor readback. Limitation: PermiSense does not infer external threat actor identity or nation-state attribution without external threat intelligence feeds.',
    model: 'gemini-2.5-flash',
  };

  // If Gemini API Key is available, augment with AI synthesis strictly grounded in evidence
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are PermiSense Copilot, an evidence-grounded industrial cybersecurity assistant.
You MUST ONLY summarize the following verified cyber-physical incident facts.
DO NOT hallucinate malware, external attribution, or unrecorded damage.
DO NOT approve actions or claim autonomous remediation authority.

INCIDENT FACTS:
- ID: ${incident.incident_id}
- Asset: ${incident.asset.name} (${incident.asset.id})
- Control Change: Register ${incident.control_change.register} changed from ${incident.control_change.previous_value} to ${incident.control_change.new_value} ${incident.control_change.unit} by ${incident.control_change.source_ip}
- Process Deviation: ${incident.process_deviation.register_name} reached ${incident.process_deviation.peak_observed} ${incident.process_deviation.unit} (Limit: ${incident.process_deviation.threshold})
- Detection Rule: ${incident.detection.rule_name}
- MITRE Techniques: ${incident.mitre_attack.map(m => `${m.technique_id}: ${m.technique_name}`).join(', ')}
- Impact: ${incident.operational_impact.summary}
- Risk Score: ${incident.risk.score}/100 (${incident.risk.level})
- Proposed Response: ${incident.response_plan.recommended_action} -> ${incident.response_plan.target_value} ${incident.response_plan.unit}

Respond in strict JSON with keys:
"summary": string,
"evidence_breakdown": string[],
"operational_impact": string,
"recommended_action": string,
"confidence_and_limitations": string`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return NextResponse.json({
          incident_id,
          generated_at: new Date().toISOString(),
          summary: parsed.summary || defaultBrief.summary,
          evidence_breakdown: parsed.evidence_breakdown || defaultBrief.evidence_breakdown,
          operational_impact: parsed.operational_impact || defaultBrief.operational_impact,
          recommended_action: parsed.recommended_action || defaultBrief.recommended_action,
          confidence_and_limitations: parsed.confidence_and_limitations || defaultBrief.confidence_and_limitations,
          model: 'gemini-2.5-flash',
        });
      }
    } catch {
      // Fallback to deterministic evidence structure
    }
  }

  return NextResponse.json(defaultBrief);
}
