import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../models/ticket.model';
import { ageHours, isBreached } from '../../utils';

@Component({
  selector: 'app-ticket-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-table.component.html',
})
export class TicketTableComponent {
  @Input() tickets: Ticket[] = [];
  @Input() emptyMessage = 'No tickets to show.';
  @Output() select = new EventEmitter<number>();

  ageHours = ageHours;
  isBreached = isBreached;

  onRowClick(t: Ticket) {
    this.select.emit(t.id);
  }
}
