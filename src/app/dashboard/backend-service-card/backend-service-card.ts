import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HealthStatusData } from '../../core/models/health.model';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-backend-service-card',
  imports: [DatePipe],
  templateUrl: './backend-service-card.html',
  styleUrl: './backend-service-card.css',
  host: { class: 'block' },
})
export class BackendServiceCard implements OnInit {
  private readonly healthService = inject(HealthService);

  readonly healthData = signal<HealthStatusData | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.healthData.set(null);

    this.healthService.getHealth().subscribe({
      next: response => {
        this.healthData.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
