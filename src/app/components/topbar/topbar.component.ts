import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService, ViewName } from '../../services/app-state.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  constructor(public state: AppStateService) {}

  onUserChange(id: string) {
    this.state.setCurrentUserById(Number(id));
  }

  setView(v: ViewName) {
    this.state.view.set(v);
  }
}
