import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AppStateService } from '../../services/app-state.service';
import { Stats, Ticket } from '../../models/ticket.model';
import { TicketTableComponent } from '../ticket-table/ticket-table.component';

interface BarRow { key: string; count: number; pct: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TicketTableComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats: Stats | null = null;
  breached: Ticket[] = [];
  loading = true;

  statusOrder = ['open', 'in_progress', 'pending_student', 'pending_department', 'resolved', 'closed', 'reopened'];
  priorityOrder = ['urgent', 'high', 'medium', 'low'];

  statusBars: BarRow[] = [];
  priorityBars: BarRow[] = [];

  constructor(private api: ApiService, public appState: AppStateService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getStats().subscribe(stats => {
      this.stats = stats;
      const maxStatus = Math.max(1, ...Object.values(stats.byStatus));
      const maxPri = Math.max(1, ...Object.values(stats.byPriority));
      this.statusBars = this.statusOrder
        .filter(s => stats.byStatus[s])
        .map(s => ({ key: s, count: stats.byStatus[s], pct: (stats.byStatus[s] / maxStatus) * 100 }));
      this.priorityBars = this.priorityOrder
        .filter(p => stats.byPriority[p])
        .map(p => ({ key: p, count: stats.byPriority[p], pct: (stats.byPriority[p] / maxPri) * 100 }));
    });
    this.api.getTickets({ breached: '1' }).subscribe(tickets => {
      this.breached = tickets;
      this.loading = false;
    });
  }

  openTicket(id: number) {
    this.appState.openTicket(id);
  }
}
