export interface IngestInput {
  objective: string;
}

export interface FindAllSchema {
  objective: string;
  entity_type: string;
  match_conditions: MatchCondition[];
  enrichments?: EnrichmentConfig[] | null;
  generator?: 'base' | 'core' | 'pro' | 'preview';
  match_limit?: number | null;
}

export interface MatchCondition {
  name: string;
  description: string;
}

export interface EnrichmentConfig {
  processor?: string;
  output_schema: JsonSchema;
  mcp_servers?: McpServer[] | null;
}

export interface JsonSchema {
  json_schema: Record<string, any>;
  type: 'json';
}

export interface McpServer {
  type: 'url';
  url: string;
  headers?: Record<string, string> | null;
  name: string;
  allowed_tools?: string[] | null;
}

export interface FindAllRunInput {
  objective: string;
  entity_type: string;
  match_conditions: MatchCondition[];
  generator: 'base' | 'core' | 'pro' | 'preview';
  match_limit: number;
  exclude_list?: ExcludeCandidate[] | null;
  metadata?: Record<string, string | number | boolean> | null;
  webhook?: Webhook | null;
}

export interface ExcludeCandidate {
  name: string;
  url: string;
}

export interface Webhook {
  url: string;
  event_types?: string[];
}

export interface FindAllRun {
  findall_id: string;
  status: FindAllRunStatus;
  generator: 'base' | 'core' | 'pro' | 'preview';
  metadata?: Record<string, string | number | boolean> | null;
  created_at?: string | null;
  modified_at?: string | null;
}

export interface FindAllRunStatus {
  status: 'queued' | 'action_required' | 'running' | 'completed' | 'failed' | 'cancelling' | 'cancelled';
  is_active: boolean;
  metrics: FindAllCandidateMetrics;
  termination_reason?: 'low_match_rate' | 'match_limit_met' | 'candidates_exhausted' | 'user_cancelled' | 'error_occurred' | 'timeout' | null;
}

export interface FindAllCandidateMetrics {
  generated_candidates_count: number;
  matched_candidates_count: number;
}

export interface FindAllRunResult {
  run: FindAllRun;
  candidates: FindAllCandidate[];
  last_event_id?: string | null;
}

export interface FindAllCandidate {
  candidate_id: string;
  name: string;
  url: string;
  description?: string | null;
  match_status: 'generated' | 'matched' | 'unmatched' | 'discarded';
  output?: Record<string, any> | null;
  basis?: FieldBasis[] | null;
}

export interface FieldBasis {
  field: string;
  citations: Citation[];
  reasoning: string;
  confidence?: string | null;
}

export interface Citation {
  title?: string | null;
  url: string;
  excerpts?: string[] | null;
}

export type FindAllEvent =
  | FindAllSchemaUpdatedEvent
  | FindAllRunStatusEvent
  | FindAllCandidateEvent
  | ErrorEvent;

export interface FindAllSchemaUpdatedEvent {
  type: 'findall.schema.updated';
  timestamp: string;
  event_id: string;
  data: FindAllSchema;
}

export interface FindAllRunStatusEvent {
  type: 'findall.status';
  timestamp: string;
  event_id: string;
  data: FindAllRun;
}

export interface FindAllCandidateEvent {
  type:
    | 'findall.candidate.generated'
    | 'findall.candidate.matched'
    | 'findall.candidate.unmatched'
    | 'findall.candidate.discarded'
    | 'findall.candidate.enriched';
  timestamp: string;
  event_id: string;
  data: FindAllCandidate;
}

export interface ErrorEvent {
  type: 'error';
  timestamp: string;
  event_id: string;
  error: {
    ref_id: string;
    message: string;
    detail?: Record<string, any> | null;
  };
}