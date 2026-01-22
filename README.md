# FindAll CLI

A command-line interface for the Parallel FindAll API that helps you discover and evaluate entities matching complex criteria.

## Installation

```bash
npm install -g findall-cli
```

Or use directly with npx:

```bash
npx findall-cli run ./output "Find AI companies that raised Series A in 2024"
```

## Installation into your coding agent (Claude, Cursor, etc.)

```
npx skills add janwilmake/parallel-findall-cli
```

## Usage

### Basic Usage

```bash
findall run <output-dir> <objective>
```

**Example:**

```bash
findall run ./results "Find all SaaS companies with SOC2 Type II certification"
```

### With Options

```bash
# Specify API key
findall run ./results "..." --api-key YOUR_API_KEY

# Use different generator tier
findall run ./results "..." --generator pro

# Set match limit
findall run ./results "..." --limit 100

# Skip interactive preview
findall run ./results "..." --skip-preview --auto-approve
```

### Environment Variables

```bash
export PARALLEL_API_KEY=your_api_key_here
findall run ./results "Find companies..."
```

## Workflow

The CLI follows this workflow:

1. **Ingest**: Converts your natural language objective into a structured schema
2. **Preview**: Shows the generated schema and allows editing
3. **Configure**: Set generator tier, match limits, and other options
4. **Run**: Executes the FindAll search with real-time progress
5. **Output**: Saves results to specified directory

## Interactive Schema Editor

The CLI provides an interactive editor to:

- View and modify the objective
- Change entity type
- Add, edit, or remove match conditions
- Preview the full JSON schema

Use arrow keys to navigate and follow the prompts.

## Output Files

Results are saved to the specified output directory:

- `summary.json` - Run metadata and statistics
- `matches.json` - All matched candidates with full details
- `candidates.json` - All evaluated candidates (matched and unmatched)
- `schema.json` - Final schema used for the run
- `matches.csv` - CSV export of matched candidates

## Options

| Option                   | Description                               | Default             |
| ------------------------ | ----------------------------------------- | ------------------- |
| `-k, --api-key <key>`    | Parallel API key                          | `$PARALLEL_API_KEY` |
| `-g, --generator <tier>` | Generator tier (base\|core\|pro\|preview) | `core`              |
| `-l, --limit <number>`   | Initial match limit (5-1000)              | `50`                |
| `--skip-preview`         | Skip schema preview                       | `false`             |
| `--auto-approve`         | Auto-approve schema without editing       | `false`             |

## Examples

### Find AI companies with specific criteria

```bash
findall run ./ai-companies \
  "Find AI companies that raised Series A in 2024 and have at least 50 employees" \
  --generator pro \
  --limit 100
```

### Find security-compliant SaaS companies

```bash
findall run ./saas-companies \
  "Find SaaS companies with SOC2 Type II and ISO 27001 certifications" \
  --generator core
```

### Non-interactive mode

```bash
export PARALLEL_API_KEY=your_key
findall run ./results "Your objective here" --skip-preview --auto-approve
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
npm start run ./output "Test objective"

# Watch mode
npm run dev
```

## API Documentation

This CLI uses the Parallel FindAll API. For detailed API documentation, see:
https://api.parallel.ai/docs

## License

MIT
