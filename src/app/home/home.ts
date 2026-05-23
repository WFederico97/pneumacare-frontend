import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HealthService } from '../core/services/health.service';
import { HealthStatusData } from '../core/models/health.model';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
  host: { class: 'block' }
})
export class Home implements OnInit {
  private readonly healthService = inject(HealthService);

  readonly healthData   = signal<HealthStatusData | null>(null);
  readonly isLoading    = signal(true);
  readonly hasError     = signal(false);

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.healthData.set(null);

    this.healthService.getHealth().subscribe({
      next: (response) => {
        this.healthData.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
}
