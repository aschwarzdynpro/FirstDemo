import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { AnalysisResult } from '../types';

const RISK_LABELS: Record<string, string> = {
  low: 'Geringes Risiko',
  medium: 'Mittleres Risiko',
  high: 'Hohes Risiko',
};

export function streamAnalysisPdf(
  res: Response,
  filename: string,
  result: AnalysisResult
): void {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename.replace(/\.[^.]+$/, ''))}_analyse.pdf"`
  );
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────────────────────
  doc
    .fontSize(22)
    .fillColor('#4338ca')
    .text('VertragsCheck AI', { align: 'left' })
    .fontSize(11)
    .fillColor('#6b7280')
    .text('Vertragsanalyse-Bericht', { align: 'left' })
    .moveDown(0.5);

  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#e5e7eb')
    .stroke()
    .moveDown(0.8);

  // ── Meta ──────────────────────────────────────────────────────────────────
  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text(`Dokument: ${filename}`)
    .text(`Erstellt: ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`)
    .moveDown(1);

  // ── Overall risk banner ───────────────────────────────────────────────────
  const bannerColor = result.overallRisk === 'high' ? '#fef2f2' : result.overallRisk === 'medium' ? '#fffbeb' : '#f0fdf4';
  const bannerBorder = result.overallRisk === 'high' ? '#fca5a5' : result.overallRisk === 'medium' ? '#fcd34d' : '#86efac';
  const bannerText = result.overallRisk === 'high' ? '#991b1b' : result.overallRisk === 'medium' ? '#92400e' : '#166534';

  const bannerY = doc.y;
  doc
    .roundedRect(50, bannerY, 495, 60, 6)
    .fillAndStroke(bannerColor, bannerBorder);

  doc
    .fontSize(13)
    .fillColor(bannerText)
    .text(`Gesamt-Risiko: ${RISK_LABELS[result.overallRisk]}`, 66, bannerY + 10)
    .fontSize(10)
    .text(result.summary, 66, bannerY + 28, { width: 465 });

  doc.y = bannerY + 70;
  doc.moveDown(1);

  // ── Klauseln ──────────────────────────────────────────────────────────────
  doc
    .fontSize(14)
    .fillColor('#111827')
    .text('Analysierte Klauseln', { underline: false })
    .moveDown(0.5);

  const sorted = [...result.clauses].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.risk] - order[b.risk];
  });

  for (const clause of sorted) {
    // Check page break
    if (doc.y > 700) doc.addPage();

    const riskColor = clause.risk === 'high' ? '#dc2626' : clause.risk === 'medium' ? '#d97706' : '#16a34a';

    doc
      .fontSize(11)
      .fillColor('#111827')
      .text(clause.title, { continued: false })
      .fontSize(9)
      .fillColor(riskColor)
      .text(RISK_LABELS[clause.risk])
      .moveDown(0.3);

    doc
      .fontSize(9)
      .fillColor('#6b7280')
      .text('Originaltext:', { continued: false })
      .fillColor('#374151')
      .text(`"${clause.originalText}"`, { indent: 10 })
      .moveDown(0.2);

    doc
      .fillColor('#6b7280')
      .text('Erklärung:', { continued: false })
      .fillColor('#374151')
      .text(clause.plainExplanation, { indent: 10 })
      .moveDown(0.2);

    doc
      .fillColor('#6b7280')
      .text('Risikobewertung:', { continued: false })
      .fillColor(riskColor)
      .text(clause.riskReason, { indent: 10 })
      .moveDown(0.2);

    if (clause.suggestion) {
      doc
        .fillColor('#6b7280')
        .text('Verbesserungsvorschlag:', { continued: false })
        .fillColor('#4338ca')
        .text(clause.suggestion, { indent: 10 })
        .moveDown(0.2);
    }

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#f3f4f6')
      .lineWidth(0.5)
      .stroke()
      .moveDown(0.6);
  }

  // ── Empfehlungen ──────────────────────────────────────────────────────────
  if (result.recommendations.length > 0) {
    if (doc.y > 650) doc.addPage();
    doc
      .fontSize(14)
      .fillColor('#111827')
      .text('Empfehlungen')
      .moveDown(0.5);

    for (const rec of result.recommendations) {
      doc
        .fontSize(10)
        .fillColor('#374151')
        .text(`• ${rec}`)
        .moveDown(0.3);
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor('#9ca3af')
    .text(
      'Dieser Bericht wurde automatisch erstellt und ersetzt keine Rechtsberatung.',
      { align: 'center' }
    );

  doc.end();
}
