#!/usr/bin/env node
import { Command } from 'commander';
import { ingestAndRun } from './commands/ingest-run.js';

const program = new Command();

program
  .name('findall')
  .description('CLI tool for Parallel FindAll API')
  .version('0.1.0');

program
  .command('run')
  .argument('<output-dir>', 'Output directory for results')
  .argument('<objective>', 'Natural language objective for the search')
  .description('Ingest objective, preview schema, configure, and run FindAll')
  .option('-k, --api-key <key>', 'Parallel API key (or set PARALLEL_API_KEY env var)')
  .option('-g, --generator <tier>', 'Generator tier (base|core|pro|preview)', 'core')
  .option('-l, --limit <number>', 'Initial match limit', '50')
  .option('--skip-preview', 'Skip schema preview and confirmation')
  .option('--auto-approve', 'Automatically approve schema without editing')
  .action(ingestAndRun);

program.parse();