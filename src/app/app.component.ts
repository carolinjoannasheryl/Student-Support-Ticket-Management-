import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { AppStateService } from './services/app-state.service';
import { TopbarComponent } from './components/topbar/topbar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TicketListComponent } from './components/ticket-list/ticket-list.component';
import { NewTicketComponent } from './components/new-ticket/new-ticket.component';
import { TicketModalComponent } from './components/ticket-modal/ticket-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    DashboardComponent,
    TicketListComponent,
    NewTicketComponent,
    TicketModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private api: ApiService, public appState: AppStateService) {}

  ngOnInit() {
    this.api.getUsers().subscribe(users => this.appState.setUsers(users));
  }
}
