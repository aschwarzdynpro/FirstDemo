import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult, StreamEvent } from '../types';

const SYSTEM_PROMPT = `Du bist ein Vertragsanalyse-Assistent. Analysiere den folgenden Vertragstext und gib eine strukturierte JSON-Antwort zurück.

Regeln:
- Erkläre jede Klausel in einfacher, verständlicher Sprache (kein Juristendeutsch)
- Bewerte das Risiko: "low" (Standard, unbedenklich), "medium" (prüfen empfohlen), "high" (potenziell nachteilig)
- Sei konkret und spezifisch — keine generischen Warnungen
- Sprache der Antwort: Deutsch
- Antworte NUR mit validem JSON, kein Markdown, keine Erklärungen außerhalb des JSON

JSON-Schema:
{
  "summary": "string (2-3 Sätze, was ist dieser Vertrag?)",
  "overallRisk": "low|medium|high",
  "clauses": [
    {
      "id": "string",
      "title": "string (Klausel-Bezeichnung)",
      "originalText": "string (relevanter Originaltext, max. 200 Zeichen)",
      "plainExplanation": "string (Erklärung in Alltagssprache)",
      "risk": "low|medium|high",
      "riskReason": "string (warum dieses Risiko?)",
      "suggestion": "string (konkrete Verbesserung, optional)"
    }
  ],
  "recommendations": ["string"]
}`;

export async function analyzeContractStreaming(
  contractText: string,
  onEvent: (event: StreamEvent) => void
): Promise<AnalysisResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  onEvent({ status: 'processing', progress: 10, message: 'Verbinde mit KI...' });

  const truncatedText = contractText.slice(0, 100000);

  let fullResponse = '';

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analysiere diesen Vertragstext:\n\n${truncatedText}`,
      },
    ],
  });

  onEvent({ status: 'processing', progress: 20, message: 'Analysiere Vertrag...' });

  let chunkCount = 0;
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullResponse += chunk.delta.text;
      chunkCount++;

      // Update progress as chunks arrive (20 -> 90)
      const progress = Math.min(20 + Math.floor((chunkCount / 50) * 70), 90);
      if (chunkCount % 5 === 0) {
        onEvent({ status: 'processing', progress, message: 'Klauseln werden analysiert...' });
      }
    }
  }

  onEvent({ status: 'processing', progress: 95, message: 'Ergebnis wird aufbereitet...' });

  const result = parseAnalysisResult(fullResponse);

  onEvent({ status: 'complete', result });

  return result;
}

function parseAnalysisResult(jsonString: string): AnalysisResult {
  // Strip potential markdown code fences
  const cleaned = jsonString.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed as AnalysisResult;
  } catch {
    throw new Error('KI-Antwort konnte nicht geparst werden. Bitte erneut versuchen.');
  }
}
