/**
 * Sprint 1 — Tests für den pdfParser Service
 * pdf-parse und mammoth werden gemockt; TXT wird mit echten Temp-Dateien getestet.
 */
import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Mock pdf-parse
jest.mock('pdf-parse', () =>
  jest.fn<() => Promise<{ text: string }>>().mockResolvedValue({ text: 'Extrahierter PDF-Text.' })
);

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn<() => Promise<{ value: string }>>().mockResolvedValue({ value: 'Extrahierter DOCX-Text.' }),
}));

import { extractTextFromFile, countPages } from '../src/services/pdfParser';

// ─────────────────────────────────────────────────────────────────────────────

function writeTmpFile(content: string, ext: string): string {
  const p = path.join(os.tmpdir(), `vertragscheck-test-${Date.now()}${ext}`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}

afterAll(() => {
  // Cleanup handled by OS tmpdir; nothing critical to do
});

// ─────────────────────────────────────────────────────────────────────────────

describe('extractTextFromFile', () => {
  it('reads TXT files directly', async () => {
    const content = 'Das ist ein Testvertrag.';
    const filePath = writeTmpFile(content, '.txt');
    const result = await extractTextFromFile(filePath, 'text/plain');
    expect(result).toBe(content);
    fs.unlinkSync(filePath);
  });

  it('calls pdf-parse for .pdf extension', async () => {
    // Write dummy bytes (content irrelevant — pdf-parse is mocked)
    const filePath = writeTmpFile('%PDF-1.4 dummy', '.pdf');
    const result = await extractTextFromFile(filePath, 'application/pdf');
    expect(result).toBe('Extrahierter PDF-Text.');
    fs.unlinkSync(filePath);
  });

  it('calls pdf-parse when mime type is application/pdf', async () => {
    const filePath = writeTmpFile('%PDF-1.4 dummy', '.pdf');
    const result = await extractTextFromFile(filePath, 'application/pdf');
    expect(result).toBe('Extrahierter PDF-Text.');
    fs.unlinkSync(filePath);
  });

  it('calls mammoth for .docx files', async () => {
    const filePath = writeTmpFile('dummy docx bytes', '.docx');
    const result = await extractTextFromFile(filePath, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(result).toBe('Extrahierter DOCX-Text.');
    fs.unlinkSync(filePath);
  });

  it('throws for unsupported file types', async () => {
    const filePath = writeTmpFile('', '.xyz');
    await expect(extractTextFromFile(filePath, 'application/octet-stream')).rejects.toThrow(
      /nicht unterstütztes dateiformat/i
    );
    fs.unlinkSync(filePath);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('countPages', () => {
  it('returns 1 for short text', () => {
    expect(countPages('Kurztext')).toBe(1);
  });

  it('returns ~1 page for 3000 characters', () => {
    expect(countPages('a'.repeat(3000))).toBe(1);
  });

  it('returns 2 pages for 3001 characters', () => {
    expect(countPages('a'.repeat(3001))).toBe(2);
  });

  it('returns 10 pages for 30000 characters', () => {
    expect(countPages('a'.repeat(30000))).toBe(10);
  });

  it('returns 1 for empty string', () => {
    expect(countPages('')).toBe(0);
  });
});
