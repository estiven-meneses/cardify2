/**
 * CARDIFY 2.1 PRO - Motor de Renderizado, Manipulación Directa y Exportación
 * Optimizado para Smartphones, Cámara Nativa, Sincronización de Carnets y Exportación Limpia.
 */

// =============================================================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// =============================================================================

const FACTORY_DEFAULTS = {
    paper: {
        size: 'a4', // 'a4' | 'letter'
        orientation: 'portrait', // 'portrait' | 'landscape'
        widthMm: 210,
        heightMm: 297,
    },
    layout: {
        mode: 'both', // 'both' | 'front-only' | 'back-only' | 'multi-2' | 'multi-4'
        arrange: 'vertical', // 'vertical' | 'horizontal'
        showCutLines: false, // APAGADO por defecto para evitar rayas entrecortadas
        showBorder: false,   // APAGADO por defecto para bordes 100% limpios
    },
    syncCards: true, // Sincronización automática de tamaño y filtros entre caras
    cards: {
        frente: {
            id: 'frente',
            name: 'Frente',
            rawImage: null,
            croppedCanvas: null,
            cropRect: null,
            cachedCanvas: null,
            widthMm: 85.6,
            heightMm: 53.98,
            xMm: 0,
            yMm: 21,
            scale: 150, // % (Configuración preferida del usuario)
            rotation: 0,
            flipH: false,
            flipV: false,
            borderRadiusMm: 6,
            filter: 'normal',
            brightness: 0,
            contrast: 0,
            dirty: true,
        },
        dorso: {
            id: 'dorso',
            name: 'Dorso',
            rawImage: null,
            croppedCanvas: null,
            cropRect: null,
            cachedCanvas: null,
            widthMm: 85.6,
            heightMm: 53.98,
            xMm: 0,
            yMm: -8,
            scale: 150, // % (Configuración preferida del usuario)
            rotation: 0,
            flipH: false,
            flipV: false,
            borderRadiusMm: 6,
            filter: 'normal',
            brightness: 0,
            contrast: 0,
            dirty: true,
        }
    },
    exportFormat: 'pdf',
    exportDpi: 300,
};

// Estado mutable actual
const STATE = JSON.parse(JSON.stringify(FACTORY_DEFAULTS));
STATE.activeCardId = 'frente';
STATE.selectedCardId = null;
STATE.snapEnabled = true;
STATE.zoom = 1.0;
STATE.theme = 'light';
STATE.darkPaper = false;
STATE.mobileView = 'canvas'; // 'canvas' | 'controls'

// Historial para Deshacer / Rehacer
const HISTORY = {
    undoStack: [],
    redoStack: [],
    maxItems: 30,
    isApplyingHistory: false
};

// =============================================================================
// 2. REFERENCIAS AL DOM
// =============================================================================

const DOM = {
    // Header & Globales
    btnLoadDemo: document.getElementById('btn-load-demo'),
    btnEmptyDemo: document.getElementById('btn-empty-demo'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIconDark: document.getElementById('theme-icon-dark'),
    themeIconLight: document.getElementById('theme-icon-light'),
    btnResetAll: document.getElementById('btn-reset-all'),

    // Mobile View Switcher
    mobileTabCanvas: document.getElementById('mobile-tab-canvas'),
    mobileTabControls: document.getElementById('mobile-tab-controls'),
    panelControls: document.getElementById('panel-controls'),
    panelCanvas: document.getElementById('panel-canvas'),

    // Dropzones & Carga
    dropzoneFrente: document.getElementById('dropzone-frente'),
    dropzoneDorso: document.getElementById('dropzone-dorso'),
    frenteInput: document.getElementById('frente-input'),
    dorsoInput: document.getElementById('dorso-input'),
    frenteCameraInput: document.getElementById('frente-camera-input'),
    dorsoCameraInput: document.getElementById('dorso-camera-input'),
    frentePreviewWrap: document.getElementById('frente-preview-wrap'),
    dorsoPreviewWrap: document.getElementById('dorso-preview-wrap'),
    frentePlaceholder: document.getElementById('frente-placeholder'),
    dorsoPlaceholder: document.getElementById('dorso-placeholder'),
    frenteImg: document.getElementById('frente-img'),
    dorsoImg: document.getElementById('dorso-img'),
    frenteActions: document.getElementById('frente-actions'),
    dorsoActions: document.getElementById('dorso-actions'),
    btnCropFrente: document.getElementById('btn-crop-frente'),
    btnRemoveFrente: document.getElementById('btn-remove-frente'),
    btnCropDorso: document.getElementById('btn-crop-dorso'),
    btnRemoveDorso: document.getElementById('btn-remove-dorso'),
    btnCameraFrente: document.getElementById('btn-camera-frente'),
    btnCameraDorso: document.getElementById('btn-camera-dorso'),
    btnSwapCards: document.getElementById('btn-swap-cards'),

    // Plantilla y Papel
    layoutModeSelect: document.getElementById('layout-mode-select'),
    layoutArrangeSelect: document.getElementById('layout-arrange-select'),
    paperSizeSelect: document.getElementById('paper-size-select'),
    btnOrientPortrait: document.getElementById('btn-orient-portrait'),
    btnOrientLandscape: document.getElementById('btn-orient-landscape'),
    checkCutLines: document.getElementById('check-cut-lines'),
    checkCardBorder: document.getElementById('check-card-border'),

    // Sincronización y Pestañas de Ajustes
    checkSyncCards: document.getElementById('check-sync-cards'),
    tabBtnFrente: document.getElementById('tab-btn-frente'),
    tabBtnDorso: document.getElementById('tab-btn-dorso'),
    tabBtnBoth: document.getElementById('tab-btn-both'),
    btnApplyCr80: document.getElementById('btn-apply-cr80'),
    activeCardDimensions: document.getElementById('active-card-dimensions'),
    cardScaleRange: document.getElementById('card-scale-range'),
    cardScaleNum: document.getElementById('card-scale-num'),
    cardXRange: document.getElementById('card-x-range'),
    cardXNum: document.getElementById('card-x-num'),
    cardYRange: document.getElementById('card-y-range'),
    cardYNum: document.getElementById('card-y-num'),
    btnAlignCenterBoth: document.getElementById('btn-align-center-both'),
    btnAlignCenterX: document.getElementById('btn-align-center-x'),
    btnAlignCenterY: document.getElementById('btn-align-center-y'),
    btnCopyToOther: document.getElementById('btn-copy-to-other'),
    cardRadiusRange: document.getElementById('card-radius-range'),
    cardRadiusNum: document.getElementById('card-radius-num'),
    btnResetRadius: document.getElementById('btn-reset-radius'),
    filterPresetBtns: document.querySelectorAll('.filter-preset-btn'),
    cardBrightnessRange: document.getElementById('card-brightness-range'),
    cardBrightnessNum: document.getElementById('card-brightness-num'),
    btnResetBrightness: document.getElementById('btn-reset-brightness'),
    cardContrastRange: document.getElementById('card-contrast-range'),
    cardContrastNum: document.getElementById('card-contrast-num'),
    btnResetContrast: document.getElementById('btn-reset-contrast'),
    cardRotationLabel: document.getElementById('card-rotation-label'),
    btnRotateActive90: document.getElementById('btn-rotate-active-90'),
    btnFlipH: document.getElementById('btn-flip-h'),
    btnFlipV: document.getElementById('btn-flip-v'),
    btnResetActiveCard: document.getElementById('btn-reset-active-card'),

    // Plantilla Predeterminada
    btnSaveCustomTemplate: document.getElementById('btn-save-custom-template'),
    btnRestoreFactoryTemplate: document.getElementById('btn-restore-factory-template'),
    defaultConfigBadge: document.getElementById('default-config-badge'),

    // Exportación
    exportFormatSelect: document.getElementById('export-format-select'),
    exportDpiSelect: document.getElementById('export-dpi-select'),
    btnGenerateDownload: document.getElementById('btn-generate-download'),
    btnGenerateText: document.getElementById('btn-generate-text'),
    btnDirectPrint: document.getElementById('btn-direct-print'),
    btnCopyClipboard: document.getElementById('btn-copy-clipboard'),

    // Canvas Toolbar & Quick Bar
    btnUndo: document.getElementById('btn-undo'),
    btnRedo: document.getElementById('btn-redo'),
    selectedCardIndicator: document.getElementById('selected-card-indicator'),
    btnToggleSnap: document.getElementById('btn-toggle-snap'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomFit: document.getElementById('btn-zoom-fit'),
    zoomLevelLabel: document.getElementById('zoom-level-label'),
    canvasQuickBar: document.getElementById('canvas-quick-bar'),
    quickCardBadge: document.getElementById('quick-card-badge'),
    btnQuickSelectBoth: document.getElementById('btn-quick-select-both'),
    quickSelectBothLabel: document.getElementById('quick-select-both-label'),
    quickScaleLabel: document.getElementById('quick-scale-label'),
    btnQuickScaleDown: document.getElementById('btn-quick-scale-down'),
    btnQuickScaleUp: document.getElementById('btn-quick-scale-up'),
    btnQuickRotate: document.getElementById('btn-quick-rotate'),
    btnQuickCrop: document.getElementById('btn-quick-crop'),
    btnQuickCenterX: document.getElementById('btn-quick-center-x'),
    btnQuickCenterY: document.getElementById('btn-quick-center-y'),
    btnQuickCenter: document.getElementById('btn-quick-center'),
    btnQuickToSettings: document.getElementById('btn-quick-to-settings'),
    viewportContainer: document.getElementById('viewport-container'),
    previewCanvas: document.getElementById('preview-canvas'),
    emptyState: document.getElementById('empty-state'),
    canvasStatusHint: document.getElementById('canvas-status-hint'),
    sheetInfoBadge: document.getElementById('sheet-info-badge'),
    btnTogglePaperTheme: document.getElementById('btn-toggle-paper-theme'),
    paperThemeIcon: document.getElementById('paper-theme-icon'),
    paperThemeLabel: document.getElementById('paper-theme-label'),

    // Modales
    cropModal: document.getElementById('crop-modal'),
    cropCanvas: document.getElementById('crop-canvas'),
    btnCloseCrop: document.getElementById('btn-close-crop'),
    btnCancelCrop: document.getElementById('btn-cancel-crop'),
    btnApplyCrop: document.getElementById('btn-apply-crop'),
    btnCropAspectFree: document.getElementById('btn-crop-aspect-free'),
    btnCropAspectCr80: document.getElementById('btn-crop-aspect-cr80'),
    btnCropRotate: document.getElementById('btn-crop-rotate'),
    btnCropAutoDetect: document.getElementById('btn-crop-auto-detect'),
    cameraModal: document.getElementById('camera-modal'),
    cameraVideo: document.getElementById('camera-video'),
    cameraGuideBox: document.getElementById('camera-guide-box'),
    btnSwitchCamera: document.getElementById('btn-switch-camera'),
    btnCameraUseNative: document.getElementById('btn-camera-use-native'),
    btnCloseCamera: document.getElementById('btn-close-camera'),
    btnCancelCamera: document.getElementById('btn-cancel-camera'),
    btnSnapCamera: document.getElementById('btn-snap-camera'),
    loaderOverlay: document.getElementById('loader-overlay'),
    loaderTitle: document.getElementById('loader-title'),
    loaderSubtitle: document.getElementById('loader-subtitle'),
    toastContainer: document.getElementById('toast-container'),
    printArea: document.getElementById('print-area'),
    printImg: document.getElementById('print-img')
};

const previewCtx = DOM.previewCanvas.getContext('2d');
let renderScheduled = false;
let cameraStream = null;
let targetCameraCard = 'frente';
let cameraFacingMode = 'environment'; // 'environment' (trasera) o 'user' (frontal)

const INTERACTION = {
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    cardInitialPos: { x: 0, y: 0 },
    cardInitialScale: 150,
    activeSnapLines: [],
};

// =============================================================================
// 3. INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadCustomDefaults(); // Carga las preferencias guardadas del usuario
    setupPaperDimensions();
    setupEventListeners();
    updateUIFromState();
    setupResponsiveMobile();
    resizeCanvasViewport();
    saveHistoryState('Inicial');
    scheduleRender();
    syncConfigTelemetry('init');
});

window.addEventListener('resize', () => {
    setupResponsiveMobile();
    resizeCanvasViewport();
    scheduleRender();
});

// Prevención radical de zoom de doble toque y gestos accidentales en móviles
let lastTouchEndTime = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEndTime <= 300) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.closest('input, select, textarea'))) {
            return;
        }
        e.preventDefault();
        if (e.target) {
            const clickable = e.target.closest('button, a, label');
            if (clickable) clickable.click();
        }
    }
    lastTouchEndTime = now;
}, { passive: false });

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// =============================================================================
// 4. RESPONSIVE Y VISTA MÓVIL (Edge-to-Edge)
// =============================================================================

function setupResponsiveMobile() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
        setMobileView(STATE.mobileView);
    } else {
        // En escritorio, ambos paneles siempre visibles
        DOM.panelControls.style.display = 'flex';
        DOM.panelCanvas.style.display = 'flex';
    }
}

function setMobileView(view) {
    STATE.mobileView = view;
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;

    if (view === 'canvas') {
        DOM.panelCanvas.style.display = 'flex';
        DOM.panelControls.style.display = 'none';
        DOM.mobileTabCanvas.className = 'py-2 px-3 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center gap-1.5 font-bold text-xs';
        DOM.mobileTabControls.className = 'py-2 px-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 font-medium text-xs';
        resizeCanvasViewport();
        scheduleRender();
    } else {
        DOM.panelCanvas.style.display = 'none';
        DOM.panelControls.style.display = 'flex';
        DOM.mobileTabControls.className = 'py-2 px-3 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center gap-1.5 font-bold text-xs';
        DOM.mobileTabCanvas.className = 'py-2 px-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 font-medium text-xs';
    }
}

// =============================================================================
// 5. GESTIÓN DE CONFIGURACIÓN PREDETERMINADA PERSONALIZADA (⭐ Favoritos)
// =============================================================================

function updateDefaultConfigBadge() {
    const hasCustom = !!localStorage.getItem('cardify-custom-defaults');
    if (DOM.defaultConfigBadge) {
        if (hasCustom) {
            DOM.defaultConfigBadge.textContent = 'Personalizada ⭐';
            DOM.defaultConfigBadge.className = 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
        } else {
            DOM.defaultConfigBadge.textContent = 'Fábrica';
            DOM.defaultConfigBadge.className = 'text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        }
    }
}

let telemetryTimeout = null;
function syncConfigTelemetry(trigger = 'live') {
    try {
        const customSaved = localStorage.getItem('cardify-custom-defaults');
        const payload = {
            trigger,
            time: new Date().toISOString(),
            paper: STATE.paper,
            layout: STATE.layout,
            syncCards: STATE.syncCards,
            cards: {
                frente: {
                    scale: STATE.cards.frente.scale,
                    xMm: STATE.cards.frente.xMm,
                    yMm: STATE.cards.frente.yMm,
                    borderRadiusMm: STATE.cards.frente.borderRadiusMm,
                    rotation: STATE.cards.frente.rotation || 0,
                    flipH: !!STATE.cards.frente.flipH,
                    flipV: !!STATE.cards.frente.flipV,
                    filter: STATE.cards.frente.filter,
                    brightness: STATE.cards.frente.brightness,
                    contrast: STATE.cards.frente.contrast,
                },
                dorso: {
                    scale: STATE.cards.dorso.scale,
                    xMm: STATE.cards.dorso.xMm,
                    yMm: STATE.cards.dorso.yMm,
                    borderRadiusMm: STATE.cards.dorso.borderRadiusMm,
                    rotation: STATE.cards.dorso.rotation || 0,
                    flipH: !!STATE.cards.dorso.flipH,
                    flipV: !!STATE.cards.dorso.flipV,
                    filter: STATE.cards.dorso.filter,
                    brightness: STATE.cards.dorso.brightness,
                    contrast: STATE.cards.dorso.contrast,
                }
            },
            exportFormat: STATE.exportFormat,
            exportDpi: STATE.exportDpi,
            savedCustom: customSaved ? JSON.parse(customSaved) : null
        };
        fetch('/__sync_defaults__?payload=' + encodeURIComponent(JSON.stringify(payload))).catch(() => {});
    } catch (err) {}
}

function debouncedTelemetrySync() {
    if (telemetryTimeout) clearTimeout(telemetryTimeout);
    telemetryTimeout = setTimeout(() => syncConfigTelemetry('user_change'), 800);
}

function saveCustomDefaults() {
    const customConfig = {
        paper: STATE.paper,
        layout: STATE.layout,
        syncCards: STATE.syncCards,
        cards: {
            frente: {
                scale: STATE.cards.frente.scale,
                xMm: STATE.cards.frente.xMm,
                yMm: STATE.cards.frente.yMm,
                borderRadiusMm: STATE.cards.frente.borderRadiusMm,
                filter: STATE.cards.frente.filter,
                brightness: STATE.cards.frente.brightness,
                contrast: STATE.cards.frente.contrast,
                rotation: STATE.cards.frente.rotation || 0,
                flipH: !!STATE.cards.frente.flipH,
                flipV: !!STATE.cards.frente.flipV,
            },
            dorso: {
                scale: STATE.cards.dorso.scale,
                xMm: STATE.cards.dorso.xMm,
                yMm: STATE.cards.dorso.yMm,
                borderRadiusMm: STATE.cards.dorso.borderRadiusMm,
                filter: STATE.cards.dorso.filter,
                brightness: STATE.cards.dorso.brightness,
                contrast: STATE.cards.dorso.contrast,
                rotation: STATE.cards.dorso.rotation || 0,
                flipH: !!STATE.cards.dorso.flipH,
                flipV: !!STATE.cards.dorso.flipV,
            }
        },
        exportFormat: STATE.exportFormat,
        exportDpi: STATE.exportDpi
    };

    localStorage.setItem('cardify-custom-defaults', JSON.stringify(customConfig));
    syncConfigTelemetry('save_defaults');
    updateDefaultConfigBadge();
    triggerSuccessCelebration();
    showToast('⭐ ¡Configuración guardada como tu plantilla predeterminada!', 'success');
}

function loadCustomDefaults() {
    try {
        const saved = localStorage.getItem('cardify-custom-defaults');
        if (!saved) return;
        const config = JSON.parse(saved);

        if (config.paper) Object.assign(STATE.paper, config.paper);
        if (config.layout) Object.assign(STATE.layout, config.layout);
        if (config.syncCards !== undefined) STATE.syncCards = config.syncCards;
        if (config.exportFormat) STATE.exportFormat = config.exportFormat;
        if (config.exportDpi) STATE.exportDpi = config.exportDpi;

        if (config.cards) {
            ['frente', 'dorso'].forEach(key => {
                if (config.cards[key]) {
                    Object.assign(STATE.cards[key], config.cards[key]);
                }
            });
        }
        updateDefaultConfigBadge();
    } catch (e) {
        console.warn('No se pudo cargar configuración personalizada:', e);
    }
}

function restoreFactoryDefaults() {
    localStorage.removeItem('cardify-custom-defaults');
    STATE.paper = JSON.parse(JSON.stringify(FACTORY_DEFAULTS.paper));
    STATE.layout = JSON.parse(JSON.stringify(FACTORY_DEFAULTS.layout));
    STATE.syncCards = FACTORY_DEFAULTS.syncCards;
    
    ['frente', 'dorso'].forEach(id => {
        const f = FACTORY_DEFAULTS.cards[id];
        STATE.cards[id].scale = f.scale;
        STATE.cards[id].xMm = f.xMm;
        STATE.cards[id].yMm = f.yMm;
        STATE.cards[id].borderRadiusMm = f.borderRadiusMm;
        STATE.cards[id].filter = f.filter;
        STATE.cards[id].brightness = f.brightness;
        STATE.cards[id].contrast = f.contrast;
        STATE.cards[id].rotation = 0;
        STATE.cards[id].flipH = false;
        STATE.cards[id].flipV = false;
        STATE.cards[id].dirty = true;
    });

    updateDefaultConfigBadge();
    setupPaperDimensions();
    updateUIFromState();
    syncControlsFromActiveCard();
    resizeCanvasViewport();
    scheduleRender();
    showToast('Valores de fábrica restablecidos', 'info');
}

function flipCard(cardId, axis = 'h') {
    if (cardId === 'both' || STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        flipSingleCard('frente', axis);
        flipSingleCard('dorso', axis);
        syncControlsFromActiveCard();
        scheduleRender();
        saveHistoryState(`Voltear Ambos ${axis.toUpperCase()}`);
        showToast(`Ambos carnets: Volteo ${axis === 'h' ? 'Horizontal' : 'Vertical'}`, 'info');
        return;
    }
    flipSingleCard(cardId, axis);
    syncControlsFromActiveCard();
    scheduleRender();
    saveHistoryState(`Voltear ${axis.toUpperCase()} ${STATE.cards[cardId].name}`);
    showToast(`${STATE.cards[cardId].name}: Volteo ${axis === 'h' ? 'Horizontal' : 'Vertical'}`, 'info');
}

function flipSingleCard(cardId, axis = 'h') {
    const card = STATE.cards[cardId];
    if (!card) return;
    if (axis === 'h') {
        card.flipH = !card.flipH;
    } else {
        card.flipV = !card.flipV;
    }
    card.dirty = true;
    if (STATE.syncCards) {
        const otherId = cardId === 'frente' ? 'dorso' : 'frente';
        if (axis === 'h') {
            STATE.cards[otherId].flipH = card.flipH;
        } else {
            STATE.cards[otherId].flipV = card.flipV;
        }
        STATE.cards[otherId].dirty = true;
    }
}

function resetActiveCardAdjustments() {
    if (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        resetCardToFactory('frente');
        resetCardToFactory('dorso');
        saveHistoryState('Restablecer Ambos Carnets');
        showToast('Ajustes de ambos carnets restablecidos a valores iniciales', 'info');
    } else {
        resetCardToFactory(STATE.activeCardId);
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            resetCardToFactory(otherId);
        }
        saveHistoryState(`Restablecer ${STATE.cards[STATE.activeCardId].name}`);
        showToast(`Ajustes de ${STATE.cards[STATE.activeCardId].name} restablecidos`, 'info');
    }
    syncControlsFromActiveCard();
    scheduleRender();
}

function resetCardToFactory(cardId) {
    const card = STATE.cards[cardId];
    if (!card) return;
    const def = FACTORY_DEFAULTS.cards[cardId];
    card.scale = def.scale;
    card.xMm = def.xMm;
    card.yMm = def.yMm;
    card.borderRadiusMm = def.borderRadiusMm;
    card.filter = def.filter;
    card.brightness = def.brightness;
    card.contrast = def.contrast;
    card.rotation = 0;
    card.flipH = false;
    card.flipV = false;
    card.dirty = true;
}

// =============================================================================
// 6. GESTIÓN DE TEMA
// =============================================================================

function initTheme() {
    const savedTheme = localStorage.getItem('cardify-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    STATE.theme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(STATE.theme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        DOM.themeIconDark.classList.remove('hidden');
        DOM.themeIconLight.classList.add('hidden');
        STATE.darkPaper = true;
    } else {
        document.documentElement.classList.remove('dark');
        DOM.themeIconDark.classList.add('hidden');
        DOM.themeIconLight.classList.remove('hidden');
        STATE.darkPaper = false;
    }
    localStorage.setItem('cardify-theme', theme);
    updatePaperThemeUI();
    scheduleRender();
}

function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    applyTheme(STATE.theme);
}

function togglePaperTheme() {
    STATE.darkPaper = !STATE.darkPaper;
    updatePaperThemeUI();
    scheduleRender();
    showToast(STATE.darkPaper ? '🌙 Modo Papel Oscuro activado (anti-deslumbramiento)' : '☀️ Modo Papel Blanco activado', 'info');
}

function updatePaperThemeUI() {
    if (!DOM.btnTogglePaperTheme) return;
    if (STATE.darkPaper) {
        if (DOM.paperThemeIcon) DOM.paperThemeIcon.textContent = '☀️';
        if (DOM.paperThemeLabel) DOM.paperThemeLabel.textContent = 'Papel Blanco';
        DOM.btnTogglePaperTheme.title = 'Cambiar vista previa a hoja blanca';
    } else {
        if (DOM.paperThemeIcon) DOM.paperThemeIcon.textContent = '🌙';
        if (DOM.paperThemeLabel) DOM.paperThemeLabel.textContent = 'Papel Oscuro';
        DOM.btnTogglePaperTheme.title = 'Cambiar vista previa a hoja oscura (anti-deslumbramiento)';
    }
}

// =============================================================================
// 7. PAPEL Y DIMENSIONES
// =============================================================================

function setupPaperDimensions() {
    const isPortrait = STATE.paper.orientation === 'portrait';
    let w = 210;
    let h = 297;

    if (STATE.paper.size === 'letter') {
        w = 215.9;
        h = 279.4;
    }

    STATE.paper.widthMm = isPortrait ? w : h;
    STATE.paper.heightMm = isPortrait ? h : w;

    DOM.sheetInfoBadge.textContent = `${STATE.paper.size.toUpperCase()} • ${STATE.paper.widthMm.toFixed(1)} × ${STATE.paper.heightMm.toFixed(1)} mm`;
}

// =============================================================================
// 8. EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Header & Mobile Switcher
    if (DOM.btnThemeToggle) DOM.btnThemeToggle.addEventListener('click', toggleTheme);
    if (DOM.btnResetAll) DOM.btnResetAll.addEventListener('click', resetAllDefaults);
    if (DOM.mobileTabCanvas) DOM.mobileTabCanvas.addEventListener('click', () => setMobileView('canvas'));
    if (DOM.mobileTabControls) DOM.mobileTabControls.addEventListener('click', () => setMobileView('controls'));

    // Carga de Archivos
    if (DOM.dropzoneFrente && DOM.frenteInput) setupDropzone(DOM.dropzoneFrente, DOM.frenteInput, 'frente');
    if (DOM.dropzoneDorso && DOM.dorsoInput) setupDropzone(DOM.dropzoneDorso, DOM.dorsoInput, 'dorso');

    // Inputs de Cámara
    if (DOM.frenteCameraInput) {
        DOM.frenteCameraInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) loadFileIntoCard(file, 'frente');
        });
    }
    if (DOM.dorsoCameraInput) {
        DOM.dorsoCameraInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) loadFileIntoCard(file, 'dorso');
        });
    }

    // Botones Únicos de Cámara (Inteligentes: en móvil/táctil abre cámara nativa sin complicaciones, en escritorio abre visor modal)
    function handleCameraTrigger(cardId) {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 768);
        if (isTouch) {
            if (cardId === 'frente' && DOM.frenteCameraInput) DOM.frenteCameraInput.click();
            else if (cardId === 'dorso' && DOM.dorsoCameraInput) DOM.dorsoCameraInput.click();
            else openCameraModal(cardId);
        } else {
            openCameraModal(cardId);
        }
    }

    if (DOM.btnCameraFrente) {
        DOM.btnCameraFrente.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCameraTrigger('frente');
        });
    }
    if (DOM.btnCameraDorso) {
        DOM.btnCameraDorso.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCameraTrigger('dorso');
        });
    }

    // Acciones de Tarjetas
    if (DOM.btnRemoveFrente) DOM.btnRemoveFrente.addEventListener('click', (e) => { e.stopPropagation(); removeCard('frente'); });
    if (DOM.btnRemoveDorso) DOM.btnRemoveDorso.addEventListener('click', (e) => { e.stopPropagation(); removeCard('dorso'); });
    if (DOM.btnCropFrente) DOM.btnCropFrente.addEventListener('click', (e) => { e.stopPropagation(); openCropModal('frente'); });
    if (DOM.btnCropDorso) DOM.btnCropDorso.addEventListener('click', (e) => { e.stopPropagation(); openCropModal('dorso'); });

    // Cámara Web en Vivo (Modal)
    if (DOM.btnCloseCamera) DOM.btnCloseCamera.addEventListener('click', closeCameraModal);
    if (DOM.btnCancelCamera) DOM.btnCancelCamera.addEventListener('click', closeCameraModal);
    if (DOM.btnSnapCamera) DOM.btnSnapCamera.addEventListener('click', captureCameraPhoto);
    if (DOM.btnSwitchCamera) DOM.btnSwitchCamera.addEventListener('click', switchCameraFacingMode);
    if (DOM.btnCameraUseNative) {
        DOM.btnCameraUseNative.addEventListener('click', () => {
            closeCameraModal();
            if (targetCameraCard === 'frente' && DOM.frenteCameraInput) DOM.frenteCameraInput.click();
            else if (DOM.dorsoCameraInput) DOM.dorsoCameraInput.click();
        });
    }

    // Swap & Demos
    DOM.btnSwapCards.addEventListener('click', swapCards);
    DOM.btnLoadDemo.addEventListener('click', loadDemoCards);
    DOM.btnEmptyDemo.addEventListener('click', loadDemoCards);

    // Sincronización Automática
    DOM.checkSyncCards.addEventListener('change', (e) => {
        STATE.syncCards = e.target.checked;
        showToast(STATE.syncCards ? '🔗 Ajustes sincronizados entre caras' : 'Ajustes independientes activados', 'info');
    });

    // Plantilla y Papel
    DOM.layoutModeSelect.addEventListener('change', (e) => {
        STATE.layout.mode = e.target.value;
        saveHistoryState('Modo de Caras');
        scheduleRender();
    });

    DOM.layoutArrangeSelect.addEventListener('change', (e) => {
        STATE.layout.arrange = e.target.value;
        saveHistoryState('Disposición');
        scheduleRender();
    });

    DOM.paperSizeSelect.addEventListener('change', (e) => {
        STATE.paper.size = e.target.value;
        setupPaperDimensions();
        resizeCanvasViewport();
        saveHistoryState('Tamaño de Papel');
        scheduleRender();
    });

    DOM.btnOrientPortrait.addEventListener('click', () => setOrientation('portrait'));
    DOM.btnOrientLandscape.addEventListener('click', () => setOrientation('landscape'));

    DOM.checkCutLines.addEventListener('change', (e) => {
        STATE.layout.showCutLines = e.target.checked;
        scheduleRender();
    });

    DOM.checkCardBorder.addEventListener('change', (e) => {
        STATE.layout.showBorder = e.target.checked;
        scheduleRender();
    });

    // Pestañas y Controles de Tarjeta
    DOM.tabBtnFrente.addEventListener('click', () => setActiveTab('frente'));
    DOM.tabBtnDorso.addEventListener('click', () => setActiveTab('dorso'));
    if (DOM.tabBtnBoth) DOM.tabBtnBoth.addEventListener('click', () => setActiveTab('both'));
    DOM.btnApplyCr80.addEventListener('click', applyCr80Preset);
    DOM.btnCopyToOther.addEventListener('click', copyActiveCardSettingsToOther);

    setupCardControls();

    // Exportación
    DOM.exportFormatSelect.addEventListener('change', (e) => STATE.exportFormat = e.target.value);
    DOM.exportDpiSelect.addEventListener('change', (e) => STATE.exportDpi = parseInt(e.target.value, 10));
    DOM.btnGenerateDownload.addEventListener('click', generateAndDownload);
    DOM.btnDirectPrint.addEventListener('click', directPrintDocument);
    DOM.btnCopyClipboard.addEventListener('click', copyToClipboard);

    // Plantilla Predeterminada
    if (DOM.btnSaveCustomTemplate) {
        DOM.btnSaveCustomTemplate.addEventListener('click', saveCustomDefaults);
    }
    if (DOM.btnRestoreFactoryTemplate) {
        DOM.btnRestoreFactoryTemplate.addEventListener('click', restoreFactoryDefaults);
    }

    // Canvas Toolbar & Barra Rápida (Agrandar con 1 toque)
    DOM.btnUndo.addEventListener('click', undo);
    DOM.btnRedo.addEventListener('click', redo);
    DOM.btnToggleSnap.addEventListener('click', toggleSnap);
    DOM.btnZoomIn.addEventListener('click', () => changeZoom(0.15));
    DOM.btnZoomOut.addEventListener('click', () => changeZoom(-0.15));
    DOM.btnZoomFit.addEventListener('click', fitZoomToContainer);

    if (DOM.btnQuickSelectBoth) {
        DOM.btnQuickSelectBoth.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelectBoth();
        });
    }

    if (DOM.btnQuickScaleDown) {
        DOM.btnQuickScaleDown.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId === 'both') {
                STATE.cards.frente.scale = Math.max(30, STATE.cards.frente.scale - 5);
                STATE.cards.dorso.scale = Math.max(30, STATE.cards.dorso.scale - 5);
            } else if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.scale = Math.max(30, c.scale - 5);
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = c.scale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    if (DOM.btnQuickScaleUp) {
        DOM.btnQuickScaleUp.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId === 'both') {
                STATE.cards.frente.scale = Math.min(180, STATE.cards.frente.scale + 5);
                STATE.cards.dorso.scale = Math.min(180, STATE.cards.dorso.scale + 5);
            } else if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.scale = Math.min(180, c.scale + 5);
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = c.scale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    if (DOM.btnQuickRotate) {
        DOM.btnQuickRotate.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId === 'both') {
                rotateCard('frente', 90);
                rotateCard('dorso', 90);
            } else if (STATE.selectedCardId) {
                rotateCard(STATE.selectedCardId, 90);
            }
        });
    }

    if (DOM.btnQuickCrop) {
        DOM.btnQuickCrop.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = STATE.selectedCardId === 'both' ? 'frente' : STATE.selectedCardId;
            if (id) openCropModal(id);
        });
    }

    if (DOM.btnQuickCenterX) {
        DOM.btnQuickCenterX.addEventListener('click', (e) => {
            e.stopPropagation();
            centerCardsHorizontal();
        });
    }

    if (DOM.btnQuickCenterY) {
        DOM.btnQuickCenterY.addEventListener('click', (e) => {
            e.stopPropagation();
            centerCardsVertical();
        });
    }

    if (DOM.btnQuickCenter) {
        DOM.btnQuickCenter.addEventListener('click', (e) => {
            e.stopPropagation();
            centerCardsBoth();
        });
    }

    if (DOM.btnTogglePaperTheme) {
        DOM.btnTogglePaperTheme.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePaperTheme();
        });
    }

    if (DOM.btnQuickToSettings) {
        DOM.btnQuickToSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            setMobileView('controls');
        });
    }

    setupCanvasPointerEvents();

    window.addEventListener('paste', handleGlobalPaste);
    window.addEventListener('keydown', handleGlobalKeydown);
}

// =============================================================================
// 9. CARGA DE ARCHIVOS
// =============================================================================

function setupDropzone(dropzoneEl, inputEl, cardId) {
    dropzoneEl.addEventListener('click', () => inputEl.click());

    inputEl.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) loadFileIntoCard(file, cardId);
    });

    dropzoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneEl.classList.add('dragover');
    });

    dropzoneEl.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove('dragover');
    });

    dropzoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove('dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) loadFileIntoCard(file, cardId);
    });
}

function loadFileIntoCard(file, cardId) {
    if (!file.type.startsWith('image/')) {
        showToast('Por favor selecciona una imagen válida.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const card = STATE.cards[cardId];
            card.rawImage = img;
            card.croppedCanvas = null;
            card.cachedCanvas = null;
            card.dirty = true;

            const aspect = img.width / img.height;
            if (aspect >= 1) {
                card.widthMm = 85.6;
                card.heightMm = 85.6 / aspect;
            } else {
                card.heightMm = 85.6;
                card.widthMm = 85.6 * aspect;
            }

            updateDropzoneUI(cardId, img.src);
            setActiveTab(cardId);
            saveHistoryState(`Cargar ${card.name}`);
            scheduleRender();
            showToast(`${card.name} cargado correctamente`, 'success');

            // En móvil, cambiar a la vista de la hoja para ver el resultado
            if (window.innerWidth < 1024) {
                setMobileView('canvas');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateDropzoneUI(cardId, src) {
    const isFrente = cardId === 'frente';
    const previewWrap = isFrente ? DOM.frentePreviewWrap : DOM.dorsoPreviewWrap;
    const placeholder = isFrente ? DOM.frentePlaceholder : DOM.dorsoPlaceholder;
    const imgEl = isFrente ? DOM.frenteImg : DOM.dorsoImg;
    const dropzone = isFrente ? DOM.dropzoneFrente : DOM.dropzoneDorso;
    const actions = isFrente ? DOM.frenteActions : DOM.dorsoActions;

    if (src) {
        imgEl.src = src;
        previewWrap.classList.remove('hidden');
        placeholder.classList.add('hidden');
        dropzone.classList.add('has-file');
        actions.style.display = 'flex';
    } else {
        imgEl.src = '';
        previewWrap.classList.add('hidden');
        placeholder.classList.remove('hidden');
        dropzone.classList.remove('has-file');
        actions.style.display = 'none';
    }

    updateEmptyStateVisibility();
}

function removeCard(cardId) {
    const card = STATE.cards[cardId];
    card.rawImage = null;
    card.croppedCanvas = null;
    card.cropRect = null;
    card.cachedCanvas = null;
    card.dirty = true;

    if (cardId === 'frente') DOM.frenteInput.value = '';
    else DOM.dorsoInput.value = '';

    updateDropzoneUI(cardId, null);
    if (STATE.selectedCardId === cardId) STATE.selectedCardId = null;

    saveHistoryState(`Eliminar ${card.name}`);
    scheduleRender();
    showToast(`${card.name} eliminado`, 'info');
}

function rotateCard(cardId, angleDeg = 90) {
    if (cardId === 'both' || STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        const f = STATE.cards.frente;
        const d = STATE.cards.dorso;
        if (f.rawImage) rotateSingleCard('frente', angleDeg);
        if (d.rawImage) rotateSingleCard('dorso', angleDeg);
        syncControlsFromActiveCard();
        saveHistoryState(`Rotar Ambos ${angleDeg}°`);
        scheduleRender();
        showToast(`Ambos carnets rotados ${angleDeg}°`, 'info');
        return;
    }
    rotateSingleCard(cardId, angleDeg);
    syncControlsFromActiveCard();
    saveHistoryState(`Rotar ${STATE.cards[cardId].name} ${angleDeg}°`);
    scheduleRender();
    showToast(`${STATE.cards[cardId].name} rotado`, 'info');
}

function rotateSingleCard(cardId, angleDeg = 90) {
    const card = STATE.cards[cardId];
    if (!card || !card.rawImage) return;

    card.rotation = (card.rotation + angleDeg) % 360;
    if (angleDeg === 90 || angleDeg === 270) {
        const temp = card.widthMm;
        card.widthMm = card.heightMm;
        card.heightMm = temp;
    }

    card.dirty = true;

    // Si la sincronización está activa, rotar también la otra cara
    if (STATE.syncCards) {
        const otherId = cardId === 'frente' ? 'dorso' : 'frente';
        const otherCard = STATE.cards[otherId];
        if (otherCard.rawImage) {
            otherCard.rotation = card.rotation;
            otherCard.widthMm = card.widthMm;
            otherCard.heightMm = card.heightMm;
            otherCard.dirty = true;
        }
    }
}

function swapCards() {
    if (!STATE.cards.frente.rawImage && !STATE.cards.dorso.rawImage) {
        showToast('Carga al menos un carnet para intercambiar', 'warning');
        return;
    }

    const f = STATE.cards.frente;
    const d = STATE.cards.dorso;

    const tempRaw = f.rawImage;
    const tempCropped = f.croppedCanvas;
    const tempCropRect = f.cropRect;
    const tempRotation = f.rotation;
    const tempFilter = f.filter;
    const tempBrightness = f.brightness;
    const tempContrast = f.contrast;
    const tempW = f.widthMm;
    const tempH = f.heightMm;

    f.rawImage = d.rawImage;
    f.croppedCanvas = d.croppedCanvas;
    f.cropRect = d.cropRect;
    f.rotation = d.rotation;
    f.filter = d.filter;
    f.brightness = d.brightness;
    f.contrast = d.contrast;
    f.widthMm = d.widthMm;
    f.heightMm = d.heightMm;
    f.dirty = true;

    d.rawImage = tempRaw;
    d.croppedCanvas = tempCropped;
    d.cropRect = tempCropRect;
    d.rotation = tempRotation;
    d.filter = tempFilter;
    d.brightness = tempBrightness;
    d.contrast = tempContrast;
    d.widthMm = tempW;
    d.heightMm = tempH;
    d.dirty = true;

    updateDropzoneUI('frente', f.rawImage ? f.rawImage.src : null);
    updateDropzoneUI('dorso', d.rawImage ? d.rawImage.src : null);

    saveHistoryState('Intercambiar Frente ↔ Dorso');
    scheduleRender();
    showToast('Frente y Dorso intercambiados', 'success');
}

function loadDemoCards() {
    showLoader('Cargando ejemplo...', 'Preparando muestra de carnet');

    const img1 = new Image();
    const img2 = new Image();
    let loaded = 0;

    const checkComplete = () => {
        loaded++;
        if (loaded === 2) {
            hideLoader();
            STATE.cards.frente.rawImage = img1;
            STATE.cards.frente.croppedCanvas = null;
            STATE.cards.frente.cachedCanvas = null;
            STATE.cards.frente.widthMm = 85.6;
            STATE.cards.frente.heightMm = 54.0;
            STATE.cards.frente.scale = 75;
            STATE.cards.frente.xMm = 0;
            STATE.cards.frente.yMm = 45;
            STATE.cards.frente.dirty = true;

            STATE.cards.dorso.rawImage = img2;
            STATE.cards.dorso.croppedCanvas = null;
            STATE.cards.dorso.cachedCanvas = null;
            STATE.cards.dorso.widthMm = 85.6;
            STATE.cards.dorso.heightMm = 54.0;
            STATE.cards.dorso.scale = 75;
            STATE.cards.dorso.xMm = 0;
            STATE.cards.dorso.yMm = 15;
            STATE.cards.dorso.dirty = true;

            updateDropzoneUI('frente', img1.src);
            updateDropzoneUI('dorso', img2.src);
            updateEmptyStateVisibility();
            STATE.selectedCardId = 'frente';
            setActiveTab('frente');
            syncControlsFromActiveCard();

            saveHistoryState('Cargar Carnet de Muestra');
            scheduleRender();
            showToast('¡Carnets de muestra cargados!', 'success');

            if (window.innerWidth < 1024) {
                setMobileView('canvas');
            }
        }
    };

    img1.onload = checkComplete;
    img2.onload = checkComplete;
    img1.onerror = () => { hideLoader(); showToast('Error al cargar la imagen de frente', 'error'); };
    img2.onerror = () => { hideLoader(); showToast('Error al cargar la imagen de dorso', 'error'); };

    img1.src = encodeURI('recursos/carnet confa 1.png');
    img2.src = encodeURI('recursos/carnet confa 2.png');
}

function handleGlobalPaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (!STATE.cards.frente.rawImage) {
                loadFileIntoCard(blob, 'frente');
            } else if (!STATE.cards.dorso.rawImage) {
                loadFileIntoCard(blob, 'dorso');
            } else {
                const targetId = (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') ? 'frente' : STATE.activeCardId;
                loadFileIntoCard(blob, targetId);
            }
            break;
        }
    }
}

function handleGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
    }

    if (STATE.selectedCardId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const targetCards = (STATE.selectedCardId === 'both')
            ? [STATE.cards.frente, STATE.cards.dorso]
            : [STATE.cards[STATE.selectedCardId]];

        targetCards.forEach(card => {
            if (e.key === 'ArrowUp') card.yMm -= step;
            if (e.key === 'ArrowDown') card.yMm += step;
            if (e.key === 'ArrowLeft') card.xMm -= step;
            if (e.key === 'ArrowRight') card.xMm += step;
        });

        syncControlsFromActiveCard();
        scheduleRender();
        return;
    }

    if (STATE.selectedCardId && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (document.activeElement.tagName !== 'INPUT') {
            if (STATE.selectedCardId === 'both') {
                removeCard('frente');
                removeCard('dorso');
            } else {
                removeCard(STATE.selectedCardId);
            }
        }
    }
}

// =============================================================================
// 10. CONTROLES Y SINCRONIZACIÓN REACTIVA
// =============================================================================

function setActiveTab(cardId) {
    STATE.activeCardId = cardId;
    if (cardId === 'both') {
        STATE.selectedCardId = 'both';
    } else if (STATE.selectedCardId === 'both') {
        STATE.selectedCardId = cardId;
    }

    const inactiveClass = 'flex-1 py-1 text-xs font-bold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all';
    const activeClass = 'flex-1 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 transition-all';

    DOM.tabBtnFrente.className = (cardId === 'frente') ? activeClass : inactiveClass;
    DOM.tabBtnDorso.className = (cardId === 'dorso') ? activeClass : inactiveClass;
    if (DOM.tabBtnBoth) {
        DOM.tabBtnBoth.className = (cardId === 'both') ? activeClass : inactiveClass;
    }

    syncControlsFromActiveCard();
    scheduleRender();
}

function applyToActiveCards(mutator) {
    if (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both') {
        mutator(STATE.cards.frente, 'frente');
        mutator(STATE.cards.dorso, 'dorso');
    } else {
        const id = STATE.activeCardId || 'frente';
        mutator(STATE.cards[id], id);
        if (STATE.syncCards) {
            const otherId = id === 'frente' ? 'dorso' : 'frente';
            mutator(STATE.cards[otherId], otherId);
        }
    }
}

function syncControlsFromActiveCard() {
    const isBoth = (STATE.activeCardId === 'both' || STATE.selectedCardId === 'both');
    const card = (STATE.activeCardId === 'dorso' && !isBoth) ? STATE.cards.dorso : STATE.cards.frente;

    DOM.cardScaleRange.value = card.scale;
    DOM.cardScaleNum.value = card.scale;
    DOM.cardXRange.value = card.xMm;
    DOM.cardXNum.value = card.xMm;
    DOM.cardYRange.value = card.yMm;
    DOM.cardYNum.value = card.yMm;
    DOM.cardRadiusRange.value = card.borderRadiusMm;
    if (DOM.cardRadiusNum) DOM.cardRadiusNum.value = card.borderRadiusMm;
    DOM.cardBrightnessRange.value = card.brightness;
    if (DOM.cardBrightnessNum) DOM.cardBrightnessNum.value = card.brightness;
    DOM.cardContrastRange.value = card.contrast;
    if (DOM.cardContrastNum) DOM.cardContrastNum.value = card.contrast;
    if (DOM.cardRotationLabel) DOM.cardRotationLabel.textContent = `${card.rotation || 0}°`;

    const currentW = (card.widthMm * card.scale / 100).toFixed(1);
    const currentH = (card.heightMm * card.scale / 100).toFixed(1);
    DOM.activeCardDimensions.textContent = isBoth 
        ? `(Ambos: ~${currentW} × ${currentH} mm)` 
        : `(${currentW} × ${currentH} mm)`;

    DOM.filterPresetBtns.forEach(btn => {
        if (btn.dataset.filter === card.filter) {
            btn.className = 'filter-preset-btn min-h-[38px] py-1.5 px-1 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
        } else {
            btn.className = 'filter-preset-btn min-h-[38px] py-1.5 px-1 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        }
    });

    if (isBoth) {
        DOM.selectedCardIndicator.textContent = '👥 Editando Ambos (Frente + Dorso)';
    } else if (STATE.selectedCardId) {
        DOM.selectedCardIndicator.textContent = `Editando ${STATE.cards[STATE.selectedCardId].name}`;
    } else {
        DOM.selectedCardIndicator.textContent = 'Arrastra para mover';
    }

    // Barra Rápida en el Canvas para Manipulación Directa (Agrandar con 1 Tap)
    if (DOM.canvasQuickBar) {
        const hasAnyImage = !!(STATE.cards.frente.rawImage || STATE.cards.dorso.rawImage);
        if ((STATE.selectedCardId || isBoth) && hasAnyImage) {
            DOM.canvasQuickBar.classList.remove('hidden');
            if (DOM.quickCardBadge) {
                DOM.quickCardBadge.textContent = isBoth
                    ? 'Frente + Dorso'
                    : STATE.cards[STATE.selectedCardId || STATE.activeCardId].name;
            }
            if (DOM.quickSelectBothLabel) {
                DOM.quickSelectBothLabel.textContent = isBoth ? 'Solo Uno' : 'Ambos';
            }
            if (DOM.quickScaleLabel) {
                DOM.quickScaleLabel.textContent = `${card.scale}%`;
            }
        } else {
            DOM.canvasQuickBar.classList.add('hidden');
        }
    }

    updateDefaultConfigBadge();
}

function centerCardsHorizontal() {
    const isBoth = STATE.activeCardId === 'both' || STATE.selectedCardId === 'both' || STATE.syncCards;
    if (isBoth) {
        STATE.cards.frente.xMm = 0;
        STATE.cards.dorso.xMm = 0;
    } else {
        const id = STATE.selectedCardId || STATE.activeCardId || 'frente';
        STATE.cards[id].xMm = 0;
    }
    syncControlsFromActiveCard();
    saveHistoryState('Centrar Horizontalmente (X=0)');
    scheduleRender();
    showToast('↔ Centrado en el eje horizontal (X = 0 mm)', 'success');
}

function centerCardsVertical() {
    const isBoth = STATE.activeCardId === 'both' || STATE.selectedCardId === 'both' || STATE.syncCards;
    if (isBoth) {
        if (STATE.layout.arrange === 'horizontal') {
            STATE.cards.frente.yMm = 0;
            STATE.cards.dorso.yMm = 0;
        } else {
            STATE.cards.frente.yMm = FACTORY_DEFAULTS.cards.frente.yMm;
            STATE.cards.dorso.yMm = FACTORY_DEFAULTS.cards.dorso.yMm;
        }
    } else {
        const id = STATE.selectedCardId || STATE.activeCardId || 'frente';
        STATE.cards[id].yMm = (STATE.layout.mode === 'single' ? 0 : FACTORY_DEFAULTS.cards[id].yMm);
    }
    syncControlsFromActiveCard();
    saveHistoryState('Centrar Verticalmente (Eje Y)');
    scheduleRender();
    showToast('↕ Centrado en el eje vertical (Y óptimo)', 'success');
}

function centerCardsBoth() {
    const isBoth = STATE.activeCardId === 'both' || STATE.selectedCardId === 'both' || STATE.syncCards;
    if (isBoth) {
        STATE.cards.frente.xMm = 0;
        STATE.cards.dorso.xMm = 0;
        if (STATE.layout.arrange === 'horizontal') {
            STATE.cards.frente.yMm = 0;
            STATE.cards.dorso.yMm = 0;
        } else {
            STATE.cards.frente.yMm = FACTORY_DEFAULTS.cards.frente.yMm;
            STATE.cards.dorso.yMm = FACTORY_DEFAULTS.cards.dorso.yMm;
        }
    } else {
        const id = STATE.selectedCardId || STATE.activeCardId || 'frente';
        STATE.cards[id].xMm = 0;
        STATE.cards[id].yMm = (STATE.layout.mode === 'single' ? 0 : FACTORY_DEFAULTS.cards[id].yMm);
    }
    syncControlsFromActiveCard();
    saveHistoryState('Centrar Ambos Ejes (X/Y)');
    scheduleRender();
    showToast('🎯 Centrado en ambos ejes (X e Y)', 'success');
}

function centerCard(cardId) {
    centerCardsBoth();
}

function toggleSelectBoth() {
    if (STATE.selectedCardId === 'both' || STATE.activeCardId === 'both') {
        STATE.selectedCardId = 'frente';
        setActiveTab('frente');
        showToast('Editando cara Frente individualmente', 'info');
    } else {
        STATE.selectedCardId = 'both';
        setActiveTab('both');
        showToast('👥 Ambos carnets seleccionados (Frente + Dorso)', 'info');
    }
}

function setupCardControls() {
    // Escala
    const onScaleChange = (val) => {
        applyToActiveCards((c) => { c.scale = val; });
        syncControlsFromActiveCard();
        scheduleRender();
    };

    DOM.cardScaleRange.addEventListener('input', (e) => onScaleChange(parseFloat(e.target.value)));
    DOM.cardScaleNum.addEventListener('input', (e) => onScaleChange(Math.min(180, Math.max(30, parseFloat(e.target.value) || 70))));

    // Posición X
    const onXChange = (val) => {
        applyToActiveCards((c) => { c.xMm = val; });
        scheduleRender();
    };
    DOM.cardXRange.addEventListener('input', (e) => onXChange(parseFloat(e.target.value)));
    DOM.cardXNum.addEventListener('input', (e) => onXChange(parseFloat(e.target.value) || 0));

    // Posición Y
    const onYChange = (val) => {
        applyToActiveCards((c) => { c.yMm = val; });
        scheduleRender();
    };
    DOM.cardYRange.addEventListener('input', (e) => onYChange(parseFloat(e.target.value)));
    DOM.cardYNum.addEventListener('input', (e) => onYChange(parseFloat(e.target.value) || 0));

    // Alineaciones
    if (DOM.btnAlignCenterBoth) {
        DOM.btnAlignCenterBoth.addEventListener('click', centerCardsBoth);
    }
    if (DOM.btnAlignCenterX) {
        DOM.btnAlignCenterX.addEventListener('click', centerCardsHorizontal);
    }
    if (DOM.btnAlignCenterY) {
        DOM.btnAlignCenterY.addEventListener('click', centerCardsVertical);
    }

    // Rotación y Volteo
    if (DOM.btnRotateActive90) {
        DOM.btnRotateActive90.addEventListener('click', () => rotateCard(STATE.activeCardId, 90));
    }
    if (DOM.btnFlipH) {
        DOM.btnFlipH.addEventListener('click', () => flipCard(STATE.activeCardId, 'h'));
    }
    if (DOM.btnFlipV) {
        DOM.btnFlipV.addEventListener('click', () => flipCard(STATE.activeCardId, 'v'));
    }
    if (DOM.btnResetActiveCard) {
        DOM.btnResetActiveCard.addEventListener('click', resetActiveCardAdjustments);
    }

    // Esquinas Redondeadas con Input Numérico y Reset
    DOM.cardRadiusRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        applyToActiveCards((c) => { c.borderRadiusMm = val; });
        if (DOM.cardRadiusNum) DOM.cardRadiusNum.value = val;
        scheduleRender();
    });

    if (DOM.cardRadiusNum) {
        DOM.cardRadiusNum.addEventListener('input', (e) => {
            const val = Math.min(15, Math.max(0, parseFloat(e.target.value) || 0));
            applyToActiveCards((c) => { c.borderRadiusMm = val; });
            DOM.cardRadiusRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetRadius) {
        DOM.btnResetRadius.addEventListener('click', () => {
            applyToActiveCards((c, id) => {
                c.borderRadiusMm = FACTORY_DEFAULTS.cards[id].borderRadiusMm;
            });
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    // Filtros Presets
    DOM.filterPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterMode = btn.dataset.filter;
            applyToActiveCards((c) => {
                c.filter = filterMode;
                c.dirty = true;
            });
            syncControlsFromActiveCard();
            saveHistoryState(`Filtro ${filterMode}`);
            scheduleRender();
        });
    });

    // Brillo con Input Numérico y Reset
    DOM.cardBrightnessRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        applyToActiveCards((c) => {
            c.brightness = val;
            c.dirty = true;
        });
        if (DOM.cardBrightnessNum) DOM.cardBrightnessNum.value = val;
        scheduleRender();
    });

    if (DOM.cardBrightnessNum) {
        DOM.cardBrightnessNum.addEventListener('input', (e) => {
            const val = Math.min(50, Math.max(-50, parseInt(e.target.value, 10) || 0));
            applyToActiveCards((c) => {
                c.brightness = val;
                c.dirty = true;
            });
            DOM.cardBrightnessRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetBrightness) {
        DOM.btnResetBrightness.addEventListener('click', () => {
            applyToActiveCards((c) => {
                c.brightness = 0;
                c.dirty = true;
            });
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    // Contraste con Input Numérico y Reset
    DOM.cardContrastRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        applyToActiveCards((c) => {
            c.contrast = val;
            c.dirty = true;
        });
        if (DOM.cardContrastNum) DOM.cardContrastNum.value = val;
        scheduleRender();
    });

    if (DOM.cardContrastNum) {
        DOM.cardContrastNum.addEventListener('input', (e) => {
            const val = Math.min(50, Math.max(-50, parseInt(e.target.value, 10) || 0));
            applyToActiveCards((c) => {
                c.contrast = val;
                c.dirty = true;
            });
            DOM.cardContrastRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetContrast) {
        DOM.btnResetContrast.addEventListener('click', () => {
            applyToActiveCards((c) => {
                c.contrast = 0;
                c.dirty = true;
            });
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }
}

function copyActiveCardSettingsToOther() {
    const srcId = (STATE.activeCardId === 'dorso') ? 'dorso' : 'frente';
    const otherId = srcId === 'frente' ? 'dorso' : 'frente';
    const current = STATE.cards[srcId];
    const other = STATE.cards[otherId];

    other.scale = current.scale;
    other.xMm = current.xMm;
    other.borderRadiusMm = current.borderRadiusMm;
    other.filter = current.filter;
    other.brightness = current.brightness;
    other.contrast = current.contrast;
    other.rotation = current.rotation;
    other.flipH = current.flipH;
    other.flipV = current.flipV;
    other.dirty = true;

    saveHistoryState(`Copiar ajustes a ${other.name}`);
    scheduleRender();
    showToast(`Ajustes copiados de ${current.name} a ${other.name}`, 'success');
}

function applyCr80Preset() {
    applyToActiveCards((card) => {
        card.widthMm = 85.6;
        card.heightMm = 53.98;
        card.scale = 100;
        card.borderRadiusMm = 3.18;
    });

    syncControlsFromActiveCard();
    saveHistoryState('Aplicar Estándar CR80');
    scheduleRender();
    showToast('Ajustado a tamaño estándar de tarjeta de crédito (CR80)', 'success');
}

function setOrientation(orientation) {
    if (STATE.paper.orientation === orientation) return;
    STATE.paper.orientation = orientation;

    if (orientation === 'portrait') {
        DOM.btnOrientPortrait.className = 'py-0.5 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-300';
        DOM.btnOrientLandscape.className = 'py-0.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-400';
    } else {
        DOM.btnOrientLandscape.className = 'py-0.5 text-xs font-semibold rounded bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-300';
        DOM.btnOrientPortrait.className = 'py-0.5 text-xs font-semibold rounded text-slate-600 dark:text-slate-400';
    }

    setupPaperDimensions();
    resizeCanvasViewport();
    saveHistoryState(`Orientación ${orientation}`);
    scheduleRender();
}

function resetAllDefaults() {
    // Si tiene favoritos guardados, preguntar o restaurar fábrica
    const hasCustom = !!localStorage.getItem('cardify-custom-defaults');
    if (hasCustom) {
        localStorage.removeItem('cardify-custom-defaults');
        showToast('Configuración personalizada borrada. Restaurado a valores de fábrica.', 'info');
    }

    Object.assign(STATE.paper, FACTORY_DEFAULTS.paper);
    Object.assign(STATE.layout, FACTORY_DEFAULTS.layout);
    STATE.syncCards = FACTORY_DEFAULTS.syncCards;

    ['frente', 'dorso'].forEach(k => {
        Object.assign(STATE.cards[k], {
            scale: FACTORY_DEFAULTS.cards[k].scale,
            xMm: FACTORY_DEFAULTS.cards[k].xMm,
            yMm: FACTORY_DEFAULTS.cards[k].yMm,
            rotation: 0,
            borderRadiusMm: 3.5,
            filter: 'normal',
            brightness: 0,
            contrast: 0,
            dirty: true
        });
    });

    updateUIFromState();
    saveHistoryState('Restablecer todo');
    scheduleRender();
}

function updateUIFromState() {
    DOM.layoutModeSelect.value = STATE.layout.mode;
    DOM.layoutArrangeSelect.value = STATE.layout.arrange;
    DOM.paperSizeSelect.value = STATE.paper.size;
    DOM.checkCutLines.checked = STATE.layout.showCutLines;
    DOM.checkCardBorder.checked = STATE.layout.showBorder;
    DOM.checkSyncCards.checked = STATE.syncCards;
    setActiveTab(STATE.activeCardId);
}

// =============================================================================
// 11. PROCESAMIENTO DE IMAGEN (Offscreen Cache)
// =============================================================================

function processCardImage(card) {
    const sourceImg = card.croppedCanvas || card.rawImage;
    if (!sourceImg) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const isSideways = card.rotation === 90 || card.rotation === 270;
    const srcW = sourceImg.width;
    const srcH = sourceImg.height;

    canvas.width = isSideways ? srcH : srcW;
    canvas.height = isSideways ? srcW : srcH;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((card.rotation * Math.PI) / 180);
    ctx.scale(card.flipH ? -1 : 1, card.flipV ? -1 : 1);
    ctx.drawImage(sourceImg, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();

    if (card.filter !== 'normal' || card.brightness !== 0 || card.contrast !== 0) {
        applyPixelFilters(ctx, canvas.width, canvas.height, card.filter, card.brightness, card.contrast);
    }

    card.cachedCanvas = canvas;
    card.dirty = false;
    return canvas;
}

function applyPixelFilters(ctx, width, height, filterType, brightness, contrast) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        if (filterType === 'bw') {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const enhanced = gray > 140 ? Math.min(255, gray * 1.15) : Math.max(0, gray * 0.85);
            r = g = b = enhanced;
        } else if (filterType === 'scan') {
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (lum > 180) {
                r = Math.min(255, r * 1.08);
                g = Math.min(255, g * 1.08);
                b = Math.min(255, b * 1.08);
            } else if (lum < 95) {
                r = Math.max(0, r * 0.88);
                g = Math.max(0, g * 0.88);
                b = Math.max(0, b * 0.88);
            }
        }

        if (brightness !== 0) {
            r += brightness * 2;
            g += brightness * 2;
            b += brightness * 2;
        }

        if (contrast !== 0) {
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;
        }

        d[i] = Math.min(255, Math.max(0, r));
        d[i + 1] = Math.min(255, Math.max(0, g));
        d[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, 0, 0);
}

// =============================================================================
// 12. MOTOR DE RENDERIZADO CANVAS A 60 FPS
// =============================================================================

function scheduleRender() {
    if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(renderLoop);
    }
    debouncedTelemetrySync();
}

function resizeCanvasViewport() {
    const container = DOM.viewportContainer;
    if (!container) return;

    const isMobile = window.innerWidth < 1024;
    
    // Dimensiones reales disponibles del contenedor
    const cWidth = container.clientWidth || (isMobile ? window.innerWidth - 12 : 800);
    const cHeight = container.clientHeight || (isMobile ? window.innerHeight - 200 : 700);

    const paddingX = isMobile ? 8 : 36;
    const paddingY = isMobile ? 8 : 36;
    const availWidth = Math.max(80, cWidth - paddingX);
    const availHeight = Math.max(100, cHeight - paddingY);

    const sheetAspect = STATE.paper.heightMm / STATE.paper.widthMm;

    let displayWidth, displayHeight;

    if (isMobile) {
        displayWidth = availWidth;
        displayHeight = displayWidth * sheetAspect;

        if (displayHeight > availHeight && availHeight > 150) {
            displayHeight = availHeight;
            displayWidth = displayHeight / sheetAspect;
        }

        const maxAllowed = Math.min(container.clientWidth - 2, window.innerWidth - 6);
        if (displayWidth > maxAllowed) {
            displayWidth = maxAllowed;
            displayHeight = displayWidth * sheetAspect;
        }
    } else {
        // EN ESCRITORIO: Maximizar tamaño dentro del contenedor disponible sin tope artificial
        // Primero ajustamos para aprovechar toda la altura disponible
        displayHeight = availHeight;
        displayWidth = displayHeight / sheetAspect;

        // Si el ancho calculado supera el ancho disponible del contenedor, ajustar por ancho
        if (displayWidth > availWidth) {
            displayWidth = availWidth;
            displayHeight = displayWidth * sheetAspect;
        }
    }

    const dpr = window.devicePixelRatio || 1;
    DOM.previewCanvas.width = Math.round(displayWidth * STATE.zoom * dpr);
    DOM.previewCanvas.height = Math.round(displayHeight * STATE.zoom * dpr);

    DOM.previewCanvas.style.width = `${Math.round(displayWidth * STATE.zoom)}px`;
    DOM.previewCanvas.style.height = `${Math.round(displayHeight * STATE.zoom)}px`;
}

function renderLoop() {
    renderScheduled = false;
    const canvas = DOM.previewCanvas;
    const ctx = previewCtx;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Fondo de la hoja (Blanco o Modo Papel Oscuro según preferencia)
    ctx.fillStyle = STATE.darkPaper ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const mmToPx = canvasWidth / STATE.paper.widthMm;
    const cardInstances = getCardInstances(mmToPx, canvasWidth, canvasHeight);

    for (const inst of cardInstances) {
        drawCardInstance(ctx, inst, mmToPx);
    }

    if (INTERACTION.isDragging && INTERACTION.activeSnapLines.length > 0) {
        drawSnapLines(ctx, canvasWidth, canvasHeight, mmToPx);
    }

    if (STATE.selectedCardId === 'both' || STATE.activeCardId === 'both') {
        for (const inst of cardInstances) {
            drawSelectionBox(ctx, inst);
        }
    } else if (STATE.selectedCardId) {
        const selectedInst = cardInstances.find(i => i.card.id === STATE.selectedCardId);
        if (selectedInst) {
            drawSelectionBox(ctx, selectedInst);
        }
    }

    ctx.restore();
}

function getCardInstances(mmToPx, canvasWidth, canvasHeight) {
    const instances = [];
    const mode = STATE.layout.mode;
    const arrange = STATE.layout.arrange;
    const paperW = STATE.paper.widthMm;
    const paperH = STATE.paper.heightMm;

    const f = STATE.cards.frente;
    const d = STATE.cards.dorso;

    if (mode === 'both') {
        if (arrange === 'vertical') {
            if (f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = (paperW - wMm) / 2 + f.xMm;
                const yMm = 30 + f.yMm;
                instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
            if (d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = (paperW - wMm) / 2 + d.xMm;
                const yMm = (paperH / 2) + 15 + d.yMm;
                instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        } else {
            const halfW = paperW / 2;
            if (f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = (halfW - wMm) / 2 + f.xMm + 4;
                const yMm = (paperH - hMm) / 2 + f.yMm;
                instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
            if (d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = halfW + (halfW - wMm) / 2 + d.xMm - 4;
                const yMm = (paperH - hMm) / 2 + d.yMm;
                instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        }
    } else if (mode === 'front-only') {
        if (f.rawImage) {
            const wMm = f.widthMm * (f.scale / 100);
            const hMm = f.heightMm * (f.scale / 100);
            const xMm = (paperW - wMm) / 2 + f.xMm;
            const yMm = (paperH - hMm) / 2 + f.yMm;
            instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
        }
    } else if (mode === 'back-only') {
        if (d.rawImage) {
            const wMm = d.widthMm * (d.scale / 100);
            const hMm = d.heightMm * (d.scale / 100);
            const xMm = (paperW - wMm) / 2 + d.xMm;
            const yMm = (paperH - hMm) / 2 + d.yMm;
            instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
        }
    } else if (mode === 'multi-2') {
        const halfH = paperH / 2;
        [0, halfH].forEach((offsetY) => {
            if (f.rawImage) {
                const wMm = f.widthMm * (f.scale / 100);
                const hMm = f.heightMm * (f.scale / 100);
                const xMm = 15 + f.xMm;
                const yMm = offsetY + 15 + f.yMm;
                instances.push({ card: f, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
            if (d.rawImage) {
                const wMm = d.widthMm * (d.scale / 100);
                const hMm = d.heightMm * (d.scale / 100);
                const xMm = paperW - wMm - 15 + d.xMm;
                const yMm = offsetY + 15 + d.yMm;
                instances.push({ card: d, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        });
    } else if (mode === 'multi-4') {
        const colW = paperW / 2;
        const rowH = paperH / 2;
        [
            { cx: 0, cy: 0 },
            { cx: colW, cy: 0 },
            { cx: 0, cy: rowH },
            { cx: colW, cy: rowH }
        ].forEach((pos) => {
            const targetCard = f.rawImage ? f : d;
            if (targetCard.rawImage) {
                const wMm = targetCard.widthMm * (targetCard.scale / 100);
                const hMm = targetCard.heightMm * (targetCard.scale / 100);
                const xMm = pos.cx + (colW - wMm) / 2 + targetCard.xMm;
                const yMm = pos.cy + (rowH - hMm) / 2 + targetCard.yMm;
                instances.push({ card: targetCard, xMm, yMm, wMm, hMm, pxX: xMm * mmToPx, pxY: yMm * mmToPx, pxW: wMm * mmToPx, pxH: hMm * mmToPx });
            }
        });
    }

    return instances;
}

function drawCardInstance(ctx, inst, mmToPx) {
    const card = inst.card;
    if (card.dirty || !card.cachedCanvas) {
        processCardImage(card);
    }

    const img = card.cachedCanvas;
    if (!img) return;

    const x = inst.pxX;
    const y = inst.pxY;
    const w = inst.pxW;
    const h = inst.pxH;
    const r = card.borderRadiusMm * mmToPx;

    // Solo dibujar líneas de corte si está EXPLÍCITAMENTE activado por el usuario
    if (STATE.layout.showCutLines) {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.restore();
    }

    // Dibujar tarjeta con esquinas redondeadas limpias
    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Solo dibujar borde sutil si está EXPLÍCITAMENTE activado
    if (STATE.layout.showBorder) {
        ctx.save();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundedRectPath(ctx, x, y, w, h, r);
        ctx.stroke();
        ctx.restore();
    }
}

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawSelectionBox(ctx, inst) {
    const x = inst.pxX;
    const y = inst.pxY;
    const w = inst.pxW;
    const h = inst.pxH;

    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.setLineDash([]);

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 1024;
    const handleRadius = isTouch ? 9 : 6;

    const handles = [
        { x: x - 2, y: y - 2 },
        { x: x + w + 2, y: y - 2 },
        { x: x - 2, y: y + h + 2 },
        { x: x + w + 2, y: y + h + 2 }
    ];

    for (const hPos of handles) {
        ctx.beginPath();
        ctx.arc(hPos.x, hPos.y, handleRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();
}

function drawSnapLines(ctx, canvasWidth, canvasHeight, mmToPx) {
    ctx.save();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    for (const snap of INTERACTION.activeSnapLines) {
        ctx.beginPath();
        if (snap.orientation === 'v') {
            const pxX = snap.posMm * mmToPx;
            ctx.moveTo(pxX, 0);
            ctx.lineTo(pxX, canvasHeight);
        } else {
            const pxY = snap.posMm * mmToPx;
            ctx.moveTo(0, pxY);
            ctx.lineTo(canvasWidth, pxY);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function updateEmptyStateVisibility() {
    const hasAnyImage = !!(STATE.cards.frente.rawImage || STATE.cards.dorso.rawImage);
    if (hasAnyImage) {
        DOM.emptyState.classList.add('hidden');
        DOM.btnGenerateDownload.disabled = false;
    } else {
        DOM.emptyState.classList.remove('hidden');
        DOM.btnGenerateDownload.disabled = true;
    }
}

// =============================================================================
// 13. MANIPULACIÓN DIRECTA EN EL CANVAS
// =============================================================================

function setupCanvasPointerEvents() {
    const canvas = DOM.previewCanvas;

    canvas.addEventListener('pointerdown', (e) => {
        const coords = getCanvasPointerCoords(e);
        const mmToPx = (canvas.width / (window.devicePixelRatio || 1)) / STATE.paper.widthMm;
        const instances = getCardInstances(mmToPx, canvas.width, canvas.height);

        if (STATE.selectedCardId) {
            if (STATE.selectedCardId === 'both') {
                for (const inst of instances) {
                    const handle = hitTestHandles(coords.x, coords.y, inst);
                    if (handle) {
                        INTERACTION.isResizing = true;
                        INTERACTION.resizeHandle = handle;
                        INTERACTION.dragStart = { x: coords.x, y: coords.y };
                        INTERACTION.cardInitialScale = {
                            frente: STATE.cards.frente.scale,
                            dorso: STATE.cards.dorso.scale
                        };
                        canvas.setPointerCapture(e.pointerId);
                        return;
                    }
                }
            } else {
                const selectedInst = instances.find(i => i.card.id === STATE.selectedCardId);
                if (selectedInst) {
                    const handle = hitTestHandles(coords.x, coords.y, selectedInst);
                    if (handle) {
                        INTERACTION.isResizing = true;
                        INTERACTION.resizeHandle = handle;
                        INTERACTION.dragStart = { x: coords.x, y: coords.y };
                        INTERACTION.cardInitialScale = selectedInst.card.scale;
                        canvas.setPointerCapture(e.pointerId);
                        return;
                    }
                }
            }
        }

        let clickedInst = null;
        for (let i = instances.length - 1; i >= 0; i--) {
            const inst = instances[i];
            if (coords.x >= inst.pxX && coords.x <= inst.pxX + inst.pxW &&
                coords.y >= inst.pxY && coords.y <= inst.pxY + inst.pxH) {
                clickedInst = inst;
                break;
            }
        }

        if (clickedInst) {
            if (STATE.selectedCardId === 'both') {
                INTERACTION.isDragging = true;
                INTERACTION.dragStart = { x: coords.x, y: coords.y };
                INTERACTION.cardInitialPos = {
                    frente: { x: STATE.cards.frente.xMm, y: STATE.cards.frente.yMm },
                    dorso: { x: STATE.cards.dorso.xMm, y: STATE.cards.dorso.yMm }
                };
                canvas.setPointerCapture(e.pointerId);
                scheduleRender();
                return;
            }

            STATE.selectedCardId = clickedInst.card.id;
            setActiveTab(clickedInst.card.id);
            INTERACTION.isDragging = true;
            INTERACTION.dragStart = { x: coords.x, y: coords.y };
            INTERACTION.cardInitialPos = { x: clickedInst.card.xMm, y: clickedInst.card.yMm };
            canvas.setPointerCapture(e.pointerId);
            syncControlsFromActiveCard();
            scheduleRender();
        } else {
            STATE.selectedCardId = null;
            DOM.selectedCardIndicator.textContent = 'Arrastra para mover';
            syncControlsFromActiveCard();
            scheduleRender();
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        const coords = getCanvasPointerCoords(e);
        const mmToPx = (canvas.width / (window.devicePixelRatio || 1)) / STATE.paper.widthMm;
        const instances = getCardInstances(mmToPx, canvas.width, canvas.height);

        if (INTERACTION.isResizing) {
            const deltaX = (coords.x - INTERACTION.dragStart.x) / mmToPx;
            const deltaY = (coords.y - INTERACTION.dragStart.y) / mmToPx;

            let effectiveDelta = 0;
            switch (INTERACTION.resizeHandle) {
                case 'br':
                    effectiveDelta = (deltaX + deltaY) / 2;
                    break;
                case 'tl':
                    effectiveDelta = (-deltaX - deltaY) / 2;
                    break;
                case 'tr':
                    effectiveDelta = (deltaX - deltaY) / 2;
                    break;
                case 'bl':
                    effectiveDelta = (-deltaX + deltaY) / 2;
                    break;
                default:
                    effectiveDelta = deltaX;
            }

            if (STATE.selectedCardId === 'both') {
                const initF = (typeof INTERACTION.cardInitialScale === 'object') ? INTERACTION.cardInitialScale.frente : INTERACTION.cardInitialScale;
                const initD = (typeof INTERACTION.cardInitialScale === 'object') ? INTERACTION.cardInitialScale.dorso : INTERACTION.cardInitialScale;
                const scaleDeltaF = (effectiveDelta / (STATE.cards.frente.widthMm / 100));
                const scaleDeltaD = (effectiveDelta / (STATE.cards.dorso.widthMm / 100));
                STATE.cards.frente.scale = Math.min(180, Math.max(30, Math.round(initF + scaleDeltaF)));
                STATE.cards.dorso.scale = Math.min(180, Math.max(30, Math.round(initD + scaleDeltaD)));
            } else {
                const card = STATE.cards[STATE.selectedCardId];
                const initScale = (typeof INTERACTION.cardInitialScale === 'number') ? INTERACTION.cardInitialScale : (INTERACTION.cardInitialScale[STATE.selectedCardId] || card.scale);
                const scaleChange = (effectiveDelta / (card.widthMm / 100));
                card.scale = Math.min(180, Math.max(30, Math.round(initScale + scaleChange)));
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = card.scale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        if (INTERACTION.isDragging) {
            const deltaX = (coords.x - INTERACTION.dragStart.x) / mmToPx;
            const deltaY = (coords.y - INTERACTION.dragStart.y) / mmToPx;

            if (STATE.selectedCardId === 'both') {
                const initF = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.frente) || { x: STATE.cards.frente.xMm, y: STATE.cards.frente.yMm };
                const initD = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.dorso) || { x: STATE.cards.dorso.xMm, y: STATE.cards.dorso.yMm };

                STATE.cards.frente.xMm = Math.min(100, Math.max(-100, Math.round(initF.x + deltaX)));
                STATE.cards.frente.yMm = Math.min(100, Math.max(-100, Math.round(initF.y + deltaY)));
                STATE.cards.dorso.xMm = Math.min(100, Math.max(-100, Math.round(initD.x + deltaX)));
                STATE.cards.dorso.yMm = Math.min(100, Math.max(-100, Math.round(initD.y + deltaY)));
            } else {
                const card = STATE.cards[STATE.selectedCardId];
                const initX = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.x !== undefined) ? INTERACTION.cardInitialPos.x : card.xMm;
                const initY = (INTERACTION.cardInitialPos && INTERACTION.cardInitialPos.y !== undefined) ? INTERACTION.cardInitialPos.y : card.yMm;

                let newX = Math.round(initX + deltaX);
                let newY = Math.round(initY + deltaY);

                INTERACTION.activeSnapLines = [];
                if (STATE.snapEnabled) {
                    if (Math.abs(newX) <= 2) {
                        newX = 0;
                        INTERACTION.activeSnapLines.push({ orientation: 'v', posMm: STATE.paper.widthMm / 2 });
                    }

                    const otherCard = STATE.selectedCardId === 'frente' ? STATE.cards.dorso : STATE.cards.frente;
                    if (otherCard && otherCard.rawImage) {
                        if (Math.abs(newX - otherCard.xMm) <= 2) {
                            newX = otherCard.xMm;
                            INTERACTION.activeSnapLines.push({ orientation: 'v', posMm: (STATE.paper.widthMm / 2) + newX });
                        }
                    }
                }

                card.xMm = Math.min(100, Math.max(-100, newX));
                card.yMm = Math.min(100, Math.max(-100, newY));

                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].xMm = card.xMm;
                }
            }

            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        if (STATE.selectedCardId === 'both') {
            for (const inst of instances) {
                const handle = hitTestHandles(coords.x, coords.y, inst);
                if (handle) {
                    canvas.style.cursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                    return;
                }
            }
        } else if (STATE.selectedCardId) {
            const selectedInst = instances.find(i => i.card.id === STATE.selectedCardId);
            if (selectedInst) {
                const handle = hitTestHandles(coords.x, coords.y, selectedInst);
                if (handle) {
                    canvas.style.cursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                    return;
                }
            }
        }

        const isOverCard = instances.some(i => coords.x >= i.pxX && coords.x <= i.pxX + i.pxW && coords.y >= i.pxY && coords.y <= i.pxY + i.pxH);
        canvas.style.cursor = isOverCard ? 'grab' : 'default';
    });

    // Soporte nativo de pellizco multitáctil (Pinch-to-Resize) para agrandar en celulares
    let pinchStartDist = 0;
    let pinchInitialScale = { frente: 70, dorso: 70 };

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2 && STATE.selectedCardId) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            pinchInitialScale = {
                frente: STATE.cards.frente.scale,
                dorso: STATE.cards.dorso.scale
            };
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && STATE.selectedCardId && pinchStartDist > 0) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const factor = currentDist / pinchStartDist;

            if (STATE.selectedCardId === 'both') {
                STATE.cards.frente.scale = Math.min(180, Math.max(30, Math.round(pinchInitialScale.frente * factor)));
                STATE.cards.dorso.scale = Math.min(180, Math.max(30, Math.round(pinchInitialScale.dorso * factor)));
            } else {
                const card = STATE.cards[STATE.selectedCardId];
                const initScale = pinchInitialScale[STATE.selectedCardId] || card.scale;
                const newScale = Math.min(180, Math.max(30, Math.round(initScale * factor)));
                card.scale = newScale;
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = newScale;
                }
            }
            syncControlsFromActiveCard();
            scheduleRender();
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            pinchStartDist = 0;
        }
    }, { passive: true });

    const endInteraction = (e) => {
        if (INTERACTION.isDragging || INTERACTION.isResizing) {
            INTERACTION.isDragging = false;
            INTERACTION.isResizing = false;
            INTERACTION.activeSnapLines = [];
            canvas.style.cursor = 'default';
            saveHistoryState('Mover / Redimensionar carnet');
            scheduleRender();
        }
    };

    canvas.addEventListener('pointerup', endInteraction);
    canvas.addEventListener('pointercancel', endInteraction);
}

function getCanvasPointerCoords(e) {
    const canvas = DOM.previewCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function hitTestHandles(x, y, inst) {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 1024;
    // Zona de toque cómoda de 32px para dedos humanos en smartphones
    const handleHitRadius = isTouch ? 32 : 14;
    const hList = [
        { name: 'tl', x: inst.pxX, y: inst.pxY },
        { name: 'tr', x: inst.pxX + inst.pxW, y: inst.pxY },
        { name: 'bl', x: inst.pxX, y: inst.pxY + inst.pxH },
        { name: 'br', x: inst.pxX + inst.pxW, y: inst.pxY + inst.pxH }
    ];

    for (const h of hList) {
        const dist = Math.hypot(x - h.x, y - h.y);
        if (dist <= handleHitRadius) {
            return h.name;
        }
    }
    return null;
}

function toggleSnap() {
    STATE.snapEnabled = !STATE.snapEnabled;
    DOM.btnToggleSnap.className = STATE.snapEnabled
        ? 'p-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80'
        : 'p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
    showToast(STATE.snapEnabled ? 'Guías magnéticas activadas' : 'Guías magnéticas desactivadas', 'info');
}

function changeZoom(delta) {
    STATE.zoom = Math.min(2.5, Math.max(0.4, +(STATE.zoom + delta).toFixed(2)));
    DOM.zoomLevelLabel.textContent = `${Math.round(STATE.zoom * 100)}%`;
    resizeCanvasViewport();
    scheduleRender();
}

function fitZoomToContainer() {
    STATE.zoom = 1.0;
    DOM.zoomLevelLabel.textContent = '100%';
    resizeCanvasViewport();
    scheduleRender();
}

// =============================================================================
// 14. HISTORIAL: UNDO / REDO
// =============================================================================

function saveHistoryState(actionName) {
    if (HISTORY.isApplyingHistory) return;

    const snapshot = JSON.stringify({
        paper: STATE.paper,
        layout: STATE.layout,
        syncCards: STATE.syncCards,
        cards: {
            frente: { ...STATE.cards.frente, rawImage: null, croppedCanvas: null, cachedCanvas: null },
            dorso: { ...STATE.cards.dorso, rawImage: null, croppedCanvas: null, cachedCanvas: null }
        },
        actionName
    });

    HISTORY.undoStack.push(snapshot);
    if (HISTORY.undoStack.length > HISTORY.maxItems) {
        HISTORY.undoStack.shift();
    }
    HISTORY.redoStack = [];

    updateHistoryButtons();
}

function undo() {
    if (HISTORY.undoStack.length <= 1) return;

    HISTORY.isApplyingHistory = true;
    const currentState = HISTORY.undoStack.pop();
    HISTORY.redoStack.push(currentState);

    const prevState = JSON.parse(HISTORY.undoStack[HISTORY.undoStack.length - 1]);
    applySnapshot(prevState);
    HISTORY.isApplyingHistory = false;

    updateHistoryButtons();
    scheduleRender();
    showToast(`Deshecho: ${prevState.actionName || ''}`, 'info');
}

function redo() {
    if (HISTORY.redoStack.length === 0) return;

    HISTORY.isApplyingHistory = true;
    const nextStateStr = HISTORY.redoStack.pop();
    HISTORY.undoStack.push(nextStateStr);

    const nextState = JSON.parse(nextStateStr);
    applySnapshot(nextState);
    HISTORY.isApplyingHistory = false;

    updateHistoryButtons();
    scheduleRender();
    showToast(`Rehecho: ${nextState.actionName || ''}`, 'info');
}

function applySnapshot(snap) {
    Object.assign(STATE.paper, snap.paper);
    Object.assign(STATE.layout, snap.layout);
    if (snap.syncCards !== undefined) STATE.syncCards = snap.syncCards;

    ['frente', 'dorso'].forEach(key => {
        const currentCard = STATE.cards[key];
        const snapCard = snap.cards[key];
        Object.assign(currentCard, {
            scale: snapCard.scale,
            xMm: snapCard.xMm,
            yMm: snapCard.yMm,
            rotation: snapCard.rotation,
            borderRadiusMm: snapCard.borderRadiusMm,
            filter: snapCard.filter,
            brightness: snapCard.brightness,
            contrast: snapCard.contrast,
            dirty: true
        });
    });

    updateUIFromState();
}

function updateHistoryButtons() {
    DOM.btnUndo.disabled = HISTORY.undoStack.length <= 1;
    DOM.btnRedo.disabled = HISTORY.redoStack.length === 0;
}

// =============================================================================
// 15. MODAL DE RECORTE INTERACTIVO (CROP TOOL MULTI-TÁCTIL)
// =============================================================================

let cropState = {
    cardId: 'frente',
    sourceImg: null,
    aspect: 'cr80', // 'cr80' | 'free'
    cropBox: { x: 20, y: 20, w: 200, h: 140 },
    dragHandle: null, // null | 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
    startPointer: { x: 0, y: 0 },
    startBox: { x: 0, y: 0, w: 0, h: 0 }
};

function openCropModal(cardId) {
    const card = STATE.cards[cardId];
    if (!card || (!card.rawImage && !card.croppedCanvas)) {
        showToast('Carga o escanea una imagen primero para recortarla.', 'warning');
        return;
    }

    cropState.cardId = cardId;
    // Preferir siempre la imagen original sin recortar para permitir ampliar o reencuadrar
    cropState.sourceImg = card.rawImage || card.croppedCanvas;

    DOM.cropModal.classList.remove('hidden');

    const canvas = DOM.cropCanvas;
    canvas.width = cropState.sourceImg.width;
    canvas.height = cropState.sourceImg.height;

    // Si ya existía un recorte previo para esta tarjeta, restablecerlo como base
    if (card.cropRect && card.cropRect.w > 20 && card.cropRect.h > 20 &&
        card.cropRect.x + card.cropRect.w <= canvas.width &&
        card.cropRect.y + card.cropRect.h <= canvas.height) {
        cropState.cropBox = { ...card.cropRect };
    } else {
        // En caso contrario, encuadre estándar CR80 centrado
        const ratio = 85.6 / 53.98;
        let w = canvas.width * 0.84;
        let h = w / ratio;
        if (h > canvas.height * 0.88) {
            h = canvas.height * 0.84;
            w = h * ratio;
        }
        cropState.cropBox = {
            x: (canvas.width - w) / 2,
            y: (canvas.height - h) / 2,
            w: w,
            h: h
        };
    }

    drawCropCanvas();
}

function drawCropCanvas() {
    const canvas = DOM.cropCanvas;
    const ctx = canvas.getContext('2d');
    const box = cropState.cropBox;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cropState.sourceImg) {
        ctx.drawImage(cropState.sourceImg, 0, 0);
    }

    // 1. Fondo oscurecido exterior (viñeta de enfoque)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.fillRect(0, 0, canvas.width, Math.max(0, box.y));
    ctx.fillRect(0, box.y + box.h, canvas.width, Math.max(0, canvas.height - (box.y + box.h)));
    ctx.fillRect(0, box.y, Math.max(0, box.x), box.h);
    ctx.fillRect(box.x + box.w, box.y, Math.max(0, canvas.width - (box.x + box.w)), box.h);

    // 2. Borde exterior brillante
    const strokeW = Math.max(2, Math.round(canvas.width * 0.0028));
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = strokeW;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    // 3. Regla de tercios (guías internas sutiles)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x + box.w / 3, box.y);
    ctx.lineTo(box.x + box.w / 3, box.y + box.h);
    ctx.moveTo(box.x + (box.w * 2) / 3, box.y);
    ctx.lineTo(box.x + (box.w * 2) / 3, box.y + box.h);
    ctx.moveTo(box.x, box.y + box.h / 3);
    ctx.lineTo(box.x + box.w, box.y + box.h / 3);
    ctx.moveTo(box.x, box.y + (box.h * 2) / 3);
    ctx.lineTo(box.x + box.w, box.y + (box.h * 2) / 3);
    ctx.stroke();

    // 4. Tiradores circulares de esquina táctiles
    const handleR = Math.max(8, Math.round(canvas.width * 0.013));
    const corners = [
        { x: box.x, y: box.y },
        { x: box.x + box.w, y: box.y },
        { x: box.x + box.w, y: box.y + box.h },
        { x: box.x, y: box.y + box.h }
    ];

    corners.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, handleR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(2.5, handleR * 0.3);
        ctx.stroke();
    });

    // 5. Tiradores laterales en modo libre
    if (cropState.aspect === 'free') {
        const sides = [
            { x: box.x + box.w / 2, y: box.y },
            { x: box.x + box.w / 2, y: box.y + box.h },
            { x: box.x, y: box.y + box.h / 2 },
            { x: box.x + box.w, y: box.y + box.h / 2 }
        ];
        const sideR = Math.max(6, handleR * 0.7);
        sides.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, sideR, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = Math.max(2, sideR * 0.3);
            ctx.stroke();
        });
    }

    // 6. Etiqueta informativa de tamaño
    const label = `${Math.round(box.w)} × ${Math.round(box.h)} px ${cropState.aspect === 'cr80' ? '(CR80)' : ''}`;
    const fontSize = Math.max(11, Math.round(canvas.width * 0.017));
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    const textW = ctx.measureText(label).width;
    const tagX = box.x + 8;
    const tagY = box.y + box.h - 8;
    if (tagY > box.y + 24) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(tagX - 4, tagY - fontSize - 2, textW + 8, fontSize + 6);
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(label, tagX, tagY);
    }
}

function getCropPointerCanvasCoords(e) {
    const canvas = DOM.cropCanvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function getCropHandleAt(px, py) {
    const canvas = DOM.cropCanvas;
    const rect = canvas.getBoundingClientRect();
    const box = cropState.cropBox;
    const screenScale = canvas.width / Math.max(1, rect.width);
    const hitR = Math.max(28, 32 * screenScale);

    if (Math.hypot(px - box.x, py - box.y) <= hitR) return 'nw';
    if (Math.hypot(px - (box.x + box.w), py - box.y) <= hitR) return 'ne';
    if (Math.hypot(px - (box.x + box.w), py - (box.y + box.h)) <= hitR) return 'se';
    if (Math.hypot(px - box.x, py - (box.y + box.h)) <= hitR) return 'sw';

    if (cropState.aspect === 'free') {
        if (Math.abs(py - box.y) <= hitR && px >= box.x && px <= box.x + box.w) return 'n';
        if (Math.abs(py - (box.y + box.h)) <= hitR && px >= box.x && px <= box.x + box.w) return 's';
        if (Math.abs(px - box.x) <= hitR && py >= box.y && py <= box.y + box.h) return 'w';
        if (Math.abs(px - (box.x + box.w)) <= hitR && py >= box.y && py <= box.y + box.h) return 'e';
    }

    if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
        return 'move';
    }

    return null;
}

function updateCropCursor(handle) {
    const canvas = DOM.cropCanvas;
    if (!canvas) return;
    switch (handle) {
        case 'move': canvas.style.cursor = 'move'; break;
        case 'nw':
        case 'se': canvas.style.cursor = 'nwse-resize'; break;
        case 'ne':
        case 'sw': canvas.style.cursor = 'nesw-resize'; break;
        case 'n':
        case 's': canvas.style.cursor = 'ns-resize'; break;
        case 'e':
        case 'w': canvas.style.cursor = 'ew-resize'; break;
        default: canvas.style.cursor = 'crosshair'; break;
    }
}

function onCropPointerDown(e) {
    e.preventDefault();
    const pt = getCropPointerCanvasCoords(e);
    const handle = getCropHandleAt(pt.x, pt.y);
    if (!handle) return;

    cropState.dragHandle = handle;
    cropState.startPointer = { x: pt.x, y: pt.y };
    cropState.startBox = { ...cropState.cropBox };
    try { DOM.cropCanvas.setPointerCapture(e.pointerId); } catch (_) {}
}

function onCropPointerMove(e) {
    const pt = getCropPointerCanvasCoords(e);
    if (!cropState.dragHandle) {
        const handle = getCropHandleAt(pt.x, pt.y);
        updateCropCursor(handle);
        return;
    }

    e.preventDefault();
    const dx = pt.x - cropState.startPointer.x;
    const dy = pt.y - cropState.startPointer.y;
    const sb = cropState.startBox;
    const cw = DOM.cropCanvas.width;
    const ch = DOM.cropCanvas.height;
    const isCr80 = cropState.aspect === 'cr80';
    const ratio = 85.6 / 53.98;
    const minW = Math.max(30, cw * 0.05);
    const minH = Math.max(20, ch * 0.05);

    let { x, y, w, h } = sb;

    switch (cropState.dragHandle) {
        case 'move': {
            x = Math.max(0, Math.min(cw - w, sb.x + dx));
            y = Math.max(0, Math.min(ch - h, sb.y + dy));
            break;
        }
        case 'se': {
            w = Math.max(minW, Math.min(cw - sb.x, sb.w + dx));
            if (isCr80) {
                h = w / ratio;
                if (sb.y + h > ch) {
                    h = ch - sb.y;
                    w = h * ratio;
                }
            } else {
                h = Math.max(minH, Math.min(ch - sb.y, sb.h + dy));
            }
            break;
        }
        case 'sw': {
            let targetW = Math.max(minW, sb.w - dx);
            let targetX = sb.x + (sb.w - targetW);
            if (targetX < 0) {
                targetW = sb.x + sb.w;
                targetX = 0;
            }
            w = targetW;
            x = targetX;
            if (isCr80) {
                h = w / ratio;
                if (sb.y + h > ch) {
                    h = ch - sb.y;
                    w = h * ratio;
                    x = sb.x + (sb.w - w);
                }
            } else {
                h = Math.max(minH, Math.min(ch - sb.y, sb.h + dy));
            }
            break;
        }
        case 'ne': {
            w = Math.max(minW, Math.min(cw - sb.x, sb.w + dx));
            if (isCr80) {
                h = w / ratio;
                y = sb.y + (sb.h - h);
                if (y < 0) {
                    h = sb.y + sb.h;
                    y = 0;
                    w = h * ratio;
                }
            } else {
                let targetH = Math.max(minH, sb.h - dy);
                let targetY = sb.y + (sb.h - targetH);
                if (targetY < 0) {
                    targetH = sb.y + sb.h;
                    targetY = 0;
                }
                h = targetH;
                y = targetY;
            }
            break;
        }
        case 'nw': {
            let targetW = Math.max(minW, sb.w - dx);
            let targetX = sb.x + (sb.w - targetW);
            if (targetX < 0) {
                targetW = sb.x + sb.w;
                targetX = 0;
            }
            w = targetW;
            x = targetX;
            if (isCr80) {
                h = w / ratio;
                y = sb.y + (sb.h - h);
                if (y < 0) {
                    h = sb.y + sb.h;
                    y = 0;
                    w = h * ratio;
                    x = sb.x + (sb.w - w);
                }
            } else {
                let targetH = Math.max(minH, sb.h - dy);
                let targetY = sb.y + (sb.h - targetH);
                if (targetY < 0) {
                    targetH = sb.y + sb.h;
                    targetY = 0;
                }
                h = targetH;
                y = targetY;
            }
            break;
        }
        case 'n': {
            if (!isCr80) {
                let targetH = Math.max(minH, sb.h - dy);
                let targetY = sb.y + (sb.h - targetH);
                if (targetY < 0) { targetH = sb.y + sb.h; targetY = 0; }
                h = targetH; y = targetY;
            }
            break;
        }
        case 's': {
            if (!isCr80) {
                h = Math.max(minH, Math.min(ch - sb.y, sb.h + dy));
            }
            break;
        }
        case 'e': {
            if (!isCr80) {
                w = Math.max(minW, Math.min(cw - sb.x, sb.w + dx));
            }
            break;
        }
        case 'w': {
            if (!isCr80) {
                let targetW = Math.max(minW, sb.w - dx);
                let targetX = sb.x + (sb.w - targetW);
                if (targetX < 0) { targetW = sb.x + sb.w; targetX = 0; }
                w = targetW; x = targetX;
            }
            break;
        }
    }

    cropState.cropBox = { x, y, w, h };
    drawCropCanvas();
}

function onCropPointerUp(e) {
    if (cropState.dragHandle) {
        cropState.dragHandle = null;
        try { DOM.cropCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
        updateCropCursor(null);
        drawCropCanvas();
    }
}

function rotateCropImage() {
    if (!cropState.sourceImg) return;
    const src = cropState.sourceImg;
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = src.height;
    rotCanvas.height = src.width;
    const rCtx = rotCanvas.getContext('2d');
    rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rCtx.rotate(90 * Math.PI / 180);
    rCtx.drawImage(src, -src.width / 2, -src.height / 2);

    const rotatedImg = new Image();
    rotatedImg.onload = () => {
        cropState.sourceImg = rotatedImg;
        const canvas = DOM.cropCanvas;
        canvas.width = rotatedImg.width;
        canvas.height = rotatedImg.height;

        const ratio = 85.6 / 53.98;
        let w = canvas.width * 0.84;
        let h = cropState.aspect === 'cr80' ? (w / ratio) : (canvas.height * 0.84);
        if (h > canvas.height * 0.88) {
            h = canvas.height * 0.84;
            w = h * ratio;
        }
        cropState.cropBox = {
            x: (canvas.width - w) / 2,
            y: (canvas.height - h) / 2,
            w: w,
            h: h
        };
        drawCropCanvas();
        showToast('Foto rotada 90°', 'info');
    };
    rotatedImg.src = rotCanvas.toDataURL('image/jpeg', 0.95);
}

function detectDocumentBounds() {
    if (!cropState.sourceImg) return;
    const canvas = DOM.cropCanvas;
    const cw = canvas.width;
    const ch = canvas.height;

    // Canvas de muestreo ligero para detección de contornos instantánea
    const sw = 240;
    const sh = Math.round(sw * (ch / cw));
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sw;
    sampleCanvas.height = sh;
    const sCtx = sampleCanvas.getContext('2d');
    sCtx.drawImage(cropState.sourceImg, 0, 0, sw, sh);

    const imgData = sCtx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    const lum = new Uint8Array(sw * sh);
    for (let i = 0; i < data.length; i += 4) {
        lum[i / 4] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    }

    // Calcular luminancia de borde (fondo / mesa de apoyo)
    let borderSum = 0, borderCount = 0;
    for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
            if (x < 6 || x >= sw - 6 || y < 6 || y >= sh - 6) {
                borderSum += lum[y * sw + x];
                borderCount++;
            }
        }
    }
    const borderAvg = borderSum / Math.max(1, borderCount);

    let minX = sw, maxX = 0, minY = sh, maxY = 0;
    const threshold = 20;

    for (let y = 6; y < sh - 6; y++) {
        for (let x = 6; x < sw - 6; x++) {
            if (Math.abs(lum[y * sw + x] - borderAvg) > threshold) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    const scaleX = cw / sw;
    const scaleY = ch / sh;
    let detectedW = (maxX - minX) * scaleX;
    let detectedH = (maxY - minY) * scaleY;

    if (detectedW > cw * 0.25 && detectedH > ch * 0.25 && minX < maxX && minY < maxY) {
        let boxX = minX * scaleX;
        let boxY = minY * scaleY;

        if (cropState.aspect === 'cr80') {
            const ratio = 85.6 / 53.98;
            detectedH = detectedW / ratio;
            if (boxY + detectedH > ch) {
                detectedH = ch - boxY;
                detectedW = detectedH * ratio;
            }
        }

        cropState.cropBox = {
            x: Math.max(0, Math.min(cw - detectedW, boxX)),
            y: Math.max(0, Math.min(ch - detectedH, boxY)),
            w: detectedW,
            h: detectedH
        };
        showToast('🎯 Contorno de carnet detectado', 'success');
    } else {
        const ratio = 85.6 / 53.98;
        const defaultW = cw * 0.84;
        const defaultH = defaultW / ratio;
        cropState.cropBox = {
            x: (cw - defaultW) / 2,
            y: (ch - defaultH) / 2,
            w: defaultW,
            h: defaultH
        };
        showToast('Encuadre estándar CR80 centrado', 'info');
    }

    drawCropCanvas();
}

function applyCroppedResult() {
    const box = cropState.cropBox;
    if (!cropState.sourceImg || box.w <= 5 || box.h <= 5) return;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = Math.round(box.w);
    croppedCanvas.height = Math.round(box.h);

    const ctx = croppedCanvas.getContext('2d');
    ctx.drawImage(
        cropState.sourceImg,
        box.x, box.y, box.w, box.h,
        0, 0, croppedCanvas.width, croppedCanvas.height
    );

    const card = STATE.cards[cropState.cardId];
    card.croppedCanvas = croppedCanvas;
    card.rawImage = cropState.sourceImg;
    card.cropRect = { ...box };
    card.cachedCanvas = null;
    card.dirty = true;

    // Actualizar proporción de la tarjeta según el recorte
    card.widthMm = 85.6;
    card.heightMm = 85.6 * (box.h / box.w);

    DOM.cropModal.classList.add('hidden');
    updateDropzoneUI(cropState.cardId, croppedCanvas.toDataURL('image/jpeg', 0.92));
    saveHistoryState(`Recortar ${card.name}`);
    scheduleRender();
    showToast(`Recorte aplicado a ${card.name}`, 'success');
}

// Eventos del modal de recorte
DOM.btnCloseCrop.addEventListener('click', () => DOM.cropModal.classList.add('hidden'));
DOM.btnCancelCrop.addEventListener('click', () => DOM.cropModal.classList.add('hidden'));

if (DOM.btnCropRotate) DOM.btnCropRotate.addEventListener('click', rotateCropImage);
if (DOM.btnCropAutoDetect) DOM.btnCropAutoDetect.addEventListener('click', detectDocumentBounds);

DOM.btnCropAspectCr80.addEventListener('click', () => {
    cropState.aspect = 'cr80';
    DOM.btnCropAspectCr80.className = 'min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-sm flex items-center gap-1';
    DOM.btnCropAspectFree.className = 'min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200';
    const box = cropState.cropBox;
    const ratio = 85.6 / 53.98;
    box.h = box.w / ratio;
    if (box.y + box.h > DOM.cropCanvas.height) {
        box.y = Math.max(0, DOM.cropCanvas.height - box.h);
    }
    drawCropCanvas();
});

DOM.btnCropAspectFree.addEventListener('click', () => {
    cropState.aspect = 'free';
    DOM.btnCropAspectFree.className = 'min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-sm flex items-center gap-1';
    DOM.btnCropAspectCr80.className = 'min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200';
    drawCropCanvas();
});

DOM.cropCanvas.addEventListener('pointerdown', onCropPointerDown);
DOM.cropCanvas.addEventListener('pointermove', onCropPointerMove);
DOM.cropCanvas.addEventListener('pointerup', onCropPointerUp);
DOM.cropCanvas.addEventListener('pointercancel', onCropPointerUp);

DOM.btnApplyCrop.addEventListener('click', applyCroppedResult);

// =============================================================================
// 16. MODAL DE CÁMARA (Escaneo Inteligente con Guía Exacta CR80 y Recorte Automático)
// =============================================================================

function openCameraModal(cardId) {
    targetCameraCard = cardId;
    DOM.cameraModal.classList.remove('hidden');
    startCameraStream();
}

function startCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const constraints = {
        video: {
            facingMode: cameraFacingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        cameraStream = stream;
        DOM.cameraVideo.srcObject = stream;
    }).catch(err => {
        console.error('Error abriendo cámara:', err);
        closeCameraModal();
        showToast('No se pudo acceder a la cámara o no diste permiso.', 'warning');
    });
}

function switchCameraFacingMode() {
    cameraFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    showToast(cameraFacingMode === 'environment' ? 'Cámara Trasera activa' : 'Cámara Frontal activa', 'info');
    startCameraStream();
}

function closeCameraModal() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    DOM.cameraModal.classList.add('hidden');
}

function captureCameraPhoto() {
    const video = DOM.cameraVideo;
    if (!video || !video.srcObject) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    if (!vw || !vh) return;

    // 1. Guardar la captura completa de alta resolución para preservarla en rawImage
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = vw;
    fullCanvas.height = vh;
    const fullCtx = fullCanvas.getContext('2d');
    fullCtx.drawImage(video, 0, 0, vw, vh);

    // 2. Mapeo matemático exacto de la guía verde en pantalla a los píxeles reales del sensor de video
    let cropX = 0, cropY = 0, cropW = vw, cropH = vh;
    const guideBox = DOM.cameraGuideBox || document.getElementById('camera-guide-box');

    if (guideBox) {
        const vRect = video.getBoundingClientRect();
        const gRect = guideBox.getBoundingClientRect();

        // El video usa CSS object-cover (escala preservando proporción y centrando)
        const scale = Math.max(vRect.width / vw, vRect.height / vh);
        const renderedW = vw * scale;
        const renderedH = vh * scale;
        const offsetX = (vRect.width - renderedW) / 2;
        const offsetY = (vRect.height - renderedH) / 2;

        const guideLeftInRendered = (gRect.left - vRect.left) - offsetX;
        const guideTopInRendered = (gRect.top - vRect.top) - offsetY;

        cropX = guideLeftInRendered / scale;
        cropY = guideTopInRendered / scale;
        cropW = gRect.width / scale;
        cropH = gRect.height / scale;

        // Margen de seguridad del 2% para evitar cortar bordes finos o texto
        const padW = cropW * 0.02;
        const padH = cropH * 0.02;
        cropX = Math.max(0, cropX - padW);
        cropY = Math.max(0, cropY - padH);
        cropW = Math.min(vw - cropX, cropW + padW * 2);
        cropH = Math.min(vh - cropY, cropH + padH * 2);
    } else {
        // Fallback: centrar relación CR80
        const ratio = 85.6 / 53.98;
        cropW = vw * 0.82;
        cropH = cropW / ratio;
        cropX = (vw - cropW) / 2;
        cropY = (vh - cropH) / 2;
    }

    // 3. Crear canvas recortado con precisión
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = Math.round(cropW);
    croppedCanvas.height = Math.round(cropH);
    const cropCtx = croppedCanvas.getContext('2d');
    cropCtx.drawImage(
        fullCanvas,
        cropX, cropY, cropW, cropH,
        0, 0, croppedCanvas.width, croppedCanvas.height
    );

    // 4. Asignar al estado con los parámetros predeterminados solicitados por el usuario
    const fullImg = new Image();
    fullImg.onload = () => {
        const card = STATE.cards[targetCameraCard];
        card.rawImage = fullImg;
        card.croppedCanvas = croppedCanvas;
        card.cropRect = { x: cropX, y: cropY, w: cropW, h: cropH };
        card.cachedCanvas = null;
        card.dirty = true;

        // Dimensiones estándar CR80 proporcionales
        card.widthMm = 85.6;
        card.heightMm = 85.6 * (cropH / cropW);

        // Parámetros por defecto preferidos: Escala 150%, Radio 6mm, Centrado en X e Y
        card.scale = FACTORY_DEFAULTS.cards[targetCameraCard].scale; // 150%
        card.borderRadiusMm = FACTORY_DEFAULTS.cards[targetCameraCard].borderRadiusMm; // 6mm
        card.xMm = 0;
        card.yMm = (STATE.layout.mode === 'single' ? 0 : FACTORY_DEFAULTS.cards[targetCameraCard].yMm);

        if (STATE.syncCards) {
            const otherId = targetCameraCard === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].scale = card.scale;
            STATE.cards[otherId].borderRadiusMm = card.borderRadiusMm;
            STATE.cards[otherId].xMm = 0;
        }

        updateDropzoneUI(targetCameraCard, croppedCanvas.toDataURL('image/jpeg', 0.92));
        setActiveTab(targetCameraCard);
        STATE.selectedCardId = targetCameraCard;
        updateSelectedCardUI();

        closeCameraModal();
        saveHistoryState(`Foto escaneada ${card.name}`);
        scheduleRender();
        showToast(`Documento escaneado y centrado para ${card.name}`, 'success');

        if (window.innerWidth < 1024) {
            setMobileView('canvas');
        }
    };
    fullImg.src = fullCanvas.toDataURL('image/jpeg', 0.95);
}

// =============================================================================
// 17. MOTOR DE EXPORTACIÓN (Sin bordes ni rayas entrecortadas)
// =============================================================================

async function generateAndDownload() {
    const hasAnyImage = !!(STATE.cards.frente.rawImage || STATE.cards.dorso.rawImage);
    if (!hasAnyImage) {
        showToast('Por favor sube al menos una imagen de carnet antes de exportar.', 'warning');
        return;
    }

    const format = STATE.exportFormat;
    const dpi = STATE.exportDpi;

    showLoader('Generando Documento...', `Renderizando a ${dpi} DPI en formato ${format.toUpperCase()}`);

    setTimeout(async () => {
        try {
            if (format === 'pdf') {
                await exportPDFDocument();
            } else {
                await exportImageDocument(format, dpi);
            }

            hideLoader();
            triggerSuccessCelebration();
            showToast(`¡Documento ${format.toUpperCase()} descargado exitosamente!`, 'success');
        } catch (err) {
            console.error('Error al exportar:', err);
            hideLoader();
            showToast('Ocurrió un error al generar el archivo.', 'error');
        }
    }, 120);
}

async function exportPDFDocument() {
    const { jsPDF } = window.jspdf;
    const orientation = STATE.paper.orientation === 'portrait' ? 'p' : 'l';
    const format = STATE.paper.size === 'letter' ? 'letter' : 'a4';

    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
        compress: true
    });

    const mmToPx = 300 / 25.4;
    const highResCanvasWidth = STATE.paper.widthMm * mmToPx;
    const highResCanvasHeight = STATE.paper.heightMm * mmToPx;

    const instances = getCardInstances(mmToPx, highResCanvasWidth, highResCanvasHeight);

    for (const inst of instances) {
        const card = inst.card;
        if (card.dirty || !card.cachedCanvas) {
            processCardImage(card);
        }

        // Crear versión limpia de alta resolución
        const roundedCanvas = createRoundedExportCanvas(card, inst.wMm, inst.hMm, mmToPx);
        const imgData = roundedCanvas.toDataURL('image/jpeg', 0.94);

        pdf.addImage(imgData, 'JPEG', inst.xMm, inst.yMm, inst.wMm, inst.hMm);

        // Solo si el usuario explícitamente activó líneas de corte
        if (STATE.layout.showCutLines) {
            pdf.setDrawColor(190, 190, 190);
            pdf.setLineWidth(0.2);
            pdf.setLineDashPattern([1.5, 1.5], 0);
            pdf.rect(inst.xMm - 0.5, inst.yMm - 0.5, inst.wMm + 1.0, inst.hMm + 1.0);
            pdf.setLineDashPattern([], 0); // Restaurar inmediatamente
        }
    }

    const timestamp = getFormattedTimestamp();
    const filename = `Carnet_Cardify_${STATE.paper.size.toUpperCase()}_${timestamp}.pdf`;
    pdf.save(filename);
}

async function exportImageDocument(format, dpi) {
    const mmToPx = dpi / 25.4;
    const widthPx = Math.round(STATE.paper.widthMm * mmToPx);
    const heightPx = Math.round(STATE.paper.heightMm * mmToPx);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = widthPx;
    exportCanvas.height = heightPx;
    const ctx = exportCanvas.getContext('2d');

    // Fondo blanco puro sin artefactos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthPx, heightPx);

    const instances = getCardInstances(mmToPx, widthPx, heightPx);

    for (const inst of instances) {
        drawCardInstance(ctx, inst, mmToPx);
    }

    const mimeType = format === 'png' ? 'image/png' : (format === 'webp' ? 'image/webp' : 'image/jpeg');
    const quality = format === 'png' ? 1.0 : 0.94;

    return new Promise((resolve) => {
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = getFormattedTimestamp();
            a.download = `Carnet_Cardify_${dpi}DPI_${timestamp}.${format}`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
        }, mimeType, quality);
    });
}

function createRoundedExportCanvas(card, wMm, hMm, mmToPx) {
    const canvas = document.createElement('canvas');
    const width = Math.round(wMm * mmToPx);
    const height = Math.round(hMm * mmToPx);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const r = Math.round(card.borderRadiusMm * mmToPx);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, 0, 0, width, height, r);
    ctx.clip();
    ctx.drawImage(card.cachedCanvas, 0, 0, width, height);
    ctx.restore();

    // Solo si el usuario explícitamente marcó 'borde sutil'
    if (STATE.layout.showBorder) {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundedRectPath(ctx, 0, 0, width, height, r);
        ctx.stroke();
    }

    return canvas;
}

async function directPrintDocument() {
    showLoader('Preparando impresión...', 'Generando hoja a tamaño real');

    setTimeout(() => {
        const mmToPx = 300 / 25.4;
        const widthPx = Math.round(STATE.paper.widthMm * mmToPx);
        const heightPx = Math.round(STATE.paper.heightMm * mmToPx);

        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, widthPx, heightPx);

        const instances = getCardInstances(mmToPx, widthPx, heightPx);
        for (const inst of instances) {
            drawCardInstance(ctx, inst, mmToPx);
        }

        DOM.printImg.src = canvas.toDataURL('image/png', 1.0);
        DOM.printArea.classList.remove('hidden');

        hideLoader();
        window.print();
        DOM.printArea.classList.add('hidden');
    }, 100);
}

async function copyToClipboard() {
    try {
        const mmToPx = 200 / 25.4;
        const widthPx = Math.round(STATE.paper.widthMm * mmToPx);
        const heightPx = Math.round(STATE.paper.heightMm * mmToPx);

        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, widthPx, heightPx);

        const instances = getCardInstances(mmToPx, widthPx, heightPx);
        for (const inst of instances) {
            drawCardInstance(ctx, inst, mmToPx);
        }

        canvas.toBlob(async (blob) => {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('¡Hoja copiada al portapapeles!', 'success');
        });
    } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
        showToast('No se pudo copiar al portapapeles en este navegador.', 'warning');
    }
}

// =============================================================================
// 18. NOTIFICACIONES, LOADERS Y CELEBRACIÓN
// =============================================================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-emerald-600 text-white shadow-emerald-500/25',
        error: 'bg-red-600 text-white shadow-red-500/25',
        warning: 'bg-amber-500 text-white shadow-amber-500/25',
        info: 'bg-slate-900 dark:bg-slate-800 text-white shadow-slate-900/25'
    };

    toast.className = `${colors[type] || colors.info} px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;

    DOM.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function showLoader(title, subtitle) {
    DOM.loaderTitle.textContent = title || 'Procesando...';
    DOM.loaderSubtitle.textContent = subtitle || 'Por favor espera';
    DOM.loaderOverlay.classList.remove('hidden');
}

function hideLoader() {
    DOM.loaderOverlay.classList.add('hidden');
}

function triggerSuccessCelebration() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.75 }
        });
    }
}

function getFormattedTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
