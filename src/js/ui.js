/**
 * Módulo de interfaz de usuario (UI)
 * Maneja toda la interacción con el DOM y visualización
 * Zeus Balneario - Necochea
 */

// ============================================================================
// UTILIDADES DE FORMATEO
// ============================================================================

/**
 * Formatear cantidad de dinero en pesos argentinos
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada (ej: "$5.000")
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0';
  }
  return '$' + amount.toLocaleString('es-AR');
}

/**
 * Formatear fecha a formato YYYY-MM-DD
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function formatDate(date) {
  if (typeof date === 'string') return date;
  if (!(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

// Estado global de la aplicación
let currentType = null; // Se inicializa dinámicamente
let currentView = 'dashboard'; // 'dashboard' o tipo de recurso
let selectedCells = [];
let selectionMode = false;
let currentPeriodIndex = 0; // Índice del período actual (0-7 para 8 períodos de 20 días)
const DAYS_PER_PERIOD = 20;

/**
 * Calcular períodos de la temporada
 * @returns {Array} Array de períodos con startDate y endDate
 */
function calculatePeriods() {
  const periods = [];
  const seasonStart = new Date(SEASON.startDate);
  const seasonEnd = new Date(SEASON.endDate);
  
  let currentStart = new Date(seasonStart);
  
  while (currentStart < seasonEnd) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + DAYS_PER_PERIOD - 1);
    
    // Si el período se pasa del fin de temporada, ajustar
    if (currentEnd > seasonEnd) {
      currentEnd = new Date(seasonEnd);
    }
    
    periods.push({
      startDate: currentStart.toISOString().split('T')[0],
      endDate: currentEnd.toISOString().split('T')[0],
      days: Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1
    });
    
    // Avanzar al siguiente período
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  return periods;
}

/**
 * Obtener nombre corto del cliente (primeras letras de nombre y apellido)
 * @param {string} fullName - Nombre completo del cliente
 * @returns {string} Nombre abreviado
 */
function getClientNameShort(fullName) {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) {
    // Solo un nombre, tomar primeras 3 letras
    return words[0].substring(0, 3).toUpperCase();
  } else {
    // Tomar primera letra de nombre y primera letra de apellido
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
}

/**
 * Obtener índice de color basado en el ID del alquiler
 * @param {string} id - ID del alquiler
 * @returns {number} Índice de color (0-9)
 */
function getColorIndexFromId(id) {
  // Generar un número hash simple del ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Retornar un número entre 0 y 9 (10 colores diferentes)
  return Math.abs(hash) % 10;
}

/**
 * Obtener etiqueta del método de pago
 * @param {string} method - Método de pago
 * @returns {string} Etiqueta formateada
 */
function getPaymentMethodLabel(method) {
  const methods = {
    efectivo: '💵 Efectivo',
    transferencia: '🏦 Transferencia',
    tarjeta: '💳 Tarjeta',
    mercadopago: '📱 MercadoPago'
  };
  return methods[method] || method;
}

/**
 * Obtener etiqueta del estado de pago
 * @param {string} status - Estado de pago
 * @returns {string} Etiqueta formateada
 */
function getPaymentStatusLabel(status) {
  const statuses = {
    pendiente: '⏳ Pendiente',
    parcial: '⚠️ Pago Parcial',
    pagado: '✅ Pagado'
  };
  return statuses[status] || status;
}

/**
 * Verificar si una fecha es día de carnaval
 * @param {string} date - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {boolean} true si es día de carnaval
 */
function isCarnavalDate(date) {
  // Carnaval 2026: 14, 15, 16, 17 de febrero
  const carnavalDates = [
    '2026-02-14',
    '2026-02-15',
    '2026-02-16',
    '2026-02-17'
  ];
  return carnavalDates.includes(date);
}

/**
 * Inicializar la interfaz de usuario
 */
function initUI() {
  // Verificar si hay recursos normales (no especiales) o pileta configurada
  const availableTypes = Object.keys(UNIT_TYPES);
  const hasPoolConfig = typeof getPoolConfig === 'function' && getPoolConfig() && getPoolConfig().enabled;
  
  if (availableTypes.length === 0 && !hasPoolConfig) {
    console.error('❌ No hay tipos de recursos configurados');
    return;
  }
  
  // Inicializar currentType con el primer tipo disponible (si existe)
  if (availableTypes.length > 0) {
    currentType = availableTypes[0];
  }
  
  renderTabs();
  
  // Mostrar dashboard por defecto
  showDashboard();
  
  // Preparar vistas de recursos (sin renderizar todavía)
  attachEventListeners();
  setupDateInput();
  
  console.log('🎨 UI inicializada correctamente');
}

/**
 * Configurar el input de fecha con límites de temporada
 */
function setupDateInput() {
  const checkDateInput = document.getElementById('check-date');
  if (checkDateInput) {
    checkDateInput.min = SEASON.startDate;
    checkDateInput.max = SEASON.endDate;
    checkDateInput.value = getTodayDate();
  }
}

/**
 * Renderizar las pestañas de tipos de recursos
 */
function renderTabs() {
  const tabsContainer = document.getElementById('tabs-container');
  tabsContainer.innerHTML = '';
  
  // Agregar pestaña Dashboard
  const dashboardTab = document.createElement('button');
  dashboardTab.className = `tab-button ${currentView === 'dashboard' ? 'active' : ''}`;
  dashboardTab.innerHTML = `🏠 Dashboard`;
  dashboardTab.dataset.type = 'dashboard';
  dashboardTab.addEventListener('click', () => {
    switchTab('dashboard');
  });
  tabsContainer.appendChild(dashboardTab);
  
  // ✅ NUEVO: Agregar pestaña Vista Rápida
  const quickViewTab = document.createElement('button');
  quickViewTab.className = `tab-button ${currentView === 'quick-view' ? 'active' : ''}`;
  quickViewTab.innerHTML = `👁️ Vista Rápida`;
  quickViewTab.dataset.type = 'quick-view';
  quickViewTab.addEventListener('click', () => {
    switchTab('quick-view');
  });
  tabsContainer.appendChild(quickViewTab);
  
  // ✅ NUEVO: Agregar pestaña Clientes
  const clientsTab = document.createElement('button');
  clientsTab.className = `tab-button ${currentView === 'clients' ? 'active' : ''}`;
  clientsTab.innerHTML = `👥 Clientes`;
  clientsTab.dataset.type = 'clients';
  clientsTab.addEventListener('click', () => {
    switchTab('clients');
  });
  tabsContainer.appendChild(clientsTab);
  
  // ✅ NUEVO: Agregar pestaña Pileta (solo si está configurada)
  try {
    if (typeof getPoolConfig === 'function') {
      const poolConfig = getPoolConfig();
      if (poolConfig && poolConfig.enabled) {
        const poolTab = document.createElement('button');
        poolTab.className = `tab-button ${currentView === 'pool' ? 'active' : ''}`;
        poolTab.innerHTML = `🏊 Pileta`;
        poolTab.dataset.type = 'pool';
        poolTab.addEventListener('click', () => {
          switchTab('pool');
        });
        tabsContainer.appendChild(poolTab);
      }
    }
  } catch (error) {
    console.warn('Error al cargar configuración de pileta:', error);
  }
  
  // Agregar pestañas de recursos
  Object.keys(UNIT_TYPES).forEach(type => {
    const config = UNIT_TYPES[type];
    const button = document.createElement('button');
    button.className = `tab-button ${type === currentType && currentView !== 'dashboard' && currentView !== 'quick-view' && currentView !== 'clients' ? 'active' : ''}`;
    button.innerHTML = `${config.icon} ${config.label}`;
    button.dataset.type = type;
    
    button.addEventListener('click', () => {
      switchTab(type);
    });
    
    tabsContainer.appendChild(button);
  });
}

/**
 * Cambiar de pestaña
 * @param {string} type - Tipo de recurso a mostrar, 'dashboard', 'quick-view', o 'clients'
 */
function switchTab(type) {
  clearSelection();
  
  // Actualizar botones activos
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  if (type === 'dashboard') {
    currentView = 'dashboard';
    showDashboard();
  } else if (type === 'quick-view') {
    currentView = 'quick-view';
    showQuickView();
  } else if (type === 'clients') {
    // ✅ NUEVO: Vista de clientes
    currentView = 'clients';
    showClientsView();
  } else if (type === 'pool') {
    // ✅ NUEVO: Vista de pileta
    currentView = 'pool';
    showPoolSection();
  } else {
    currentView = 'resource';
    currentType = type;
    showResourceView();
    renderGrid(type);
    updateAvailabilityStats();
    renderRentalsTable();
  }
  
  // Re-aplicar modo privacidad si está activo
  if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
    setTimeout(() => {
      hideFinancialInfo();
    }, 100);
  }
}

/**
 * Mostrar vista del dashboard
 */
function showDashboard() {
  document.getElementById('dashboard-container').style.display = 'block';
  document.getElementById('resource-content').style.display = 'none';
  document.getElementById('manage-pricing-btn').style.display = 'none';
  
  // Ocultar quick view
  const quickViewContainer = document.getElementById('quick-view-container');
  if (quickViewContainer) {
    quickViewContainer.style.display = 'none';
  }
  
  // Ocultar contenedor de clientes si existe
  const clientsContainer = document.getElementById('clients-container');
  if (clientsContainer) {
    clientsContainer.style.display = 'none';
  }
  
  // Ocultar contenedor de pileta si existe
  const poolContainer = document.getElementById('pool-container');
  if (poolContainer) {
    poolContainer.style.display = 'none';
  }
  
  // Verificar que renderDashboard esté disponible
  if (typeof renderDashboard === 'function') {
    renderDashboard();
  } else {
    console.error('❌ renderDashboard no está disponible. Verifica que dashboard.js esté cargado.');
    // Fallback temporal
    const container = document.getElementById('dashboard-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <h2>📊 Dashboard</h2>
          <p>Cargando dashboard...</p>
          <button class="btn btn-primary" onclick="location.reload()">Recargar</button>
        </div>
      `;
    }
  }
  
  // Re-aplicar modo privacidad si está activo
  if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
    setTimeout(() => {
      hideFinancialInfo();
    }, 100);
  }
}

/**
 * Mostrar vista rápida de plazas
 */
function showQuickView() {
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('resource-content').style.display = 'none';
  document.getElementById('quick-view-container').style.display = 'block';
  document.getElementById('manage-pricing-btn').style.display = 'none';
  
  // Ocultar contenedor de clientes si existe
  const clientsContainer = document.getElementById('clients-container');
  if (clientsContainer) {
    clientsContainer.style.display = 'none';
  }
  
  // Ocultar contenedor de pileta si existe
  const poolContainer = document.getElementById('pool-container');
  if (poolContainer) {
    poolContainer.style.display = 'none';
  }
  
  renderQuickView();
}

/**
 * Mostrar vista de recursos
 */
function showResourceView() {
  console.log('🔍 showResourceView() llamada - currentType:', currentType);
  console.log('🔍 UNIT_TYPES disponibles:', Object.keys(UNIT_TYPES));
  
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('resource-content').style.display = 'block';
  document.getElementById('manage-pricing-btn').style.display = 'inline-flex';
  
  // Asegurar que grid-container esté visible
  const gridContainer = document.getElementById('grid-container');
  if (gridContainer) {
    gridContainer.style.display = 'block';
  }
  
  // Ocultar quick view
  const quickViewContainer = document.getElementById('quick-view-container');
  if (quickViewContainer) {
    quickViewContainer.style.display = 'none';
  }
  
  // Ocultar contenedor de clientes si existe
  const clientsContainer = document.getElementById('clients-container');
  if (clientsContainer) {
    clientsContainer.style.display = 'none';
  }
  
  // Ocultar contenedor de pileta si existe
  const poolContainer = document.getElementById('pool-container');
  if (poolContainer) {
    poolContainer.style.display = 'none';
  }
  
  // Renderizar la vista del recurso actual
  console.log('🔍 Llamando renderGrid con tipo:', currentType);
  renderGrid(currentType);
  updateAvailabilityStats();
  renderRentalsTable();
}

/**
 * Renderizar la grilla principal del calendario
 * @param {string} type - Tipo de recurso
 */
function renderGrid(type) {
  const gridContainer = document.getElementById('grid-container');
  gridContainer.innerHTML = '<div class="loading">Cargando grilla...</div>';
  
  const config = UNIT_TYPES[type];
  const periods = calculatePeriods();
  const currentPeriod = periods[currentPeriodIndex];
  
  // Actualizar display del período
  updatePeriodDisplay(currentPeriod);
  
  // Generar fechas del período actual
  const dates = [];
  const start = new Date(currentPeriod.startDate);
  const end = new Date(currentPeriod.endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  // Crear contenedor con scroll
  const wrapper = document.createElement('div');
  wrapper.className = 'grid-wrapper';
  
  // Crear grilla
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  grid.style.gridTemplateColumns = `80px repeat(${dates.length}, 60px)`;
  
  // Header vacío (esquina superior izquierda)
  const cornerCell = document.createElement('div');
  cornerCell.className = 'grid-header-corner';
  cornerCell.textContent = config.prefix;
  grid.appendChild(cornerCell);
  
  // Headers de fechas (columnas)
  dates.forEach(date => {
    const headerCell = document.createElement('div');
    headerCell.className = 'grid-header-date';
    headerCell.textContent = formatDateDisplay(date);
    headerCell.title = date;
    
    // Resaltar fecha de hoy
    if (date === getTodayDate()) {
      headerCell.classList.add('today');
    }
    
    // Resaltar días de carnaval
    if (isCarnavalDate(date)) {
      headerCell.classList.add('carnaval');
    }
    
    grid.appendChild(headerCell);
  });
  
  // Filas de unidades
  for (let unitNum = 1; unitNum <= config.total; unitNum++) {
    // Header de unidad (fila)
    const unitHeader = document.createElement('div');
    unitHeader.className = 'grid-header-unit';
    unitHeader.textContent = `${config.prefix}${unitNum}`;
    grid.appendChild(unitHeader);
    
    // Celdas de cada día
    dates.forEach(date => {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.type = type;
      cell.dataset.unit = unitNum;
      cell.dataset.date = date;
      
      // Marcar columna de HOY
      if (date === getTodayDate()) {
        cell.classList.add('today-column');
      }
      
      // Verificar si está ocupada
      const rental = getRentalByUnitAndDate(type, unitNum, date);
      
      if (rental) {
        cell.classList.add('occupied');
        cell.dataset.rentalId = rental.id;
        cell.title = `Ocupado por: ${rental.clientName}\nTeléfono: ${rental.clientPhone}\nClick para ver detalles`;
        
        // Agregar nombre del cliente abreviado
        const clientNameShort = getClientNameShort(rental.clientName);
        cell.textContent = clientNameShort;
        
        // Asignar color basado en el hash del ID del alquiler
        const colorClass = `rental-color-${getColorIndexFromId(rental.id)}`;
        cell.classList.add(colorClass);
      } else {
        cell.classList.add('available');
        cell.title = `${config.prefix}${unitNum} - ${formatDateDisplay(date)}`;
        
        // Marcar días de carnaval disponibles
        if (isCarnavalDate(date)) {
          cell.classList.add('carnaval');
        }
      }
      
      grid.appendChild(cell);
    });
  }
  
  wrapper.appendChild(grid);
  gridContainer.innerHTML = '';
  gridContainer.appendChild(wrapper);
  
  // Agregar event listeners a las celdas
  attachCellListeners();
}

/**
 * Actualizar display del período actual
 */
function updatePeriodDisplay(period) {
  const periodRangeElement = document.getElementById('period-range');
  const prevBtn = document.getElementById('prev-period');
  const nextBtn = document.getElementById('next-period');
  const periods = calculatePeriods();
  
  if (periodRangeElement) {
    const startFormatted = formatDateDisplay(period.startDate);
    const endFormatted = formatDateDisplay(period.endDate);
    periodRangeElement.textContent = `${startFormatted} al ${endFormatted} (${period.days} días)`;
  }
  
  // Habilitar/deshabilitar botones
  if (prevBtn) {
    prevBtn.disabled = currentPeriodIndex === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentPeriodIndex >= periods.length - 1;
  }
}

/**
 * Adjuntar event listeners a las celdas de la grilla
 */
function attachCellListeners() {
  const cells = document.querySelectorAll('.grid-cell');
  
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });
}

/**
 * Manejar click en una celda
 * @param {Event} event - Evento de click
 */
function handleCellClick(event) {
  const cell = event.target;
  
  if (!cell.classList.contains('grid-cell')) return;
  
  // Si la celda está ocupada, mostrar detalles
  if (cell.classList.contains('occupied')) {
    const rentalId = cell.dataset.rentalId;
    showRentalDetails(rentalId);
    return;
  }
  
  // Si está disponible, iniciar selección
  if (cell.classList.contains('available')) {
    startSelection(cell);
  }
}

/**
 * Iniciar selección de rango de fechas
 * @param {HTMLElement} startCell - Celda inicial
 */
function startSelection(startCell) {
  clearSelection();
  
  const type = startCell.dataset.type;
  const unitNumber = parseInt(startCell.dataset.unit);
  const startDate = startCell.dataset.date;
  
  selectedCells = [startCell];
  highlightCells([startCell], 'selected');
  
  // Mostrar mensaje para seleccionar fecha final
  showSelectionPrompt(type, unitNumber, startDate);
}

/**
 * Mostrar prompt para seleccionar fecha final
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} startDate - Fecha inicial
 */
function showSelectionPrompt(type, unitNumber, startDate) {
  const config = UNIT_TYPES[type];
  
  // Crear overlay temporal
  const overlay = document.createElement('div');
  overlay.className = 'selection-prompt-overlay';
  overlay.innerHTML = `
    <div class="selection-prompt">
      <h3>Seleccionar rango de fechas</h3>
      <p><strong>${config.icon} ${config.prefix}${unitNumber}</strong></p>
      <p>Desde: <strong>${formatDateDisplay(startDate)}</strong></p>
      <label for="end-date-select">Hasta:</label>
      <input type="date" id="end-date-select" min="${startDate}" max="2025-02-28" value="${startDate}">
      <div class="prompt-buttons">
        <button id="cancel-selection" class="btn-secondary">Cancelar</button>
        <button id="confirm-selection" class="btn-primary">Continuar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Event listeners
  document.getElementById('cancel-selection').addEventListener('click', () => {
    clearSelection();
    overlay.remove();
  });
  
  document.getElementById('confirm-selection').addEventListener('click', () => {
    const endDate = document.getElementById('end-date-select').value;
    
    if (!endDate || endDate < startDate) {
      showNotification('La fecha final debe ser igual o posterior a la fecha inicial', 'error');
      return;
    }
    
    // Validar que todas las fechas del rango estén disponibles
    const isAvailable = validateDateRange(type, unitNumber, startDate, endDate);
    
    if (!isAvailable) {
      showNotification('Hay días ocupados en el rango seleccionado', 'error');
      clearSelection();
      overlay.remove();
      return;
    }
    
    // Seleccionar todas las celdas del rango
    selectDateRange(type, unitNumber, startDate, endDate);
    overlay.remove();
    
    // Mostrar modal de nuevo alquiler
    showNewRentalModal(type, unitNumber, startDate, endDate);
  });
  
  // Cerrar con click en overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      clearSelection();
      overlay.remove();
    }
  });
}

/**
 * Validar que un rango de fechas esté disponible
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 * @returns {boolean} true si está disponible
 */
function validateDateRange(type, unitNumber, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const rental = getRentalByUnitAndDate(type, unitNumber, dateStr);
    
    if (rental) {
      return false;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return true;
}

/**
 * Seleccionar todas las celdas en un rango de fechas
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 */
function selectDateRange(type, unitNumber, startDate, endDate) {
  clearSelection();
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  const cellsToSelect = [];
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const cell = document.querySelector(
      `.grid-cell[data-type="${type}"][data-unit="${unitNumber}"][data-date="${dateStr}"]`
    );
    
    if (cell) {
      cellsToSelect.push(cell);
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  selectedCells = cellsToSelect;
  highlightCells(cellsToSelect, 'selected');
}

/**
 * Resaltar celdas con un color específico
 * @param {Array<HTMLElement>} cells - Array de celdas a resaltar
 * @param {string} state - Estado del color (available, occupied, selected)
 */
function highlightCells(cells, state) {
  cells.forEach(cell => {
    cell.style.backgroundColor = CELL_COLORS[state];
    
    if (state === 'selected') {
      cell.classList.add('selected');
    }
  });
}

/**
 * Limpiar selección actual
 */
function clearSelection() {
  selectedCells.forEach(cell => {
    cell.classList.remove('selected');
    cell.style.backgroundColor = '';
  });
  
  selectedCells = [];
  selectionMode = false;
}

/**
 * Mostrar modal de nuevo alquiler
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 */
function showNewRentalModal(type, unitNumber, startDate, endDate) {
  const config = UNIT_TYPES[type];
  const days = calculateDays(startDate, endDate);
  
  // Obtener precio sugerido basado en las tarifas configuradas
  const suggestedPrice = getSuggestedPriceForRange(type, startDate, endDate);
  const priceValue = suggestedPrice || '';
  const priceWarning = !suggestedPrice ? '<div class="pricing-warning" style="margin-bottom: var(--spacing-md);">⚠️ No hay tarifas configuradas para este período. Configure las tarifas primero.</div>' : '';
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Nuevo Alquiler</h2>
        <button class="modal-close" id="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="rental-type-title">
          <h1>${config.icon} ${config.label.toUpperCase()}</h1>
        </div>
        <div class="rental-summary">
          <p><strong>${config.icon} ${config.label}:</strong> ${config.prefix}${unitNumber}</p>
          <p><strong>Período:</strong> ${formatDateDisplay(startDate)} al ${formatDateDisplay(endDate)}</p>
          <p><strong>Días:</strong> ${days}</p>
        </div>
        
        ${priceWarning}
        
        <form id="rental-form">
          <!-- 👤 SECCIÓN DE CLIENTE SIMPLIFICADA -->
          <div class="client-search-section">
            <h3>👤 Datos del Cliente</h3>
            
            <!-- Alerta cuando cliente existe -->
            <div id="client-found-alert" class="client-found-alert" style="display: none;">
              <div class="alert-content">
                <span class="alert-icon">✅</span>
                <div class="alert-text">
                  <strong>Cliente encontrado:</strong>
                  <span id="found-client-name"></span>
                </div>
                <button type="button" id="clear-client-btn" class="btn-clear-client" title="Limpiar formulario">✖</button>
              </div>
              <div class="client-quick-info" id="client-quick-info"></div>
            </div>
            
            <!-- Formulario de cliente siempre visible -->
            <div id="client-form-fields">
              <div class="form-group">
                <label for="client-dni">DNI / Pasaporte *</label>
                <div class="search-input-group">
                  <input type="text" id="client-dni" required placeholder="12345678" pattern="\\d{7,8}">
                  <button type="button" id="search-client-btn" class="btn-search-client" title="Buscar cliente existente">
                    🔍 Buscar
                  </button>
                </div>
                <small>Ingrese DNI y presione buscar para autocompletar datos</small>
              </div>
              
              <div class="form-group">
                <label for="client-name">Nombre Completo *</label>
                <input type="text" id="client-name" required placeholder="Ej: Juan Pérez">
              </div>
              
              <div class="form-group">
                <label for="client-phone">Teléfono *</label>
                <input type="tel" id="client-phone" required placeholder="2262123456" pattern="\\d{10}">
                <small>10 dígitos sin espacios ni guiones</small>
              </div>
              
              <div class="form-group">
                <label for="client-email">Email (opcional)</label>
                <input type="email" id="client-email" placeholder="cliente@email.com">
              </div>
              
              <!-- 📍 DATOS DE PROCEDENCIA -->
              <details class="origin-details">
                <summary>📍 Datos de Procedencia (opcional)</summary>
                <div class="origin-fields">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="client-country">País</label>
                      <input type="text" id="client-country" placeholder="Argentina" value="Argentina">
                    </div>
                    <div class="form-group">
                      <label for="client-state">Provincia/Estado</label>
                      <input type="text" id="client-state" placeholder="Buenos Aires">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="client-city">Ciudad</label>
                    <input type="text" id="client-city" placeholder="Capital Federal">
                  </div>
                  
                  <div class="form-group">
                    <label for="client-neighborhood">Barrio</label>
                    <input type="text" id="client-neighborhood" placeholder="Palermo">
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group" style="flex: 2;">
                      <label for="client-street">Calle</label>
                      <input type="text" id="client-street" placeholder="Av. Santa Fe">
                    </div>
                    <div class="form-group" style="flex: 1;">
                      <label for="client-number">Número</label>
                      <input type="text" id="client-number" placeholder="1234">
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="client-floor">Piso/Depto</label>
                      <input type="text" id="client-floor" placeholder="5°B">
                    </div>
                    <div class="form-group">
                      <label for="client-zipcode">Código Postal</label>
                      <input type="text" id="client-zipcode" placeholder="C1060">
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
          
          <!-- 💰 SECCIÓN DE PAGO -->
          <div class="payment-section">
            <h3>💰 Información de Pago</h3>
            
            <div class="form-group">
              <label for="price-per-day">Precio base por día ($) *</label>
              <input type="number" id="price-per-day" required min="1" step="1" placeholder="5000" value="${priceValue}">
              ${suggestedPrice ? '<small style="color: #4CAF50;">✓ Precio sugerido según tarifas configuradas</small>' : ''}
            </div>
            
            <div id="discount-info" class="discount-info" style="display: none;">
              <div class="discount-badge">
                <span id="discount-icon"></span>
                <span id="discount-text"></span>
              </div>
            </div>
            
            <div class="total-price-breakdown">
              <div class="price-row" id="subtotal-row" style="display: none;">
                <span>Subtotal:</span>
                <span>$<span id="subtotal-display">0</span></span>
              </div>
              <div class="price-row discount-row" id="discount-row" style="display: none;">
                <span>🎁 Descuento (<span id="discount-percentage">0</span>%):</span>
                <span style="color: #4CAF50;">-$<span id="discount-amount-display">0</span></span>
              </div>
              <div class="price-row total-row">
                <strong>Total a pagar:</strong>
                <strong>$<span id="total-display">0</span></strong>
              </div>
            </div>
            
            <div class="form-group">
              <label for="payment-method">Método de Pago *</label>
              <select id="payment-method" required>
                <option value="">Seleccionar...</option>
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="mercadopago">📱 MercadoPago</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="payment-status">Estado del Pago *</label>
              <select id="payment-status" required>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="parcial">⚠️ Pago Parcial</option>
                <option value="pagado">✅ Pagado</option>
              </select>
            </div>
            
            <div class="form-group" id="amount-paid-group">
              <label for="amount-paid">Monto Pagado ($)</label>
              <input type="number" id="amount-paid" min="0" step="1" placeholder="0" value="0">
              <small>Dejar en 0 si no se pagó nada aún</small>
            </div>
          </div>
          
          ${(type === 'sombrilla' || type === 'carpa') ? `
            <div class="form-group parking-option">
              <label class="checkbox-label">
                <input type="checkbox" id="include-parking">
                <span>🚗 Incluir plaza de estacionamiento</span>
              </label>
              <small>Se asignará automáticamente una plaza disponible para las mismas fechas</small>
            </div>
            
            <div id="parking-details" style="display: none;">
              <div class="parking-details-section">
                <h4>Detalles del Estacionamiento</h4>
                
                <div class="form-group">
                  <label for="parking-price">Precio por día Estacionamiento ($) *</label>
                  <input type="number" id="parking-price" min="1" step="1" placeholder="1000" value="${getSuggestedPriceForRange('estacionamiento', startDate, endDate) || 1000}">
                  <small>Precio diario para la plaza de estacionamiento</small>
                </div>
                
                <div class="parking-total-display">
                  <strong>Total Estacionamiento: $<span id="parking-total-display">0</span></strong>
                  <small>(${days} días)</small>
                </div>
                
                <div class="form-group">
                  <label for="parking-payment-method">Método de Pago Estacionamiento *</label>
                  <select id="parking-payment-method">
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="mercadopago">📱 MercadoPago</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="parking-payment-status">Estado del Pago Estacionamiento *</label>
                  <select id="parking-payment-status">
                    <option value="pendiente" selected>⏳ Pendiente</option>
                    <option value="parcial">⚠️ Pago Parcial</option>
                    <option value="pagado">✅ Pagado</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="parking-amount-paid">Monto Pagado Estacionamiento ($)</label>
                  <input type="number" id="parking-amount-paid" min="0" step="1" placeholder="0" value="0">
                  <small>Monto actual pagado por el estacionamiento</small>
                </div>
                
                <div class="grand-total-display">
                  <strong>💰 TOTAL GENERAL: $<span id="grand-total-display">0</span></strong>
                  <small>Incluye ${config.label.toLowerCase()} + estacionamiento</small>
                </div>
              </div>
            </div>
          ` : ''}
          
          <div class="modal-buttons">
            <button type="button" class="btn-secondary" id="cancel-rental">Cancelar</button>
            <button type="submit" class="btn-primary">Confirmar Alquiler</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Actualizar total automáticamente
  const priceInput = document.getElementById('price-per-day');
  const totalDisplay = document.getElementById('total-display');
  const subtotalDisplay = document.getElementById('subtotal-display');
  const discountAmountDisplay = document.getElementById('discount-amount-display');
  const discountPercentageSpan = document.getElementById('discount-percentage');
  const paymentStatusSelect = document.getElementById('payment-status');
  const amountPaidInput = document.getElementById('amount-paid');
  const discountRow = document.getElementById('discount-row');
  const subtotalRow = document.getElementById('subtotal-row');
  const discountInfo = document.getElementById('discount-info');
  const discountIcon = document.getElementById('discount-icon');
  const discountText = document.getElementById('discount-text');
  
  let totalPrice = 0;
  let currentClientId = null; // Se actualiza cuando se busca un cliente
  let currentClient = null; // Variable para almacenar el cliente encontrado
  
  function updatePriceDisplay() {
    const price = parseFloat(priceInput.value) || 0;
    const priceCalculation = calculateTotalPrice(price, days, currentClientId);
    
    totalPrice = priceCalculation.finalPrice;
    
    // Mostrar descuento si aplica
    if (priceCalculation.discountPercentage > 0) {
      subtotalRow.style.display = 'flex';
      discountRow.style.display = 'flex';
      discountInfo.style.display = 'block';
      
      subtotalDisplay.textContent = priceCalculation.basePrice.toLocaleString('es-AR');
      discountAmountDisplay.textContent = priceCalculation.discount.toLocaleString('es-AR');
      discountPercentageSpan.textContent = priceCalculation.discountPercentage;
      
      // Icono y texto según tipo de cliente
      if (priceCalculation.clientType === 'vip') {
        discountIcon.textContent = '👑';
        discountText.textContent = 'Cliente VIP - Descuento aplicado automáticamente';
        discountInfo.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
      } else if (priceCalculation.clientType === 'frecuente') {
        discountIcon.textContent = '⭐';
        discountText.textContent = 'Cliente Frecuente - Descuento aplicado automáticamente';
        discountInfo.style.background = 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)';
      }
    } else {
      subtotalRow.style.display = 'none';
      discountRow.style.display = 'none';
      discountInfo.style.display = 'none';
    }
    
    totalDisplay.textContent = totalPrice.toLocaleString('es-AR');
    updatePaymentStatus();
  }
  
  priceInput.addEventListener('input', updatePriceDisplay);
  
  // Calcular precio inicial
  updatePriceDisplay();
  
  // Actualizar estado de pago según monto pagado
  amountPaidInput.addEventListener('input', updatePaymentStatus);
  
  function updatePaymentStatus() {
    const amountPaid = parseFloat(amountPaidInput.value) || 0;
    
    if (amountPaid === 0) {
      paymentStatusSelect.value = 'pendiente';
    } else if (amountPaid >= totalPrice) {
      paymentStatusSelect.value = 'pagado';
      amountPaidInput.value = totalPrice; // No puede pagar más del total
    } else {
      paymentStatusSelect.value = 'parcial';
    }
  }
  
  // Manejar checkbox de estacionamiento
  const includeParkingCheckbox = document.getElementById('include-parking');
  const parkingDetailsSection = document.getElementById('parking-details');
  
  if (includeParkingCheckbox && parkingDetailsSection) {
    includeParkingCheckbox.addEventListener('change', () => {
      parkingDetailsSection.style.display = includeParkingCheckbox.checked ? 'block' : 'none';
      updateGrandTotal();
    });
    
    // Actualizar estado de pago del estacionamiento
    const parkingPriceInput = document.getElementById('parking-price');
    const parkingAmountPaidInput = document.getElementById('parking-amount-paid');
    const parkingPaymentStatusSelect = document.getElementById('parking-payment-status');
    const parkingTotalDisplay = document.getElementById('parking-total-display');
    
    if (parkingPriceInput && parkingAmountPaidInput && parkingPaymentStatusSelect) {
      const parkingDays = calculateDays(startDate, endDate);
      
      // Calcular y mostrar total del estacionamiento al cargar
      const initialParkingPrice = parseFloat(parkingPriceInput.value) || 0;
      const initialParkingTotal = initialParkingPrice * parkingDays;
      parkingTotalDisplay.textContent = initialParkingTotal.toLocaleString('es-AR');
      
      // Actualizar al cambiar el precio del estacionamiento
      parkingPriceInput.addEventListener('input', () => {
        const parkingPrice = parseFloat(parkingPriceInput.value) || 0;
        const parkingTotal = parkingPrice * parkingDays;
        parkingTotalDisplay.textContent = parkingTotal.toLocaleString('es-AR');
        updateGrandTotal();
      });
      
      parkingAmountPaidInput.addEventListener('input', () => {
        const parkingPrice = parseFloat(parkingPriceInput.value) || 0;
        const parkingTotal = parkingPrice * parkingDays;
        const parkingAmountPaid = parseFloat(parkingAmountPaidInput.value) || 0;
        
        if (parkingAmountPaid === 0) {
          parkingPaymentStatusSelect.value = 'pendiente';
        } else if (parkingAmountPaid >= parkingTotal) {
          parkingPaymentStatusSelect.value = 'pagado';
          parkingAmountPaidInput.value = parkingTotal;
        } else {
          parkingPaymentStatusSelect.value = 'parcial';
        }
      });
    }
  }
  
  // Función para actualizar el total general
  function updateGrandTotal() {
    const grandTotalDisplay = document.getElementById('grand-total-display');
    if (!grandTotalDisplay) return;
    
    const rentalTotal = totalPrice; // Total del alquiler principal
    let grandTotal = rentalTotal;
    
    if (includeParkingCheckbox && includeParkingCheckbox.checked) {
      const parkingPriceInput = document.getElementById('parking-price');
      const parkingPrice = parseFloat(parkingPriceInput.value) || 0;
      const parkingDays = calculateDays(startDate, endDate);
      const parkingTotal = parkingPrice * parkingDays;
      grandTotal += parkingTotal;
    }
    
    grandTotalDisplay.textContent = grandTotal.toLocaleString('es-AR');
  }
  
  // Actualizar total general cuando cambia el precio principal
  priceInput.addEventListener('input', updateGrandTotal);
  
  // Inicializar total general
  updateGrandTotal();
  
  // ✅ Event listeners para búsqueda y autocompletado de clientes
  // (currentClient ya está declarado más arriba)
  
  const searchClientBtn = document.getElementById('search-client-btn');
  const clientDNIInput = document.getElementById('client-dni');
  const clientFoundAlert = document.getElementById('client-found-alert');
  const clientQuickInfo = document.getElementById('client-quick-info');
  const foundClientName = document.getElementById('found-client-name');
  const clearClientBtn = document.getElementById('clear-client-btn');
  
  // Buscar cliente al hacer click en el botón
  if (searchClientBtn) {
    searchClientBtn.addEventListener('click', () => {
      const dni = clientDNIInput.value.trim();
      if (!dni) {
        showNotification('⚠️ Ingrese un DNI para buscar', 'warning');
        clientDNIInput.focus();
        return;
      }
      
      const client = getClientByDNI(dni);
      
      if (client) {
        // ✅ Cliente encontrado - autocompletar todos los campos
        currentClient = client;
        currentClientId = client.id; // Guardar el ID para calcular descuentos
        
        // Autocompletar campos básicos
        document.getElementById('client-name').value = client.fullName;
        document.getElementById('client-phone').value = client.phone;
        document.getElementById('client-email').value = client.email || '';
        
        // Autocompletar datos de procedencia si existen
        if (client.origin) {
          document.getElementById('client-country').value = client.origin.country || 'Argentina';
          document.getElementById('client-state').value = client.origin.state || '';
          document.getElementById('client-city').value = client.origin.city || '';
          document.getElementById('client-neighborhood').value = client.origin.address?.neighborhood || '';
          document.getElementById('client-street').value = client.origin.address?.street || '';
          document.getElementById('client-number').value = client.origin.address?.number || '';
          document.getElementById('client-floor').value = client.origin.address?.floor || '';
          document.getElementById('client-zipcode').value = client.origin.address?.zipCode || '';
        }
        
        // Mostrar alerta con información del cliente
        foundClientName.textContent = client.fullName;
        
        const clientTypeLabels = {
          'regular': '👤 Cliente Regular',
          'frecuente': '⭐ Cliente Frecuente',
          'vip': '🏆 Cliente VIP',
          'blacklist': '🚫 LISTA NEGRA'
        };
        
        let infoHTML = `
          <div class="client-stats">
            <span class="client-type ${client.clientType}">${clientTypeLabels[client.clientType] || '👤 Cliente'}</span>
            <span>📊 ${client.totalReservations || 0} reservas</span>
            <span class="amount-field">💰 $${(client.totalSpent || 0).toLocaleString('es-AR')}</span>
          </div>
        `;
        
        if (client.clientType === 'blacklist') {
          infoHTML += `<div class="blacklist-warning">⚠️ ADVERTENCIA: ${client.blacklistReason || 'Cliente en lista negra'}</div>`;
        }
        
        if (client.notes) {
          infoHTML += `<div class="client-notes-display">📝 ${client.notes}</div>`;
        }
        
        clientQuickInfo.innerHTML = infoHTML;
        clientFoundAlert.style.display = 'block';
        
        // Actualizar el cálculo de precio con descuento
        updatePriceDisplay();
        
        showNotification('✅ Cliente encontrado y datos autocompletados', 'success');
        
        // Enfocar en el siguiente campo (precio)
        document.getElementById('price-per-day').focus();
      } else {
        // ℹ️ Cliente no encontrado - mantener formulario limpio para crear nuevo
        currentClient = null;
        currentClientId = null; // Limpiar ID para no aplicar descuento
        clientFoundAlert.style.display = 'none';
        
        // Actualizar el cálculo de precio sin descuento
        updatePriceDisplay();
        
        showNotification('ℹ️ DNI no encontrado. Ingrese los datos para crear el cliente', 'info');
        
        // Limpiar solo los campos de datos (mantener DNI)
        document.getElementById('client-name').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-email').value = '';
        
        // Enfocar en nombre para continuar
        document.getElementById('client-name').focus();
      }
    });
  }
  
  // Buscar también al presionar Enter en el campo DNI
  if (clientDNIInput) {
    clientDNIInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchClientBtn.click();
      }
    });
  }
  
  // Limpiar búsqueda y crear cliente nuevo
  if (clearClientBtn) {
    clearClientBtn.addEventListener('click', () => {
      currentClient = null;
      currentClientId = null; // Limpiar ID para no aplicar descuento
      clientFoundAlert.style.display = 'none';
      document.getElementById('client-name').value = '';
      document.getElementById('client-phone').value = '';
      document.getElementById('client-email').value = '';
      
      // Actualizar el cálculo de precio sin descuento
      updatePriceDisplay();
      
      document.getElementById('client-name').focus();
      showNotification('ℹ️ Creando cliente nuevo', 'info');
    });
  }
  
  // Event listeners
  document.getElementById('close-modal').addEventListener('click', () => {
    clearSelection();
    modal.remove();
  });
  
  document.getElementById('cancel-rental').addEventListener('click', () => {
    clearSelection();
    modal.remove();
  });
  
  document.getElementById('rental-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleNewRentalSubmit(type, unitNumber, startDate, endDate, modal);
  });
  
  // Cerrar con click en overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      clearSelection();
      modal.remove();
    }
  });
  
  // Focus en el primer campo
  document.getElementById('client-name').focus();
}

/**
 * Manejar envío del formulario de nuevo alquiler
 */
function handleNewRentalSubmit(type, unitNumber, startDate, endDate, modal) {
  // ✅ NUEVO: Guardar o actualizar cliente primero
  const clientData = {
    fullName: document.getElementById('client-name').value,
    dni: document.getElementById('client-dni').value,
    phone: document.getElementById('client-phone').value,
    email: document.getElementById('client-email')?.value || '',
    origin: {
      country: document.getElementById('client-country')?.value || '',
      state: document.getElementById('client-state')?.value || '',
      city: document.getElementById('client-city')?.value || '',
      address: {
        neighborhood: document.getElementById('client-neighborhood')?.value || '',
        street: document.getElementById('client-street')?.value || '',
        number: document.getElementById('client-number')?.value || '',
        floor: document.getElementById('client-floor')?.value || '',
        zipCode: document.getElementById('client-zipcode')?.value || ''
      }
    }
  };
  
  // Buscar si existe el cliente para actualizar o crear
  const existingClient = getClientByDNI(clientData.dni);
  if (existingClient) {
    clientData.id = existingClient.id;
  }
  
  const savedClient = saveClient(clientData);
  
  if (!savedClient) {
    showNotification('❌ Error al guardar datos del cliente', 'error');
    return;
  }
  
  // Datos de la reserva
  const rentalData = {
    type,
    unitNumber,
    startDate,
    endDate,
    clientId: savedClient.id, // ✅ NUEVO: Vinculación con cliente
    clientName: savedClient.fullName,
    clientPhone: savedClient.phone,
    clientDNI: savedClient.dni,
    pricePerDay: parseFloat(document.getElementById('price-per-day').value),
    paymentMethod: document.getElementById('payment-method').value,
    paymentStatus: document.getElementById('payment-status').value,
    amountPaid: parseFloat(document.getElementById('amount-paid').value) || 0
  };
  
  const result = createRental(rentalData);
  
  if (result.success) {
    // ✅ NUEVO: Actualizar estadísticas del cliente con precio final (con descuento aplicado)
    updateClientStats(savedClient.id, result.rental.totalPrice, startDate);
    
    let successMsg = '✅ Alquiler registrado correctamente';
    let parkingCreated = false;
    let parkingResult = null;
    
    // Si es sombrilla o carpa, verificar si se debe incluir estacionamiento
    if ((type === 'sombrilla' || type === 'carpa')) {
      const includeParkingCheckbox = document.getElementById('include-parking');
      
      if (includeParkingCheckbox && includeParkingCheckbox.checked) {
        console.log('🚗 Buscando plaza de estacionamiento...');
        
        // Buscar plaza de estacionamiento disponible
        const parkingSpot = findAvailableParking(startDate, endDate);
        console.log('Plaza encontrada:', parkingSpot);
        
        if (parkingSpot) {
          // Obtener valores del formulario de estacionamiento
          const parkingPrice = parseFloat(document.getElementById('parking-price').value) || 1000;
          const parkingPaymentMethod = document.getElementById('parking-payment-method').value;
          const parkingPaymentStatus = document.getElementById('parking-payment-status').value;
          const parkingAmountPaid = parseFloat(document.getElementById('parking-amount-paid').value) || 0;
          
          console.log('Precio estacionamiento:', parkingPrice);
          console.log('Método de pago estacionamiento:', parkingPaymentMethod);
          console.log('Estado de pago estacionamiento:', parkingPaymentStatus);
          console.log('Monto pagado estacionamiento:', parkingAmountPaid);
          
          // Crear alquiler de estacionamiento con los datos del formulario
          const parkingData = {
            type: 'estacionamiento',
            unitNumber: parkingSpot,
            startDate,
            endDate,
            clientId: savedClient.id, // ✅ NUEVO: Mismo cliente
            clientName: savedClient.fullName,
            clientPhone: savedClient.phone,
            clientDNI: savedClient.dni,
            pricePerDay: parkingPrice,
            paymentMethod: parkingPaymentMethod,
            paymentStatus: parkingPaymentStatus,
            amountPaid: parkingAmountPaid
          };
          
          console.log('Creando alquiler de estacionamiento:', parkingData);
          parkingResult = createRental(parkingData);
          console.log('Resultado:', parkingResult);
          
          if (parkingResult.success) {
            // ✅ NUEVO: Actualizar estadísticas también para el estacionamiento
            updateClientStats(savedClient.id, parkingPrice * calculateDays(startDate, endDate), startDate);
            successMsg = `✅ Alquiler registrado correctamente<br>🚗 Plaza de estacionamiento E${parkingSpot} asignada automáticamente`;
            parkingCreated = true;
          } else {
            console.error('Error al crear estacionamiento:', parkingResult.errors);
            successMsg = `✅ Alquiler registrado correctamente<br>⚠️ No se pudo asignar estacionamiento: ${parkingResult.errors.join(', ')}`;
          }
        } else {
          console.warn('No hay plazas disponibles');
          successMsg = '✅ Alquiler registrado correctamente<br>⚠️ No hay plazas de estacionamiento disponibles para estas fechas';
        }
      }
    }
    
    showNotification(successMsg, 'success');
    clearSelection();
    modal.remove();
    renderGrid(currentType);
    updateAvailabilityStats();
    renderRentalsTable();
    
    // Si se creó estacionamiento, también actualizar esa vista
    if (parkingCreated) {
      console.log('✅ Estacionamiento asignado correctamente');
    }
    
    // Generar comprobante automáticamente
    const parkingRentalObj = parkingCreated && parkingResult.success ? parkingResult.rental : null;
    generateReceipt(result.rental, parkingRentalObj);
  } else {
    const errorMsg = result.errors.join('<br>');
    showNotification(errorMsg, 'error');
  }
}

/**
 * Mostrar detalles de un alquiler existente
 * @param {string} rentalId - ID del alquiler
 */
function showRentalDetails(rentalId) {
  const rental = getRentalById(rentalId);
  
  if (!rental) {
    showNotification('No se encontró el alquiler', 'error');
    return;
  }
  
  const config = UNIT_TYPES[rental.type];
  const days = calculateDays(rental.startDate, rental.endDate);
  
  // Calcular pagos usando el nuevo sistema
  const paidAmount = calculatePaidAmount(rental.id);
  const balance = rental.totalPrice - paidAmount;
  
  // Determinar estado de pago
  let paymentStatus;
  if (balance <= 0) {
    paymentStatus = 'pagado';
  } else if (paidAmount > 0) {
    paymentStatus = 'parcial';
  } else {
    paymentStatus = 'pendiente';
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Detalle del Alquiler</h2>
        <button class="modal-close" id="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="rental-details">
          <div class="detail-row">
            <span class="detail-label">Cliente:</span>
            <span class="detail-value">${rental.clientName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Teléfono:</span>
            <span class="detail-value">${rental.clientPhone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">DNI:</span>
            <span class="detail-value">${rental.clientDNI}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${config.icon} ${config.label}:</span>
            <span class="detail-value">${config.prefix}${rental.unitNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Desde:</span>
            <span class="detail-value">${formatDateDisplay(rental.startDate)} (${rental.startDate})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Hasta:</span>
            <span class="detail-value">${formatDateDisplay(rental.endDate)} (${rental.endDate})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Días:</span>
            <span class="detail-value">${days}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Precio/día:</span>
            <span class="detail-value">$${rental.pricePerDay.toLocaleString('es-AR')}</span>
          </div>
          <div class="detail-row total">
            <span class="detail-label">TOTAL:</span>
            <span class="detail-value">$${rental.totalPrice.toLocaleString('es-AR')}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Método de Pago:</span>
            <span class="detail-value">${getPaymentMethodLabel(rental.paymentMethod)}</span>
          </div>
          <div class="detail-row payment-status-row ${paymentStatus}">
            <span class="detail-label">Estado del Pago:</span>
            <span class="detail-value payment-status-badge">${getPaymentStatusLabel(paymentStatus)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Monto Pagado:</span>
            <span class="detail-value">$${paidAmount.toLocaleString('es-AR')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Saldo Pendiente:</span>
            <span class="detail-value">$${balance.toLocaleString('es-AR')}</span>
          </div>
        </div>
        
        <div class="modal-buttons">
          <button class="btn-secondary" id="close-details">Cerrar</button>
          <button class="btn-warning" id="manage-payments">💰 Gestionar Pagos</button>
          <button class="btn-info" id="view-receipt">📄 Ver Comprobante</button>
          <button class="btn-primary" id="edit-rental">✏️ Editar</button>
          <button class="btn-danger" id="delete-rental">❌ Cancelar Alquiler</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Re-aplicar modo privacidad si está activo
  if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
    setTimeout(() => {
      hideFinancialInfo();
    }, 50);
  }
  
  // Event listeners
  document.getElementById('close-modal').addEventListener('click', () => modal.remove());
  document.getElementById('close-details').addEventListener('click', () => modal.remove());
  
  document.getElementById('manage-payments').addEventListener('click', () => {
    modal.remove();
    showPaymentModal(rental);
  });
  
  document.getElementById('view-receipt').addEventListener('click', () => {
    modal.remove();
    
    // Buscar si hay estacionamiento asociado
    let parkingRental = null;
    if (rental.type === 'sombrilla' || rental.type === 'carpa') {
      // Buscar reserva de estacionamiento con mismo cliente y fechas
      const allRentals = getRentals();
      parkingRental = allRentals.find(r => 
        r.type === 'estacionamiento' &&
        r.clientDNI === rental.clientDNI &&
        r.startDate === rental.startDate &&
        r.endDate === rental.endDate
      );
    }
    
    // Generar comprobante
    generateReceipt(rental, parkingRental);
  });
  
  document.getElementById('edit-rental').addEventListener('click', () => {
    modal.remove();
    showEditRentalModal(rentalId);
  });
  
  document.getElementById('delete-rental').addEventListener('click', () => {
    if (confirm('¿Seguro que desea cancelar este alquiler?')) {
      const result = cancelRental(rentalId);
      
      if (result.success) {
        showNotification('Alquiler cancelado correctamente', 'success');
        modal.remove();
        renderGrid(currentType);
        updateAvailabilityStats();
        renderRentalsTable();
      } else {
        showNotification(result.message, 'error');
      }
    }
  });
  
  // Cerrar con click en overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Actualizar estadísticas de disponibilidad
 */
function updateAvailabilityStats() {
  const today = getTodayDate();
  const summary = getAvailabilitySummary(currentType, today);
  const config = UNIT_TYPES[currentType];
  
  const statsContainer = document.getElementById('availability-stats');
  statsContainer.innerHTML = `
    <div class="stats-numbers">
      <div class="stat">
        <span class="stat-value available">${summary.available}</span>
        <span class="stat-label">Disponibles</span>
      </div>
      <div class="stat">
        <span class="stat-value occupied">${summary.occupied}</span>
        <span class="stat-label">Ocupadas</span>
      </div>
      <div class="stat">
        <span class="stat-value total">${summary.total}</span>
        <span class="stat-label">Total</span>
      </div>
    </div>
  `;
}

/**
 * Consultar disponibilidad de una fecha específica
 */
function checkDateAvailability() {
  const dateInput = document.getElementById('check-date');
  const selectedDate = dateInput.value;
  
  if (!selectedDate) {
    showNotification('Por favor selecciona una fecha', 'error');
    return;
  }
  
  // Verificar que la fecha esté dentro de la temporada
  const seasonStart = new Date(SEASON.startDate);
  const seasonEnd = new Date(SEASON.endDate);
  const checkDate = new Date(selectedDate);
  
  if (checkDate < seasonStart || checkDate > seasonEnd) {
    showNotification('La fecha debe estar dentro de la temporada 2025-2026', 'error');
    return;
  }
  
  const summary = getAvailabilitySummary(currentType, selectedDate);
  const config = UNIT_TYPES[currentType];
  
  const statsContainer = document.getElementById('date-availability-stats');
  statsContainer.innerHTML = `
    <div class="stats-numbers">
      <div class="stat">
        <span class="stat-value available">${summary.available}</span>
        <span class="stat-label">Disponibles</span>
      </div>
      <div class="stat">
        <span class="stat-value occupied">${summary.occupied}</span>
        <span class="stat-label">Ocupadas</span>
      </div>
      <div class="stat">
        <span class="stat-value total">${summary.total}</span>
        <span class="stat-label">Total</span>
      </div>
    </div>
    <p style="text-align: center; margin-top: var(--spacing-sm); color: var(--text-secondary); font-size: var(--font-size-sm);">
      ${config.icon} ${config.label} - ${formatDateDisplay(selectedDate)}
    </p>
  `;
}

/**
 * Mostrar modal para editar un alquiler existente
 * @param {string} rentalId - ID del alquiler a editar
 */
function showEditRentalModal(rentalId) {
  const rental = getRentalById(rentalId);
  
  if (!rental) {
    showNotification('No se encontró el alquiler', 'error');
    return;
  }
  
  const config = UNIT_TYPES[rental.type];
  const days = calculateDays(rental.startDate, rental.endDate);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>✏️ Editar Alquiler</h2>
        <button class="modal-close" id="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="rental-summary">
          <p><strong>${config.icon} ${config.label}:</strong> ${config.prefix}${rental.unitNumber}</p>
          <p><strong>Período:</strong> ${formatDateDisplay(rental.startDate)} al ${formatDateDisplay(rental.endDate)}</p>
          <p><strong>Cliente:</strong> ${rental.clientName}</p>
          <p><strong>Días:</strong> ${days}</p>
        </div>
        
        <form id="edit-rental-form">
          <div class="form-group">
            <label for="edit-client-name">Nombre del Cliente *</label>
            <input type="text" id="edit-client-name" required value="${rental.clientName}">
          </div>
          
          <div class="form-group">
            <label for="edit-client-phone">Teléfono *</label>
            <input type="tel" id="edit-client-phone" required value="${rental.clientPhone}" pattern="\\d{10}">
            <small>10 dígitos sin espacios ni guiones</small>
          </div>
          
          <div class="form-group">
            <label for="edit-client-dni">DNI *</label>
            <input type="text" id="edit-client-dni" required value="${rental.clientDNI}" pattern="\\d{7,8}">
            <small>7 u 8 dígitos sin puntos</small>
          </div>
          
          <div class="form-group">
            <label for="edit-price-per-day">Precio por día ($) *</label>
            <input type="number" id="edit-price-per-day" required min="1" step="1" value="${rental.pricePerDay}">
          </div>
          
          <div class="total-price">
            <strong>Total: $<span id="edit-total-display">${rental.totalPrice.toLocaleString('es-AR')}</span></strong>
          </div>
          
          <div class="form-group">
            <label for="edit-payment-method">Método de Pago *</label>
            <select id="edit-payment-method" required>
              <option value="efectivo" ${rental.paymentMethod === 'efectivo' ? 'selected' : ''}>💵 Efectivo</option>
              <option value="transferencia" ${rental.paymentMethod === 'transferencia' ? 'selected' : ''}>🏦 Transferencia</option>
              <option value="tarjeta" ${rental.paymentMethod === 'tarjeta' ? 'selected' : ''}>💳 Tarjeta</option>
              <option value="mercadopago" ${rental.paymentMethod === 'mercadopago' ? 'selected' : ''}>📱 MercadoPago</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-payment-status">Estado del Pago *</label>
            <select id="edit-payment-status" required>
              <option value="pendiente" ${rental.paymentStatus === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
              <option value="parcial" ${rental.paymentStatus === 'parcial' ? 'selected' : ''}>⚠️ Pago Parcial</option>
              <option value="pagado" ${rental.paymentStatus === 'pagado' ? 'selected' : ''}>✅ Pagado</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-amount-paid">Monto Pagado ($)</label>
            <input type="number" id="edit-amount-paid" min="0" step="1" value="${rental.amountPaid || 0}">
            <small>Monto actual pagado por el cliente</small>
          </div>
          
          <div class="payment-info">
            <p>💰 <strong>Saldo Pendiente:</strong> $<span id="edit-balance-display">${(rental.totalPrice - (rental.amountPaid || 0)).toLocaleString('es-AR')}</span></p>
          </div>
          
          <div class="modal-buttons">
            <button type="button" class="btn-secondary" id="cancel-edit">Cancelar</button>
            <button type="submit" class="btn-primary">💾 Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Actualizar total y saldo automáticamente
  const priceInput = document.getElementById('edit-price-per-day');
  const totalDisplay = document.getElementById('edit-total-display');
  const paymentStatusSelect = document.getElementById('edit-payment-status');
  const amountPaidInput = document.getElementById('edit-amount-paid');
  const balanceDisplay = document.getElementById('edit-balance-display');
  
  let totalPrice = rental.totalPrice;
  
  function updateEditTotals() {
    const price = parseFloat(priceInput.value) || 0;
    totalPrice = calculateTotalPrice(price, days);
    totalDisplay.textContent = totalPrice.toLocaleString('es-AR');
    updateEditPaymentStatus();
  }
  
  function updateEditPaymentStatus() {
    const amountPaid = parseFloat(amountPaidInput.value) || 0;
    const balance = totalPrice - amountPaid;
    balanceDisplay.textContent = balance.toLocaleString('es-AR');
    
    if (amountPaid === 0) {
      paymentStatusSelect.value = 'pendiente';
    } else if (amountPaid >= totalPrice) {
      paymentStatusSelect.value = 'pagado';
      amountPaidInput.value = totalPrice;
    } else {
      paymentStatusSelect.value = 'parcial';
    }
  }
  
  priceInput.addEventListener('input', updateEditTotals);
  amountPaidInput.addEventListener('input', updateEditPaymentStatus);
  
  // Event listeners
  document.getElementById('close-modal').addEventListener('click', () => modal.remove());
  
  document.getElementById('cancel-edit').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('edit-rental-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleEditRentalSubmit(rentalId, modal);
  });
  
  // Cerrar con click en overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Focus en el primer campo editable
  document.getElementById('edit-client-name').focus();
}

/**
 * Manejar envío del formulario de edición
 */
function handleEditRentalSubmit(rentalId, modal) {
  const updatedData = {
    clientName: document.getElementById('edit-client-name').value,
    clientPhone: document.getElementById('edit-client-phone').value,
    clientDNI: document.getElementById('edit-client-dni').value,
    pricePerDay: parseFloat(document.getElementById('edit-price-per-day').value),
    paymentMethod: document.getElementById('edit-payment-method').value,
    paymentStatus: document.getElementById('edit-payment-status').value,
    amountPaid: parseFloat(document.getElementById('edit-amount-paid').value) || 0
  };
  
  const result = updateRental(rentalId, updatedData);
  
  if (result.success) {
    showNotification('✅ Alquiler actualizado correctamente', 'success');
    modal.remove();
    renderGrid(currentType);
    updateAvailabilityStats();
    renderRentalsTable();
  } else {
    const errorMsg = result.errors.join('<br>');
    showNotification(errorMsg, 'error');
  }
}

/**
 * Renderizar tabla de reservas activas
 */
function renderRentalsTable() {
  const tableContainer = document.getElementById('rentals-table-container');
  let rentals = getRentalsByType(currentType);
  const config = UNIT_TYPES[currentType];
  
  // Aplicar filtros
  rentals = applyFilters(rentals);
  
  if (rentals.length === 0) {
    tableContainer.innerHTML = `
      <div class="no-rentals">
        <p>No hay reservas que coincidan con los filtros seleccionados</p>
      </div>
    `;
    return;
  }
  
  // Ordenar por fecha de inicio
  rentals.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  let tableHTML = `
    <div class="table-wrapper">
      <table class="rentals-table">
        <thead>
          <tr>
            <th>Color</th>
            <th>${config.icon} Unidad</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Desde</th>
            <th>Hasta</th>
            <th>Días</th>
            <th>Total</th>
            <th>Estado Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  rentals.forEach(rental => {
    const colorIndex = getColorIndexFromId(rental.id);
    const days = calculateDays(rental.startDate, rental.endDate);
    const colorClass = `rental-color-${colorIndex}`;
    
    // Calcular pagos usando el nuevo sistema
    const paidAmount = calculatePaidAmount(rental.id);
    const balance = rental.totalPrice - paidAmount;
    
    // Determinar estado de pago
    let paymentStatus;
    if (balance <= 0) {
      paymentStatus = 'pagado';
    } else if (paidAmount > 0) {
      paymentStatus = 'parcial';
    } else {
      paymentStatus = 'pendiente';
    }
    
    const paymentStatusClass = `payment-badge-${paymentStatus}`;
    
    tableHTML += `
      <tr data-rental-id="${rental.id}">
        <td>
          <div class="color-indicator ${colorClass}"></div>
        </td>
        <td><strong>${config.prefix}${rental.unitNumber}</strong></td>
        <td>${rental.clientName}</td>
        <td>${rental.clientPhone}</td>
        <td>${formatDateDisplay(rental.startDate)}</td>
        <td>${formatDateDisplay(rental.endDate)}</td>
        <td>${days}</td>
        <td>$${rental.totalPrice.toLocaleString('es-AR')}</td>
        <td>
          <span class="payment-badge ${paymentStatusClass}" title="Pagado: $${paidAmount.toLocaleString('es-AR')} | Saldo: $${balance.toLocaleString('es-AR')}">
            ${getPaymentStatusLabel(paymentStatus)}
          </span>
        </td>
        <td class="actions-cell">
          <button class="btn-table-view" onclick="showRentalDetailsFromTable('${rental.id}')" title="Ver detalles">
            👁️
          </button>
          <button class="btn-table-move" onclick="showMoveRentalModal('${rental.id}')" title="Mover a otra unidad">
            ↔️
          </button>
          <button class="btn-table-delete" onclick="confirmDeleteRental('${rental.id}')" title="Cancelar">
            ❌
          </button>
        </td>
      </tr>
    `;
  });
  
  tableHTML += `
        </tbody>
      </table>
    </div>
    <div class="table-summary">
      <strong>Total de reservas: ${rentals.length}</strong>
    </div>
  `;
  
  tableContainer.innerHTML = tableHTML;
}

/**
 * Aplicar filtros a las reservas
 * @param {Array} rentals - Array de reservas
 * @returns {Array} - Reservas filtradas
 */
function applyFilters(rentals) {
  const filterMonth = document.getElementById('filter-month')?.value || '';
  const filterDate = document.getElementById('filter-date')?.value || '';
  const filterPayment = document.getElementById('filter-payment')?.value || '';
  
  let filtered = [...rentals];
  
  // Filtrar por mes
  if (filterMonth) {
    filtered = filtered.filter(rental => {
      // rental.startDate está en formato "YYYY-MM-DD"
      // Extraer año-mes directamente del string
      const yearMonth = rental.startDate.substring(0, 7); // "2025-11-15" -> "2025-11"
      return yearMonth === filterMonth;
    });
  }
  
  // Filtrar por fecha específica
  if (filterDate) {
    filtered = filtered.filter(rental => rental.startDate === filterDate);
  }
  
  // Filtrar por estado de pago
  if (filterPayment) {
    filtered = filtered.filter(rental => {
      const paymentStatus = rental.paymentStatus || 'pendiente';
      return paymentStatus === filterPayment;
    });
  }
  
  return filtered;
}

/**
 * Mostrar detalles de reserva desde la tabla
 * @param {string} rentalId - ID de la reserva
 */
function showRentalDetailsFromTable(rentalId) {
  showRentalDetails(rentalId);
}

/**
 * Mostrar modal para mover una reserva a otra unidad
 * @param {string} rentalId - ID de la reserva a mover
 */
function showMoveRentalModal(rentalId) {
  const rental = getRentalById(rentalId);
  
  if (!rental) {
    showNotification('No se encontró la reserva', 'error');
    return;
  }
  
  const config = UNIT_TYPES[rental.type];
  const days = calculateDays(rental.startDate, rental.endDate);
  
  // Generar opciones de unidades disponibles
  let unitOptions = '';
  for (let i = 1; i <= config.total; i++) {
    if (i !== rental.unitNumber) {
      unitOptions += `<option value="${i}">${config.prefix}${i}</option>`;
    }
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>↔️ Mover Reserva</h2>
        <button class="modal-close" id="close-move-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="rental-summary">
          <h3>Reserva Actual</h3>
          <p><strong>${config.icon} Unidad Actual:</strong> ${config.prefix}${rental.unitNumber}</p>
          <p><strong>Cliente:</strong> ${rental.clientName}</p>
          <p><strong>Período:</strong> ${formatDateDisplay(rental.startDate)} al ${formatDateDisplay(rental.endDate)}</p>
          <p><strong>Días:</strong> ${days}</p>
        </div>
        
        <div class="alert alert-info">
          ℹ️ Se verificará automáticamente que la nueva unidad esté disponible para todas las fechas de esta reserva.
        </div>
        
        <form id="move-rental-form">
          <div class="form-group">
            <label for="new-unit-number">Nueva Unidad *</label>
            <select id="new-unit-number" required>
              <option value="">Seleccionar ${config.label.toLowerCase()}...</option>
              ${unitOptions}
            </select>
            <small>Seleccione la unidad a la que desea mover esta reserva</small>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="cancel-move">Cancelar</button>
            <button type="submit" class="btn-primary">Mover Reserva</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const closeBtn = modal.querySelector('#close-move-modal');
  const cancelBtn = modal.querySelector('#cancel-move');
  const form = modal.querySelector('#move-rental-form');
  
  const closeModal = () => modal.remove();
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newUnitNumber = parseInt(document.getElementById('new-unit-number').value);
    
    if (!newUnitNumber) {
      showNotification('Debe seleccionar una unidad', 'error');
      return;
    }
    
    // Intentar mover la reserva
    const result = moveRental(rentalId, newUnitNumber);
    
    if (result.success) {
      showNotification(result.message, 'success');
      closeModal();
      renderGrid(currentType);
      renderRentalsTable();
    } else {
      // Mostrar errores
      const errorMsg = result.errors.join('<br>');
      showNotification(errorMsg, 'error');
    }
  });
}

/**
 * Confirmar eliminación de reserva desde la tabla
 * @param {string} rentalId - ID de la reserva
 */
function confirmDeleteRental(rentalId) {
  if (confirm('¿Seguro que desea cancelar este alquiler?')) {
    const result = cancelRental(rentalId);
    
    if (result.success) {
      showNotification('Alquiler cancelado correctamente', 'success');
      renderGrid(currentType);
      updateAvailabilityStats();
      renderRentalsTable();
    } else {
      showNotification(result.message, 'error');
    }
  }
}

/**
 * Mostrar notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, info)
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = message;
  
  document.body.appendChild(notification);
  
  // Mostrar con animación
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Ocultar después de 4 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Generar y mostrar comprobante de reserva
 * @param {Object} rental - Objeto de la reserva principal
 * @param {Object} parkingRental - Objeto de la reserva de estacionamiento (opcional)
 */
function generateReceipt(rental, parkingRental = null) {
  const config = UNIT_TYPES[rental.type];
  const days = calculateDays(rental.startDate, rental.endDate);
  const balance = rental.totalPrice - (rental.amountPaid || 0);
  
  // Calcular estado de pago considerando ambas reservas
  let paymentStatusIcon = '';
  let paymentStatusText = '';
  let paymentStatusClass = '';
  
  // Si hay estacionamiento, considerar ambos pagos
  if (parkingRental) {
    const parkingBalance = parkingRental.totalPrice - (parkingRental.amountPaid || 0);
    const totalToPay = rental.totalPrice + parkingRental.totalPrice;
    const totalPaid = (rental.amountPaid || 0) + (parkingRental.amountPaid || 0);
    
    if (totalPaid === 0) {
      paymentStatusIcon = '⏳';
      paymentStatusText = 'PENDIENTE DE PAGO';
      paymentStatusClass = 'pendiente';
    } else if (totalPaid >= totalToPay) {
      paymentStatusIcon = '✅';
      paymentStatusText = 'PAGADO COMPLETAMENTE';
      paymentStatusClass = 'pagado';
    } else {
      paymentStatusIcon = '⚠️';
      paymentStatusText = 'PAGO PARCIAL';
      paymentStatusClass = 'parcial';
    }
  } else {
    // Solo considerar el pago de la reserva principal
    if (rental.paymentStatus === 'pagado') {
      paymentStatusIcon = '✅';
      paymentStatusText = 'PAGADO COMPLETAMENTE';
      paymentStatusClass = 'pagado';
    } else if (rental.paymentStatus === 'parcial') {
      paymentStatusIcon = '⚠️';
      paymentStatusText = 'PAGO PARCIAL';
      paymentStatusClass = 'parcial';
    } else {
      paymentStatusIcon = '⏳';
      paymentStatusText = 'PENDIENTE DE PAGO';
      paymentStatusClass = 'pendiente';
    }
  }
  
  // Construir HTML del comprobante
  let receiptHTML = `
    <div class="receipt-container">
      <div class="receipt-header">
        <h1>🏖️ ZEUS BALNEARIO</h1>
        <p class="receipt-subtitle">Necochea, Argentina</p>
        <p class="receipt-date">Comprobante generado: ${new Date().toLocaleString('es-AR')}</p>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>DATOS DEL CLIENTE</h2>
        <div class="receipt-row">
          <span class="receipt-label">Nombre y Apellido:</span>
          <span class="receipt-value">${rental.clientName}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">DNI:</span>
          <span class="receipt-value">${rental.clientDNI}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Teléfono:</span>
          <span class="receipt-value">${rental.clientPhone}</span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>DETALLES DE LA RESERVA</h2>
        <div class="receipt-row">
          <span class="receipt-label">Fecha de Ingreso:</span>
          <span class="receipt-value highlight">${formatDateDisplay(rental.startDate)}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Fecha de Salida:</span>
          <span class="receipt-value highlight">${formatDateDisplay(rental.endDate)}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Total de días:</span>
          <span class="receipt-value">${days} días</span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>UNIDADES ASIGNADAS</h2>
        <div class="receipt-unit">
          <span class="unit-icon">${config.icon}</span>
          <span class="unit-type">${config.label}</span>
          <span class="unit-number">${config.prefix}${rental.unitNumber}</span>
        </div>
        ${parkingRental ? `
          <div class="receipt-unit">
            <span class="unit-icon">🚗</span>
            <span class="unit-type">Estacionamiento</span>
            <span class="unit-number">E${parkingRental.unitNumber}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>INFORMACIÓN DE PAGO</h2>
        <div class="receipt-row">
          <span class="receipt-label">${config.label}:</span>
          <span class="receipt-value">$${rental.totalPrice.toLocaleString('es-AR')}</span>
        </div>
        ${parkingRental ? `
          <div class="receipt-row">
            <span class="receipt-label">Estacionamiento:</span>
            <span class="receipt-value">$${parkingRental.totalPrice.toLocaleString('es-AR')}</span>
          </div>
        ` : ''}
        <div class="receipt-total">
          <span class="receipt-label">TOTAL:</span>
          <span class="receipt-value">$${(rental.totalPrice + (parkingRental ? parkingRental.totalPrice : 0)).toLocaleString('es-AR')}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Monto Pagado:</span>
          <span class="receipt-value">$${((rental.amountPaid || 0) + (parkingRental ? (parkingRental.amountPaid || 0) : 0)).toLocaleString('es-AR')}</span>
        </div>
        ${balance > 0 || (parkingRental && (parkingRental.totalPrice - (parkingRental.amountPaid || 0)) > 0) ? `
          <div class="receipt-row balance">
            <span class="receipt-label">Saldo Pendiente:</span>
            <span class="receipt-value">$${(balance + (parkingRental ? (parkingRental.totalPrice - (parkingRental.amountPaid || 0)) : 0)).toLocaleString('es-AR')}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-status ${paymentStatusClass}">
        <span class="status-icon">${paymentStatusIcon}</span>
        <span class="status-text">${paymentStatusText}</span>
      </div>
      
      ${parkingRental ? `
        <div class="receipt-detail-status">
          <div class="detail-status-item ${rental.paymentStatus}">
            ${rental.paymentStatus === 'pagado' ? '✅' : rental.paymentStatus === 'parcial' ? '⚠️' : '⏳'} 
            PAGO DE ${config.label.toUpperCase()} ${rental.paymentStatus === 'pagado' ? 'COMPLETO' : rental.paymentStatus === 'parcial' ? 'PARCIAL' : 'PENDIENTE'}
          </div>
          <div class="detail-status-item ${parkingRental.paymentStatus}">
            ${parkingRental.paymentStatus === 'pagado' ? '✅' : parkingRental.paymentStatus === 'parcial' ? '⚠️' : '⏳'} 
            PAGO DE ESTACIONAMIENTO ${parkingRental.paymentStatus === 'pagado' ? 'COMPLETO' : parkingRental.paymentStatus === 'parcial' ? 'PARCIAL' : 'PENDIENTE'}
          </div>
        </div>
      ` : ''}
      
      <div class="receipt-footer">
        <p>Conserve este comprobante como constancia de su reserva</p>
        <p class="receipt-footer-small">Zeus Balneario - Necochea, Argentina</p>
      </div>
    </div>
  `;
  
  // Crear modal para mostrar el comprobante
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-large">
      <div class="modal-header">
        <h2>📄 Comprobante de Reserva</h2>
        <button class="modal-close" id="close-receipt">&times;</button>
      </div>
      <div class="modal-body">
        ${receiptHTML}
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="close-receipt-btn">Cerrar</button>
          <button type="button" class="btn-primary" id="print-receipt">🖨️ Imprimir Comprobante</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Re-aplicar modo privacidad si está activo
  if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
    setTimeout(() => {
      hideFinancialInfo();
    }, 50);
  }
  
  // Event listeners
  const closeBtn = modal.querySelector('#close-receipt');
  const closeBtnBottom = modal.querySelector('#close-receipt-btn');
  const printBtn = modal.querySelector('#print-receipt');
  
  const closeModal = () => modal.remove();
  
  closeBtn.addEventListener('click', closeModal);
  closeBtnBottom.addEventListener('click', closeModal);
  
  printBtn.addEventListener('click', () => {
    // Crear ventana de impresión
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante de Reserva - Zeus Balneario</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 5px; font-size: 11px; line-height: 1.2; }
          .receipt-container { max-width: 100%; margin: 0 auto; }
          .receipt-header { text-align: center; margin-bottom: 5px; }
          .receipt-header h1 { margin: 0; color: #2196F3; font-size: 1.1rem; line-height: 1.1; }
          .receipt-subtitle { margin: 2px 0 0 0; color: #666; font-size: 11px; line-height: 1.1; }
          .receipt-date { font-size: 9px; color: #999; margin-top: 1px; }
          .receipt-divider { border-top: 1px dashed #ccc; margin: 4px 0; }
          .receipt-section { margin-bottom: 5px; }
          .receipt-section h2 { color: #2196F3; font-size: 12px; margin-bottom: 2px; border-bottom: 1px solid #eee; padding-bottom: 1px; line-height: 1.1; }
          .receipt-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; line-height: 1.2; }
          .receipt-label { font-weight: bold; }
          .receipt-value.highlight { color: #2196F3; font-weight: bold; font-size: 11px; }
          .receipt-unit { display: flex; align-items: center; padding: 4px; background: #f5f5f5; margin: 2px 0; border-radius: 3px; border-left: 3px solid #2196F3; }
          .unit-icon { font-size: 16px; margin-right: 5px; }
          .unit-type { flex: 1; font-weight: bold; font-size: 11px; }
          .unit-number { font-size: 13px; font-weight: bold; color: #2196F3; }
          .receipt-total { display: flex; justify-content: space-between; padding: 5px; background: #f0f0f0; margin: 4px 0; font-size: 13px; font-weight: bold; border-radius: 3px; }
          .receipt-row.balance { color: #F44336; font-weight: bold; padding: 3px 0; }
          .receipt-status { text-align: center; padding: 6px; font-size: 14px; font-weight: bold; margin: 5px 0; border-radius: 4px; line-height: 1.1; }
          .receipt-status.pagado { background: #4CAF50; color: white; }
          .receipt-status.parcial { background: #FF9800; color: white; }
          .receipt-status.pendiente { background: #9E9E9E; color: white; }
          .status-icon { font-size: 16px; margin-right: 3px; }
          .status-text { letter-spacing: 0.3px; }
          .receipt-detail-status { margin: 5px 0; display: flex; flex-direction: column; gap: 3px; }
          .detail-status-item { padding: 4px; border-radius: 3px; font-size: 10px; font-weight: 600; text-align: center; color: white; line-height: 1.2; }
          .detail-status-item.pagado { background: #4CAF50; }
          .detail-status-item.parcial { background: #FF9800; }
          .detail-status-item.pendiente { background: #9E9E9E; }
          .receipt-footer { text-align: center; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ccc; }
          .receipt-footer p { margin: 1px 0; font-size: 9px; line-height: 1.2; }
          .receipt-footer-small { font-size: 8px; color: #999; margin-top: 2px; }
          @media print {
            body { padding: 3px; }
            @page { 
              size: letter;
              margin: 0.2cm; 
            }
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/**
 * Adjuntar event listeners generales
 */
function attachEventListeners() {
  // Botón de nuevo alquiler rápido (opcional)
  const quickRentalBtn = document.getElementById('quick-rental-btn');
  if (quickRentalBtn) {
    quickRentalBtn.addEventListener('click', () => {
      showNotification('Haz click en una celda verde de la grilla para comenzar', 'info');
    });
  }
  
  // Botones de navegación de períodos
  const prevBtn = document.getElementById('prev-period');
  const nextBtn = document.getElementById('next-period');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const periods = calculatePeriods();
      if (currentPeriodIndex > 0) {
        currentPeriodIndex--;
        renderGrid(currentType);
      }
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const periods = calculatePeriods();
      if (currentPeriodIndex < periods.length - 1) {
        currentPeriodIndex++;
        renderGrid(currentType);
      }
    });
  }
  
  // Botón de gestionar tarifas
  const pricingBtn = document.getElementById('manage-pricing-btn');
  if (pricingBtn) {
    // Remover listeners existentes y agregar uno nuevo
    pricingBtn.replaceWith(pricingBtn.cloneNode(true));
    const newPricingBtn = document.getElementById('manage-pricing-btn');
    newPricingBtn.addEventListener('click', () => {
      showPricingModal(currentType);
    });
  }
  
  // Event listeners para filtros
  const filterMonth = document.getElementById('filter-month');
  const filterDate = document.getElementById('filter-date');
  const filterPayment = document.getElementById('filter-payment');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  if (filterMonth) {
    filterMonth.addEventListener('change', () => {
      renderRentalsTable();
    });
  }
  
  if (filterDate) {
    filterDate.addEventListener('change', () => {
      renderRentalsTable();
    });
  }
  
  if (filterPayment) {
    filterPayment.addEventListener('change', () => {
      renderRentalsTable();
    });
  }
  
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (filterMonth) filterMonth.value = '';
      if (filterDate) filterDate.value = '';
      if (filterPayment) filterPayment.value = '';
      renderRentalsTable();
    });
  }
  
  // Botón de consultar disponibilidad
  const checkAvailabilityBtn = document.getElementById('check-availability-btn');
  if (checkAvailabilityBtn) {
    checkAvailabilityBtn.addEventListener('click', checkDateAvailability);
  }
  
  // También permitir consulta al presionar Enter en el input de fecha
  const checkDateInput = document.getElementById('check-date');
  if (checkDateInput) {
    checkDateInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkDateAvailability();
      }
    });
  }
  
  // Event listeners para backup
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const importInput = document.getElementById('import-file-input');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportData);
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', handleImportData);
  }
  
  if (importInput) {
    importInput.addEventListener('change', handleFileSelect);
  }
  
  // Botón de reconfiguración
  const reconfigureBtn = document.getElementById('reconfigure-btn');
  if (reconfigureBtn) {
    reconfigureBtn.addEventListener('click', showReconfigureModal);
  }
}

/**
 * Mostrar modal de gestión de tarifas
 * @param {string} type - Tipo de recurso
 */
function showPricingModal(type) {
  // Verificar si ya hay un modal de tarifas abierto
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    console.log('⚠️ Ya hay un modal abierto, cancelando apertura duplicada');
    return;
  }
  
  if (!hasPermission('canManagePricing')) {
    showNotification('❌ No tienes permisos para gestionar las tarifas.', 'error');
    return;
  }
  
  if (!type || !UNIT_TYPES[type]) {
    console.error('❌ Tipo de recurso no válido:', type);
    showNotification('❌ Error: Tipo de recurso no válido', 'error');
    return;
  }
  
  const config = UNIT_TYPES[type];
  const periods = calculatePricingPeriods();
  const currentPricing = getPricingByType(type);
  const check = checkPricingComplete(type);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-large">
      <div class="modal-header">
        <h2>💰 Gestionar Tarifas - ${config.icon} ${config.label}</h2>
        <button class="modal-close" id="close-pricing-modal">&times;</button>
      </div>
      <div class="modal-body">
        ${!check.complete ? `
          <div class="pricing-warning">
            ⚠️ <strong>Atención:</strong> Faltan configurar ${check.missingPeriods.length} período(s) de tarifas.
          </div>
        ` : `
          <div class="pricing-summary">
            ✅ <strong>Todas las tarifas están configuradas</strong>
          </div>
        `}
        
        <p style="margin-bottom: var(--spacing-md); color: var(--text-secondary);">
          Configure el precio por día para cada período de 15 días de la temporada.
        </p>
        
        <form id="pricing-form">
          <div class="pricing-form-grid">
            ${periods.map(period => {
              const key = `period_${period.id}`;
              const currentPrice = currentPricing[key] || '';
              const specialClass = period.special ? 'pricing-period-card-special' : '';
              const periodLabel = period.special ? period.label : `📅 Período ${period.id}`;
              
              return `
                <div class="pricing-period-card ${specialClass}">
                  <div class="pricing-period-header">
                    ${periodLabel}
                  </div>
                  <div class="pricing-period-dates">
                    ${formatDateDisplay(period.startDate)} al ${formatDateDisplay(period.endDate)}
                    <br>
                    <small>(${period.days} días)</small>
                  </div>
                  <div class="pricing-input-wrapper">
                    <input 
                      type="number" 
                      name="${key}"
                      id="${key}"
                      placeholder="Precio por día"
                      value="${currentPrice}"
                      min="0"
                      step="100"
                      required
                    >
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div class="modal-buttons">
            <button type="button" class="btn-secondary" id="cancel-pricing">Cancelar</button>
            <button type="submit" class="btn-primary">💾 Guardar Tarifas</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners - usar querySelector del modal para evitar conflictos
  const closeBtn = modal.querySelector('#close-pricing-modal');
  const cancelBtn = modal.querySelector('#cancel-pricing');
  const form = modal.querySelector('#pricing-form');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePricingSave(type, modal);
    });
  }
  
  // Cerrar con click en overlay (prevenir propagación desde contenido)
  const modalContent = modal.querySelector('.modal');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Focus en el primer input
  const firstInput = modal.querySelector('input');
  if (firstInput) {
    firstInput.focus();
  }
}

/**
 * Guardar tarifas configuradas
 * @param {string} type - Tipo de recurso
 * @param {HTMLElement} modal - Elemento del modal
 */
function handlePricingSave(type, modal) {
  const form = document.getElementById('pricing-form');
  const formData = new FormData(form);
  const pricing = {};
  
  let hasErrors = false;
  
  for (let [key, value] of formData.entries()) {
    const price = parseFloat(value);
    
    if (isNaN(price) || price <= 0) {
      showNotification(`El precio para ${key} debe ser mayor a 0`, 'error');
      hasErrors = true;
      break;
    }
    
    pricing[key] = price;
  }
  
  if (hasErrors) {
    return;
  }
  
  const saved = savePricingByType(type, pricing);
  
  if (saved) {
    showNotification('✅ Tarifas guardadas correctamente', 'success');
    modal.remove();
    
    // Actualizar la grilla por si hay cambios
    renderGrid(currentType);
  } else {
    showNotification('❌ Error al guardar las tarifas', 'error');
  }
}

/**
 * Renderizar modal genérico
 * @param {string} modalType - Tipo de modal
 * @param {Object} data - Datos para el modal
 */
function renderModal(modalType, data) {
  switch (modalType) {
    case 'new-rental':
      showNewRentalModal(data.type, data.unitNumber, data.startDate, data.endDate);
      break;
    case 'rental-details':
      showRentalDetails(data.rentalId);
      break;
    default:
      console.warn('Tipo de modal desconocido:', modalType);
  }
}

/**
 * Maneja la exportación de datos
 */
function handleExportData() {
  try {
    const data = exportAllData();
    const filename = `zeus-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(data, filename);
    
    showBackupMessage('✅ Datos exportados correctamente', 'success');
    showNotification('✅ Backup descargado correctamente', 'success');
  } catch (error) {
    console.error('Error al exportar:', error);
    showBackupMessage('❌ Error al exportar datos', 'error');
    showNotification('❌ Error al exportar datos', 'error');
  }
}

/**
 * Maneja la importación de datos
 */
function handleImportData() {
  const fileInput = document.getElementById('import-file-input');
  fileInput.click();
}

/**
 * Procesa el archivo importado
 * @param {Event} event - Evento del input file
 */
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Confirmar antes de importar
      const confirm = window.confirm(
        '⚠️ ATENCIÓN: Importar datos sobrescribirá toda la información actual.\n\n' +
        `Reservas a importar: ${data.rentals?.length || 0}\n` +
        `Pagos a importar: ${data.payments?.length || 0}\n` +
        `Clientes a importar: ${data.clients?.length || 0}\n` +
        `Fecha del backup: ${data.exportDate ? new Date(data.exportDate).toLocaleString() : 'Desconocida'}\n` +
        `Versión: ${data.version || '1.0'}\n\n` +
        '¿Deseas continuar?'
      );
      
      if (!confirm) {
        showBackupMessage('Importación cancelada', 'error');
        return;
      }
      
      const stats = importAllData(data);
      
      showBackupMessage(
        `✅ Importación exitosa: ${stats.rentalsImported} reservas, ${stats.paymentsImported} pagos, ${stats.clientsImported} clientes y ${stats.pricingImported} tarifas`,
        'success'
      );
      showNotification(
        `✅ Datos importados: ${stats.rentalsImported} reservas, ${stats.paymentsImported} pagos y ${stats.clientsImported} clientes`,
        'success'
      );
      
      // Recargar la interfaz
      setTimeout(() => {
        location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      showBackupMessage('❌ Error: Archivo inválido o corrupto', 'error');
      showNotification('❌ Error al importar datos', 'error');
    }
  };
  
  reader.onerror = function() {
    showBackupMessage('❌ Error al leer el archivo', 'error');
    showNotification('❌ Error al leer el archivo', 'error');
  };
  
  reader.readAsText(file);
  
  // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
  event.target.value = '';
}

/**
 * Muestra un mensaje en la sección de backup
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success' o 'error'
 */
function showBackupMessage(message, type) {
  const infoElement = document.getElementById('backup-info');
  if (!infoElement) return;
  
  infoElement.textContent = message;
  infoElement.className = `backup-info ${type}`;
  
  // Limpiar mensaje después de 5 segundos
  setTimeout(() => {
    infoElement.textContent = '';
    infoElement.className = 'backup-info';
  }, 5000);
}

/**
 * Maneja la exportación de SOLO pagos
 */
function handleExportPayments() {
  try {
    const data = exportPaymentsOnly();
    const filename = `zeus-pagos-${new Date().toISOString().split('T')[0]}.json`;
    
    downloadJSON(data, filename);
    showBackupMessage(`✅ ${data.totalPayments} pagos exportados`, 'success');
    showNotification(`✅ ${data.totalPayments} pagos exportados`, 'success');
  } catch (error) {
    console.error('Error al exportar pagos:', error);
    showBackupMessage('❌ Error al exportar pagos', 'error');
    showNotification('❌ Error al exportar pagos', 'error');
  }
}

/**
 * Maneja la importación de SOLO pagos
 */
function handleImportPayments() {
  const fileInput = document.getElementById('import-payments-input');
  fileInput.click();
}

/**
 * Procesa el archivo de pagos importado
 * @param {Event} event - Evento del input file
 */
function handlePaymentsFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Verificar que sea un archivo de solo pagos
      if (data.type !== 'payments-only') {
        showBackupMessage('❌ Este archivo no es un backup de solo pagos', 'error');
        showNotification('❌ Archivo incorrecto. Use "Importar Todo" para backups completos', 'error');
        return;
      }
      
      // Confirmar antes de importar
      const confirm = window.confirm(
        '⚠️ ATENCIÓN: Esta opción SOBRESCRIBIRÁ todos los pagos actuales.\n\n' +
        `Pagos a importar: ${data.payments?.length || 0}\n` +
        `Fecha del backup: ${data.exportDate ? new Date(data.exportDate).toLocaleString() : 'Desconocida'}\n\n` +
        '✅ Asegúrate de haber importado las RESERVAS primero\n' +
        'para que los pagos se vinculen correctamente.\n\n' +
        '¿Deseas continuar?'
      );
      
      if (!confirm) {
        showBackupMessage('Importación cancelada', 'error');
        return;
      }
      
      const result = importPaymentsOnly(data);
      
      showBackupMessage(
        `✅ ${result.paymentsImported} pagos importados`,
        'success'
      );
      showNotification(
        `✅ ${result.paymentsImported} pagos importados correctamente`,
        'success'
      );
      
      // Recargar la interfaz
      setTimeout(() => {
        location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar archivo de pagos:', error);
      showBackupMessage('❌ ' + error.message, 'error');
      showNotification('❌ Error al importar pagos', 'error');
    }
  };
  
  reader.onerror = function() {
    showBackupMessage('❌ Error al leer el archivo', 'error');
    showNotification('❌ Error al leer el archivo', 'error');
  };
  
  reader.readAsText(file);
  
  // Limpiar el input
  event.target.value = '';
}

/**
 * Mostrar modal de gestión de pagos
 * @param {Object} rental - Objeto de reserva
 */
function showPaymentModal(rental) {
  // Ejecutar migración si es necesario
  migrateOldPayments();
  
  // Debug: Verificar pagos en localStorage
  const allPayments = getAllPayments();
  console.log('🔍 DEBUG: Total pagos en sistema:', allPayments.length);
  console.log('🔍 DEBUG: Pagos para rental', rental.id, ':', allPayments.filter(p => p.rentalId === rental.id).length);
  
  const summary = getPaymentSummary(rental.id);
  if (!summary) {
    showNotification('❌ No se pudo cargar la información de pagos', 'error');
    return;
  }
  
  console.log('📊 DEBUG: Payment Summary:', summary);
  
  // Obtener configuración del tipo de recurso
  const config = UNIT_TYPES[rental.type];
  if (!config) {
    showNotification('❌ Tipo de recurso no encontrado', 'error');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-payments">
      <div class="modal-header">
        <h2>💰 Gestión de Pagos</h2>
        <button class="modal-close" id="close-payment-modal">&times;</button>
      </div>
      <div class="modal-body">
        
        <!-- Información de la reserva -->
        <div class="payment-rental-info">
          <h3>📋 Reserva</h3>
          <p><strong>Cliente:</strong> ${rental.clientName}</p>
          <p><strong>Recurso:</strong> ${config.icon} ${config.label} ${config.prefix}${rental.unitNumber}</p>
          <p><strong>Período:</strong> ${rental.startDate ? formatDateShort(rental.startDate) : 'Sin fecha'} → ${rental.endDate ? formatDateShort(rental.endDate) : 'Sin fecha'}</p>
        </div>

        <!-- Resumen de pagos -->
        <div class="payment-summary">
          <div class="payment-summary-row">
            <span class="label">Total a pagar:</span>
            <span class="value total">$${summary.totalPrice.toLocaleString('es-AR')}</span>
          </div>
          <div class="payment-summary-row">
            <span class="label">Pagado:</span>
            <span class="value paid">$${summary.paidAmount.toLocaleString('es-AR')}</span>
          </div>
          <div class="payment-summary-row">
            <span class="label">Pendiente:</span>
            <span class="value pending">$${summary.pendingAmount.toLocaleString('es-AR')}</span>
          </div>
          <div class="payment-progress">
            <div class="payment-progress-bar">
              <div class="payment-progress-fill" style="width: ${summary.paymentPercentage}%"></div>
            </div>
            <span class="payment-percentage">${summary.paymentPercentage}%</span>
          </div>
        </div>

        <!-- Lista de pagos -->
        <div class="payment-list-section">
          <h3>📜 Historial de Pagos (${summary.paymentCount})</h3>
          <div id="payment-list" class="payment-list">
            ${summary.payments.length > 0 
              ? summary.payments.map(payment => `
                  <div class="payment-item" data-payment-id="${payment.id}">
                    <div class="payment-item-header">
                      <span class="payment-date">${payment.paymentDate ? formatDateShort(payment.paymentDate) : 'Fecha no disponible'}</span>
                      <span class="payment-method">${PAYMENT_METHODS[payment.paymentMethod]?.icon || '💵'} ${PAYMENT_METHODS[payment.paymentMethod]?.label || payment.paymentMethod}</span>
                      <span class="payment-amount">$${payment.amount.toLocaleString('es-AR')}</span>
                      <div class="payment-actions">
                        <button class="btn-view-receipt" data-payment-id="${payment.id}" title="Ver recibo">📄</button>
                        <button class="btn-delete-payment" data-payment-id="${payment.id}" title="Eliminar pago">🗑️</button>
                      </div>
                    </div>
                    ${payment.notes ? `<div class="payment-notes">${payment.notes}</div>` : ''}
                  </div>
                `).join('')
              : '<p class="no-payments">No hay pagos registrados</p>'
            }
          </div>
        </div>

        <!-- Formulario de nuevo pago -->
        ${summary.pendingAmount > 0 ? `
          <div class="payment-form-section">
            <h3>➕ Registrar Nuevo Pago</h3>
            <form id="new-payment-form" class="payment-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="payment-amount">Monto *</label>
                  <input 
                    type="number" 
                    id="payment-amount" 
                    name="amount" 
                    min="1" 
                    max="${summary.pendingAmount}"
                    step="0.01" 
                    required
                    placeholder="Ingrese el monto"
                  >
                  <small>Máximo: $${summary.pendingAmount.toLocaleString('es-AR')}</small>
                </div>
                <div class="form-group">
                  <label for="payment-date">Fecha *</label>
                  <input 
                    type="date" 
                    id="payment-date" 
                    name="paymentDate" 
                    value="${new Date().toISOString().split('T')[0]}"
                    required
                  >
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="payment-method">Método de Pago *</label>
                  <select id="payment-method" name="paymentMethod" required>
                    ${Object.entries(PAYMENT_METHODS).map(([key, method]) => `
                      <option value="${key}">${method.icon} ${method.label}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="payment-notes">Notas (opcional)</label>
                <textarea 
                  id="payment-notes" 
                  name="notes" 
                  rows="2" 
                  placeholder="Ej: Seña 50%, Resto del pago, etc."
                ></textarea>
              </div>
              <div class="modal-buttons">
                <button type="submit" class="btn btn-primary">💾 Registrar Pago</button>
              </div>
            </form>
          </div>
        ` : '<div class="payment-complete">✅ ¡Reserva completamente pagada!</div>'}

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Re-aplicar modo privacidad si está activo
  if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
    setTimeout(() => {
      hideFinancialInfo();
    }, 50);
  }

  // Event listeners
  document.getElementById('close-payment-modal').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Manejo del formulario de nuevo pago
  const form = document.getElementById('new-payment-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleNewPaymentSubmit(rental.id, modal);
    });
  }

  // Event listeners para eliminar pagos
  const deleteButtons = modal.querySelectorAll('.btn-delete-payment');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const paymentId = e.target.dataset.paymentId;
      handleDeletePayment(paymentId, rental.id, modal);
    });
  });
  
  // Event listeners para ver recibos de pagos
  const receiptButtons = modal.querySelectorAll('.btn-view-receipt');
  receiptButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const paymentId = e.target.dataset.paymentId;
      const payments = getAllPayments();
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        generatePaymentReceipt(payment, rental);
      }
    });
  });
}

/**
 * Manejar envío de nuevo pago
 * @param {string} rentalId - ID de la reserva
 * @param {HTMLElement} modal - Modal element
 */
function handleNewPaymentSubmit(rentalId, modal) {
  const form = document.getElementById('new-payment-form');
  const formData = new FormData(form);
  
  const paymentData = {
    amount: parseFloat(formData.get('amount')),
    paymentDate: formData.get('paymentDate'),
    paymentMethod: formData.get('paymentMethod'),
    notes: formData.get('notes') || ''
  };

  // Validar monto
  const summary = getPaymentSummary(rentalId);
  if (paymentData.amount > summary.pendingAmount) {
    showNotification('❌ El monto excede el saldo pendiente', 'error');
    return;
  }

  // Agregar pago
  const payment = addPayment(rentalId, paymentData);
  
  if (payment) {
    showNotification('✅ Pago registrado correctamente', 'success');
    
    // Cerrar modal y refrescar vista
    modal.remove();
    
    // Refrescar dashboard y grilla
    if (currentView === 'dashboard') {
      renderDashboard();
    } else {
      renderGrid(currentType);
    }
    
    // Re-aplicar modo privacidad si está activo
    if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
      setTimeout(() => {
        hideFinancialInfo();
      }, 100);
    }
  } else {
    showNotification('❌ Error al registrar el pago', 'error');
  }
}

/**
 * Manejar eliminación de pago
 * @param {string} paymentId - ID del pago
 * @param {string} rentalId - ID de la reserva
 * @param {HTMLElement} modal - Modal element
 */
function handleDeletePayment(paymentId, rentalId, modal) {
  if (!confirm('¿Estás seguro de eliminar este pago?')) {
    return;
  }

  const success = deletePayment(paymentId);
  
  if (success) {
    showNotification('✅ Pago eliminado correctamente', 'success');
    
    // Reabrir modal actualizado
    modal.remove();
    const rentals = getRentals();
    const rental = rentals.find(r => r.id === rentalId);
    if (rental) {
      showPaymentModal(rental);
    }
    
    // Refrescar dashboard y grilla
    if (currentView === 'dashboard') {
      renderDashboard();
    } else {
      renderGrid(currentType);
    }
    
    // Re-aplicar modo privacidad si está activo
    if (typeof privacyModeEnabled !== 'undefined' && privacyModeEnabled) {
      setTimeout(() => {
        hideFinancialInfo();
      }, 100);
    }
  } else {
    showNotification('❌ Error al eliminar el pago', 'error');
  }
}

/**
 * Generar recibo de un pago individual
 * @param {Object} payment - Objeto de pago
 * @param {Object} rental - Objeto de reserva
 */
function generatePaymentReceipt(payment, rental) {
  const config = UNIT_TYPES[rental.type];
  const establishmentConfig = getEstablishmentConfig();
  const establishmentName = establishmentConfig?.establishmentName || 'ZEUS BALNEARIO';
  
  // Construir HTML del recibo
  const receiptHTML = `
    <div class="receipt-container">
      <div class="receipt-header">
        <h1>🏖️ ${establishmentName.toUpperCase()}</h1>
        <p class="receipt-subtitle">Necochea, Argentina</p>
        <p class="receipt-date">Recibo de Pago</p>
        <p class="receipt-number">N° ${payment.id}</p>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>DATOS DEL CLIENTE</h2>
        <div class="receipt-row">
          <span class="receipt-label">Nombre y Apellido:</span>
          <span class="receipt-value">${rental.clientName}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">DNI:</span>
          <span class="receipt-value">${rental.clientDNI}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Teléfono:</span>
          <span class="receipt-value">${rental.clientPhone}</span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>RESERVA</h2>
        <div class="receipt-row">
          <span class="receipt-label">Recurso:</span>
          <span class="receipt-value">${config.icon} ${config.label} ${config.prefix}${rental.unitNumber}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Período:</span>
          <span class="receipt-value">${formatDateDisplay(rental.startDate)} → ${formatDateDisplay(rental.endDate)}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Total Reserva:</span>
          <span class="receipt-value">$${rental.totalPrice.toLocaleString('es-AR')}</span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section payment-detail">
        <h2>DETALLE DEL PAGO</h2>
        <div class="receipt-row">
          <span class="receipt-label">Fecha de Pago:</span>
          <span class="receipt-value highlight">${formatDateDisplay(payment.paymentDate)}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Método de Pago:</span>
          <span class="receipt-value">${PAYMENT_METHODS[payment.paymentMethod]?.icon || '💵'} ${PAYMENT_METHODS[payment.paymentMethod]?.label || payment.paymentMethod}</span>
        </div>
        ${payment.notes ? `
          <div class="receipt-row">
            <span class="receipt-label">Concepto:</span>
            <span class="receipt-value">${payment.notes}</span>
          </div>
        ` : ''}
        <div class="receipt-total payment-received-amount">
          <span class="receipt-label">MONTO PAGADO:</span>
          <span class="receipt-value">$${payment.amount.toLocaleString('es-AR')}</span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-section">
        <h2>ESTADO DE CUENTA</h2>
        <div class="receipt-row">
          <span class="receipt-label">Total a Pagar:</span>
          <span class="receipt-value">$${rental.totalPrice.toLocaleString('es-AR')}</span>
        </div>
        
        <h3 style="margin-top: 15px; margin-bottom: 10px; font-size: 0.95rem; color: var(--text-secondary);">Historial de Pagos:</h3>
        ${(() => {
          const allPayments = getPaymentsByRental(rental.id);
          return allPayments.map((p, index) => `
            <div class="receipt-row payment-history-item ${p.id === payment.id ? 'current-payment' : ''}">
              <span class="receipt-label">${index + 1}. ${p.paymentDate ? formatDateShort(p.paymentDate) : 'Sin fecha'} - ${PAYMENT_METHODS[p.paymentMethod]?.icon || '💵'}</span>
              <span class="receipt-value">$${p.amount.toLocaleString('es-AR')}</span>
              ${p.id === payment.id ? '<span class="current-badge">← Este pago</span>' : ''}
            </div>
          `).join('');
        })()}
        
        <div class="receipt-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
          <span class="receipt-label"><strong>Total Pagado:</strong></span>
          <span class="receipt-value"><strong>$${calculatePaidAmount(rental.id).toLocaleString('es-AR')}</strong></span>
        </div>
        <div class="receipt-row ${calculatePendingAmount(rental.id) > 0 ? 'balance' : ''}">
          <span class="receipt-label"><strong>Saldo Pendiente:</strong></span>
          <span class="receipt-value"><strong>$${calculatePendingAmount(rental.id).toLocaleString('es-AR')}</strong></span>
        </div>
      </div>
      
      <div class="receipt-divider"></div>
      
      <div class="receipt-status ${calculatePendingAmount(rental.id) <= 0 ? 'pagado' : 'parcial'}">
        <span class="status-icon">${calculatePendingAmount(rental.id) <= 0 ? '✅' : '⚠️'}</span>
        <span class="status-text">${calculatePendingAmount(rental.id) <= 0 ? 'RESERVA PAGADA COMPLETAMENTE' : 'PAGO PARCIAL RECIBIDO'}</span>
      </div>
      
      <div class="receipt-footer">
        <p>Este comprobante certifica el pago recibido.</p>
        <p>Gracias por su confianza.</p>
        <p class="receipt-footer-date">Emitido: ${new Date().toLocaleString('es-AR')}</p>
      </div>
      
      <div class="receipt-actions">
        <button class="btn-primary" onclick="window.print()">🖨️ Imprimir</button>
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
      </div>
    </div>
  `;
  
  // Crear modal con el recibo
  const modal = document.createElement('div');
  modal.className = 'modal-overlay receipt-modal';
  modal.innerHTML = `
    <div class="modal modal-receipt">
      ${receiptHTML}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cerrar con click en overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// ===================================
// BÚSQUEDA GLOBAL
// ===================================

let currentSearchIndex = -1;
let searchResultsArray = [];

/**
 * Inicializar búsqueda global
 */
function initializeSearch() {
  const searchInput = document.getElementById('global-search');
  const clearBtn = document.getElementById('clear-search');
  const closeBtn = document.getElementById('close-search-results');
  const resultsContainer = document.getElementById('search-results');
  
  if (!searchInput) return;

  // Búsqueda con debounce
  const debouncedSearch = debounce(performSearch, SEARCH_CONFIG.debounceDelay);
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Mostrar/ocultar botón de limpiar
    if (clearBtn) {
      clearBtn.style.display = query ? 'flex' : 'none';
    }
    
    if (query.length >= SEARCH_CONFIG.minChars) {
      debouncedSearch(query);
    } else {
      hideSearchResults();
    }
  });

  // Limpiar búsqueda
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      hideSearchResults();
      searchInput.focus();
    });
  }

  // Cerrar resultados
  if (closeBtn) {
    closeBtn.addEventListener('click', hideSearchResults);
  }

  // Atajos de teclado
  document.addEventListener('keydown', handleSearchKeyboard);
  
  // Click fuera para cerrar
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      hideSearchResults();
    }
  });
}

/**
 * Realizar búsqueda
 * @param {string} query - Término de búsqueda
 */
function performSearch(query) {
  const results = searchRentals(query);
  searchResultsArray = results;
  currentSearchIndex = -1;
  renderSearchResults(results, query);
}

/**
 * Renderizar resultados de búsqueda
 * @param {Array} results - Resultados
 * @param {string} query - Término de búsqueda
 */
function renderSearchResults(results, query) {
  const resultsContainer = document.getElementById('search-results');
  const resultsList = document.getElementById('search-results-list');
  const resultsCount = document.querySelector('.search-results-count');
  
  if (!resultsContainer || !resultsList) return;

  // Actualizar contador
  if (resultsCount) {
    resultsCount.textContent = `${results.length} resultado${results.length !== 1 ? 's' : ''}`;
  }

  // Si no hay resultados
  if (results.length === 0) {
    resultsList.innerHTML = `
      <div class="search-no-results">
        <div class="search-no-results-icon">🔍</div>
        <div class="search-no-results-text">No se encontraron reservas</div>
        <small>Intenta buscar por nombre, DNI, teléfono o número de unidad</small>
      </div>
    `;
    resultsContainer.style.display = 'flex';
    return;
  }

  // Renderizar resultados
  resultsList.innerHTML = results.map((rental, index) => {
    const config = UNIT_TYPES[rental.type];
    const unitLabel = `${config.icon} ${config.prefix}${rental.unitNumber}`;
    
    // Calcular estado de pago (redondear para evitar problemas de precisión)
    const paidAmount = Math.round(calculatePaidAmount(rental.id));
    const totalAmount = Math.round(rental.totalPrice);
    let paymentStatus = 'pending';
    let paymentBadge = '❌ Pendiente';
    
    if (paidAmount >= totalAmount) {
      paymentStatus = 'paid';
      paymentBadge = '✅ Pagado';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
      paymentBadge = '🟡 Parcial';
    }
    
    // Formatear fechas (con validación)
    const startDate = rental.startDate ? formatDateShort(rental.startDate) : 'Sin fecha';
    const endDate = rental.endDate ? formatDateShort(rental.endDate) : 'Sin fecha';
    
    // Highlight de términos
    const clientName = highlightSearchTerms(rental.clientName, query);
    const clientDNI = highlightSearchTerms(rental.clientDNI, query);
    const clientPhone = highlightSearchTerms(rental.clientPhone || '-', query);
    
    return `
      <div class="search-result-item" data-rental-id="${rental.id}" data-index="${index}">
        <div class="search-result-info">
          <div class="search-result-client">${clientName}</div>
          <div class="search-result-details">
            <span class="search-result-detail">📋 DNI: ${clientDNI}</span>
            <span class="search-result-detail">📞 ${clientPhone}</span>
            <span class="search-result-detail">${unitLabel}</span>
          </div>
          <div class="search-result-dates">📅 ${startDate} → ${endDate}</div>
        </div>
        <span class="search-result-badge ${paymentStatus}">${paymentBadge}</span>
      </div>
    `;
  }).join('');

  // Mostrar resultados
  resultsContainer.style.display = 'flex';

  // Event listeners para clicks
  resultsList.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const rentalId = item.dataset.rentalId;
      openRentalFromSearch(rentalId);
    });
  });
}

/**
 * Ocultar resultados de búsqueda
 */
function hideSearchResults() {
  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer) {
    resultsContainer.style.display = 'none';
  }
  searchResultsArray = [];
  currentSearchIndex = -1;
}

/**
 * Abrir reserva desde búsqueda
 * @param {string} rentalId - ID de la reserva
 */
function openRentalFromSearch(rentalId) {
  const rentals = getRentals();
  const rental = rentals.find(r => r.id === rentalId);
  
  if (!rental) {
    console.error('Reserva no encontrada:', rentalId);
    alert('No se pudo encontrar la reserva.');
    return;
  }

  console.log('Abriendo reserva:', rental);

  // Cambiar a la vista del tipo de recurso si es necesario
  if (rental.type !== currentType) {
    console.log('Cambiando vista de', currentType, 'a', rental.type);
    switchTab(rental.type);
  }

  // Dar un pequeño delay para que se renderice la vista
  setTimeout(() => {
    // Pasar el ID, no el objeto completo
    showRentalDetails(rental.id);
  }, 100);
  
  // Ocultar resultados
  hideSearchResults();
  
  // Limpiar input
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.value = '';
  }
  
  const clearBtn = document.getElementById('clear-search');
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
}

/**
 * Manejar atajos de teclado
 * @param {KeyboardEvent} e - Evento de teclado
 */
function handleSearchKeyboard(e) {
  const searchInput = document.getElementById('global-search');
  const resultsContainer = document.getElementById('search-results');
  const isSearchVisible = resultsContainer && resultsContainer.style.display === 'flex';

  // Ctrl+K o Cmd+K: Abrir búsqueda
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  // Si los resultados están visibles
  if (isSearchVisible && searchResultsArray.length > 0) {
    // ESC: Cerrar resultados
    if (e.key === 'Escape') {
      e.preventDefault();
      hideSearchResults();
      if (searchInput) searchInput.blur();
      return;
    }

    // Flecha abajo: Navegar hacia abajo
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      currentSearchIndex = Math.min(currentSearchIndex + 1, searchResultsArray.length - 1);
      highlightSearchResult(currentSearchIndex);
      return;
    }

    // Flecha arriba: Navegar hacia arriba
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      currentSearchIndex = Math.max(currentSearchIndex - 1, 0);
      highlightSearchResult(currentSearchIndex);
      return;
    }

    // Enter: Abrir resultado seleccionado
    if (e.key === 'Enter' && currentSearchIndex >= 0) {
      e.preventDefault();
      const rental = searchResultsArray[currentSearchIndex];
      if (rental) {
        openRentalFromSearch(rental.id);
      }
      return;
    }
  }
}

/**
 * Resaltar resultado en la navegación con teclado
 * @param {number} index - Índice del resultado
 */
function highlightSearchResult(index) {
  const resultsList = document.getElementById('search-results-list');
  if (!resultsList) return;

  const items = resultsList.querySelectorAll('.search-result-item');
  
  // Remover highlight previo
  items.forEach(item => item.classList.remove('active'));
  
  // Agregar highlight al actual
  if (items[index]) {
    items[index].classList.add('active');
    items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ===================================
// MODO PRIVACIDAD
// ===================================

let privacyModeEnabled = false;
let privacyModeInitialized = false;
const PRIVACY_STORAGE_KEY = 'zeus-privacy-mode';

/**
 * Inicializar modo privacidad
 */
function initializePrivacyMode() {
  // Evitar múltiples inicializaciones
  if (privacyModeInitialized) {
    console.log('🔒 Modo privacidad ya inicializado, omitiendo...');
    return;
  }
  // Usar setTimeout para asegurar que todos los elementos del DOM estén disponibles
  setTimeout(() => {
    const privacyBtn = document.getElementById('privacy-toggle-btn');
    if (!privacyBtn) {
      console.log('⚠️ Botón privacy-toggle-btn no encontrado, reintentando...');
      // Solo reintentar si no se ha inicializado aún
      if (!privacyModeInitialized) {
        setTimeout(() => {
          initializePrivacyMode();
        }, 1000);
      }
      return;
    }

    // Limpiar event listeners previos si existen
    const newBtn = privacyBtn.cloneNode(true);
    privacyBtn.parentNode.replaceChild(newBtn, privacyBtn);
    
    // Referenciar el nuevo botón
    const cleanBtn = document.getElementById('privacy-toggle-btn');

    // Cargar preferencia guardada
    const savedMode = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (savedMode === 'true') {
      privacyModeEnabled = true;
      togglePrivacyMode(true);
    }

    // Event listener para el botón (solo uno)
    cleanBtn.addEventListener('click', handlePrivacyToggle);

    // Marcar como inicializado
    privacyModeInitialized = true;
    console.log('✅ Modo privacidad inicializado correctamente');
  }, 500); // Esperar 500ms para que el DOM esté completamente cargado
}

/**
 * Manejar click en botón de privacidad
 */
function handlePrivacyToggle() {
  privacyModeEnabled = !privacyModeEnabled;
  togglePrivacyMode(privacyModeEnabled);
  
  // Guardar preferencia
  localStorage.setItem(PRIVACY_STORAGE_KEY, privacyModeEnabled.toString());
  
  // Mostrar notificación
  const message = privacyModeEnabled 
    ? 'Modo privacidad activado 🔒' 
    : 'Modo privacidad desactivado 👁️';
  
  if (typeof showNotification === 'function') {
    showNotification(message, 'info');
  }
}

/**
 * Toggle modo privacidad
 * @param {boolean} enabled - Activar o desactivar
 */
function togglePrivacyMode(enabled) {
  // Actualizar variable global
  privacyModeEnabled = enabled;
  
  const privacyBtn = document.getElementById('privacy-toggle-btn');
  const icon = privacyBtn?.querySelector('.privacy-icon');
  const label = privacyBtn?.querySelector('.privacy-label');

  if (enabled) {
    // Activar modo privacidad
    privacyBtn?.classList.add('active');
    if (icon) icon.textContent = '🙈';
    if (label) label.textContent = 'Mostrar montos';
    hideFinancialInfo();
  } else {
    // Desactivar modo privacidad
    privacyBtn?.classList.remove('active');
    if (icon) icon.textContent = '👁️';
    if (label) label.textContent = 'Ocultar montos';
    showFinancialInfo();
  }
  
  // También aplicar a elementos que se carguen dinámicamente después
  setTimeout(() => {
    if (enabled) {
      hideFinancialInfo();
    }
  }, 100);
}

/**
 * Ocultar información financiera
 */
function hideFinancialInfo() {
  // Selectores de elementos con montos
  const selectors = [
    '.kpi-value',              // KPIs del dashboard
    '.stat-value',             // Estadísticas
    '.rental-price',           // Precios en grilla
    '.rental-amount',          // Montos en tablas
    '.payment-amount',         // Montos de pagos
    '.search-result-badge',    // Badges de estado en búsqueda
    '.pricing-input',          // Inputs de precios
    '.total-price',            // Precio total
    '.amount-paid',            // Monto pagado
    '.amount-pending'          // Monto pendiente
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (!el.classList.contains('amount-hidden')) {
        // Guardar el contenido original
        el.dataset.originalContent = el.textContent || el.innerHTML;
        // Ocultar
        if (el.tagName.toLowerCase() === 'input') {
          el.dataset.originalValue = el.value;
          el.value = '****';
        } else {
          el.textContent = '****';
        }
        el.classList.add('amount-hidden');
      }
    });
  });
  
  // Marcar que el modo está activo globalmente
  document.body.classList.add('privacy-mode-active');
}

/**
 * Mostrar información financiera
 */
function showFinancialInfo() {
  const hiddenElements = document.querySelectorAll('.amount-hidden');
  
  hiddenElements.forEach(el => {
    // Restaurar contenido original
    if (el.tagName.toLowerCase() === 'input' && el.dataset.originalValue) {
      el.value = el.dataset.originalValue;
      delete el.dataset.originalValue;
    } else if (el.dataset.originalContent) {
      if (el.dataset.originalContent.includes('<')) {
        el.innerHTML = el.dataset.originalContent;
      } else {
        el.textContent = el.dataset.originalContent;
      }
      delete el.dataset.originalContent;
    }
    el.classList.remove('amount-hidden');
  });
  
  // Quitar marca global
  document.body.classList.remove('privacy-mode-active');
}

/**
 * Resetear inicialización de modo privacidad (para debugging)
 */
function resetPrivacyMode() {
  privacyModeInitialized = false;
  privacyModeEnabled = false;
  console.log('🔄 Modo privacidad reseteado');
}

/**
 * Obtener estado del modo privacidad
 * @returns {boolean}
 */
function isPrivacyModeEnabled() {
  return privacyModeEnabled;
}

/**
 * Formatear monto con modo privacidad
 * @param {number} amount - Monto a formatear
 * @param {string} className - Clase CSS para aplicar
 * @returns {string} - HTML del monto
 */
function formatAmountWithPrivacy(amount, className = 'kpi-value') {
  if (privacyModeEnabled) {
    return `<span class="${className} amount-hidden" data-original-content="$${amount.toLocaleString('es-AR')}">****</span>`;
  }
  return `<span class="${className}">$${amount.toLocaleString('es-AR')}</span>`;
}

/**
 * Mostrar vista de gestión de clientes
 */
function showClientsView() {
  // Ocultar otros contenedores y mostrar el de clientes
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('resource-content').style.display = 'none';
  document.getElementById('manage-pricing-btn').style.display = 'none';
  
  // Ocultar quick view
  const quickViewContainer = document.getElementById('quick-view-container');
  if (quickViewContainer) {
    quickViewContainer.style.display = 'none';
  }
  
  // Ocultar contenedor de pileta si existe
  const poolContainer = document.getElementById('pool-container');
  if (poolContainer) {
    poolContainer.style.display = 'none';
  }
  
  const stats = getClientStats();
  const clients = getAllClients();

  // Crear contenedor de clientes si no existe
  let clientsContainer = document.getElementById('clients-container');
  if (!clientsContainer) {
    clientsContainer = document.createElement('div');
    clientsContainer.id = 'clients-container';
    clientsContainer.className = 'clients-container';
    document.querySelector('.main-container').appendChild(clientsContainer);
  }
  
  clientsContainer.style.display = 'block';
  
  clientsContainer.innerHTML = `
    <div class="clients-view-container">
      <div class="clients-header">
        <h2>👥 Gestión de Clientes</h2>
        <div class="clients-header-actions">
          <button class="btn btn-secondary" onclick="showClientClassificationConfigModal()" title="Configurar clasificación de clientes">
            ⚙️ Configurar Clasificación
          </button>
          <button class="btn btn-primary" onclick="showNewClientModal()">
            <span>+</span> Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- Estadísticas de Clientes -->
      <div class="clients-stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total Clientes</div>
            <div class="stat-value">${stats.totalClients}</div>
          </div>
        </div>
        <div class="stat-card" title="Clientes VIP: ${getClientClassificationConfig().vipMinReservations}+ reservas o $${getClientClassificationConfig().vipMinSpending.toLocaleString()}+ gastados">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-label">Clientes VIP</div>
            <div class="stat-value">${stats.vipCount}</div>
            <div class="stat-hint">Descuento: ${getClientClassificationConfig().vipDiscount}%</div>
          </div>
        </div>
        <div class="stat-card" title="Clientes Frecuentes: ${getClientClassificationConfig().frequentMinReservations}+ reservas">
          <div class="stat-icon">🔄</div>
          <div class="stat-content">
            <div class="stat-label">Clientes Frecuentes</div>
            <div class="stat-value">${stats.frequentCount}</div>
            <div class="stat-hint">Descuento: ${getClientClassificationConfig().frequentDiscount}%</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚫</div>
          <div class="stat-content">
            <div class="stat-label">Lista Negra</div>
            <div class="stat-value">${stats.blacklistCount}</div>
          </div>
        </div>
      </div>

      <!-- Búsqueda de Clientes -->
      <div class="clients-search-bar">
        <input 
          type="text" 
          id="clients-search-input" 
          class="search-input" 
          placeholder="Buscar por nombre, DNI o teléfono..."
        >
      </div>

      <!-- Lista de Clientes -->
      <div class="clients-list" id="clients-list">
        ${renderClientsList(clients)}
      </div>
    </div>
  `;

  // Event listener para búsqueda
  const searchInput = document.getElementById('clients-search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const filtered = query ? searchClients(query) : getAllClients();
    document.getElementById('clients-list').innerHTML = renderClientsList(filtered);
  });

  // Aplicar modo privacidad si está activo
  setTimeout(() => {
    if (privacyModeEnabled) {
      applyPrivacyMode();
    }
  }, 0);
}

/**
 * Renderizar lista de clientes
 * @param {Array} clients - Array de clientes
 * @returns {string} - HTML de la lista
 */
function renderClientsList(clients) {
  if (clients.length === 0) {
    return `
      <div class="empty-state">
        <p>No se encontraron clientes</p>
      </div>
    `;
  }

  // Ordenar por última visita (más reciente primero)
  const sorted = [...clients].sort((a, b) => {
    const dateA = a.lastVisit ? new Date(a.lastVisit) : new Date(0);
    const dateB = b.lastVisit ? new Date(b.lastVisit) : new Date(0);
    return dateB - dateA;
  });

  return sorted.map(client => {
    const typeClass = client.clientType || 'regular';
    const typeLabel = {
      'regular': 'Regular',
      'frecuente': 'Frecuente',
      'vip': 'VIP',
      'blacklist': 'Lista Negra'
    }[typeClass];

    const lastVisitDate = client.lastVisit 
      ? new Date(client.lastVisit).toLocaleDateString('es-AR') 
      : 'Nunca';

    return `
      <div class="client-card">
        <div class="client-card-header">
          <div class="client-card-name">
            ${client.fullName}
            <span class="client-type-badge ${typeClass}">${typeLabel}</span>
          </div>
          <div class="client-card-dni">DNI: ${client.dni}</div>
        </div>
        <div class="client-card-info">
          <div class="client-card-stat">
            <span class="stat-icon">📞</span>
            <span>${client.phone || 'Sin teléfono'}</span>
          </div>
          <div class="client-card-stat">
            <span class="stat-icon">📅</span>
            <span>Última visita: ${lastVisitDate}</span>
          </div>
          <div class="client-card-stat">
            <span class="stat-icon">🔢</span>
            <span>${client.totalReservations || 0} reservas</span>
          </div>
          <div class="client-card-stat">
            <span class="stat-icon">💰</span>
            <span class="amount-field">$${(client.totalSpent || 0).toLocaleString('es-AR')}</span>
          </div>
        </div>
        <div class="client-card-actions">
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); showClientProfile('${client.id}')">
            👁️ Ver Perfil
          </button>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); showEditClientModal('${client.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteClient('${client.id}')">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Mostrar perfil completo de un cliente
 * @param {string} clientId - ID del cliente
 */
function showClientProfile(clientId) {
  console.log('👤 showClientProfile llamado con ID:', clientId);
  const client = getClientById(clientId);
  if (!client) {
    console.error('Cliente no encontrado:', clientId);
    alert('Cliente no encontrado');
    return;
  }

  // Obtener todas las reservas del cliente
  const rentals = getRentals().filter(r => r.clientId === clientId);
  const sortedRentals = rentals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const firstVisitDate = client.firstVisit 
    ? new Date(client.firstVisit).toLocaleDateString('es-AR') 
    : 'Desconocida';
  const lastVisitDate = client.lastVisit 
    ? new Date(client.lastVisit).toLocaleDateString('es-AR') 
    : 'Nunca';

  const typeClass = client.clientType || 'regular';
  const typeLabel = {
    'regular': 'Regular',
    'frecuente': 'Frecuente',
    'vip': 'VIP',
    'blacklist': 'Lista Negra'
  }[typeClass];

  const modalHTML = `
    <div class="modal-overlay" id="client-profile-modal">
      <div class="modal modal-large client-profile-modal">
        <div class="modal-header">
          <h2>👤 Perfil del Cliente</h2>
          <div class="modal-header-actions">
            <button class="btn btn-secondary" onclick="showEditClientModal('${client.id}')">
              ✏️ Editar
            </button>
            <button class="btn btn-danger" onclick="deleteClient('${client.id}')">
              🗑️ Eliminar
            </button>
            <button class="btn btn-secondary" onclick="closeClientProfile()">✕ Cerrar</button>
          </div>
        </div>
        <div class="modal-body">
          <!-- Información Principal -->
          <div class="client-profile-header">
            <h3>${client.fullName} <span class="client-type-badge ${typeClass}">${typeLabel}</span></h3>
          </div>

          <!-- Datos de Contacto -->
          <div class="client-profile-section">
            <h4>📋 Datos de Contacto</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">DNI:</span>
                <span class="info-value">${client.dni}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Teléfono:</span>
                <span class="info-value">${client.phone || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${client.email || '-'}</span>
              </div>
            </div>
          </div>

          <!-- Origen -->
          ${client.origin ? `
            <div class="client-profile-section">
              <h4>📍 Origen</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">País:</span>
                  <span class="info-value">${client.origin.country || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Provincia/Estado:</span>
                  <span class="info-value">${client.origin.state || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Ciudad:</span>
                  <span class="info-value">${client.origin.city || '-'}</span>
                </div>
              </div>
              ${client.origin.address ? `
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Dirección:</span>
                    <span class="info-value">${client.origin.address.street || ''} ${client.origin.address.number || ''}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Barrio:</span>
                    <span class="info-value">${client.origin.address.neighborhood || '-'}</span>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Estadísticas -->
          <div class="client-profile-section">
            <h4>📊 Estadísticas</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Primera visita:</span>
                <span class="info-value">${firstVisitDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Última visita:</span>
                <span class="info-value">${lastVisitDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total reservas:</span>
                <span class="info-value">${client.totalReservations || 0}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total gastado:</span>
                <span class="info-value amount-field">$${(client.totalSpent || 0).toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          <!-- Historial de Reservas -->
          <div class="client-profile-section">
            <h4>📅 Historial de Reservas (${sortedRentals.length})</h4>
            <div class="client-rentals-list">
              ${sortedRentals.length > 0 ? sortedRentals.map(rental => {
                const checkIn = new Date(rental.startDate).toLocaleDateString('es-AR');
                const checkOut = new Date(rental.endDate).toLocaleDateString('es-AR');
                const isPast = new Date(rental.endDate) < new Date();
                const isCancelled = rental.status === 'cancelled';
                const status = isCancelled ? 'Cancelada' : (isPast ? 'Completada' : 'Activa');
                const statusClass = isCancelled ? 'status-cancelled' : (isPast ? 'status-completed' : 'status-active');
                
                // Formatear tipo de recurso
                const typeLabels = {
                  'sombrilla': 'Sombrilla',
                  'carpa': 'Carpa',
                  'estacionamiento': 'Estacionamiento'
                };
                const resourceLabel = typeLabels[rental.type] || rental.type;
                
                // Color según tipo de recurso
                const typeColors = {
                  'sombrilla': '#FF6B6B',
                  'carpa': '#4ECDC4',
                  'estacionamiento': '#FFE66D'
                };
                const borderColor = typeColors[rental.type] || '#95E1D3';
                
                return `
                  <div class="rental-history-item" style="border-left: 4px solid ${borderColor};" onclick="event.stopPropagation(); switchTab('dashboard'); setTimeout(() => showRentalDetails('${rental.id}'), 100);">
                    <div class="rental-history-header">
                      <span class="rental-resource">${resourceLabel} ${rental.unitNumber}</span>
                      <span class="rental-status ${statusClass}">${status}</span>
                    </div>
                    <div class="rental-history-dates">
                      ${checkIn} → ${checkOut}
                    </div>
                    <div class="rental-history-amount amount-field">
                      $${(rental.totalPrice || 0).toLocaleString('es-AR')}
                    </div>
                  </div>
                `;
              }).join('') : '<p class="empty-state">No hay reservas registradas</p>'}
            </div>
          </div>

          <!-- Notas -->
          ${client.notes ? `
            <div class="client-profile-section">
              <h4>📝 Notas</h4>
              <p class="client-notes">${client.notes}</p>
            </div>
          ` : ''}

          <!-- Lista Negra -->
          ${client.clientType === 'blacklist' && client.blacklistReason ? `
            <div class="client-profile-section blacklist-section">
              <h4>🚫 Lista Negra</h4>
              <p class="blacklist-reason">${client.blacklistReason}</p>
              <button class="btn btn-success" onclick="removeClientFromBlacklist('${client.id}')">
                Remover de Lista Negra
              </button>
            </div>
          ` : client.clientType !== 'blacklist' ? `
            <div class="client-profile-section">
              <button class="btn btn-danger" onclick="addClientToBlacklist('${client.id}')">
                🚫 Agregar a Lista Negra
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Aplicar modo privacidad si está activo
  setTimeout(() => {
    if (privacyModeEnabled) {
      applyPrivacyMode();
    }
  }, 0);
}

/**
 * Cerrar perfil de cliente
 */
function closeClientProfile() {
  const modal = document.getElementById('client-profile-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Agregar cliente a lista negra
 * @param {string} clientId - ID del cliente
 */
function addClientToBlacklist(clientId) {
  const reason = prompt('Ingrese el motivo para agregar a la lista negra:');
  if (reason && reason.trim()) {
    markAsBlacklist(clientId, reason.trim());
    closeClientProfile();
    showClientsView();
    alert('Cliente agregado a la lista negra');
  }
}

/**
 * Remover cliente de lista negra
 * @param {string} clientId - ID del cliente
 */
function removeClientFromBlacklist(clientId) {
  if (confirm('¿Está seguro de remover este cliente de la lista negra?')) {
    removeFromBlacklist(clientId);
    closeClientProfile();
    showClientsView();
    alert('Cliente removido de la lista negra');
  }
}

/**
 * Mostrar modal para crear nuevo cliente
 */
function showNewClientModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'new-client-modal';
  
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>➕ Nuevo Cliente</h2>
        <button class="modal-close" onclick="closeNewClientModal()">&times;</button>
      </div>
      
      <div class="modal-body">
        <form id="new-client-form">
          <div class="form-section">
            <h3>📋 Información Básica</h3>
            
            <div class="form-group">
              <label for="new-client-dni">DNI / Pasaporte *</label>
              <input 
                type="text" 
                id="new-client-dni" 
                required 
                placeholder="12345678"
                pattern="\\d{7,8}"
              >
              <small>7 u 8 dígitos sin puntos</small>
            </div>
            
            <div class="form-group">
              <label for="new-client-name">Nombre Completo *</label>
              <input 
                type="text" 
                id="new-client-name" 
                required 
                placeholder="Juan Pérez"
              >
            </div>
            
            <div class="form-group">
              <label for="new-client-phone">Teléfono *</label>
              <input 
                type="tel" 
                id="new-client-phone" 
                required 
                placeholder="2262123456"
                pattern="\\d{10}"
              >
              <small>10 dígitos sin espacios</small>
            </div>
            
            <div class="form-group">
              <label for="new-client-email">Email</label>
              <input 
                type="email" 
                id="new-client-email" 
                placeholder="cliente@email.com"
              >
            </div>
          </div>
          
          <div class="form-section">
            <h3>📍 Procedencia (Opcional)</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="new-client-country">País</label>
                <input 
                  type="text" 
                  id="new-client-country" 
                  placeholder="Argentina"
                  value="Argentina"
                >
              </div>
              
              <div class="form-group">
                <label for="new-client-state">Provincia/Estado</label>
                <input 
                  type="text" 
                  id="new-client-state" 
                  placeholder="Buenos Aires"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="new-client-city">Ciudad</label>
              <input 
                type="text" 
                id="new-client-city" 
                placeholder="Capital Federal"
              >
            </div>
            
            <div class="form-group">
              <label for="new-client-neighborhood">Barrio</label>
              <input 
                type="text" 
                id="new-client-neighborhood" 
                placeholder="Palermo"
              >
            </div>
            
            <div class="form-row">
              <div class="form-group" style="flex: 2;">
                <label for="new-client-street">Calle</label>
                <input 
                  type="text" 
                  id="new-client-street" 
                  placeholder="Av. Santa Fe"
                >
              </div>
              
              <div class="form-group">
                <label for="new-client-number">Número</label>
                <input 
                  type="text" 
                  id="new-client-number" 
                  placeholder="1234"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="new-client-floor">Piso/Depto</label>
                <input 
                  type="text" 
                  id="new-client-floor" 
                  placeholder="5°B"
                >
              </div>
              
              <div class="form-group">
                <label for="new-client-zipcode">Código Postal</label>
                <input 
                  type="text" 
                  id="new-client-zipcode" 
                  placeholder="1425"
                >
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>📝 Notas</h3>
            <div class="form-group">
              <label for="new-client-notes">Observaciones</label>
              <textarea 
                id="new-client-notes" 
                rows="3"
                placeholder="Ej: Prefiere sombrillas cerca del mar, viene con 2 niños..."
              ></textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeNewClientModal()">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              ✅ Crear Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listener para el formulario
  document.getElementById('new-client-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleNewClientSubmit();
  });
  
  // Focus en el primer campo
  document.getElementById('new-client-dni').focus();
}

/**
 * Cerrar modal de nuevo cliente
 */
function closeNewClientModal() {
  const modal = document.getElementById('new-client-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Manejar envío del formulario de nuevo cliente
 */
function handleNewClientSubmit() {
  const clientData = {
    dni: document.getElementById('new-client-dni').value.trim(),
    fullName: document.getElementById('new-client-name').value.trim(),
    phone: document.getElementById('new-client-phone').value.trim(),
    email: document.getElementById('new-client-email').value.trim() || '',
    origin: {
      country: document.getElementById('new-client-country').value.trim() || '',
      state: document.getElementById('new-client-state').value.trim() || '',
      city: document.getElementById('new-client-city').value.trim() || '',
      address: {
        neighborhood: document.getElementById('new-client-neighborhood').value.trim() || '',
        street: document.getElementById('new-client-street').value.trim() || '',
        number: document.getElementById('new-client-number').value.trim() || '',
        floor: document.getElementById('new-client-floor').value.trim() || '',
        zipCode: document.getElementById('new-client-zipcode').value.trim() || ''
      }
    },
    notes: document.getElementById('new-client-notes').value.trim() || ''
  };
  
  // Verificar si el cliente ya existe
  const existingClient = getClientByDNI(clientData.dni);
  if (existingClient) {
    showNotification('⚠️ Ya existe un cliente con ese DNI', 'warning');
    return;
  }
  
  // Guardar el cliente
  const savedClient = saveClient(clientData);
  
  if (savedClient) {
    showNotification('✅ Cliente creado correctamente', 'success');
    closeNewClientModal();
    showClientsView(); // Recargar la vista de clientes
  } else {
    showNotification('❌ Error al crear el cliente', 'error');
  }
}

/**
 * Mostrar modal para editar cliente existente
 * @param {string} clientId - ID del cliente a editar
 */
function showEditClientModal(clientId) {
  const client = getClientById(clientId);
  if (!client) {
    showNotification('❌ Cliente no encontrado', 'error');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'edit-client-modal';
  
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>✏️ Editar Cliente</h2>
        <button class="modal-close" onclick="closeEditClientModal()">&times;</button>
      </div>
      
      <div class="modal-body">
        <form id="edit-client-form">
          <div class="form-section">
            <h3>📋 Información Básica</h3>
            
            <div class="form-group">
              <label for="edit-client-dni">DNI / Pasaporte *</label>
              <input 
                type="text" 
                id="edit-client-dni" 
                required 
                placeholder="12345678"
                pattern="\\d{7,8}"
                value="${client.dni}"
                readonly
                style="background-color: #f0f0f0;"
              >
              <small>El DNI no puede ser modificado</small>
            </div>
            
            <div class="form-group">
              <label for="edit-client-name">Nombre Completo *</label>
              <input 
                type="text" 
                id="edit-client-name" 
                required 
                placeholder="Juan Pérez"
                value="${client.fullName}"
              >
            </div>
            
            <div class="form-group">
              <label for="edit-client-phone">Teléfono *</label>
              <input 
                type="tel" 
                id="edit-client-phone" 
                required 
                placeholder="2262123456"
                pattern="\\d{10}"
                value="${client.phone}"
              >
              <small>10 dígitos sin espacios</small>
            </div>
            
            <div class="form-group">
              <label for="edit-client-email">Email</label>
              <input 
                type="email" 
                id="edit-client-email" 
                placeholder="cliente@email.com"
                value="${client.email || ''}"
              >
            </div>
          </div>
          
          <div class="form-section">
            <h3>📍 Procedencia (Opcional)</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="edit-client-country">País</label>
                <input 
                  type="text" 
                  id="edit-client-country" 
                  placeholder="Argentina"
                  value="${client.origin?.country || 'Argentina'}"
                >
              </div>
              
              <div class="form-group">
                <label for="edit-client-state">Provincia/Estado</label>
                <input 
                  type="text" 
                  id="edit-client-state" 
                  placeholder="Buenos Aires"
                  value="${client.origin?.state || ''}"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="edit-client-city">Ciudad</label>
              <input 
                type="text" 
                id="edit-client-city" 
                placeholder="Capital Federal"
                value="${client.origin?.city || ''}"
              >
            </div>
            
            <div class="form-group">
              <label for="edit-client-neighborhood">Barrio</label>
              <input 
                type="text" 
                id="edit-client-neighborhood" 
                placeholder="Palermo"
                value="${client.origin?.address?.neighborhood || ''}"
              >
            </div>
            
            <div class="form-row">
              <div class="form-group" style="flex: 2;">
                <label for="edit-client-street">Calle</label>
                <input 
                  type="text" 
                  id="edit-client-street" 
                  placeholder="Av. Santa Fe"
                  value="${client.origin?.address?.street || ''}"
                >
              </div>
              
              <div class="form-group">
                <label for="edit-client-number">Número</label>
                <input 
                  type="text" 
                  id="edit-client-number" 
                  placeholder="1234"
                  value="${client.origin?.address?.number || ''}"
                >
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="edit-client-floor">Piso/Depto</label>
                <input 
                  type="text" 
                  id="edit-client-floor" 
                  placeholder="5°B"
                  value="${client.origin?.address?.floor || ''}"
                >
              </div>
              
              <div class="form-group">
                <label for="edit-client-zipcode">Código Postal</label>
                <input 
                  type="text" 
                  id="edit-client-zipcode" 
                  placeholder="1425"
                  value="${client.origin?.address?.zipCode || ''}"
                >
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>📝 Notas</h3>
            <div class="form-group">
              <label for="edit-client-notes">Observaciones</label>
              <textarea 
                id="edit-client-notes" 
                rows="3"
                placeholder="Ej: Prefiere sombrillas cerca del mar, viene con 2 niños..."
              >${client.notes || ''}</textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn-secondary" onclick="closeEditClientModal()">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              ✅ Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listener para el formulario
  document.getElementById('edit-client-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleEditClientSubmit(clientId);
  });
  
  // Focus en el primer campo editable
  document.getElementById('edit-client-name').focus();
}

/**
 * Cerrar modal de editar cliente
 */
function closeEditClientModal() {
  const modal = document.getElementById('edit-client-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Manejar envío del formulario de editar cliente
 * @param {string} clientId - ID del cliente a actualizar
 */
function handleEditClientSubmit(clientId) {
  const client = getClientById(clientId);
  if (!client) {
    showNotification('❌ Cliente no encontrado', 'error');
    return;
  }
  
  // Actualizar datos (manteniendo campos que no se editan)
  const updatedClient = {
    ...client,
    fullName: document.getElementById('edit-client-name').value.trim(),
    phone: document.getElementById('edit-client-phone').value.trim(),
    email: document.getElementById('edit-client-email').value.trim() || '',
    origin: {
      country: document.getElementById('edit-client-country').value.trim() || '',
      state: document.getElementById('edit-client-state').value.trim() || '',
      city: document.getElementById('edit-client-city').value.trim() || '',
      address: {
        neighborhood: document.getElementById('edit-client-neighborhood').value.trim() || '',
        street: document.getElementById('edit-client-street').value.trim() || '',
        number: document.getElementById('edit-client-number').value.trim() || '',
        floor: document.getElementById('edit-client-floor').value.trim() || '',
        zipCode: document.getElementById('edit-client-zipcode').value.trim() || ''
      }
    },
    notes: document.getElementById('edit-client-notes').value.trim() || '',
    updatedAt: new Date().toISOString()
  };
  
  // Guardar el cliente
  const savedClient = saveClient(updatedClient);
  
  if (savedClient) {
    showNotification('✅ Cliente actualizado correctamente', 'success');
    closeEditClientModal();
    closeClientProfile(); // Cerrar el perfil si estaba abierto
    showClientsView(); // Recargar la vista de clientes
  } else {
    showNotification('❌ Error al actualizar el cliente', 'error');
  }
}

/**
 * Eliminar cliente
 * @param {string} clientId - ID del cliente a eliminar
 */
function deleteClient(clientId) {
  console.log('🗑️ deleteClient llamado con ID:', clientId);
  const client = getClientById(clientId);
  if (!client) {
    console.error('Cliente no encontrado:', clientId);
    showNotification('❌ Cliente no encontrado', 'error');
    return;
  }
  
  console.log('Cliente encontrado:', client);
  
  // Verificar si tiene reservas activas
  const activeRentals = getRentals().filter(r => 
    r.clientId === clientId && 
    new Date(r.endDate) >= new Date()
  );
  
  if (activeRentals.length > 0) {
    alert(`⚠️ No se puede eliminar este cliente porque tiene ${activeRentals.length} reserva(s) activa(s).\n\nPrimero debe cancelar todas sus reservas activas o esperar a que finalicen.`);
    return;
  }
  
  // Verificar si tiene reservas pasadas
  const pastRentals = getRentals().filter(r => r.clientId === clientId);
  
  if (pastRentals.length > 0) {
    const confirmMsg = `Este cliente tiene ${pastRentals.length} reserva(s) en el historial.\n\n¿Desea ARCHIVAR el cliente en lugar de eliminarlo?\n\n✅ Sí (Archivar - Recomendado)\n❌ No (Eliminar permanentemente)`;
    
    if (confirm(confirmMsg)) {
      // Archivar (marcar como inactivo)
      const archivedClient = {
        ...client,
        archived: true,
        archivedAt: new Date().toISOString()
      };
      
      if (saveClient(archivedClient)) {
        showNotification('📦 Cliente archivado correctamente', 'success');
        closeClientProfile();
        showClientsView();
      } else {
        showNotification('❌ Error al archivar el cliente', 'error');
      }
      return;
    }
  }
  
  // Confirmación final para eliminar
  const confirmDelete = confirm(`¿Está seguro de que desea eliminar a ${client.fullName}?\n\nEsta acción NO se puede deshacer.`);
  
  if (confirmDelete) {
    if (deleteClientById(clientId)) {
      showNotification('✅ Cliente eliminado correctamente', 'success');
      closeClientProfile();
      showClientsView();
    } else {
      showNotification('❌ Error al eliminar el cliente', 'error');
    }
  }
}

// ========================================
// VISTA RÁPIDA DE PLAZAS
// ========================================

let quickViewType = 'sombrilla'; // Tipo activo en vista rápida

/**
 * Renderizar vista rápida de plazas
 */
// Estado global para la fecha seleccionada en vista rápida
let quickViewDate = new Date();

function renderQuickView(type = quickViewType, date = quickViewDate) {
  quickViewType = type;
  quickViewDate = date;
  const container = document.getElementById('quick-view-container');
  const config = UNIT_TYPES[type];
  
  if (!config) {
    container.innerHTML = '<p class="error-message">Configuración no encontrada</p>';
    return;
  }
  
  const viewDate = new Date(date);
  viewDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isToday = viewDate.getTime() === today.getTime();
  
  const units = [];
  
  // Calcular estado de cada unidad
  const totalUnits = config.total || config.quantity || 0;
  
  console.log(`Vista Rápida - Tipo: ${type}, Total unidades: ${totalUnits}`);
  console.log('Config completa:', config);
  
  for (let i = 1; i <= totalUnits; i++) {
    const status = calculateUnitStatus(type, i, viewDate);
    units.push({
      unitNumber: i,
      ...status
    });
  }
  
  console.log('Vista Rápida - Total unidades calculadas:', units.length);
  console.log('Vista Rápida - Primera unidad:', units[0]);
  
  // Contar estadísticas
  const stats = {
    free: units.filter(u => u.status === 'free').length,
  // Ocupadas: todas las que están ocupadas o vencidas, sin importar el pago
  occupied: units.filter(u => u.status === 'occupied' || u.status === 'overdue').length,
  // Con deuda: las ocupadas con pago parcial
  partial: units.filter(u => (u.status === 'occupied' || u.status === 'overdue') && u.paymentStatus === 'partial').length,
  reserved: units.filter(u => u.status === 'reserved').length,
  overdue: units.filter(u => u.status === 'overdue').length
  };
  
  container.innerHTML = `
    <div class="quick-view-section">
      <div class="quick-view-header">
        <div>
          <h2>👁️ Vista Rápida de Plazas</h2>
          <div class="quick-view-date-navigator">
            <button class="date-nav-btn" onclick="navigateQuickViewDate(-1)" title="Día anterior">
              ◀️
            </button>
            <div class="date-display">
              ${isToday 
                ? `<strong>HOY</strong> - ${viewDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                : viewDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              }
            </div>
            <button class="date-nav-btn" onclick="navigateQuickViewDate(1)" title="Día siguiente">
              ▶️
            </button>
            ${!isToday ? `
              <button class="date-today-btn" onclick="resetQuickViewToToday()" title="Volver a hoy">
                📅 Hoy
              </button>
            ` : ''}
          </div>
        </div>
        <div class="quick-view-tabs">
          ${Object.keys(UNIT_TYPES).map(t => {
            const cfg = UNIT_TYPES[t];
            return `
              <button 
                class="quick-view-tab ${t === type ? 'active' : ''}" 
                onclick="renderQuickView('${t}', quickViewDate)"
                title="${cfg.label}">
                ${cfg.icon} ${cfg.label}
              </button>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="quick-view-summary">
        <div class="summary-stat free">
          <span class="stat-icon">⚪</span>
          <span class="stat-value">${stats.free}</span>
          <span class="stat-label">Libres</span>
        </div>
        <div class="summary-stat occupied">
          <span class="stat-icon">🟢</span>
          <span class="stat-value">${stats.occupied}</span>
          <span class="stat-label">Ocupadas</span>
        </div>
        ${stats.partial > 0 ? `
          <div class="summary-stat partial">
            <span class="stat-icon">🟡</span>
            <span class="stat-value">${stats.partial}</span>
            <span class="stat-label">Con Deuda</span>
          </div>
        ` : ''}
        ${stats.reserved > 0 ? `
          <div class="summary-stat reserved">
            <span class="stat-icon">🟠</span>
            <span class="stat-value">${stats.reserved}</span>
            <span class="stat-label">Reservas</span>
          </div>
        ` : ''}
        ${stats.overdue > 0 ? `
          <div class="summary-stat overdue">
            <span class="stat-icon">🔴</span>
            <span class="stat-value">${stats.overdue}</span>
            <span class="stat-label">Vencidas</span>
          </div>
        ` : ''}
      </div>
      
      <div class="quick-view-grid">
        ${units.map(unit => renderUnitCard(unit, type, config)).join('')}
      </div>
      
      <div class="quick-view-legend">
        <h4>📖 Leyenda</h4>
        <div class="legend-items">
          <div class="legend-item"><span class="legend-box free"></span> Libre</div>
          <div class="legend-item"><span class="legend-box occupied"></span> Ocupada y Pagada</div>
          <div class="legend-item"><span class="legend-box partial"></span> Ocupada con Deuda</div>
          <div class="legend-item"><span class="legend-box reserved"></span> Reserva Próxima (≤7 días)</div>
          <div class="legend-item"><span class="legend-box overdue"></span> Estadía Vencida</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderizar tarjeta de unidad individual
 */
function renderUnitCard(unit, type, config) {
  const { unitNumber, status, paymentStatus, clientName, daysRemaining, daysUntilCheckIn, amountDue, daysUntilNextReservation, rentalId } = unit;
  
  console.log(`Renderizando tarjeta ${config.prefix}${unitNumber} - Status: ${status}`);
  
  let cardClass = 'unit-card';
  let content = '';
  let clickHandler = '';
  
  switch (status) {
    case 'free':
      cardClass += ' free';
      clickHandler = `onclick="openNewRentalFromQuickView('${type}', ${unitNumber})"`;
      content = `
        <div class="unit-number">${config.prefix}${unitNumber}</div>
        <div class="unit-status-label">LIBRE</div>
        ${daysUntilNextReservation !== null && daysUntilNextReservation <= 45
          ? `<div class="unit-info"><strong>Llega en:<br>${daysUntilNextReservation} día${daysUntilNextReservation !== 1 ? 's' : ''}</strong></div>`
          : `<div class="unit-info">Click para<br>reservar</div>`
        }
      `;
      break;
      
    case 'occupied':
      cardClass += paymentStatus === 'paid' ? ' occupied-paid' : ' occupied-partial';
      clickHandler = rentalId ? `onclick="showRentalDetails('${rentalId}')"` : '';
      content = `
        <div class="unit-number">${config.prefix}${unitNumber}</div>
        <div class="unit-status-label">OCUPADA</div>
        ${paymentStatus === 'partial' && amountDue > 0
          ? `<div class="unit-info debt"><strong>Debe:<br>$${amountDue.toLocaleString('es-AR')}</strong></div>`
          : `<div class="unit-info"><strong>${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}<br>restante${daysRemaining !== 1 ? 's' : ''}</strong></div>`
        }
      `;
      break;
      
    case 'reserved':
      // Si hay días libres antes de la próxima reserva, mostrar 'Libre X días'
      let diasLibres = unit.daysUntilNextReservation;
      if (diasLibres === undefined || diasLibres === null) diasLibres = daysUntilCheckIn;
      if (diasLibres < 1) diasLibres = 1;
      cardClass += ' free';
      clickHandler = `onclick=\"openNewRentalFromQuickView('${type}', ${unitNumber})\"`;
      content = `
        <div class="unit-number">${config.prefix}${unitNumber}</div>
        <div class="unit-status-label">LIBRE</div>
        <div class="unit-info"><strong>Libre ${diasLibres} día${diasLibres !== 1 ? 's' : ''}</strong></div>
      `;
      break;
      
    case 'overdue':
      cardClass += paymentStatus === 'paid' ? ' occupied-paid' : ' occupied-partial';
      clickHandler = rentalId ? `onclick="showRentalDetails('${rentalId}')"` : '';
      content = `
        <div class="unit-number">${config.prefix}${unitNumber}</div>
        <div class="unit-status-label">OCUPADA</div>
        ${paymentStatus === 'partial' && amountDue > 0
          ? `<div class="unit-info debt"><strong>Debe:<br>$${amountDue.toLocaleString('es-AR')}</strong></div>`
          : `<div class="unit-info"><strong>${daysRemaining === 1 ? 'ULTIMO DIA' : '0 días restantes'}</strong></div>`
        }
      `;
      break;
  }
  
  return `<div class="${cardClass}" ${clickHandler} title="Click para ver detalles">${content}</div>`;
}

/**
 * Navegar días en la vista rápida
 */
function navigateQuickViewDate(days) {
  const newDate = new Date(quickViewDate);
  newDate.setDate(newDate.getDate() + days);
  renderQuickView(quickViewType, newDate);
}

/**
 * Volver a hoy en la vista rápida
 */
function resetQuickViewToToday() {
  quickViewDate = new Date();
  renderQuickView(quickViewType, quickViewDate);
}

/**
 * Abrir modal de nueva reserva desde Vista Rápida
 */
function openNewRentalFromQuickView(type, unitNumber) {
  // Formatear fecha para el input date
  let dateStr = quickViewDate.toISOString().split('T')[0];
  
  // Verificar si la fecha está dentro de la temporada
  if (dateStr < SEASON.startDate) {
    dateStr = SEASON.startDate; // Usar primer día de temporada
    console.log('Fecha ajustada al inicio de temporada:', dateStr);
  } else if (dateStr > SEASON.endDate) {
    dateStr = SEASON.endDate; // Usar último día de temporada
    console.log('Fecha ajustada al fin de temporada:', dateStr);
  }
  
  console.log('Abriendo reserva desde Vista Rápida:', type, unitNumber, dateStr);
  
  // Cambiar a la vista de recursos
  switchTab(type);
  
  // Esperar un momento para que se renderice la grilla
  setTimeout(() => {
    // Buscar la celda correspondiente en la grilla
    const cell = document.querySelector(
      `.grid-cell[data-type="${type}"][data-unit="${unitNumber}"][data-date="${dateStr}"]`
    );
    
    console.log('Celda encontrada:', cell);
    console.log('Clases de la celda:', cell ? cell.className : 'no encontrada');
    
    if (cell && cell.classList.contains('available')) {
      // Llamar directamente a startSelection en lugar de simular click
      startSelection(cell);
    } else {
      // Si no encuentra la celda o no está disponible, mostrar mensaje
      const config = UNIT_TYPES[type];
      if (!cell) {
        showNotification(
          `No se encontró ${config.prefix}${unitNumber} en el calendario. Fecha: ${dateStr}`,
          'warning'
        );
      } else {
        showNotification(
          `${config.prefix}${unitNumber} no está disponible en esta fecha`,
          'warning'
        );
      }
    }
  }, 400);
}

// ========================================
// FUNCIONES DE GESTIÓN DE PILETA
// ========================================

let currentPoolDate = new Date().toISOString().split('T')[0];

/**
 * Mostrar sección de gestión de pileta
 */
function showPoolSection() {
  currentView = 'pool';
  
  // Ocultar todas las otras vistas
  document.getElementById('dashboard-container').style.display = 'none';
  document.getElementById('resource-content').style.display = 'none';
  document.getElementById('manage-pricing-btn').style.display = 'none';
  
  const quickViewContainer = document.getElementById('quick-view-container');
  if (quickViewContainer) {
    quickViewContainer.style.display = 'none';
  }
  
  const clientsContainer = document.getElementById('clients-container');
  if (clientsContainer) {
    clientsContainer.style.display = 'none';
  }
  
  // Mostrar contenedor de pileta
  let poolContainer = document.getElementById('pool-container');
  if (!poolContainer) {
    poolContainer = document.createElement('div');
    poolContainer.id = 'pool-container';
    poolContainer.className = 'pool-container';
    document.querySelector('.main-container').appendChild(poolContainer);
  }
  
  poolContainer.style.display = 'block';
  renderPoolSection();
}

/**
 * Renderizar sección completa de pileta
 */
function renderPoolSection() {
  const container = document.getElementById('pool-container');
  if (!container) {
    console.error('❌ No se encontró el contenedor de pileta');
    return;
  }
  
  // Verificar que las funciones de pool estén disponibles
  if (typeof getPoolOccupancyByDate !== 'function' || 
      typeof getPoolRevenueByDate !== 'function' || 
      typeof getPoolConfig !== 'function') {
    console.error('❌ Funciones de pool no disponibles');
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>Error: Módulo de pileta no cargado correctamente</p>
        <button class="btn btn-primary" onclick="location.reload()">Recargar página</button>
      </div>
    `;
    return;
  }
  
  try {
    const occupancy = getPoolOccupancyByDate(currentPoolDate);
    const revenue = getPoolRevenueByDate(currentPoolDate);
    const config = getPoolConfig();
    
    console.log('✅ Datos de pileta cargados:', { occupancy, revenue, config });
  
    const dateObj = new Date(currentPoolDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  container.innerHTML = `
    <div class="pool-section">
      <div class="pool-header">
        <div>
          <h2>🏊 Gestión de Pileta</h2>
          <p class="pool-subtitle">Control de aforo y ventas de entradas</p>
        </div>
        
        <div class="pool-date-navigator">
          <button class="nav-button" onclick="changePoolDate(-1)" title="Día anterior">◀️</button>
          <div class="pool-current-date">
            <span class="date-label">Fecha:</span>
            <span class="date-value">${formattedDate}</span>
          </div>
          <button class="nav-button" onclick="changePoolDate(1)" title="Día siguiente">▶️</button>
          <button class="nav-button today-button" onclick="goToPoolToday()">📅 Hoy</button>
        </div>
      </div>
      
      <div class="pool-stats-grid">
        <div class="pool-stat-card capacity-card">
          <div class="stat-header">
            <span class="stat-icon">👥</span>
            <h3>Ocupación del Día</h3>
          </div>
          <div class="capacity-display">
            <div class="capacity-number">
              <span class="current">${occupancy.currentOccupancy}</span>
              <span class="separator">/</span>
              <span class="max">${occupancy.maxCapacity}</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill" style="width: ${occupancy.percentOccupied}%; background: ${
                occupancy.percentOccupied > 90 ? '#f44336' : 
                occupancy.percentOccupied > 70 ? '#ff9800' : '#4CAF50'
              }"></div>
            </div>
            <span class="capacity-text">${occupancy.percentOccupied}% ocupado · ${occupancy.available} disponibles</span>
          </div>
        </div>
        
        <div class="pool-stat-card revenue-card">
          <div class="stat-header">
            <span class="stat-icon">💰</span>
            <h3>Ingresos del Día</h3>
          </div>
          <div class="revenue-display">
            <div class="revenue-amount">${formatCurrency(revenue.paidRevenue)}</div>
            <div class="revenue-details">
              <span>📋 ${revenue.entriesCount} entradas vendidas</span>
              <span>✅ ${revenue.paidEntriesCount} pagadas</span>
              ${revenue.pendingRevenue > 0 ? `<span class="pending">⏳ ${formatCurrency(revenue.pendingRevenue)} pendiente</span>` : ''}
            </div>
          </div>
        </div>
        
        <div class="pool-stat-card config-card">
          <div class="stat-header">
            <span class="stat-icon">⚙️</span>
            <h3>Configuración</h3>
          </div>
          <div class="config-display">
            <div class="config-item">
              <span>Entrada día:</span>
              <strong>${formatCurrency(config.prices.dayPass)}</strong>
            </div>
            <div class="config-item">
              <span>Pase estadía/día:</span>
              <strong>${formatCurrency(config.prices.stayPassPerDay)}</strong>
            </div>
            <div class="config-item">
              <span>Capacidad máx:</span>
              <strong>${config.maxCapacity} personas</strong>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pool-actions">
        <button class="btn btn-primary btn-large" onclick="showNewPoolEntryModal()">
          ➕ Vender Entrada
        </button>
        <button class="btn btn-secondary" onclick="showTodaysSales()">
          💰 Ventas de Hoy
        </button>
        <button class="btn btn-secondary" onclick="showPoolConfig()">
          ⚙️ Configuración
        </button>
      </div>
      
      <div id="pool-entries-list" class="pool-entries-section">
        ${renderPoolEntriesList()}
      </div>
    </div>
  `;
  } catch (error) {
    console.error('❌ Error al renderizar sección de pileta:', error);
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>Error al cargar la sección de pileta</p>
        <p style="color: #666; font-size: 0.9em;">${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Recargar página</button>
      </div>
    `;
  }
}

/**
 * Renderizar lista de entradas del día
 */
function renderPoolEntriesList() {
  try {
    if (typeof getPoolOccupancyByDate !== 'function') {
      console.error('❌ getPoolOccupancyByDate no está disponible');
      return `<div class="empty-state"><p>Error: función no disponible</p></div>`;
    }
    
    const occupancy = getPoolOccupancyByDate(currentPoolDate);
  
  if (occupancy.entries.length === 0) {
    return `
      <div class="empty-state">
        <span class="empty-icon">🏊</span>
        <p>No hay entradas registradas para este día</p>
      </div>
    `;
  }
  
  const entriesHtml = occupancy.entries
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(entry => {
      const statusBadge = entry.paymentStatus === 'paid' ? 
        '<span class="badge badge-success">✅ Pagado</span>' :
        entry.paymentStatus === 'partial' ?
        '<span class="badge badge-warning">⏳ Parcial</span>' :
        '<span class="badge badge-danger">❌ Pendiente</span>';
      
      const typeLabel = entry.entryType === 'day' ? '🎫 Día' : '🎟️ Estadía';
      const createdTime = new Date(entry.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="pool-entry-card">
          <div class="entry-header">
            <div class="entry-client">
              <strong>${entry.clientName}</strong>
              ${entry.clientDNI ? `<span class="dni">DNI: ${entry.clientDNI}</span>` : ''}
            </div>
            <div class="entry-actions">
              <button class="btn-icon" onclick="viewPoolEntry('${entry.id}')" title="Ver detalles">👁️</button>
              <button class="btn-icon" onclick="printPoolTicket('${entry.id}')" title="Imprimir entrada">🖨️</button>
              <button class="btn-icon btn-danger" onclick="deletePoolEntry('${entry.id}')" title="Eliminar entrada">🗑️</button>
            </div>
          </div>
          <div class="entry-details">
            <span class="entry-type">${typeLabel}</span>
            <span class="entry-people">👥 ${entry.numberOfPeople} personas</span>
            <span class="entry-time">🕐 ${createdTime}</span>
          </div>
          <div class="entry-footer">
            <span class="entry-price">${formatCurrency(entry.totalPrice)}</span>
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
  
  return `
    <div class="entries-header">
      <h3>📋 Entradas del día (${occupancy.entries.length})</h3>
    </div>
    <div class="pool-entries-grid">
      ${entriesHtml}
    </div>
  `;
  } catch (error) {
    console.error('❌ Error al renderizar lista de entradas:', error);
    return `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>Error al cargar las entradas</p>
      </div>
    `;
  }
}

/**
 * Cambiar fecha de pileta
 */
function changePoolDate(days) {
  const date = new Date(currentPoolDate + 'T12:00:00');
  date.setDate(date.getDate() + days);
  currentPoolDate = date.toISOString().split('T')[0];
  renderPoolSection();
}

/**
 * Ir a hoy en pileta
 */
function goToPoolToday() {
  currentPoolDate = new Date().toISOString().split('T')[0];
  renderPoolSection();
}

/**
 * Mostrar modal de nueva entrada de pileta
 */
function showNewPoolEntryModal() {
  const config = getPoolConfig();
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay pool-modal';
  modal.innerHTML = `
    <div class="modal modal-large">
      <div class="modal-header">
        <h3>🏊 Nueva Entrada de Pileta</h3>
        <button class="modal-close" id="close-pool-entry-modal">×</button>
      </div>
      
      <div class="modal-body">
        <form id="pool-entry-form">
          
          <!-- Información del cliente -->
          <div class="client-search-section">
            <h3>👤 Datos del Cliente</h3>
            
            <!-- Alerta cuando cliente existe -->
            <div id="pool-client-found-alert" class="client-found-alert" style="display: none;">
              <div class="alert-content">
                <span class="alert-icon">✅</span>
                <div class="alert-text">
                  <strong>Cliente encontrado:</strong>
                  <span id="pool-found-client-name"></span>
                </div>
                <button type="button" id="pool-clear-client-btn" class="btn-clear-client" title="Limpiar formulario">✖</button>
              </div>
              <div class="client-quick-info" id="pool-client-quick-info"></div>
            </div>
            
            <!-- Formulario de cliente -->
            <div id="pool-client-form-fields">
              <div class="form-group">
                <label for="pool-client-dni">DNI / Pasaporte</label>
                <div class="search-input-group">
                  <input type="text" id="pool-client-dni" placeholder="12345678">
                  <button type="button" id="pool-search-client-btn" class="btn-search-client" title="Buscar cliente existente">
                    🔍 Buscar
                  </button>
                </div>
                <small>Ingrese DNI y presione buscar para autocompletar datos</small>
              </div>
              
              <div class="form-group">
                <label for="pool-client-name">Nombre completo *</label>
                <input type="text" id="pool-client-name" required placeholder="Juan Pérez">
              </div>
              
              <div class="form-group">
                <label for="pool-client-phone">Teléfono</label>
                <input type="tel" id="pool-client-phone" placeholder="2262-123456">
              </div>
            </div>
          </div>

          <!-- Tipo de entrada -->
          <div class="form-section">
            <h4>🎫 Tipo de Entrada</h4>
            <div class="radio-group">
              <label class="radio-card">
                <input type="radio" name="entry-type" value="day" checked id="entry-type-day">
                <div class="radio-content">
                  <span class="radio-icon">🎫</span>
                  <div>
                    <strong>Entrada por Día</strong>
                    <span>${formatCurrency(config.prices.dayPass)}/persona</span>
                  </div>
                </div>
              </label>
              <label class="radio-card">
                <input type="radio" name="entry-type" value="stay" id="entry-type-stay">
                <div class="radio-content">
                  <span class="radio-icon">🎟️</span>
                  <div>
                    <strong>Pase por Estadía</strong>
                    <span>${formatCurrency(config.prices.stayPassPerDay)}/persona/día</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Fecha(s) -->
          <div class="form-section" id="day-entry-section">
            <h4>📅 Fecha</h4>
            <input type="date" id="pool-entry-date" value="${currentPoolDate}" required>
          </div>

          <div class="form-section" id="stay-entry-section" style="display: none;">
            <h4>📅 Rango de Fechas</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="pool-stay-start">Desde</label>
                <input type="date" id="pool-stay-start" value="${currentPoolDate}">
              </div>
              <div class="form-group">
                <label for="pool-stay-end">Hasta</label>
                <input type="date" id="pool-stay-end">
              </div>
            </div>
            <div id="pool-stay-days" class="info-text"></div>
          </div>

          <!-- Cantidad de personas -->
          <div class="form-section">
            <h4>👥 Cantidad de Personas</h4>
            
            <!-- Contadores por edad -->
            <div class="people-counters">
              <div class="counter-group">
                <label class="counter-label">
                  <span class="counter-icon">👨‍👩‍👧‍👦</span>
                  <span>Adultos (13+ años)</span>
                  <span class="counter-price" id="adult-price-label">${formatCurrency(config.prices.adult || config.prices.dayPass)}</span>
                </label>
                <div class="counter-controls">
                  <button type="button" class="counter-btn minus" onclick="changeCounter('adults', -1)">
                    <span class="btn-icon">−</span>
                  </button>
                  <input type="number" id="pool-adults-count" min="0" max="20" value="1" readonly>
                  <button type="button" class="counter-btn plus" onclick="changeCounter('adults', 1)">
                    <span class="btn-icon">+</span>
                  </button>
                </div>
              </div>
              
              <div class="counter-group">
                <label class="counter-label">
                  <span class="counter-icon">👶</span>
                  <span>Menores (0-12 años) <small class="discount-badge">35% OFF</small></span>
                  <span class="counter-price" id="child-price-label">${formatCurrency((config.prices.adult || config.prices.dayPass) * 0.65)}</span>
                </label>
                <div class="counter-controls">
                  <button type="button" class="counter-btn minus" onclick="changeCounter('children', -1)">
                    <span class="btn-icon">−</span>
                  </button>
                  <input type="number" id="pool-children-count" min="0" max="20" value="0" readonly>
                  <button type="button" class="counter-btn plus" onclick="changeCounter('children', 1)">
                    <span class="btn-icon">+</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="people-summary">
              <span class="total-people">Total: <strong id="pool-total-people">1 persona</strong></span>
            </div>
            
            <div id="pool-group-discount-info" class="info-text"></div>
          </div>

          <!-- Resumen de precio -->
          <div class="pool-price-summary">
            <h4>💰 Resumen de Precio</h4>
            <div class="price-breakdown">
              <div class="price-row" id="pool-adults-price-row">
                <span>Adultos (<span id="adults-count-display">1</span>):</span>
                <span id="pool-adults-subtotal">${formatCurrency(config.prices.adult || config.prices.dayPass)}</span>
              </div>
              <div class="price-row" id="pool-children-price-row" style="display: none;">
                <span>Menores (<span id="children-count-display">0</span>):</span>
                <span id="pool-children-subtotal">$0</span>
              </div>
              <div class="price-row" id="pool-discount-row" style="display: none;">
                <span>Descuento por grupo:</span>
                <span id="pool-discount-amount" class="discount">-$0</span>
              </div>
              <div class="price-row total-row">
                <span>Total a pagar:</span>
                <span id="pool-total-price">${formatCurrency(config.prices.adult || config.prices.dayPass)}</span>
              </div>
            </div>
          </div>

          <!-- Método de pago -->
          <div class="form-section">
            <h4>💳 Pago</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="pool-payment-method">Método de pago</label>
                <select id="pool-payment-method" required>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="mercadopago">🛒 MercadoPago</option>
                </select>
              </div>
              <div class="form-group">
                <label for="pool-payment-amount">Monto pagado</label>
                <input type="number" id="pool-payment-amount" min="0" required>
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div class="form-section">
            <h4>📝 Notas (opcional)</h4>
            <textarea id="pool-notes" rows="2" placeholder="Ej: Familia con niños pequeños"></textarea>
          </div>

        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancel-pool-entry">Cancelar</button>
        <button type="button" class="btn btn-primary" id="confirm-pool-entry">
          ✅ Confirmar Venta
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Activar animación de entrada
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  // Variable para almacenar el cliente encontrado
  let foundPoolClient = null;
  
  // Event listeners con animación de salida
  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  };
  
  document.getElementById('close-pool-entry-modal').addEventListener('click', closeModal);
  
  document.getElementById('cancel-pool-entry').addEventListener('click', closeModal);
  
  document.getElementById('confirm-pool-entry').addEventListener('click', () => {
    const success = confirmPoolEntry(foundPoolClient);
    if (success) {
      closeModal();
    }
  });
  
  // Búsqueda de cliente
  document.getElementById('pool-search-client-btn').addEventListener('click', () => {
    const dni = document.getElementById('pool-client-dni').value.trim();
    if (!dni) {
      showNotification('Por favor ingrese un DNI para buscar', 'warning');
      return;
    }
    
    const client = getClientByDNI(dni);
    if (client) {
      foundPoolClient = client;
      
      // Autocompletar campos
      document.getElementById('pool-client-name').value = client.fullName || client.name || '';
      document.getElementById('pool-client-phone').value = client.phone || '';
      
      // Mostrar alerta de cliente encontrado
      document.getElementById('pool-client-found-alert').style.display = 'block';
      document.getElementById('pool-found-client-name').textContent = client.fullName || client.name;
      
      // Info rápida del cliente
      const quickInfo = document.getElementById('pool-client-quick-info');
      quickInfo.innerHTML = `
        <p><strong>📞 Teléfono:</strong> ${client.phone || 'No registrado'}</p>
        ${client.email ? `<p><strong>📧 Email:</strong> ${client.email}</p>` : ''}
        ${client.origin && client.origin.city ? `<p><strong>📍 Ciudad:</strong> ${client.origin.city}</p>` : ''}
      `;
      
      showNotification('✅ Cliente encontrado y datos cargados', 'success');
    } else {
      foundPoolClient = null;
      showNotification('Cliente no encontrado. Puede registrar uno nuevo completando los datos', 'info');
    }
  });
  
  // Botón limpiar cliente
  document.getElementById('pool-clear-client-btn').addEventListener('click', () => {
    foundPoolClient = null;
    document.getElementById('pool-client-dni').value = '';
    document.getElementById('pool-client-name').value = '';
    document.getElementById('pool-client-phone').value = '';
    document.getElementById('pool-client-found-alert').style.display = 'none';
    showNotification('Formulario limpiado', 'info');
  });
  
  // Cerrar al hacer click fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Listeners para cambio de tipo de entrada
  document.getElementById('entry-type-day').addEventListener('change', toggleEntryType);
  document.getElementById('entry-type-stay').addEventListener('change', toggleEntryType);
  
  // Listeners para actualizar precio
  document.getElementById('pool-entry-date').addEventListener('change', updatePoolPriceSummary);
  document.getElementById('pool-stay-start').addEventListener('change', updatePoolPriceSummary);
  document.getElementById('pool-stay-end').addEventListener('change', updatePoolPriceSummary);
  
  // Inicializar precios
  setTimeout(() => {
    updatePriceLabels();
    updatePoolPriceSummary();
  }, 100);
}

/**
 * Alternar tipo de entrada (día/estadía)
 */
function toggleEntryType() {
  const entryType = document.querySelector('input[name="entry-type"]:checked').value;
  const daySection = document.getElementById('day-entry-section');
  const staySection = document.getElementById('stay-entry-section');
  
  if (entryType === 'day') {
    daySection.style.display = 'block';
    staySection.style.display = 'none';
  } else {
    daySection.style.display = 'none';
    staySection.style.display = 'block';
  }
  
  updatePriceLabels();
  updatePoolPriceSummary();
}

/**
 * Cambiar contador de personas por tipo de edad
 */
function changeCounter(type, delta) {
  const input = document.getElementById(`pool-${type}-count`);
  const currentValue = parseInt(input.value) || 0;
  const newValue = Math.max(0, Math.min(20, currentValue + delta));
  
  input.value = newValue;
  updatePoolPriceSummary();
}

/**
 * Actualizar precios en las etiquetas
 */
function updatePriceLabels() {
  const config = getPoolConfig();
  const entryType = document.querySelector('input[name="entry-type"]:checked')?.value || 'day';
  
  // Precios fijos: adultos precio completo, menores 35% descuento
  const adultPrice = entryType === 'day' ? config.prices.dayPass : config.prices.stayPassPerDay;
  const childPrice = adultPrice * 0.65; // 35% descuento = 65% del precio
  
  document.getElementById('adult-price-label').textContent = formatCurrency(adultPrice);
  document.getElementById('child-price-label').textContent = formatCurrency(childPrice);
}

/**
 * Actualizar resumen de precio en modal
 */
function updatePoolPriceSummary() {
  const entryType = document.querySelector('input[name="entry-type"]:checked')?.value || 'day';
  const adults = parseInt(document.getElementById('pool-adults-count')?.value) || 0;
  const children = parseInt(document.getElementById('pool-children-count')?.value) || 0;
  
  let numberOfDays = 1;
  
  if (entryType === 'stay') {
    const startDate = document.getElementById('pool-stay-start')?.value;
    const endDate = document.getElementById('pool-stay-end')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      const daysInfo = document.getElementById('pool-stay-days');
      if (daysInfo) {
        daysInfo.textContent = numberOfDays > 0 ? `📊 ${numberOfDays} días` : '';
      }
    }
  }
  
  // Crear configuración temporal con edad fija de 12 años
  const tempConfig = createDefaultPoolConfig(12);
  
  // Calcular precio usando el nuevo sistema
  const people = { adults, children };
  const priceInfo = calculatePoolEntryPrice(people, entryType, numberOfDays, tempConfig);
  
  // Actualizar etiquetas de precio
  updatePriceLabels();
  
  // Actualizar contadores y totales
  const totalPeople = adults + children;
  document.getElementById('pool-total-people').textContent = `${totalPeople} ${totalPeople === 1 ? 'persona' : 'personas'}`;
  
  // Actualizar displays de precio
  document.getElementById('adults-count-display').textContent = adults;
  document.getElementById('pool-adults-subtotal').textContent = formatCurrency(priceInfo.adultSubtotal);
  
  if (children > 0) {
    document.getElementById('pool-children-price-row').style.display = 'flex';
    document.getElementById('children-count-display').textContent = children;
    document.getElementById('pool-children-subtotal').textContent = formatCurrency(priceInfo.childSubtotal);
  } else {
    document.getElementById('pool-children-price-row').style.display = 'none';
  }
  
  // Mostrar descuento por grupo si aplica
  if (priceInfo.groupDiscount > 0) {
    document.getElementById('pool-discount-row').style.display = 'flex';
    document.getElementById('pool-discount-amount').textContent = 
      `-${formatCurrency(priceInfo.discountAmount)} (${Math.round(priceInfo.groupDiscount * 100)}%)`;
    
    document.getElementById('pool-group-discount-info').textContent = 
      `🎉 Descuento del ${Math.round(priceInfo.groupDiscount * 100)}% por grupo`;
    document.getElementById('pool-group-discount-info').style.display = 'block';
  } else {
    document.getElementById('pool-discount-row').style.display = 'none';
    document.getElementById('pool-group-discount-info').style.display = 'none';
  }
  
  document.getElementById('pool-total-price').textContent = formatCurrency(priceInfo.totalPrice);
  
  // Actualizar monto de pago sugerido
  document.getElementById('pool-payment-amount').value = priceInfo.totalPrice;
}

/**
 * Confirmar y guardar entrada de pileta
 */
function confirmPoolEntry(foundClient = null) {
  const entryType = document.querySelector('input[name="entry-type"]:checked').value;
  const clientName = document.getElementById('pool-client-name').value.trim();
  const clientDNI = document.getElementById('pool-client-dni').value.trim();
  const clientPhone = document.getElementById('pool-client-phone').value.trim();
  const adults = parseInt(document.getElementById('pool-adults-count').value) || 0;
  const children = parseInt(document.getElementById('pool-children-count').value) || 0;
  const ageLimit = 12; // Edad fija para menores
  const paymentMethod = document.getElementById('pool-payment-method').value;
  const amountPaid = parseFloat(document.getElementById('pool-payment-amount').value);
  const notes = document.getElementById('pool-notes').value.trim();
  
  if (!clientName) {
    showNotification('Por favor ingresa el nombre del cliente', 'error');
    return false;
  }
  
  const totalPeople = adults + children;
  if (totalPeople < 1) {
    showNotification('Debe haber al menos 1 persona', 'error');
    return false;
  }
  
  let date = null;
  let dates = [];
  let numberOfDays = 1;
  
  const people = { adults, children };
  
  if (entryType === 'day') {
    date = document.getElementById('pool-entry-date').value;
    if (!date) {
      showNotification('Por favor selecciona una fecha', 'error');
      return false;
    }
    
    // Validar capacidad
    const validation = canAddPoolEntry(date, people);
    if (!validation.valid) {
      showNotification(validation.message, 'error');
      return false;
    }
  } else {
    const startDate = document.getElementById('pool-stay-start').value;
    const endDate = document.getElementById('pool-stay-end').value;
    
    if (!startDate || !endDate) {
      showNotification('Por favor selecciona el rango de fechas', 'error');
      return false;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      showNotification('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
      return false;
    }
    
    dates = getDateRange(startDate, endDate);
    numberOfDays = dates.length;
    
    // Validar capacidad para todas las fechas
    const validation = validateStayPassDates(dates, people);
    if (!validation.valid) {
      showNotification(validation.message, 'error');
      return false;
    }
  }
  
  // Crear configuración temporal con el límite de edad seleccionado
  const tempConfig = createDefaultPoolConfig(ageLimit);
  const priceInfo = calculatePoolEntryPrice(people, entryType, numberOfDays, tempConfig);
  
  const paymentStatus = amountPaid >= priceInfo.totalPrice ? 'paid' :
                        amountPaid > 0 ? 'partial' : 'pending';
  
  // Si no hay cliente encontrado y hay DNI, crear nuevo cliente
  let clientId = foundClient ? foundClient.id : null;
  
  if (!foundClient && clientDNI && clientName) {
    // Verificar si el cliente ya existe por DNI
    const existingClient = getClientByDNI(clientDNI);
    if (existingClient) {
      clientId = existingClient.id;
      showNotification('ℹ️ Cliente encontrado en base de datos', 'info');
    } else if (clientPhone) {
      // Crear nuevo cliente usando la función del módulo clients.js
      const newClientData = {
        fullName: clientName,
        dni: clientDNI,
        phone: clientPhone,
        email: '',
        origin: {
          country: '',
          state: '',
          city: '',
          address: {
            neighborhood: '',
            street: '',
            number: '',
            floor: '',
            zipCode: ''
          }
        },
        notes: '',
        preferences: []
      };
      
      const newClient = saveClient(newClientData);
      if (newClient) {
        clientId = newClient.id;
        showNotification('✅ Nuevo cliente registrado en la base de datos', 'success');
      }
    }
  }
  
  const entry = createPoolEntry({
    entryType,
    clientId,
    clientName,
    clientDNI,
    clientPhone,
    numberOfPeople: totalPeople,
    adults,
    children,
    ageLimit,
    date,
    dates,
    basePrice: priceInfo.basePrice,
    adultPrice: priceInfo.adultPrice,
    childPrice: priceInfo.childPrice,
    adultSubtotal: priceInfo.adultSubtotal,
    childSubtotal: priceInfo.childSubtotal,
    groupDiscount: priceInfo.groupDiscount,
    totalPrice: priceInfo.totalPrice,
    amountPaid,
    paymentStatus,
    paymentMethod,
    notes
  });
  
  showNotification(`✅ Entrada de pileta registrada correctamente para ${clientName}`, 'success');
  renderPoolSection();
  return true;
}

/**
 * Ver detalles de entrada de pileta
 */
function viewPoolEntry(entryId) {
  const entry = getPoolEntries().find(e => e.id === entryId);
  if (!entry) return;
  
  const dateDisplay = entry.entryType === 'day' ? 
    formatDate(entry.date) :
    `${formatDate(entry.dates[0])} - ${formatDate(entry.dates[entry.dates.length - 1])} (${entry.dates.length} días)`;
  
  const statusBadge = entry.paymentStatus === 'paid' ? 
    '<span class="badge badge-success">✅ Pagado</span>' :
    entry.paymentStatus === 'partial' ?
    '<span class="badge badge-warning">⏳ Pago Parcial</span>' :
    '<span class="badge badge-danger">❌ Pendiente</span>';
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-medium">
      <div class="modal-header">
        <h3>🏊 Detalle de Entrada de Pileta</h3>
        <button class="modal-close" id="close-entry-detail">×</button>
      </div>
      
      <div class="modal-body">
        <div class="detail-section">
          <h4>👤 Cliente</h4>
          <p><strong>Nombre:</strong> ${entry.clientName}</p>
          ${entry.clientDNI ? `<p><strong>DNI:</strong> ${entry.clientDNI}</p>` : ''}
          ${entry.clientPhone ? `<p><strong>Teléfono:</strong> ${entry.clientPhone}</p>` : ''}
        </div>
        
        <div class="detail-section">
          <h4>🎫 Entrada</h4>
          <p><strong>Tipo:</strong> ${entry.entryType === 'day' ? '🎫 Entrada por Día' : '🎟️ Pase por Estadía'}</p>
          <p><strong>Fecha(s):</strong> ${dateDisplay}</p>
          <p><strong>Personas:</strong> 👥 ${entry.numberOfPeople}</p>
        </div>
        
        <div class="detail-section">
          <h4>💰 Pago</h4>
          <p><strong>Precio base:</strong> ${formatCurrency(entry.basePrice)} × ${entry.numberOfPeople} ${entry.entryType === 'stay' ? `× ${entry.dates.length}` : ''}</p>
          ${entry.groupDiscount > 0 ? `<p><strong>Descuento grupo:</strong> ${Math.round(entry.groupDiscount * 100)}%</p>` : ''}
          <p><strong>Total:</strong> ${formatCurrency(entry.totalPrice)}</p>
          <p><strong>Pagado:</strong> ${formatCurrency(entry.amountPaid)}</p>
          <p><strong>Estado:</strong> ${statusBadge}</p>
          <p><strong>Método:</strong> ${entry.paymentMethod}</p>
          ${entry.paymentDate ? `<p><strong>Fecha de pago:</strong> ${new Date(entry.paymentDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
        </div>
        
        ${entry.notes ? `
          <div class="detail-section">
            <h4>📝 Notas</h4>
            <p>${entry.notes}</p>
          </div>
        ` : ''}
        
        <div class="detail-section">
          <p class="text-muted">Registrado: ${new Date(entry.createdAt).toLocaleString('es-AR')}</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" id="print-entry-btn">🖨️ Imprimir</button>
        <button class="btn btn-primary" id="close-entry-btn">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('close-entry-detail').addEventListener('click', () => modal.remove());
  document.getElementById('close-entry-btn').addEventListener('click', () => modal.remove());
  document.getElementById('print-entry-btn').addEventListener('click', () => {
    printPoolTicket(entryId);
    modal.remove();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Imprimir comprobante de entrada
 */
function printPoolTicket(entryId) {
  const entry = getPoolEntries().find(e => e.id === entryId);
  if (!entry) return;
  
  const dateDisplay = entry.entryType === 'day' ? 
    formatDate(entry.date) :
    `${formatDate(entry.dates[0])} - ${formatDate(entry.dates[entry.dates.length - 1])}`;
  
  const ticketHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Entrada Pileta - ${entry.clientName}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          max-width: 300px;
          margin: 20px auto;
          padding: 20px;
        }
        .ticket-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .ticket-header h2 {
          margin: 0;
          font-size: 20px;
        }
        .ticket-info {
          margin: 20px 0;
        }
        .ticket-info p {
          margin: 8px 0;
          display: flex;
          justify-content: space-between;
        }
        .ticket-info strong {
          font-weight: bold;
        }
        .ticket-footer {
          text-align: center;
          border-top: 2px dashed #000;
          padding-top: 15px;
          margin-top: 15px;
          font-size: 11px;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #000;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="ticket-header">
        <h2>🏊 Zeus Balneario</h2>
        <p>Entrada de Pileta</p>
      </div>
      
      <div class="ticket-info">
        <p><strong>Cliente:</strong> ${entry.clientName}</p>
        ${entry.clientDNI ? `<p><strong>DNI:</strong> ${entry.clientDNI}</p>` : ''}
        <p><strong>Tipo:</strong> ${entry.entryType === 'day' ? 'Día' : 'Estadía'}</p>
        <p><strong>Fecha(s):</strong> ${dateDisplay}</p>
        <p><strong>Personas:</strong> ${entry.numberOfPeople}</p>
        <p class="total"><strong>Total:</strong> $${entry.totalPrice.toLocaleString('es-AR')}</p>
        <p><strong>Pagado:</strong> $${entry.amountPaid.toLocaleString('es-AR')}</p>
        <p><strong>Método:</strong> ${entry.paymentMethod}</p>
        ${entry.paymentDate ? `<p><strong>Fecha de pago:</strong> ${new Date(entry.paymentDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>` : ''}
      </div>
      
      <div class="ticket-footer">
        <p>Código: ${entry.id}</p>
        <p>${new Date(entry.createdAt).toLocaleString('es-AR')}</p>
        <p>¡Que disfrutes la pileta!</p>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '', 'width=400,height=600');
  printWindow.document.write(ticketHTML);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Eliminar entrada de pileta
 */
function deletePoolEntry(entryId) {
  const entry = getPoolEntries().find(e => e.id === entryId);
  if (!entry) {
    showNotification('❌ Entrada no encontrada', 'error');
    return;
  }
  
  const confirmMessage = `¿Estás seguro de eliminar esta entrada?\n\n` +
    `Cliente: ${entry.clientName}\n` +
    `Tipo: ${entry.entryType === 'day' ? 'Entrada de día' : 'Pase de estadía'}\n` +
    `Personas: ${entry.numberOfPeople}\n` +
    `Monto: ${formatCurrency(entry.totalPrice)}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  // Obtener todas las entradas
  const entries = getPoolEntries();
  
  // Filtrar la entrada a eliminar
  const updatedEntries = entries.filter(e => e.id !== entryId);
  
  // Guardar en localStorage
  localStorage.setItem('zeus-pool-entries', JSON.stringify(updatedEntries));
  
  showNotification('✅ Entrada eliminada correctamente', 'success');
  renderPoolSection();
}

/**
 * Mostrar ventas de hoy
 */
function showTodaysSales() {
  const today = new Date().toISOString().split('T')[0];
  const allEntries = getPoolEntries();
  
  // Filtrar entradas vendidas hoy (por createdAt)
  const todaysSales = allEntries.filter(entry => {
    if (entry.paymentStatus === 'cancelled') return false;
    const entryDate = entry.createdAt ? 
      new Date(entry.createdAt).toISOString().split('T')[0] : 
      (entry.entryType === 'day' ? entry.date : entry.dates[0]);
    return entryDate === today;
  });
  
  // Calcular totales
  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  
  todaysSales.forEach(entry => {
    totalAmount += entry.totalPrice;
    if (entry.paymentStatus === 'paid') {
      paidAmount += entry.amountPaid;
    } else if (entry.paymentStatus === 'partial') {
      paidAmount += entry.amountPaid;
      pendingAmount += (entry.totalPrice - entry.amountPaid);
    } else {
      pendingAmount += entry.totalPrice;
    }
  });
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  const salesHtml = todaysSales.length === 0 ? `
    <div class="empty-state">
      <span class="empty-icon">📋</span>
      <p>No hay ventas registradas hoy</p>
    </div>
  ` : todaysSales
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(entry => {
      const statusBadge = entry.paymentStatus === 'paid' ? 
        '<span class="badge badge-success">✅ Pagado</span>' :
        entry.paymentStatus === 'partial' ?
        '<span class="badge badge-warning">⏳ Parcial</span>' :
        '<span class="badge badge-danger">❌ Pendiente</span>';
      
      const typeLabel = entry.entryType === 'day' ? '🎫 Día' : '🎟️ Estadía';
      const dateDisplay = entry.entryType === 'day' ? 
        formatDate(entry.date) :
        `${formatDate(entry.dates[0])} - ${formatDate(entry.dates[entry.dates.length - 1])}`;
      const createdTime = new Date(entry.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="sale-item">
          <div class="sale-header">
            <div>
              <strong>${entry.clientName}</strong>
              ${entry.clientDNI ? `<span class="dni-small">DNI: ${entry.clientDNI}</span>` : ''}
            </div>
            <span class="sale-time">${createdTime}</span>
          </div>
          <div class="sale-details">
            <span>${typeLabel}</span>
            <span>📅 ${dateDisplay}</span>
            <span>👥 ${entry.numberOfPeople}p</span>
          </div>
          <div class="sale-footer">
            <span class="sale-amount">${formatCurrency(entry.totalPrice)}</span>
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
  
  modal.innerHTML = `
    <div class="modal modal-large">
      <div class="modal-header">
        <h3>💰 Ventas de Hoy - ${formatDate(today)}</h3>
        <button class="modal-close" id="close-sales-modal">×</button>
      </div>
      <div class="modal-body">
        <div class="sales-summary">
          <div class="summary-card">
            <span class="summary-label">Total Vendido</span>
            <span class="summary-value">${formatCurrency(totalAmount)}</span>
          </div>
          <div class="summary-card success">
            <span class="summary-label">Cobrado</span>
            <span class="summary-value">${formatCurrency(paidAmount)}</span>
          </div>
          <div class="summary-card warning">
            <span class="summary-label">Pendiente</span>
            <span class="summary-value">${formatCurrency(pendingAmount)}</span>
          </div>
          <div class="summary-card info">
            <span class="summary-label">Entradas</span>
            <span class="summary-value">${todaysSales.length}</span>
          </div>
        </div>
        
        <div class="sales-list">
          ${salesHtml}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="close-sales-btn">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('close-sales-modal').addEventListener('click', () => modal.remove());
  document.getElementById('close-sales-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Mostrar configuración de pileta
 */
function showPoolConfig() {
  if (!hasPermission('canManageConfig')) {
    showNotification('❌ No tienes permisos para configurar la pileta.', 'error');
    return;
  }
  
  const config = getPoolConfig();
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-medium">
      <div class="modal-header">
        <h3>⚙️ Configuración de Pileta</h3>
        <button class="modal-close" id="close-pool-config-modal">×</button>
      </div>
      
      <div class="modal-body">
        <form id="pool-config-form">
          
          <div class="form-section">
            <h4>💰 Precios</h4>
            <div class="form-group">
              <label for="config-day-pass">Entrada por día (por persona)</label>
              <input type="number" id="config-day-pass" value="${config.prices.dayPass}" required min="0" step="100">
            </div>
            <div class="form-group">
              <label for="config-stay-pass">Pase estadía por día (por persona)</label>
              <input type="number" id="config-stay-pass" value="${config.prices.stayPassPerDay}" required min="0" step="100">
            </div>
          </div>
          
          <div class="form-section">
            <h4>👥 Capacidad</h4>
            <div class="form-group">
              <label for="config-max-capacity">Capacidad máxima (personas)</label>
              <input type="number" id="config-max-capacity" value="${config.maxCapacity}" required min="1">
            </div>
          </div>
          
          <div class="form-section">
            <h4>🎁 Descuentos por Grupo</h4>
            <div class="form-group">
              <label for="config-discount-3">3 personas (%)</label>
              <input type="number" id="config-discount-3" value="${config.groupDiscounts[3] * 100}" min="0" max="100" step="1">
            </div>
            <div class="form-group">
              <label for="config-discount-4">4 personas (%)</label>
              <input type="number" id="config-discount-4" value="${config.groupDiscounts[4] * 100}" min="0" max="100" step="1">
            </div>
            <div class="form-group">
              <label for="config-discount-5">5+ personas (%)</label>
              <input type="number" id="config-discount-5" value="${config.groupDiscounts[5] * 100}" min="0" max="100" step="1">
            </div>
          </div>
          
        </form>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-pool-config">Cancelar</button>
        <button type="button" class="btn btn-primary" id="save-pool-config">💾 Guardar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('close-pool-config-modal').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('cancel-pool-config').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('save-pool-config').addEventListener('click', () => {
    savePoolConfigChanges();
    modal.remove();
  });
  
  // Cerrar al hacer click fuera del modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Guardar cambios de configuración
 */
function savePoolConfigChanges() {
  const config = {
    enabled: true,
    maxCapacity: parseInt(document.getElementById('config-max-capacity').value),
    prices: {
      dayPass: parseFloat(document.getElementById('config-day-pass').value),
      stayPassPerDay: parseFloat(document.getElementById('config-stay-pass').value)
    },
    groupDiscounts: {
      3: parseFloat(document.getElementById('config-discount-3').value) / 100,
      4: parseFloat(document.getElementById('config-discount-4').value) / 100,
      5: parseFloat(document.getElementById('config-discount-5').value) / 100
    }
  };
  
  savePoolConfig(config);
  showNotification('✅ Configuración guardada correctamente', 'success');
  renderPoolSection();
}

// ========================================
// Exponer funciones globalmente para uso en HTML
// ========================================

// Funciones principales de UI
window.initUI = initUI;
window.switchTab = switchTab;
window.showDashboard = showDashboard;
window.renderGrid = renderGrid;
window.updateAvailabilityStats = updateAvailabilityStats;

// Funciones de vista rápida
window.renderQuickView = renderQuickView;
window.navigateQuickViewDate = navigateQuickViewDate;
window.resetQuickViewToToday = resetQuickViewToToday;
window.openNewRentalFromQuickView = openNewRentalFromQuickView;

// Funciones de clientes (CRM)
window.showClientsView = showClientsView;
window.showClientProfile = showClientProfile;
window.closeClientProfile = closeClientProfile;
window.showNewClientModal = showNewClientModal;
window.closeNewClientModal = closeNewClientModal;
window.showEditClientModal = showEditClientModal;
window.closeEditClientModal = closeEditClientModal;
window.deleteClient = deleteClient;
window.addClientToBlacklist = addClientToBlacklist;
window.removeClientFromBlacklist = removeClientFromBlacklist;

// Funciones de pileta
window.showPoolSection = showPoolSection;
window.renderPoolSection = renderPoolSection;
window.changePoolDate = changePoolDate;
window.goToPoolToday = goToPoolToday;
window.showNewPoolEntryModal = showNewPoolEntryModal;
window.toggleEntryType = toggleEntryType;
window.changeCounter = changeCounter;
window.updatePriceLabels = updatePriceLabels;
window.updatePoolPriceSummary = updatePoolPriceSummary;
window.confirmPoolEntry = confirmPoolEntry;
window.viewPoolEntry = viewPoolEntry;
window.printPoolTicket = printPoolTicket;
window.showPoolConfig = showPoolConfig;
window.savePoolConfigChanges = savePoolConfigChanges;
window.renderPoolEntriesList = renderPoolEntriesList;


