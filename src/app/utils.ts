import { Ticket } from './models/ticket.model';

export function fmtDate(s: string | null): string {
  if (!s) return '—';
  return new Date(s + 'Z').toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function ageHours(s: string): number {
  return Math.round((Date.now() - new Date(s + 'Z').getTime()) / 3600000);
}

export function isBreached(t: Ticket): boolean {
  return !['resolved', 'closed'].includes(t.status) && new Date(t.sla_due_at + 'Z') < new Date();
}
