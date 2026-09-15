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
            cachedCanvas: null,
            widthMm: 85.6,
            heightMm: 53.98,
            xMm: 0,
            yMm: 45,
            scale: 70, // %
            rotation: 0,
            flipH: false,
            flipV: false,
            borderRadiusMm: 3.5,
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
            cachedCanvas: null,
            widthMm: 85.6,
            heightMm: 53.98,
            xMm: 0,
            yMm: 5,
            scale: 70, // %
            rotation: 0,
            flipH: false,
            flipV: false,
            borderRadiusMm: 3.5,
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
    btnSaveDefaults: document.getElementById('btn-save-defaults'),
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
    btnNativeCamFrente: document.getElementById('btn-native-cam-frente'),
    btnNativeCamDorso: document.getElementById('btn-native-cam-dorso'),
    frentePreviewWrap: document.getElementById('frente-preview-wrap'),
    dorsoPreviewWrap: document.getElementById('dorso-preview-wrap'),
    frentePlaceholder: document.getElementById('frente-placeholder'),
    dorsoPlaceholder: document.getElementById('dorso-placeholder'),
    frenteImg: document.getElementById('frente-img'),
    dorsoImg: document.getElementById('dorso-img'),
    frenteActions: document.getElementById('frente-actions'),
    dorsoActions: document.getElementById('dorso-actions'),
    btnCropFrente: document.getElementById('btn-crop-frente'),
    btnRotateFrente: document.getElementById('btn-rotate-frente'),
    btnRemoveFrente: document.getElementById('btn-remove-frente'),
    btnCropDorso: document.getElementById('btn-crop-dorso'),
    btnRotateDorso: document.getElementById('btn-rotate-dorso'),
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
    btnApplyCr80: document.getElementById('btn-apply-cr80'),
    activeCardDimensions: document.getElementById('active-card-dimensions'),
    cardScaleRange: document.getElementById('card-scale-range'),
    cardScaleNum: document.getElementById('card-scale-num'),
    cardXRange: document.getElementById('card-x-range'),
    cardXNum: document.getElementById('card-x-num'),
    cardYRange: document.getElementById('card-y-range'),
    cardYNum: document.getElementById('card-y-num'),
    btnAlignCenterX: document.getElementById('btn-align-center-x'),
    btnAlignCenterY: document.getElementById('btn-align-center-y'),
    btnCopyToOther: document.getElementById('btn-copy-to-other'),
    cardRadiusRange: document.getElementById('card-radius-range'),
    cardRadiusNum: document.getElementById('card-radius-num'),
    btnResetRadius: document.getElementById('btn-reset-radius'),
    cornerRadiusLabel: document.getElementById('corner-radius-label'),
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
    btnLoadCustomTemplate: document.getElementById('btn-load-custom-template'),
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
    quickScaleLabel: document.getElementById('quick-scale-label'),
    btnQuickScaleDown: document.getElementById('btn-quick-scale-down'),
    btnQuickScaleUp: document.getElementById('btn-quick-scale-up'),
    btnQuickRotate: document.getElementById('btn-quick-rotate'),
    btnQuickCenter: document.getElementById('btn-quick-center'),
    btnQuickToSettings: document.getElementById('btn-quick-to-settings'),
    viewportContainer: document.getElementById('viewport-container'),
    previewCanvas: document.getElementById('preview-canvas'),
    emptyState: document.getElementById('empty-state'),
    sheetInfoBadge: document.getElementById('sheet-info-badge'),

    // Modales
    cropModal: document.getElementById('crop-modal'),
    cropCanvas: document.getElementById('crop-canvas'),
    btnCloseCrop: document.getElementById('btn-close-crop'),
    btnCancelCrop: document.getElementById('btn-cancel-crop'),
    btnApplyCrop: document.getElementById('btn-apply-crop'),
    btnCropAspectFree: document.getElementById('btn-crop-aspect-free'),
    btnCropAspectCr80: document.getElementById('btn-crop-aspect-cr80'),
    cameraModal: document.getElementById('camera-modal'),
    cameraVideo: document.getElementById('camera-video'),
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
    cardInitialScale: 70,
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
    const card = STATE.cards[cardId];
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
    syncControlsFromActiveCard();
    scheduleRender();
    saveHistoryState(`Voltear ${axis.toUpperCase()} ${card.name}`);
    showToast(`${card.name}: Volteo ${axis === 'h' ? 'Horizontal' : 'Vertical'}`, 'info');
}

function resetActiveCardAdjustments() {
    const card = STATE.cards[STATE.activeCardId];
    const def = FACTORY_DEFAULTS.cards[STATE.activeCardId];
    card.scale = 70;
    card.xMm = 0;
    card.yMm = def.yMm;
    card.borderRadiusMm = 3.5;
    card.filter = 'normal';
    card.brightness = 0;
    card.contrast = 0;
    card.rotation = 0;
    card.flipH = false;
    card.flipV = false;
    card.dirty = true;

    if (STATE.syncCards) {
        const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
        const otherDef = FACTORY_DEFAULTS.cards[otherId];
        const other = STATE.cards[otherId];
        other.scale = 70;
        other.xMm = 0;
        other.yMm = otherDef.yMm;
        other.borderRadiusMm = 3.5;
        other.filter = 'normal';
        other.brightness = 0;
        other.contrast = 0;
        other.rotation = 0;
        other.flipH = false;
        other.flipV = false;
        other.dirty = true;
    }

    syncControlsFromActiveCard();
    saveHistoryState(`Restablecer ${card.name}`);
    scheduleRender();
    showToast(`Ajustes de ${card.name} restablecidos a valores iniciales`, 'info');
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
    } else {
        document.documentElement.classList.remove('dark');
        DOM.themeIconDark.classList.add('hidden');
        DOM.themeIconLight.classList.remove('hidden');
    }
    localStorage.setItem('cardify-theme', theme);
    scheduleRender();
}

function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    applyTheme(STATE.theme);
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
    DOM.btnThemeToggle.addEventListener('click', toggleTheme);
    DOM.btnResetAll.addEventListener('click', resetAllDefaults);
    DOM.btnSaveDefaults.addEventListener('click', saveCustomDefaults);
    DOM.mobileTabCanvas.addEventListener('click', () => setMobileView('canvas'));
    DOM.mobileTabControls.addEventListener('click', () => setMobileView('controls'));

    // Carga de Archivos
    setupDropzone(DOM.dropzoneFrente, DOM.frenteInput, 'frente');
    setupDropzone(DOM.dropzoneDorso, DOM.dorsoInput, 'dorso');

    // Cámara Móvil Nativa (capture="environment")
    DOM.btnNativeCamFrente.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.frenteCameraInput.click();
    });
    DOM.frenteCameraInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) loadFileIntoCard(file, 'frente');
    });

    DOM.btnNativeCamDorso.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.dorsoCameraInput.click();
    });
    DOM.dorsoCameraInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) loadFileIntoCard(file, 'dorso');
    });

    // Acciones de Tarjetas
    DOM.btnRotateFrente.addEventListener('click', (e) => { e.stopPropagation(); rotateCard('frente', 90); });
    DOM.btnRotateDorso.addEventListener('click', (e) => { e.stopPropagation(); rotateCard('dorso', 90); });
    DOM.btnRemoveFrente.addEventListener('click', (e) => { e.stopPropagation(); removeCard('frente'); });
    DOM.btnRemoveDorso.addEventListener('click', (e) => { e.stopPropagation(); removeCard('dorso'); });
    DOM.btnCropFrente.addEventListener('click', (e) => { e.stopPropagation(); openCropModal('frente'); });
    DOM.btnCropDorso.addEventListener('click', (e) => { e.stopPropagation(); openCropModal('dorso'); });

    // Cámara Web en Vivo
    DOM.btnCameraFrente.addEventListener('click', () => openCameraModal('frente'));
    DOM.btnCameraDorso.addEventListener('click', () => openCameraModal('dorso'));
    DOM.btnCloseCamera.addEventListener('click', closeCameraModal);
    DOM.btnCancelCamera.addEventListener('click', closeCameraModal);
    DOM.btnSnapCamera.addEventListener('click', captureCameraPhoto);
    DOM.btnSwitchCamera.addEventListener('click', switchCameraFacingMode);
    DOM.btnCameraUseNative.addEventListener('click', () => {
        closeCameraModal();
        if (targetCameraCard === 'frente') DOM.frenteCameraInput.click();
        else DOM.dorsoCameraInput.click();
    });

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
    if (DOM.btnLoadCustomTemplate) {
        DOM.btnLoadCustomTemplate.addEventListener('click', () => {
            loadCustomDefaults();
            updateUIFromState();
            syncControlsFromActiveCard();
            scheduleRender();
            showToast('⭐ Plantilla favorita cargada con éxito', 'success');
        });
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

    if (DOM.btnQuickScaleDown) {
        DOM.btnQuickScaleDown.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.scale = Math.max(30, c.scale - 5);
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = c.scale;
                }
                syncControlsFromActiveCard();
                scheduleRender();
            }
        });
    }

    if (DOM.btnQuickScaleUp) {
        DOM.btnQuickScaleUp.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.scale = Math.min(180, c.scale + 5);
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].scale = c.scale;
                }
                syncControlsFromActiveCard();
                scheduleRender();
            }
        });
    }

    if (DOM.btnQuickRotate) {
        DOM.btnQuickRotate.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId) rotateCard(STATE.selectedCardId, 90);
        });
    }

    if (DOM.btnQuickCenter) {
        DOM.btnQuickCenter.addEventListener('click', (e) => {
            e.stopPropagation();
            if (STATE.selectedCardId) {
                const c = STATE.cards[STATE.selectedCardId];
                c.xMm = 0;
                if (STATE.syncCards) {
                    const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                    STATE.cards[otherId].xMm = 0;
                }
                syncControlsFromActiveCard();
                scheduleRender();
            }
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
    const card = STATE.cards[cardId];
    if (!card.rawImage) return;

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

    saveHistoryState(`Rotar ${card.name} ${angleDeg}°`);
    scheduleRender();
    showToast(`${card.name} rotado`, 'info');
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
    const tempRotation = f.rotation;
    const tempFilter = f.filter;
    const tempBrightness = f.brightness;
    const tempContrast = f.contrast;
    const tempW = f.widthMm;
    const tempH = f.heightMm;

    f.rawImage = d.rawImage;
    f.croppedCanvas = d.croppedCanvas;
    f.rotation = d.rotation;
    f.filter = d.filter;
    f.brightness = d.brightness;
    f.contrast = d.contrast;
    f.widthMm = d.widthMm;
    f.heightMm = d.heightMm;
    f.dirty = true;

    d.rawImage = tempRaw;
    d.croppedCanvas = tempCropped;
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
            setActiveTab('frente');

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
    img1.onerror = () => { hideLoader(); showToast('Error al cargar la imagen', 'error'); };
    img2.onerror = () => { hideLoader(); showToast('Error al cargar la imagen', 'error'); };

    img1.src = 'recursos/carnet confa 1.png';
    img2.src = 'recursos/carnet confa 2.png';
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
                loadFileIntoCard(blob, STATE.activeCardId);
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
        const card = STATE.cards[STATE.selectedCardId];
        const step = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowUp') card.yMm -= step;
        if (e.key === 'ArrowDown') card.yMm += step;
        if (e.key === 'ArrowLeft') card.xMm -= step;
        if (e.key === 'ArrowRight') card.xMm += step;
        
        syncControlsFromActiveCard();
        scheduleRender();
        return;
    }

    if (STATE.selectedCardId && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (document.activeElement.tagName !== 'INPUT') {
            removeCard(STATE.selectedCardId);
        }
    }
}

// =============================================================================
// 10. CONTROLES Y SINCRONIZACIÓN REACTIVA
// =============================================================================

function setActiveTab(cardId) {
    STATE.activeCardId = cardId;
    if (cardId === 'frente') {
        DOM.tabBtnFrente.className = 'flex-1 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 transition-all';
        DOM.tabBtnDorso.className = 'flex-1 py-1 text-xs font-bold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all';
    } else {
        DOM.tabBtnDorso.className = 'flex-1 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 transition-all';
        DOM.tabBtnFrente.className = 'flex-1 py-1 text-xs font-bold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-all';
    }

    syncControlsFromActiveCard();
    scheduleRender();
}

function syncControlsFromActiveCard() {
    const card = STATE.cards[STATE.activeCardId];

    DOM.cardScaleRange.value = card.scale;
    DOM.cardScaleNum.value = card.scale;
    DOM.cardXRange.value = card.xMm;
    DOM.cardXNum.value = card.xMm;
    DOM.cardYRange.value = card.yMm;
    DOM.cardYNum.value = card.yMm;
    DOM.cardRadiusRange.value = card.borderRadiusMm;
    if (DOM.cardRadiusNum) DOM.cardRadiusNum.value = card.borderRadiusMm;
    DOM.cornerRadiusLabel.textContent = `${card.borderRadiusMm} mm`;
    DOM.cardBrightnessRange.value = card.brightness;
    if (DOM.cardBrightnessNum) DOM.cardBrightnessNum.value = card.brightness;
    DOM.cardContrastRange.value = card.contrast;
    if (DOM.cardContrastNum) DOM.cardContrastNum.value = card.contrast;
    if (DOM.cardRotationLabel) DOM.cardRotationLabel.textContent = `${card.rotation || 0}°`;

    const currentW = (card.widthMm * card.scale / 100).toFixed(1);
    const currentH = (card.heightMm * card.scale / 100).toFixed(1);
    DOM.activeCardDimensions.textContent = `(${currentW} × ${currentH} mm)`;

    DOM.filterPresetBtns.forEach(btn => {
        if (btn.dataset.filter === card.filter) {
            btn.className = 'filter-preset-btn min-h-[38px] py-1.5 px-1 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
        } else {
            btn.className = 'filter-preset-btn min-h-[38px] py-1.5 px-1 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        }
    });

    DOM.selectedCardIndicator.textContent = STATE.selectedCardId 
        ? `Editando ${STATE.cards[STATE.selectedCardId].name}` 
        : 'Arrastra para mover';

    // Barra Rápida en el Canvas para Manipulación Directa (Agrandar con 1 Tap)
    if (DOM.canvasQuickBar) {
        if (STATE.selectedCardId && STATE.cards[STATE.selectedCardId].rawImage) {
            DOM.canvasQuickBar.classList.remove('hidden');
            const selCard = STATE.cards[STATE.selectedCardId];
            if (DOM.quickCardBadge) DOM.quickCardBadge.textContent = selCard.name;
            if (DOM.quickScaleLabel) DOM.quickScaleLabel.textContent = `${selCard.scale}%`;
        } else {
            DOM.canvasQuickBar.classList.add('hidden');
        }
    }

    updateDefaultConfigBadge();
}

function setupCardControls() {
    // Escala
    const onScaleChange = (val) => {
        STATE.cards[STATE.activeCardId].scale = val;
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].scale = val;
        }
        syncControlsFromActiveCard();
        scheduleRender();
    };

    DOM.cardScaleRange.addEventListener('input', (e) => onScaleChange(parseFloat(e.target.value)));
    DOM.cardScaleNum.addEventListener('input', (e) => onScaleChange(Math.min(180, Math.max(30, parseFloat(e.target.value) || 70))));

    // Posición X
    const onXChange = (val) => {
        STATE.cards[STATE.activeCardId].xMm = val;
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].xMm = val;
        }
        scheduleRender();
    };
    DOM.cardXRange.addEventListener('input', (e) => onXChange(parseFloat(e.target.value)));
    DOM.cardXNum.addEventListener('input', (e) => onXChange(parseFloat(e.target.value) || 0));

    // Posición Y
    DOM.cardYRange.addEventListener('input', (e) => {
        STATE.cards[STATE.activeCardId].yMm = parseFloat(e.target.value);
        scheduleRender();
    });
    DOM.cardYNum.addEventListener('input', (e) => {
        STATE.cards[STATE.activeCardId].yMm = parseFloat(e.target.value) || 0;
        scheduleRender();
    });

    // Alineaciones
    DOM.btnAlignCenterX.addEventListener('click', () => {
        STATE.cards[STATE.activeCardId].xMm = 0;
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].xMm = 0;
        }
        syncControlsFromActiveCard();
        saveHistoryState('Centrar Horizontalmente');
        scheduleRender();
    });

    DOM.btnAlignCenterY.addEventListener('click', () => {
        STATE.cards[STATE.activeCardId].yMm = 0;
        syncControlsFromActiveCard();
        saveHistoryState('Centrar Verticalmente');
        scheduleRender();
    });

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
        STATE.cards[STATE.activeCardId].borderRadiusMm = val;
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].borderRadiusMm = val;
        }
        if (DOM.cardRadiusNum) DOM.cardRadiusNum.value = val;
        DOM.cornerRadiusLabel.textContent = `${val} mm`;
        scheduleRender();
    });

    if (DOM.cardRadiusNum) {
        DOM.cardRadiusNum.addEventListener('input', (e) => {
            const val = Math.min(15, Math.max(0, parseFloat(e.target.value) || 0));
            STATE.cards[STATE.activeCardId].borderRadiusMm = val;
            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].borderRadiusMm = val;
            }
            DOM.cardRadiusRange.value = val;
            DOM.cornerRadiusLabel.textContent = `${val} mm`;
            scheduleRender();
        });
    }

    if (DOM.btnResetRadius) {
        DOM.btnResetRadius.addEventListener('click', () => {
            const val = 3.5;
            STATE.cards[STATE.activeCardId].borderRadiusMm = val;
            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].borderRadiusMm = val;
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    // Filtros Presets
    DOM.filterPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterMode = btn.dataset.filter;
            const card = STATE.cards[STATE.activeCardId];
            card.filter = filterMode;
            card.dirty = true;

            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].filter = filterMode;
                STATE.cards[otherId].dirty = true;
            }

            syncControlsFromActiveCard();
            saveHistoryState(`Filtro ${filterMode}`);
            scheduleRender();
        });
    });

    // Brillo con Input Numérico y Reset
    DOM.cardBrightnessRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        STATE.cards[STATE.activeCardId].brightness = val;
        STATE.cards[STATE.activeCardId].dirty = true;
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].brightness = val;
            STATE.cards[otherId].dirty = true;
        }
        if (DOM.cardBrightnessNum) DOM.cardBrightnessNum.value = val;
        scheduleRender();
    });

    if (DOM.cardBrightnessNum) {
        DOM.cardBrightnessNum.addEventListener('input', (e) => {
            const val = Math.min(50, Math.max(-50, parseInt(e.target.value, 10) || 0));
            STATE.cards[STATE.activeCardId].brightness = val;
            STATE.cards[STATE.activeCardId].dirty = true;
            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].brightness = val;
                STATE.cards[otherId].dirty = true;
            }
            DOM.cardBrightnessRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetBrightness) {
        DOM.btnResetBrightness.addEventListener('click', () => {
            STATE.cards[STATE.activeCardId].brightness = 0;
            STATE.cards[STATE.activeCardId].dirty = true;
            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].brightness = 0;
                STATE.cards[otherId].dirty = true;
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }

    // Contraste con Input Numérico y Reset
    DOM.cardContrastRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        STATE.cards[STATE.activeCardId].contrast = val;
        STATE.cards[STATE.activeCardId].dirty = true;
        if (STATE.syncCards) {
            const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
            STATE.cards[otherId].contrast = val;
            STATE.cards[otherId].dirty = true;
        }
        if (DOM.cardContrastNum) DOM.cardContrastNum.value = val;
        scheduleRender();
    });

    if (DOM.cardContrastNum) {
        DOM.cardContrastNum.addEventListener('input', (e) => {
            const val = Math.min(50, Math.max(-50, parseInt(e.target.value, 10) || 0));
            STATE.cards[STATE.activeCardId].contrast = val;
            STATE.cards[STATE.activeCardId].dirty = true;
            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].contrast = val;
                STATE.cards[otherId].dirty = true;
            }
            DOM.cardContrastRange.value = val;
            scheduleRender();
        });
    }

    if (DOM.btnResetContrast) {
        DOM.btnResetContrast.addEventListener('click', () => {
            STATE.cards[STATE.activeCardId].contrast = 0;
            STATE.cards[STATE.activeCardId].dirty = true;
            if (STATE.syncCards) {
                const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].contrast = 0;
                STATE.cards[otherId].dirty = true;
            }
            syncControlsFromActiveCard();
            scheduleRender();
        });
    }
}

function copyActiveCardSettingsToOther() {
    const current = STATE.cards[STATE.activeCardId];
    const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
    const other = STATE.cards[otherId];

    other.scale = current.scale;
    other.xMm = current.xMm;
    other.borderRadiusMm = current.borderRadiusMm;
    other.filter = current.filter;
    other.brightness = current.brightness;
    other.contrast = current.contrast;
    other.dirty = true;

    saveHistoryState(`Copiar ajustes a ${other.name}`);
    scheduleRender();
    showToast(`Ajustes copiados de ${current.name} a ${other.name}`, 'success');
}

function applyCr80Preset() {
    const card = STATE.cards[STATE.activeCardId];
    card.widthMm = 85.6;
    card.heightMm = 53.98;
    card.scale = 100;
    card.borderRadiusMm = 3.18;

    if (STATE.syncCards) {
        const otherId = STATE.activeCardId === 'frente' ? 'dorso' : 'frente';
        STATE.cards[otherId].widthMm = 85.6;
        STATE.cards[otherId].heightMm = 53.98;
        STATE.cards[otherId].scale = 100;
        STATE.cards[otherId].borderRadiusMm = 3.18;
    }

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

    // Fondo blanco puro de la hoja
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const mmToPx = canvasWidth / STATE.paper.widthMm;
    const cardInstances = getCardInstances(mmToPx, canvasWidth, canvasHeight);

    for (const inst of cardInstances) {
        drawCardInstance(ctx, inst, mmToPx);
    }

    if (INTERACTION.isDragging && INTERACTION.activeSnapLines.length > 0) {
        drawSnapLines(ctx, canvasWidth, canvasHeight, mmToPx);
    }

    if (STATE.selectedCardId) {
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
            const card = STATE.cards[STATE.selectedCardId];

            // Escalado intuitivo según la esquina arrastrada
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

            const scaleChange = (effectiveDelta / (card.widthMm / 100));

            card.scale = Math.min(180, Math.max(30, Math.round(INTERACTION.cardInitialScale + scaleChange)));
            if (STATE.syncCards) {
                const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].scale = card.scale;
            }
            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        if (INTERACTION.isDragging) {
            const deltaX = (coords.x - INTERACTION.dragStart.x) / mmToPx;
            const deltaY = (coords.y - INTERACTION.dragStart.y) / mmToPx;
            const card = STATE.cards[STATE.selectedCardId];

            let newX = Math.round(INTERACTION.cardInitialPos.x + deltaX);
            let newY = Math.round(INTERACTION.cardInitialPos.y + deltaY);

            INTERACTION.activeSnapLines = [];
            if (STATE.snapEnabled) {
                if (Math.abs(newX) <= 2) {
                    newX = 0;
                    INTERACTION.activeSnapLines.push({ orientation: 'v', posMm: STATE.paper.widthMm / 2 });
                }

                const otherCard = STATE.activeCardId === 'frente' ? STATE.cards.dorso : STATE.cards.frente;
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

            syncControlsFromActiveCard();
            scheduleRender();
            return;
        }

        if (STATE.selectedCardId) {
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
    let pinchInitialScale = 70;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2 && STATE.selectedCardId) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            pinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            pinchInitialScale = STATE.cards[STATE.selectedCardId].scale;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && STATE.selectedCardId && pinchStartDist > 0) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const factor = currentDist / pinchStartDist;
            const newScale = Math.min(180, Math.max(30, Math.round(pinchInitialScale * factor)));
            
            const card = STATE.cards[STATE.selectedCardId];
            card.scale = newScale;
            if (STATE.syncCards) {
                const otherId = STATE.selectedCardId === 'frente' ? 'dorso' : 'frente';
                STATE.cards[otherId].scale = newScale;
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
// 15. MODAL DE RECORTE (CROP TOOL)
// =============================================================================

let cropState = {
    cardId: 'frente',
    img: null,
    aspect: 'free',
    cropBox: { x: 20, y: 20, w: 200, h: 140 }
};

function openCropModal(cardId) {
    const card = STATE.cards[cardId];
    if (!card.rawImage) return;

    cropState.cardId = cardId;
    cropState.img = card.croppedCanvas || card.rawImage;

    DOM.cropModal.classList.remove('hidden');

    const canvas = DOM.cropCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = cropState.img.width;
    canvas.height = cropState.img.height;
    ctx.drawImage(cropState.img, 0, 0);

    const w = canvas.width * 0.8;
    const h = w * (54 / 85.6);
    cropState.cropBox = {
        x: (canvas.width - w) / 2,
        y: (canvas.height - h) / 2,
        w: w,
        h: h
    };

    drawCropCanvas();
}

function drawCropCanvas() {
    const canvas = DOM.cropCanvas;
    const ctx = canvas.getContext('2d');
    const box = cropState.cropBox;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cropState.img, 0, 0);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, box.y);
    ctx.fillRect(0, box.y + box.h, canvas.width, canvas.height - (box.y + box.h));
    ctx.fillRect(0, box.y, box.x, box.h);
    ctx.fillRect(box.x + box.w, box.y, canvas.width - (box.x + box.w), box.h);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
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
}

DOM.btnCloseCrop.addEventListener('click', () => DOM.cropModal.classList.add('hidden'));
DOM.btnCancelCrop.addEventListener('click', () => DOM.cropModal.classList.add('hidden'));

DOM.btnCropAspectCr80.addEventListener('click', () => {
    cropState.aspect = 'cr80';
    DOM.btnCropAspectCr80.className = 'px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium';
    DOM.btnCropAspectFree.className = 'px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-medium';
    const box = cropState.cropBox;
    box.h = box.w * (53.98 / 85.6);
    drawCropCanvas();
});

DOM.btnCropAspectFree.addEventListener('click', () => {
    cropState.aspect = 'free';
    DOM.btnCropAspectFree.className = 'px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium';
    DOM.btnCropAspectCr80.className = 'px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-medium';
});

DOM.btnApplyCrop.addEventListener('click', () => {
    const box = cropState.cropBox;
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = box.w;
    croppedCanvas.height = box.h;

    const ctx = croppedCanvas.getContext('2d');
    ctx.drawImage(cropState.img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

    const card = STATE.cards[cropState.cardId];
    card.croppedCanvas = croppedCanvas;
    card.dirty = true;

    DOM.cropModal.classList.add('hidden');
    saveHistoryState(`Recortar ${card.name}`);
    scheduleRender();
    showToast(`Recorte aplicado a ${card.name}`, 'success');
});

// =============================================================================
// 16. MODAL DE CÁMARA (Visor en Vivo + Alternar Trasera/Frontal)
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
    if (!DOM.cameraVideo.srcObject) return;

    const canvas = document.createElement('canvas');
    canvas.width = DOM.cameraVideo.videoWidth || 1280;
    canvas.height = DOM.cameraVideo.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(DOM.cameraVideo, 0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
        const card = STATE.cards[targetCameraCard];
        card.rawImage = img;
        card.croppedCanvas = null;
        card.cachedCanvas = null;
        card.dirty = true;

        updateDropzoneUI(targetCameraCard, img.src);
        closeCameraModal();
        saveHistoryState(`Captura cámara ${card.name}`);
        scheduleRender();
        showToast(`Foto capturada para ${card.name}`, 'success');

        if (window.innerWidth < 1024) {
            setMobileView('canvas');
        }
    };
    img.src = canvas.toDataURL('image/jpeg', 0.95);
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
