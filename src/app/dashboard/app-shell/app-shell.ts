import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';

/**
 * Authenticated app chrome: skip-link, role-aware sidebar and top navbar, with
 * the page content projected into the main column.
 *
 * <p>Single source for the logged-in shell so every protected page renders the
 * same navigation and accessibility scaffolding. Projected content should own a
 * {@code #main-content} landmark for the skip-link target.
 */
@Component({
  selector: 'app-shell',
  imports: [Sidebar, Navbar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  host: { class: 'block' },
})
export class AppShell {}
