import fs from 'fs/promises';
import path from 'path';
import { ParallelClient } from '../client/parallel.js';
import { SchemaEditor } from '../ui/schema-editor.js';
import { RunMonitor } from '../ui/run-monitor.js';
import { ResultWriter } from '../output/result-writer.js';
import { getApiKey } from '../config/store.js';
import type { FindAllSchema, FindAllRunInput } from '../types/findall.js';

interface RunOptions {
  apiKey?: string;
  generator: string;
  limit: string;
  skipPreview?: boolean;
  autoApprove?: boolean;
}

export async function ingestAndRun(
  outputDir: string,
  objective: string,
  options: RunOptions
): Promise<void> {
  try {
    // Validate and setup - check options, env var, then stored config
    const storedApiKey = await getApiKey();
    const apiKey = options.apiKey || process.env.PARALLEL_API_KEY || storedApiKey;
    if (!apiKey) {
      console.error('Error: API key required. Run "findall login" to authenticate, use --api-key, or set PARALLEL_API_KEY env var');
      process.exit(1);
    }

    const matchLimit = parseInt(options.limit, 10);
    if (isNaN(matchLimit) || matchLimit < 5 || matchLimit > 1000) {
      console.error('Error: Match limit must be between 5 and 1000');
      process.exit(1);
    }

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const client = new ParallelClient(apiKey);

    // Step 1: Ingest objective to generate schema
    console.log('🔍 Analyzing objective and generating schema...\n');
    console.log(`Objective: ${objective}\n`);

    let schema = await client.ingest(objective);

    // Step 2: Preview and edit schema (unless skipped)
    if (!options.skipPreview && !options.autoApprove) {
      const editor = new SchemaEditor(schema);
      schema = await editor.edit();
    } else if (!options.skipPreview) {
      console.log('📋 Generated Schema:');
      console.log(JSON.stringify(schema, null, 2));
      console.log('');
    }

    // Step 3: Create run configuration
    const runInput: FindAllRunInput = {
      objective: schema.objective,
      entity_type: schema.entity_type,
      match_conditions: schema.match_conditions,
      generator: options.generator as 'base' | 'core' | 'pro' | 'preview',
      match_limit: matchLimit,
      metadata: {
        cli_version: '0.1.0',
        created_via: 'findall-cli',
      },
    };

    // Step 4: Start the FindAll run
    console.log('\n🚀 Starting FindAll run...');
    const run = await client.createRun(runInput);
    console.log(`Run ID: ${run.findall_id}`);
    console.log(`Status: ${run.status.status}\n`);

    // Step 5: Monitor progress with SSE
    const monitor = new RunMonitor(client, run.findall_id);
    const result = await monitor.monitor();

    // Step 6: Write results to output directory
    console.log('\n💾 Writing results...');
    const writer = new ResultWriter(outputDir);
    await writer.write(result);

    console.log('\n✅ FindAll complete!');
    console.log(`Results written to: ${outputDir}`);
    console.log(`  - summary.json: Run summary and statistics`);
    console.log(`  - matches.json: All matched candidates`);
    console.log(`  - candidates.json: All evaluated candidates`);
    console.log(`  - schema.json: Final schema used`);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}