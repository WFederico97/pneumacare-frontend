import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  templateUrl: './terms.html',
  styleUrl: './terms.css',
  host: { class: 'block' },
})
export class Terms {
  constructor() {
    inject(Title).setTitle('Términos y Condiciones — PneumaCare');
  }
}
