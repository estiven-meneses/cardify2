import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

/**
 * El codigo heredado espera `window.jspdf` y un `confetti` global, que antes
 * ponian las etiquetas <script> de los CDN. Ahora vienen del bundle, pero se
 * exponen igual para no tocar el legacy en este paso de la migracion.
 *
 * Se importa ANTES que i18n.js y app.js: el orden de los imports es el orden
 * de ejecucion, y el legacy los necesita ya puestos.
 */
declare global {
  interface Window {
    jspdf: { jsPDF: typeof jsPDF };
    confetti: typeof confetti;
    // Puentes entre los dos archivos heredados (ver notas al final de cada uno).
    t: (key: string, vars?: Record<string, unknown>) => string;
    applyI18n: () => void;
    initLang: () => void;
    setLang: (lang: string) => void;
    updateUIFromState: () => void;
    updatePaperThemeUI: () => void;
    updateDefaultConfigBadge: () => void;
    scheduleRender: () => void;
  }
}

window.jspdf = { jsPDF };
window.confetti = confetti;

export {};
