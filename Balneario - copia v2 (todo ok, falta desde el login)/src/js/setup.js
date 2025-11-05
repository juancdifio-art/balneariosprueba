/**
 * Interfaz de configuración inicial del establecimiento
 */

/**
 * Muestra el modal de configuración inicial
 */
function showSetupModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay setup-modal';
  modal.innerHTML = `
    <div class="modal setup-modal-content">
      <div class="setup-header">
        <h2>🏖️ Configuración Inicial</h2>
        <p class="setup-subtitle">Configura tu establecimiento</p>
      </div>
      
      <div class="setup-body">
        <div class="setup-section">
          <label for="establishment-name" class="setup-label">
            🏢 Nombre del Establecimiento:
          </label>
          <input 
            type="text" 
            id="establishment-name" 
            class="setup-input" 
            placeholder="Ej: Zeus Balneario"
            required
          >
        </div>
        
        <div class="setup-section">
          <h3 class="setup-section-title">📦 Selecciona los Recursos que Ofreces:</h3>
          <p class="setup-hint">Marca los tipos de recursos que tienes disponibles</p>
          
          <div id="resources-selection" class="resources-grid">
            <!-- Se renderiza dinámicamente -->
          </div>
        </div>
        
        <div id="quantities-section" class="setup-section" style="display: none;">
          <h3 class="setup-section-title">🔢 Define la Cantidad de Unidades:</h3>
          <p class="setup-hint">Indica cuántas unidades tienes de cada recurso</p>
          
          <div id="quantities-container" class="quantities-container">
            <!-- Se renderiza dinámicamente -->
          </div>
        </div>
      </div>
      
      <div class="setup-footer">
        <button id="cancel-setup-btn" class="btn-secondary">
          ❌ Cancelar
        </button>
        <button id="save-setup-btn" class="btn-primary" disabled>
          ✅ Guardar Configuración
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Renderizar opciones de recursos
  renderResourceOptions();
  
  // Event listeners
  setupModalEventListeners();
}

/**
 * Renderiza las opciones de recursos disponibles
 */
function renderResourceOptions() {
  const container = document.getElementById('resources-selection');
  if (!container) return;
  
  container.innerHTML = AVAILABLE_RESOURCE_TYPES.map(type => `
    <div class="resource-option">
      <input 
        type="checkbox" 
        id="resource-${type.id}" 
        class="resource-checkbox"
        data-resource-id="${type.id}"
      >
      <label for="resource-${type.id}" class="resource-label">
        <span class="resource-emoji">${type.emoji}</span>
        <span class="resource-name">${type.name}</span>
      </label>
    </div>
  `).join('');
}

/**
 * Configura los event listeners del modal de setup
 */
function setupModalEventListeners() {
  // Checkboxes de recursos
  const checkboxes = document.querySelectorAll('.resource-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleResourceSelection);
  });
  
  // Botón cancelar
  document.getElementById('cancel-setup-btn')?.addEventListener('click', () => {
    if (confirm('¿Seguro que deseas cancelar? No podrás usar el sistema sin configurarlo.')) {
      document.querySelector('.setup-modal')?.remove();
    }
  });
  
  // Botón guardar
  document.getElementById('save-setup-btn')?.addEventListener('click', handleSaveSetup);
}

/**
 * Maneja la selección de recursos
 */
function handleResourceSelection() {
  const selectedResources = Array.from(document.querySelectorAll('.resource-checkbox:checked'))
    .map(cb => cb.dataset.resourceId);
  
  const quantitiesSection = document.getElementById('quantities-section');
  const saveBtn = document.getElementById('save-setup-btn');
  
  if (selectedResources.length > 0) {
    quantitiesSection.style.display = 'block';
    renderQuantityInputs(selectedResources);
    saveBtn.disabled = false;
  } else {
    quantitiesSection.style.display = 'none';
    saveBtn.disabled = true;
  }
}

/**
 * Renderiza los inputs de cantidad para los recursos seleccionados
 * @param {Array} selectedResources - IDs de recursos seleccionados
 */
function renderQuantityInputs(selectedResources) {
  const container = document.getElementById('quantities-container');
  if (!container) return;
  
  container.innerHTML = selectedResources.map(resourceId => {
    const type = AVAILABLE_RESOURCE_TYPES.find(t => t.id === resourceId);
    
    // Para pileta, pedir capacidad en lugar de unidades
    if (resourceId === 'pileta') {
      return `
        <div class="quantity-input-group pool-config-group">
          <label for="quantity-${resourceId}" class="quantity-label">
            ${type.emoji} ${type.name}:
          </label>
          <input 
            type="number" 
            id="quantity-${resourceId}" 
            class="quantity-input"
            data-resource-id="${resourceId}"
            min="10"
            max="1000"
            value="150"
            required
          >
          <span class="quantity-hint">personas (capacidad máxima)</span>
        </div>
      `;
    }
    
    // Para otros recursos, pedir cantidad de unidades
    return `
      <div class="quantity-input-group">
        <label for="quantity-${resourceId}" class="quantity-label">
          ${type.emoji} ${type.name}:
        </label>
        <input 
          type="number" 
          id="quantity-${resourceId}" 
          class="quantity-input"
          data-resource-id="${resourceId}"
          min="1"
          max="500"
          value="50"
          required
        >
        <span class="quantity-hint">unidades</span>
      </div>
    `;
  }).join('');
}

/**
 * Guarda la configuración del establecimiento
 */
function handleSaveSetup() {
  const establishmentName = document.getElementById('establishment-name').value.trim();
  
  if (!establishmentName) {
    alert('Por favor ingresa el nombre del establecimiento');
    return;
  }
  
  const quantityInputs = document.querySelectorAll('.quantity-input');
  const resources = [];
  let hasPool = false;
  let poolCapacity = 0;
  
  quantityInputs.forEach(input => {
    const quantity = parseInt(input.value);
    const resourceId = input.dataset.resourceId;
    
    if (quantity > 0) {
      resources.push({
        type: resourceId,
        quantity: quantity
      });
      
      // Detectar si se configuró pileta
      if (resourceId === 'pileta') {
        hasPool = true;
        poolCapacity = quantity;
      }
    }
  });
  
  if (resources.length === 0) {
    alert('Debes agregar al menos un recurso con cantidad mayor a 0');
    return;
  }
  
  const config = {
    establishmentName: establishmentName,
    resources: resources,
    configuredAt: new Date().toISOString()
  };
  
  saveEstablishmentConfig(config);
  
  // Si se configuró pileta, inicializar su configuración
  if (hasPool) {
    const poolConfig = {
      enabled: true,
      maxCapacity: poolCapacity,
      prices: {
        dayPass: 5000,
        stayPassPerDay: 4000
      },
      groupDiscounts: {
        3: 0.05,
        4: 0.10,
        5: 0.15
      }
    };
    localStorage.setItem('zeus-pool-config', JSON.stringify(poolConfig));
  } else {
    // Si NO se configuró pileta, eliminar cualquier configuración anterior
    localStorage.removeItem('zeus-pool-config');
  }
  
  // Cerrar modal
  document.querySelector('.setup-modal')?.remove();
  
  // Recargar la aplicación con la nueva configuración
  showNotification('✅ Configuración guardada correctamente', 'success');
  setTimeout(() => {
    location.reload();
  }, 1000);
}

/**
 * Muestra el modal de reconfiguración (desde menú)
 */
function showReconfigureModal() {
  const currentConfig = getEstablishmentConfig();
  
  const confirmMsg = currentConfig 
    ? '⚠️ ATENCIÓN: Reconfigurar el establecimiento eliminará todas las reservas y tarifas actuales.\n\n¿Estás seguro de que deseas continuar?'
    : '¿Deseas configurar el establecimiento?';
  
  const confirm = window.confirm(confirmMsg);
  
  if (!confirm) return;
  
  // Limpiar datos
  localStorage.clear();
  
  // Mostrar modal de configuración
  showSetupModal();
}
