import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

@Component({
  selector: 'app-faq',
  imports: [RouterLink],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
  host: { class: 'block' },
})
export class Faq {
  readonly openIndex = signal<number | null>(null);

  readonly items: FaqItem[] = [
    {
      question: '¿Cómo accedo al sistema PneumaCare?',
      answer:
        'PneumaCare es accesible desde cualquier navegador web moderno con conexión a internet. ' +
        'Las páginas informativas como ésta son públicas y no requieren autenticación. ' +
        'Para las funcionalidades clínicas avanzadas, deberá contar con las credenciales de acceso ' +
        'provistas por su institución.',
    },
    {
      question: '¿Qué es el índice RSBI?',
      answer:
        'El RSBI (Rapid Shallow Breathing Index) es un indicador clínico que evalúa la probabilidad de ' +
        'éxito en la desconexión del soporte ventilatorio mecánico. Se calcula dividiendo la frecuencia ' +
        'respiratoria (respiraciones/min) por el volumen tidal (litros): RSBI = FR / VT. ' +
        'Un valor inferior a 80 sugiere pronóstico favorable para la extubación.',
    },
    {
      question: '¿Qué es el índice PaFi?',
      answer:
        'El PaFi es la relación entre la presión arterial de oxígeno (PaO₂, en mmHg) y la fracción ' +
        'inspirada de oxígeno (FiO₂, adimensional 0.21–1.0). Se utiliza para clasificar la severidad ' +
        'del Síndrome de Dificultad Respiratoria Aguda (SDRA) según la Definición de Berlín (2012): ' +
        'PaFi ≥ 400 normal, 200–399 SDRA leve, 100–199 SDRA moderado, < 100 SDRA grave.',
    },
    {
      question: '¿Qué datos necesito para calcular el RSBI?',
      answer:
        'Se requieren dos valores medidos por el ventilador mecánico o directamente: la frecuencia ' +
        'respiratoria del paciente (en respiraciones por minuto, rango típico 10–40) y el volumen ' +
        'tidal (en litros, rango típico 0.3–0.8 L).',
    },
    {
      question: '¿Qué datos necesito para calcular el PaFi?',
      answer:
        'Se requiere la PaO₂ obtenida por gasometría arterial (en mmHg, rango típico 40–600) y la ' +
        'FiO₂ configurada en el soporte ventilatorio (valor entre 0.21 y 1.0, donde 0.21 corresponde ' +
        'al aire ambiente y 1.0 al 100 % de O₂).',
    },
    {
      question: '¿Cómo se protegen mis datos personales?',
      answer:
        'PneumaCare cumple con la Ley 25.326 de Protección de Datos Personales de Argentina. ' +
        'El sistema no almacena identificadores de pacientes en ninguna capa de la plataforma. ' +
        'Los datos de telemetría son anonimizados antes de ser exportados fuera de la JVM. ' +
        'Puede ejercer los derechos de acceso, rectificación y eliminación contactando al equipo ' +
        'a través de los canales oficiales del proyecto.',
    },
    {
      question: '¿Puedo solicitar la eliminación de mis datos?',
      answer:
        'Sí. Conforme a la Ley 25.326, todo usuario tiene derecho a solicitar la eliminación de sus ' +
        'datos personales en cualquier momento. Para ejercer este derecho, envíe su solicitud a través ' +
        'del repositorio oficial del proyecto en GitHub o del área académica de la TUP — UTN FRC.',
    },
    {
      question: '¿El sistema requiere conexión a internet permanente?',
      answer:
        'Sí, PneumaCare es una aplicación web que requiere conexión a internet para operar. Los cálculos ' +
        'clínicos se procesan en el servidor backend. Para despliegues en entornos clínicos sin acceso a ' +
        'internet, consulte a su administrador de sistemas sobre la instalación local con Docker Compose.',
    },
    {
      question: '¿Qué navegadores y dispositivos son compatibles?',
      answer:
        'PneumaCare es compatible con las versiones actuales de Chrome, Firefox, Edge y Safari. ' +
        'La interfaz es completamente responsiva y funciona correctamente en dispositivos móviles ' +
        '(desde 320 px de ancho), tablets y monitores de escritorio.',
    },
    {
      question: '¿Cómo puedo reportar un problema o sugerencia?',
      answer:
        'Puede comunicarse con el equipo de desarrollo mediante el repositorio oficial del proyecto en ' +
        'GitHub (WFederico97/pneumacare) o a través del área académica de la Tecnicatura Universitaria ' +
        'en Programación — UTN Facultad Regional Córdoba.',
    },
  ];

  toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
