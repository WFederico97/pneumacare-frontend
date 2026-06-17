import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ShiftStatus } from '../shift-status/shift-status';

@Component({
  selector: 'app-dashboard-navbar',
  imports: [ShiftStatus],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  host: { class: 'block' },
})
export class Navbar implements OnInit, OnDestroy {
  readonly clock = signal<string>('');

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateClock();
    this.timerId = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.clock.set(
      now.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    );
  }
}
