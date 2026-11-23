import type { RunState } from '@/types';

export interface WorkflowRun {
  id: number;
  name: string;
  display_title: string;
  event: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | 'skipped' | 'neutral' | null;
  created_at: string;
  updated_at: string;
  head_sha: string;
  head_branch: string;
  head_commit: { message: string } | null;
  html_url: string;
  run_attempt: number;
}

export interface WorkflowJob {
  id: number;
  run_id: number;
  name: string;
  status: WorkflowRun['status'];
  conclusion: WorkflowRun['conclusion'];
  started_at: string | null;
  completed_at: string | null;
  steps: Array<{
    name: string;
    status: WorkflowRun['status'];
    conclusion: WorkflowRun['conclusion'];
    number: number;
  }>;
}

export function mapConclusion(run: WorkflowRun): RunState {
  if (run.status !== 'completed') {
    if (run.status === 'queued' || run.status === 'requested' || run.status === 'pending' || run.status === 'waiting') return 'queued';
    return 'in_progress';
  }
  switch (run.conclusion) {
    case 'success': return 'success';
    case 'failure': return 'failure';
    case 'cancelled': return 'cancelled';
    case 'timed_out': return 'timed_out';
    case 'skipped': return 'skipped';
    default: return 'success';
  }
}

export function isTerminal(state: RunState): boolean {
  return ['success', 'failure', 'cancelled', 'timed_out', 'skipped'].includes(state);
}
