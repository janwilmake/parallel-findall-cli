import fs from 'fs/promises';
import path from 'path';
import type { FindAllRunResult } from '../types/findall.js';

export class ResultWriter {
  constructor(private outputDir: string) {}

  async write(result: FindAllRunResult): Promise<void> {
    // Summary
    const summary = {
      run_id: result.run.findall_id,
      status: result.run.status.status,
      termination_reason: result.run.status.termination_reason,
      metrics: result.run.status.metrics,
      created_at: result.run.created_at,
      modified_at: result.run.modified_at,
      generator: result.run.generator,
      metadata: result.run.metadata,
    };

    await fs.writeFile(
      path.join(this.outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Matches only
    const matches = result.candidates.filter((c) => c.match_status === 'matched');
    await fs.writeFile(
      path.join(this.outputDir, 'matches.json'),
      JSON.stringify(matches, null, 2)
    );

    // All candidates
    await fs.writeFile(
      path.join(this.outputDir, 'candidates.json'),
      JSON.stringify(result.candidates, null, 2)
    );

    // Schema (fetch separately if needed, or reconstruct from run)
    const schema = {
      objective: result.run.metadata?.objective || '',
      entity_type: result.candidates[0]?.name ? 'entities' : 'unknown',
      generator: result.run.generator,
    };

    await fs.writeFile(
      path.join(this.outputDir, 'schema.json'),
      JSON.stringify(schema, null, 2)
    );

    // CSV export for matches
    if (matches.length > 0) {
      const csv = this.convertToCSV(matches);
      await fs.writeFile(path.join(this.outputDir, 'matches.csv'), csv);
    }
  }

  private convertToCSV(candidates: any[]): string {
    if (candidates.length === 0) return '';

    const headers = ['name', 'url', 'description', 'match_status'];
    const outputFields = candidates[0].output
      ? Object.keys(candidates[0].output)
      : [];
    const allHeaders = [...headers, ...outputFields];

    const rows = candidates.map((candidate) => {
      const row = [
        this.escapeCSV(candidate.name),
        this.escapeCSV(candidate.url),
        this.escapeCSV(candidate.description || ''),
        candidate.match_status,
      ];

      outputFields.forEach((field) => {
        const value = candidate.output?.[field];
        // Extract is_matched boolean from match condition objects
        if (value && typeof value === 'object' && 'is_matched' in value) {
          row.push(String(value.is_matched));
        } else {
          row.push(this.escapeCSV(String(value ?? '')));
        }
      });

      return row.join(',');
    });

    return [allHeaders.join(','), ...rows].join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}