import fetch from "node-fetch";
import type {
  IngestInput,
  FindAllSchema,
  FindAllRunInput,
  FindAllRun,
  FindAllRunResult,
  FindAllEvent,
} from "../types/findall.js";

export class ParallelClient {
  private apiKey: string;
  private baseUrl = "https://api.parallel.ai";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async ingest(objective: string): Promise<FindAllSchema> {
    const response = await fetch(`${this.baseUrl}/v1beta/findall/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "parallel-beta": "findall-2025-09-15",
      },
      body: JSON.stringify({ objective } as IngestInput),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ingest failed: ${response.status} - ${error}`);
    }

    return response.json() as Promise<FindAllSchema>;
  }

  async createRun(input: FindAllRunInput): Promise<FindAllRun> {
    const response = await fetch(`${this.baseUrl}/v1beta/findall/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "parallel-beta": "findall-2025-09-15",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Create run failed: ${response.status} - ${error}`);
    }

    return response.json() as Promise<FindAllRun>;
  }

  async getResult(findallId: string): Promise<FindAllRunResult> {
    const response = await fetch(
      `${this.baseUrl}/v1beta/findall/runs/${findallId}/result`,
      {
        headers: {
          "x-api-key": this.apiKey,
          "parallel-beta": "findall-2025-09-15",
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get result failed: ${response.status} - ${error}`);
    }

    return response.json() as Promise<FindAllRunResult>;
  }

  async *streamEvents(
    findallId: string,
    lastEventId?: string,
  ): AsyncGenerator<FindAllEvent> {
    const url = new URL(
      `${this.baseUrl}/v1beta/findall/runs/${findallId}/events`,
    );
    if (lastEventId) {
      url.searchParams.set("last_event_id", lastEventId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": this.apiKey,
        "parallel-beta": "findall-2025-09-15",
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stream events failed: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    let buffer = "";

    for await (const chunk of response.body) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let eventType = "";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          eventData = line.slice(6);
        } else if (line === "" && eventType && eventData) {
          // Complete event - the API returns the full event object in the data field
          const event = JSON.parse(eventData) as FindAllEvent;
          yield event;

          // Reset for next event
          eventType = "";
          eventData = "";
        }
      }
    }
  }

  async extendRun(
    findallId: string,
    additionalLimit: number,
  ): Promise<FindAllSchema> {
    const response = await fetch(
      `${this.baseUrl}/v1beta/findall/runs/${findallId}/extend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "parallel-beta": "findall-2025-09-15",
        },
        body: JSON.stringify({ additional_match_limit: additionalLimit }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Extend run failed: ${response.status} - ${error}`);
    }

    return response.json() as Promise<FindAllSchema>;
  }

  async cancelRun(findallId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/v1beta/findall/runs/${findallId}/cancel`,
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "parallel-beta": "findall-2025-09-15",
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cancel run failed: ${response.status} - ${error}`);
    }
  }
}
