/**
 * Configuración del establecimiento
 * Sistema dinámico de tipos de recursos
 */

/**
 * Tipos de recursos disponibles para balnearios de playa
 * Solo incluye los 4 recursos específicos para este tipo de negocio
 */
const AVAILABLE_RESOURCE_TYPES = [
  { id: 'sombrilla', name: 'Sombrillas', emoji: '☂️', prefix: 'S' },
  { id: 'carpa', name: 'Carpas', emoji: '⛺', prefix: 'C' },
  { id: 'estacionamiento', name: 'Estacionamiento', emoji: '🚗', prefix: 'E' },
  { id: 'pileta', name: 'Pileta', emoji: '🏊', prefix: 'P', isSpecial: true } // Recurso especial (no numerado)
];

/**
 * Configuración del establecimiento
 * Se guarda en localStorage
 */
const CONFIG_STORAGE_KEY = 'zeus-establishment-config';

/**
 * Configuración por defecto para clasificación de clientes
 */
const DEFAULT_CLIENT_CLASSIFICATION = {
  frequentMinReservations: 5,
  frequentDiscount: 5,
  vipMinReservations: 10,
  vipMinSpending: 300000,
  vipDiscount: 10
};

/**
 * Obtiene la configuración del establecimiento
 * @returns {Object} Configuración actual o null si no está configurado
 */
function getEstablishmentConfig() {
  try {
    const config = localStorage.getItem(CONFIG_STORAGE_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('❌ Error al obtener configuración:', error);
    return null;
  }
}

/**
 * Obtiene la configuración de clasificación de clientes
 * @returns {Object} Configuración de clasificación
 */
function getClientClassificationConfig() {
  try {
    const config = getEstablishmentConfig();
    if (config && config.clientClassification) {
      return config.clientClassification;
    }
    return DEFAULT_CLIENT_CLASSIFICATION;
  } catch (error) {
    console.error('❌ Error al obtener configuración de clasificación:', error);
    return DEFAULT_CLIENT_CLASSIFICATION;
  }
}

/**
 * Guarda la configuración de clasificación de clientes
 * @param {Object} classificationConfig - Configuración de clasificación
 */
function saveClientClassificationConfig(classificationConfig) {
  try {
    const config = getEstablishmentConfig() || {};
    config.clientClassification = classificationConfig;
    saveEstablishmentConfig(config);
    console.log('✅ Configuración de clasificación guardada:', classificationConfig);
    return true;
  } catch (error) {
    console.error('❌ Error al guardar configuración de clasificación:', error);
    return false;
  }
}

/**
 * Guarda la configuración del establecimiento
 * @param {Object} config - Configuración a guardar
 */
function saveEstablishmentConfig(config) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    console.log('✅ Configuración guardada:', config);
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error);
  }
}

/**
 * Verifica si el establecimiento está configurado
 * @returns {boolean}
 */
function isEstablishmentConfigured() {
  const config = getEstablishmentConfig();
  return config && config.resources && config.resources.length > 0;
}

/**
 * Genera la configuración de recursos en el formato esperado por la app
 * @returns {Object} Objeto con configuración de recursos (excluye recursos especiales como pileta)
 */
function getResourcesConfig() {
  const config = getEstablishmentConfig();
  if (!config) return {};
  
  const resourcesConfig = {};
  
  config.resources.forEach(resource => {
    const typeInfo = AVAILABLE_RESOURCE_TYPES.find(t => t.id === resource.type);
    
    // Excluir recursos especiales (como pileta) que tienen su propia sección
    if (typeInfo && !typeInfo.isSpecial) {
      resourcesConfig[resource.type] = {
        label: typeInfo.name,
        icon: typeInfo.emoji,
        prefix: typeInfo.prefix,
        total: resource.quantity
      };
    }
  });
  
  return resourcesConfig;
}

/**
 * Resetea la configuración del establecimiento
 */
function resetEstablishmentConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  console.log('🔄 Configuración reseteada');
}

/**
 * Muestra el modal de configuración de clasificación de clientes
 */
function showClientClassificationConfigModal() {
  if (!hasPermission('canManageConfig')) {
    showNotification('❌ No tienes permisos para modificar la configuración.', 'error');
    return;
  }
  
  const currentConfig = getClientClassificationConfig();
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>👥 Configuración de Clasificación de Clientes</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      
      <div class="modal-body">
        <p class="config-description">
          Define los criterios para clasificar automáticamente a tus clientes y los descuentos que recibirán.
        </p>
        
        <div class="config-section">
          <h3 class="config-section-title">⭐ Cliente Frecuente</h3>
          <div class="config-grid">
            <div class="config-field">
              <label for="frequent-reservations">
                📊 Número mínimo de reservas:
              </label>
              <input 
                type="number" 
                id="frequent-reservations" 
                min="1" 
                max="100"
                value="${currentConfig.frequentMinReservations}"
                class="config-input"
              >
              <small class="config-hint">Cliente pasa a "Frecuente" al alcanzar este número</small>
            </div>
            
            <div class="config-field">
              <label for="frequent-discount">
                💰 Descuento (%):
              </label>
              <input 
                type="number" 
                id="frequent-discount" 
                min="0" 
                max="100"
                value="${currentConfig.frequentDiscount}"
                class="config-input"
              >
              <small class="config-hint">Descuento automático en sus reservas</small>
            </div>
          </div>
        </div>
        
        <div class="config-section">
          <h3 class="config-section-title">👑 Cliente VIP</h3>
          <div class="config-grid">
            <div class="config-field">
              <label for="vip-reservations">
                📊 Número mínimo de reservas:
              </label>
              <input 
                type="number" 
                id="vip-reservations" 
                min="1" 
                max="500"
                value="${currentConfig.vipMinReservations}"
                class="config-input"
              >
              <small class="config-hint">Cliente pasa a "VIP" al alcanzar este número</small>
            </div>
            
            <div class="config-field">
              <label for="vip-spending">
                💵 Gasto total mínimo ($):
              </label>
              <input 
                type="number" 
                id="vip-spending" 
                min="0" 
                step="10000"
                value="${currentConfig.vipMinSpending}"
                class="config-input"
              >
              <small class="config-hint">O si gasta este monto total, pasa a VIP</small>
            </div>
            
            <div class="config-field">
              <label for="vip-discount">
                💰 Descuento (%):
              </label>
              <input 
                type="number" 
                id="vip-discount" 
                min="0" 
                max="100"
                value="${currentConfig.vipDiscount}"
                class="config-input"
              >
              <small class="config-hint">Descuento automático en sus reservas</small>
            </div>
          </div>
        </div>
        
        <div class="config-info">
          ℹ️ <strong>Nota:</strong> Los cambios se aplicarán inmediatamente. Los clientes existentes 
          serán reclasificados según los nuevos criterios.
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
          Cancelar
        </button>
        <button class="btn-primary" id="save-classification-btn">
          ✅ Guardar Configuración
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listener para guardar
  document.getElementById('save-classification-btn').addEventListener('click', () => {
    const newConfig = {
      frequentMinReservations: parseInt(document.getElementById('frequent-reservations').value),
      frequentDiscount: parseInt(document.getElementById('frequent-discount').value),
      vipMinReservations: parseInt(document.getElementById('vip-reservations').value),
      vipMinSpending: parseInt(document.getElementById('vip-spending').value),
      vipDiscount: parseInt(document.getElementById('vip-discount').value)
    };
    
    // Validar
    if (newConfig.frequentMinReservations >= newConfig.vipMinReservations) {
      alert('⚠️ El número de reservas para VIP debe ser mayor al de Cliente Frecuente');
      return;
    }
    
    if (saveClientClassificationConfig(newConfig)) {
      // Reclasificar todos los clientes existentes
      reclassifyAllClients();
      
      showNotification('✅ Configuración de clasificación guardada correctamente', 'success');
      modal.remove();
      
      // Si estamos en la vista de clientes, recargar
      if (document.querySelector('.clients-view')) {
        showClientsView();
      }
    } else {
      showNotification('❌ Error al guardar la configuración', 'error');
    }
  });
}

/**
 * Reclasifica todos los clientes según la nueva configuración
 */
function reclassifyAllClients() {
  try {
    const clients = getAllClients();
    const config = getClientClassificationConfig();
    
    clients.forEach(client => {
      // No reclasificar clientes en lista negra ni bloqueados
      if (client.clientType === 'blacklist' || client.blocked) {
        return;
      }
      
      // Aplicar nueva clasificación
      if (client.totalReservations >= config.vipMinReservations || 
          client.totalSpent >= config.vipMinSpending) {
        client.clientType = 'vip';
      } else if (client.totalReservations >= config.frequentMinReservations) {
        client.clientType = 'frecuente';
      } else {
        client.clientType = 'regular';
      }
      
      client.updatedAt = new Date().toISOString();
    });
    
    saveAllClients(clients);
    console.log('✅ Todos los clientes reclasificados según nueva configuración');
  } catch (error) {
    console.error('❌ Error al reclasificar clientes:', error);
  }
}

/**
 * Crea una configuración por defecto para Zeus Balneario
 * Útil para demos y testing
 */
function createDefaultConfig() {
  const defaultConfig = {
    establishmentName: 'Zeus Balneario',
    establishmentLocation: 'Necochea, Argentina',
    resources: [
      { type: 'sombrilla', quantity: 50 },
      { type: 'carpa', quantity: 30 },
      { type: 'estacionamiento', quantity: 80 }
    ],
    clientClassification: DEFAULT_CLIENT_CLASSIFICATION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(defaultConfig));
  console.log('🏖️ Configuración por defecto creada para Zeus Balneario');
  return defaultConfig;
}

/**
 * Asegura que existe una configuración válida
 * Si no existe, crea la configuración por defecto
 */
function ensureConfiguration() {
  let config = getEstablishmentConfig();
  
  if (!config) {
    config = createDefaultConfig();
  }
  
  return config;
}
