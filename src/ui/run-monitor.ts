import ora from 'ora';
import type { ParallelClient } from '../client/parallel.js';
import type { FindAllRunResult, FindAllEvent } from '../types/findall.js';

export class RunMonitor {
  private spinner = ora();

  constructor(
    private client: ParallelClient,
    private findallId: string
  ) {}

  async monitor(): Promise<FindAllRunResult> {
    let generatedCount = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;
    let status = 'queued';

    this.spinner.start('Waiting for run to start...');

    try {
      for await (const event of this.client.streamEvents(this.findallId)) {
        this.handleEvent(event, {
          onGenerated: () => {
            generatedCount++;
            this.updateSpinner(status, generatedCount, matchedCount, unmatchedCount);
          },
          onMatched: (name: string) => {
            matchedCount++;
            this.spinner.succeed(`✓ Match found: ${name}`);
            this.spinner.start();
            this.updateSpinner(status, generatedCount, matchedCount, unmatchedCount);
          },
          onUnmatched: () => {
            unmatchedCount++;
            this.updateSpinner(status, generatedCount, matchedCount, unmatchedCount);
          },
          onStatus: (newStatus: string) => {
            status = newStatus;
            this.updateSpinner(status, generatedCount, matchedCount, unmatchedCount);

            // Check for terminal status
            if (['completed', 'failed', 'cancelled'].includes(newStatus)) {
              this.spinner.stop();
              return;
            }
          },
          onError: (message: string) => {
            this.spinner.fail(`Error: ${message}`);
            status = 'failed';
          },
        });

        // Break on terminal status
        if (['completed', 'failed', 'cancelled'].includes(status)) {
          break;
        }
      }

      // Get final result
      this.spinner.start('Fetching final results...');
      const result = await this.client.getResult(this.findallId);
      this.spinner.succeed('Results retrieved');

      return result;
    } catch (error) {
      this.spinner.fail('Error during monitoring');
      throw error;
    }
  }

  private handleEvent(
    event: FindAllEvent,
    handlers: {
      onGenerated: () => void;
      onMatched: (name: string) => void;
      onUnmatched: () => void;
      onStatus: (status: string) => void;
      onError: (message: string) => void;
    }
  ): void {
    switch (event.type) {
      case 'findall.candidate.generated':
        handlers.onGenerated();
        break;
      case 'findall.candidate.matched':
        handlers.onMatched(event.data.name);
        break;
      case 'findall.candidate.unmatched':
        handlers.onUnmatched();
        break;
      case 'findall.status':
        handlers.onStatus(event.data.status.status);
        break;
      case 'error':
        handlers.onError(event.error.message);
        break;
    }
  }

  private updateSpinner(
    status: string,
    generated: number,
    matched: number,
    unmatched: number
  ): void {
    const statusEmoji = {
      queued: '⏳',
      action_required: '⚠️',
      running: '🔍',
      completed: '✅',
      failed: '❌',
      cancelling: '🛑',
      cancelled: '🛑',
    }[status] || '•';

    this.spinner.text = `${statusEmoji} ${status} | Generated: ${generated} | Matched: ${matched} | Unmatched: ${unmatched}`;
  }
}