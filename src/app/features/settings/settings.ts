import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { SystemSettingsService } from '../../core/services/system-settings.service';
import { SettingCategory, SystemSetting } from '../../core/models/system-setting.model';

interface SettingGroup {
  readonly category: SettingCategory;
  readonly title: string;
  readonly hint: string;
  readonly items: SystemSetting[];
}

const CATEGORY_META: Record<SettingCategory, { title: string; hint: string; order: number }> = {
  SYSTEM: { title: 'Sistema', hint: 'Parámetros generales de la aplicación', order: 0 },
  CLINICAL_RULES: { title: 'Reglas clínicas', hint: 'Umbrales y reglas de alerta', order: 1 },
  HARDWARE: { title: 'Equipamiento', hint: 'Valores por defecto del hardware', order: 2 },
  NOTIFICATIONS: { title: 'Notificaciones', hint: 'Canales y envíos de alertas', order: 3 },
};

/**
 * Centralized configuration hub. Admin-only single access point to manage
 * system-wide parameters, clinical rules, hardware defaults and notification
 * toggles. Route-guarded to ROLE_ADMIN; the backend enforces the same.
 */
@Component({
  selector: 'app-settings',
  imports: [AppShell],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  host: { class: 'block' },
})
export class Settings implements OnInit {
  private readonly service = inject(SystemSettingsService);

  readonly settings = signal<SystemSetting[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  /** Draft values keyed by settingKey — what the inputs are bound to. */
  readonly drafts = signal<Record<string, string>>({});
  readonly savingKey = signal<string | null>(null);
  readonly savedKey = signal<string | null>(null);
  readonly errorKey = signal<{ key: string; message: string } | null>(null);

  readonly groups = computed<SettingGroup[]>(() => {
    const byCategory = new Map<SettingCategory, SystemSetting[]>();
    for (const s of this.settings()) {
      const list = byCategory.get(s.category) ?? [];
      list.push(s);
      byCategory.set(s.category, list);
    }
    return [...byCategory.entries()]
      .map(([category, items]) => ({
        category,
        title: CATEGORY_META[category].title,
        hint: CATEGORY_META[category].hint,
        items,
      }))
      .sort((a, b) => CATEGORY_META[a.category].order - CATEGORY_META[b.category].order);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.service.list().subscribe({
      next: (r) => {
        this.settings.set(r.data);
        const drafts: Record<string, string> = {};
        for (const s of r.data) drafts[s.settingKey] = s.value;
        this.drafts.set(drafts);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar la configuración. Reintentá.');
      },
    });
  }

  draftValue(key: string): string {
    return this.drafts()[key] ?? '';
  }

  onInput(key: string, value: string): void {
    this.drafts.set({ ...this.drafts(), [key]: value });
    if (this.savedKey() === key) this.savedKey.set(null);
    if (this.errorKey()?.key === key) this.errorKey.set(null);
  }

  onToggle(key: string, checked: boolean): void {
    this.onInput(key, checked ? 'true' : 'false');
  }

  isDirty(setting: SystemSetting): boolean {
    return this.draftValue(setting.settingKey) !== setting.value;
  }

  save(setting: SystemSetting): void {
    const key = setting.settingKey;
    const value = this.draftValue(key);
    if (this.savingKey() === key || value === setting.value) return;

    this.savingKey.set(key);
    this.errorKey.set(null);
    this.service.update(key, value).subscribe({
      next: (r) => {
        this.settings.set(this.settings().map((s) => (s.settingKey === key ? r.data : s)));
        this.savingKey.set(null);
        this.savedKey.set(key);
        setTimeout(() => this.savedKey.set(null), 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.savingKey.set(null);
        const message =
          typeof err.error?.message === 'string' ? err.error.message : 'No se pudo guardar.';
        this.errorKey.set({ key, message });
      },
    });
  }
}
