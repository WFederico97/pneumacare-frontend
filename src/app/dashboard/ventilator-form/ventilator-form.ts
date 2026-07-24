import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AssetService } from '../../core/services/asset.service';
import { EvaluationService } from '../../core/services/evaluation.service';
import { ShiftService } from '../../core/services/shift.service';
import { VentilatorService } from '../../core/services/ventilator.service';
import { ActiveAssignment } from '../../core/models/asset.model';
import { CreateEvaluationRequest, CstatInterpretation, DrivingPressureBand, EvaluationResult, PafiClassification, RsbiInterpretation, VentilatorBrand } from '../../core/models/evaluation.model';
import { VentilatorParameterField } from '../../core/models/ventilator-parameter.model';

type NumericControl = 'f' | 'vt' | 'fio2' | 'pao2' | 'peep' | 'pplat' | 'triggerFlow' | 'inspTime';

/** The six universal parameters present for every ventilator brand. */
const CORE_FIELDS: readonly NumericControl[] = ['f', 'vt', 'fio2', 'pao2', 'peep', 'pplat'];

/** Every brand-specific control the static form can host, cleared when not in the active schema. */
const ALL_EXTENDED_CONTROLS: readonly NumericControl[] = ['triggerFlow', 'inspTime'];

/**
 * Fallback extended schema used before the backend schema loads, so the form is
 * usable immediately. Mirrors the server defaults; the fetched schema overrides it.
 */
const FALLBACK_SCHEMA: Record<VentilatorBrand, VentilatorParameterField[]> = {
  TECME: [{ key: 'triggerFlow', label: 'Trigger por flujo', unit: 'L/min', valueType: 'number', min: 1, max: 30, step: 1, required: true }],
  NEUMOVENT: [{ key: 'inspTime', label: 'Tiempo inspiratorio', unit: 's', valueType: 'number', min: 0.1, max: 5, step: 0.1, required: true }],
};

interface PresetProfile {
  readonly label: string;
  readonly f: number;
  readonly vt: number;
  readonly fio2: number;
  readonly pao2: number;
  readonly peep: number;
  readonly pplat: number;
  readonly triggerFlow: number;
  readonly inspTime: number;
}

const PRESETS: readonly PresetProfile[] = [
  { label: 'Protección ARDS', f: 14, vt: 400, fio2: 0.60, pao2: 60, peep: 10, pplat: 28, triggerFlow: 2, inspTime: 0.8 },
  { label: 'Destete', f: 18, vt: 500, fio2: 0.35, pao2: 80, peep: 5, pplat: 18, triggerFlow: 2, inspTime: 0.9 },
  { label: 'Estándar', f: 14, vt: 500, fio2: 0.40, pao2: 80, peep: 5, pplat: 22, triggerFlow: 2, inspTime: 1.0 },
];

function platGreaterThanPeep(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pplat = (group as FormGroup).get('pplat')?.value as number | null;
    const peep = (group as FormGroup).get('peep')?.value as number | null;
    if (pplat !== null && peep !== null && pplat <= peep) {
      return { platNotGreaterThanPeep: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-ventilator-form',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './ventilator-form.html',
  styleUrl: './ventilator-form.css',
  host: { class: 'block' },
})
export class VentilatorForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly evaluationService = inject(EvaluationService);
  private readonly shiftService = inject(ShiftService);
  private readonly ventilatorService = inject(VentilatorService);
  private readonly assetService = inject(AssetService);

  /** Config-driven extended parameter schema per brand, fetched from the backend. */
  private readonly schemaByBrand = new Map<VentilatorBrand, VentilatorParameterField[]>();

  /** Extended fields for the currently selected brand — drives the dynamic form section. */
  readonly extendedFields = signal<VentilatorParameterField[]>(FALLBACK_SCHEMA.TECME);

  /** Evaluations require an OPEN shift (PNMC-93 AC3); the form locks otherwise. */
  readonly isShiftOpen = this.shiftService.isShiftOpen;

  readonly selectedBedId = input<string | null>(null);
  readonly selectedBedNumber = input<string | null>(null);
  readonly patientId = input<string | null>(null);

  /** Emitted after an evaluation is persisted, so the host can react to its alert state. */
  readonly evaluationSaved = output<EvaluationResult>();

  private lastBedId: string | null = null;

  /**
   * The patient's active ventilator assignment. {@code undefined} = lookup in
   * flight, {@code null} = confirmed unassigned. Evaluations reference the
   * physical machine, so submitting is blocked until a ventilator is assigned
   * from the patient's clinical record.
   */
  readonly activeAssignment = signal<ActiveAssignment | null | undefined>(undefined);

  readonly brandOptions: readonly VentilatorBrand[] = ['TECME', 'NEUMOVENT'];
  readonly selectedBrand = signal<VentilatorBrand>('TECME');
  readonly isLoading = signal(false);
  readonly evaluationResult = signal<EvaluationResult | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly activePreset = signal<string | null>(null);

  /**
   * Clinical fields the therapist has manually typed into since the last preset
   * fill or reset. Anything NOT in this set that still carries a value is a
   * preset/default the user is about to submit unchanged — surfaced as a flag.
   */
  readonly manuallyEdited = signal<ReadonlySet<NumericControl>>(new Set());

  readonly presets = PRESETS;

  /** The clinical fields a preset fills: the six core fields plus the active schema's extended fields. */
  private readonly presetFieldsForBrand = computed<readonly NumericControl[]>(() => {
    const extended = this.extendedFields().map((field) => field.key as NumericControl);
    return [...CORE_FIELDS, ...extended];
  });

  /**
   * Fields still holding a preset/default value the user has not touched.
   * Empty until a preset is applied; recomputes as the user edits.
   */
  readonly presetUnmodifiedFields = computed<readonly NumericControl[]>(() => {
    if (this.activePreset() === null) return [];
    this._formValues(); // re-evaluate as values change
    const edited = this.manuallyEdited();
    return this.presetFieldsForBrand().filter((name) => {
      if (edited.has(name)) return false;
      const v = this.form.controls[name].value;
      return v !== null && v !== undefined;
    });
  });

  readonly presetUnmodifiedCount = computed(() => this.presetUnmodifiedFields().length);

  readonly form = this.formBuilder.group({
    brand: this.formBuilder.control<VentilatorBrand>('TECME', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    f: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(80)],
    }),
    vt: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(100), Validators.max(1000)],
    }),
    fio2: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.21), Validators.max(1.0)],
    }),
    pao2: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(700)],
    }),
    peep: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(50)],
    }),
    pplat: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(60)],
    }),
    triggerFlow: this.formBuilder.control<number | null>(null),
    inspTime: this.formBuilder.control<number | null>(null),
  }, { validators: platGreaterThanPeep() });

  /* Live form values as a signal — drives real-time metric preview */
  private readonly _formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.value,
  });

  /* RSBI = f / (Vt[L]) — live, computes as user types */
  readonly liveRsbi = computed(() => {
    const v = this._formValues();
    const f = v.f;
    const vt = v.vt;
    if (f === null || f === undefined || !vt || vt <= 0) return null;
    return f / (vt / 1000);
  });

  /* PaFi = PaO2 / FiO2 (FiO2 as fraction 0.21–1.0) */
  readonly livePafi = computed(() => {
    const v = this._formValues();
    const pao2 = v.pao2;
    const fio2 = v.fio2;
    if (!pao2 || !fio2 || fio2 <= 0) return null;
    return pao2 / fio2;
  });

  /* Cstat = Vt[mL] / (Pplat − PEEP) */
  readonly liveCstat = computed(() => {
    const v = this._formValues();
    const vt = v.vt;
    const pplat = v.pplat;
    const peep = v.peep;
    if (!vt || !pplat || peep === null || peep === undefined || pplat <= peep) return null;
    return vt / (pplat - peep);
  });

  /* ΔP = Pplat − PEEP (cmH₂O) — driving pressure, live as user types */
  readonly liveDrivingPressure = computed(() => {
    const v = this._formValues();
    const pplat = v.pplat;
    const peep = v.peep;
    if (pplat === null || pplat === undefined || peep === null || peep === undefined || pplat <= peep) {
      return null;
    }
    return pplat - peep;
  });

  readonly hasLiveMetrics = computed(() =>
    this.liveRsbi() !== null || this.livePafi() !== null || this.liveCstat() !== null ||
    this.liveDrivingPressure() !== null
  );

  constructor() {
    effect(() => {
      const currentBedId = this.selectedBedId();
      const shiftOpen = this.isShiftOpen();

      if (!currentBedId || !shiftOpen) {
        this.form.disable({ emitEvent: false });
        this.resetClinicalFields();
        this.evaluationResult.set(null);
        this.submitError.set(null);
        this.lastBedId = null;
        return;
      }

      this.form.enable({ emitEvent: false });

      if (this.lastBedId !== currentBedId) {
        this.resetClinicalFields();
        this.evaluationResult.set(null);
        this.submitError.set(null);
        this.lastBedId = currentBedId;
      }
    });

    effect(() => {
      const currentPatientId = this.patientId();
      this.activeAssignment.set(undefined);
      if (!currentPatientId) {
        this.activeAssignment.set(null);
        return;
      }
      this.assetService.getActive(currentPatientId).subscribe({
        next: (response) => this.activeAssignment.set(response.data),
        error: () => this.activeAssignment.set(null),
      });
    });
  }

  ngOnInit(): void {
    /* Seed from the fallback so the form is usable before the fetch resolves. */
    this.schemaByBrand.set('TECME', FALLBACK_SCHEMA.TECME);
    this.schemaByBrand.set('NEUMOVENT', FALLBACK_SCHEMA.NEUMOVENT);
    this.applyExtendedSchema(this.form.controls.brand.value);

    this.ventilatorService.getParameterSchema().subscribe({
      next: (schemas) => {
        for (const schema of schemas) {
          this.schemaByBrand.set(schema.brand, schema.extendedFields);
        }
        this.applyExtendedSchema(this.selectedBrand());
      },
      error: () => {
        /* Keep the fallback schema; the form remains fully usable. */
      },
    });

    this.form.controls.brand.valueChanges.subscribe(brand => {
      this.selectedBrand.set(brand);
      this.applyExtendedSchema(brand);
      this.resetClinicalFields();
    });
  }

  hasSelectedBed(): boolean {
    return this.selectedBedId() !== null;
  }

  isInvalid(controlName: NumericControl): boolean {
    const control = this.form.controls[controlName];
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  errorMessage(controlName: NumericControl): string {
    const control = this.form.controls[controlName];
    if (!control || !control.errors) {
      return '';
    }
    if (control.errors['required']) return 'Campo obligatorio';
    if (control.errors['min']) return this.minMessage(controlName);
    if (control.errors['max']) return this.maxMessage(controlName);
    return 'Valor inválido';
  }

  showPlatCrossError(): boolean {
    const pplatControl = this.form.controls['pplat'];
    return !!this.form.errors?.['platNotGreaterThanPeep'] &&
      !!(pplatControl.dirty || pplatControl.touched);
  }

  onNumericInput(controlName: NumericControl, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const raw = target.value.trim();
    const numericValue = raw === '' ? null : Number(raw);
    const control = this.form.controls[controlName] as AbstractControl<number | null, number | null>;

    control.setValue(Number.isNaN(numericValue) ? null : numericValue, { emitEvent: false });
    control.markAsDirty();
    control.updateValueAndValidity();

    if (!this.manuallyEdited().has(controlName)) {
      this.manuallyEdited.set(new Set(this.manuallyEdited()).add(controlName));
    }
  }

  /** True when this field still shows an unmodified preset/default value. */
  isPresetUnmodified(controlName: NumericControl): boolean {
    return this.presetUnmodifiedFields().includes(controlName);
  }

  replaceCommaWithDot(event: KeyboardEvent): void {
    if (event.key !== ',') {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    event.preventDefault();

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText('.', start, end, 'end');
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* Apply a preset profile — fills the six core fields plus the active schema's extended fields */
  applyPreset(preset: PresetProfile): void {
    if (!this.hasSelectedBed()) return;

    this.form.patchValue({
      f: preset.f, vt: preset.vt, fio2: preset.fio2,
      pao2: preset.pao2, peep: preset.peep, pplat: preset.pplat,
    });

    /* Clear every possible extended control, then fill only those in the active schema. */
    for (const control of ALL_EXTENDED_CONTROLS) {
      this.form.controls[control].setValue(null);
    }
    for (const field of this.extendedFields()) {
      const key = field.key as 'triggerFlow' | 'inspTime';
      this.form.controls[key].setValue(preset[key]);
    }

    this.form.markAsDirty();
    this.evaluationResult.set(null);
    this.submitError.set(null);
    this.activePreset.set(preset.label);
    /* All fields now carry preset values — none manually modified yet. */
    this.manuallyEdited.set(new Set());
  }

  liveRsbiClass(): string {
    const v = this.liveRsbi();
    if (v === null) return 'text-slate-500';
    if (v > 105) return 'text-red-300';
    if (v >= 80) return 'text-yellow-300';
    return 'text-emerald-300';
  }

  livePafiClass(): string {
    const v = this.livePafi();
    if (v === null) return 'text-slate-500';
    if (v >= 300) return 'text-emerald-300';
    if (v >= 200) return 'text-yellow-300';
    if (v >= 100) return 'text-orange-300';
    return 'text-red-300';
  }

  liveCstatClass(): string {
    const v = this.liveCstat();
    if (v === null) return 'text-slate-500';
    if (v > 50) return 'text-cyan-300';
    if (v >= 35) return 'text-emerald-300';
    return 'text-yellow-300';
  }

  liveDrivingPressureClass(): string {
    const v = this.liveDrivingPressure();
    if (v === null) return 'text-slate-500';
    // ΔP > 15 cmH₂O is the mortality-associated threshold (Amato 2015).
    return v > 15 ? 'text-red-300' : 'text-emerald-300';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.hasSelectedBed() || this.isLoading()) {
      return;
    }

    const currentPatientId = this.patientId();
    if (!currentPatientId) {
      this.setSubmitError('No hay paciente asociado a esta cama.');
      return;
    }

    // Pre-check only: the backend resolves the shift itself, but failing here
    // gives a clearer message than a 409 after a full round-trip.
    if (!this.shiftService.activeShift()) {
      this.setSubmitError('No hay un turno activo. No se pueden registrar evaluaciones.');
      return;
    }

    const assignment = this.activeAssignment();
    if (assignment === undefined) {
      this.setSubmitError('Verificando el ventilador asignado. Intentá de nuevo en unos segundos.');
      return;
    }
    if (assignment === null) {
      this.setSubmitError(
        'El paciente no tiene un ventilador asignado. Asignale un equipo desde su historia clínica.',
      );
      return;
    }

    const v = this.form.value;
    const brand = this.selectedBrand();
    /* Build the extended payload from the active schema — no brand hard-coding. */
    const extendedParameters: Record<string, unknown> = {};
    for (const field of this.extendedFields()) {
      const control = this.form.get(field.key);
      extendedParameters[field.key] = control ? control.value : null;
    }

    const payload: CreateEvaluationRequest = {
      patientId: currentPatientId,
      physicalVentilatorId: assignment.ventilatorId,
      brand,
      f: v.f!,
      vt: v.vt!,
      pao2: v.pao2!,
      fio2: v.fio2!,
      pplat: v.pplat!,
      peep: v.peep!,
      extendedParameters,
    };

    this.isLoading.set(true);
    this.submitError.set(null);

    this.evaluationService.createEvaluation(payload).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.evaluationResult.set(response.data);
        this.evaluationSaved.emit(response.data);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.setSubmitError(this.extractErrorMessage(err));
      },
    });
  }

  newEvaluation(): void {
    this.evaluationResult.set(null);
    this.submitError.set(null);
    this.resetClinicalFields();
  }

  rsbiColorClass(interpretation: RsbiInterpretation): string {
    if (interpretation === 'FAVORABLE') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30';
    if (interpretation === 'BORDERLINE') return 'text-yellow-300 border-yellow-500/40 bg-yellow-950/30';
    return 'text-red-300 border-red-500/40 bg-red-950/30';
  }

  pafiColorClass(classification: PafiClassification): string {
    if (classification === 'NORMAL') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30';
    if (classification === 'AT_RISK') return 'text-yellow-300 border-yellow-500/40 bg-yellow-950/30';
    if (classification === 'MILD_ARDS') return 'text-orange-300 border-orange-500/40 bg-orange-950/30';
    if (classification === 'MODERATE_ARDS') return 'text-red-300 border-red-500/40 bg-red-950/30';
    return 'text-red-400 border-red-600/50 bg-red-950/50';
  }

  cstatColorClass(interpretation: CstatInterpretation): string {
    if (interpretation === 'HIGH') return 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30';
    if (interpretation === 'NORMAL') return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30';
    return 'text-yellow-300 border-yellow-500/40 bg-yellow-950/30';
  }

  rsbiLabel(interpretation: RsbiInterpretation): string {
    if (interpretation === 'FAVORABLE') return 'Favorable';
    if (interpretation === 'BORDERLINE') return 'Limítrofe';
    return 'Desfavorable';
  }

  pafiLabel(classification: PafiClassification): string {
    if (classification === 'NORMAL') return 'Normal';
    if (classification === 'AT_RISK') return 'En riesgo';
    if (classification === 'MILD_ARDS') return 'SDRA leve';
    if (classification === 'MODERATE_ARDS') return 'SDRA moderado';
    return 'SDRA severo';
  }

  cstatLabel(interpretation: CstatInterpretation): string {
    if (interpretation === 'HIGH') return 'Alta';
    if (interpretation === 'NORMAL') return 'Normal';
    return 'Baja';
  }

  drivingPressureColorClass(band: DrivingPressureBand): string {
    return band === 'HIGH'
      ? 'text-red-300 border-red-500/40 bg-red-950/30'
      : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30';
  }

  drivingPressureLabel(band: DrivingPressureBand): string {
    return band === 'HIGH' ? 'Elevada' : 'Protectora';
  }

  private setSubmitError(message: string): void {
    this.submitError.set(message);
    setTimeout(() => this.submitError.set(null), 5000);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message) {
        return body.message;
      }
      if (body.data && typeof body.data === 'object') {
        const fieldMessages = Object.values(body.data as Record<string, string>);
        if (fieldMessages.length > 0) return fieldMessages.join('; ');
      }
    }
    return 'Error al guardar la evaluación. Intente nuevamente.';
  }

  /**
   * Applies the brand's config-driven extended-parameter schema: validators and
   * visibility of the extended controls come entirely from the fetched (or
   * fallback) schema rather than being hard-coded per brand.
   */
  private applyExtendedSchema(brand: VentilatorBrand): void {
    const fields = this.schemaByBrand.get(brand) ?? [];
    this.extendedFields.set(fields);
    const activeKeys = new Set(fields.map((field) => field.key));

    /* Any extended control not in the active schema is cleared and un-validated. */
    for (const control of ALL_EXTENDED_CONTROLS) {
      if (!activeKeys.has(control)) {
        const ctrl = this.form.controls[control];
        ctrl.clearValidators();
        ctrl.setValue(null);
        ctrl.updateValueAndValidity();
      }
    }

    /* Each schema field drives its control's validators. */
    for (const field of fields) {
      const ctrl = this.form.get(field.key);
      if (!ctrl) continue;
      const validators = [Validators.min(field.min), Validators.max(field.max)];
      if (field.required) validators.unshift(Validators.required);
      ctrl.setValidators(validators);
      ctrl.updateValueAndValidity();
    }
  }

  private resetClinicalFields(): void {
    /* emitEvent: true so _formValues (toSignal from valueChanges) sees the reset */
    this.form.patchValue(
      { f: null, vt: null, fio2: null, pao2: null, peep: null, pplat: null, triggerFlow: null, inspTime: null },
    );

    ['f', 'vt', 'fio2', 'pao2', 'peep', 'pplat', 'triggerFlow', 'inspTime'].forEach(name => {
      const ctrl = this.form.get(name);
      ctrl?.markAsPristine();
      ctrl?.markAsUntouched();
    });

    this.activePreset.set(null);
    this.manuallyEdited.set(new Set());
  }

  private minMessage(controlName: NumericControl): string {
    if (controlName === 'f') return 'La frecuencia debe ser mayor o igual a 0';
    if (controlName === 'vt') return 'El volumen corriente debe ser de 100 a 1000 mL';
    if (controlName === 'fio2') return 'La FiO2 debe estar entre 0.21 y 1.0';
    if (controlName === 'pao2') return 'La PaO2 no puede ser negativa';
    if (controlName === 'peep') return 'El PEEP no puede ser negativo';
    if (controlName === 'pplat') return 'La Pplat debe ser mayor que 0';
    if (controlName === 'triggerFlow') return 'El trigger por flujo debe ser mayor o igual a 1';
    return 'El tiempo inspiratorio debe ser mayor o igual a 0.1';
  }

  private maxMessage(controlName: NumericControl): string {
    if (controlName === 'f') return 'La frecuencia no puede superar 80';
    if (controlName === 'vt') return 'El volumen corriente debe ser de 100 a 1000 mL';
    if (controlName === 'fio2') return 'La FiO2 debe estar entre 0.21 y 1.0';
    if (controlName === 'pao2') return 'La PaO2 no puede superar 700 mmHg';
    if (controlName === 'peep') return 'El PEEP no puede superar 50 cmH2O';
    if (controlName === 'pplat') return 'La Pplat no puede superar 60 cmH2O';
    if (controlName === 'triggerFlow') return 'El trigger por flujo no puede superar 30';
    return 'El tiempo inspiratorio no puede superar 5 segundos';
  }
}
