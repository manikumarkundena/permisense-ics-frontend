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

  try {
    const body = await req.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Missing question', detail: 'A valid question is required.' },
        { status: 400 }
      );
    }

    const defaultResponse = {
      incident_id,
      question,
      answer: `Based on verified incident telemetry, register ${incident.control_change.register} (${incident.control_change.register_name}) was changed from ${incident.control_change.previous_value} to ${incident.control_change.new_value} ${incident.control_change.unit}. The process sensor ${incident.process_deviation.register} recorded an actual speed of ${incident.process_deviation.peak_observed} ${incident.process_deviation.unit}, violating the ${incident.process_deviation.threshold} ${incident.process_deviation.unit} ceiling.`,
      evidence_used: [
        `DPI Record: Modbus FC06 write to ${incident.control_change.register} from ${incident.control_change.source_ip}`,
        `Encoder Reading: ${incident.process_deviation.register} = ${incident.process_deviation.peak_observed} ${incident.process_deviation.unit}`,
        `Threat Technique: MITRE ${incident.mitre_attack[0]?.technique_id || 'T0831'}`,
      ],
      action_advisory: `Operator must review the proposed remediation (${incident.response_plan.recommended_action}) in the Response Gate and authorize it manually. PermiSense AI does not execute commands autonomously.`,
      limitations: 'AI copilot provides read-only analytical commentary based exclusively on recorded telemetry and correlation rules.',
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are PermiSense Copilot, an evidence-grounded industrial cybersecurity assistant.
The operator asks: "${question}".

Answer strictly using these verified facts:
Incident: ${incident.incident_id}
Asset: ${incident.asset.name}
Register changed: ${incident.control_change.register} (${incident.control_change.previous_value} -> ${incident.control_change.new_value} ${incident.control_change.unit})
Observed speed: ${incident.process_deviation.peak_observed} ${incident.process_deviation.unit} (Threshold: ${incident.process_deviation.threshold} ${incident.process_deviation.unit})
Rule: ${incident.detection.rule_name}
Mitre: ${incident.mitre_attack.map(m => m.technique_id + ' ' + m.technique_name).join(', ')}
Impact: ${incident.operational_impact.summary}
Proposed Action: ${incident.response_plan.recommended_action} (Target: ${incident.response_plan.target_value} ${incident.response_plan.unit})

Rules:
1. NEVER invent malware or nation-state attribution.
2. ALWAYS remind the operator that human authorization is required.
3. Respond in JSON with keys: "answer", "evidence_used" (array of strings), "action_advisory", "limitations".`;

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
            question,
            answer: parsed.answer || defaultResponse.answer,
            evidence_used: parsed.evidence_used || defaultResponse.evidence_used,
            action_advisory: parsed.action_advisory || defaultResponse.action_advisory,
            limitations: parsed.limitations || defaultResponse.limitations,
          });
        }
      } catch {
        // Fallback to default
      }
    }

    return NextResponse.json(defaultResponse);
  } catch (err) {
    return NextResponse.json(
      { error: 'Chat processing failed', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
