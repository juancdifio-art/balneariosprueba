/**
 * Archivo principal de la aplicación
 * Zeus Balneario - Sistema de Gestión
 * Punto de entrada y orquestación
 */

/**
 * Inicializar la aplicación
 */
function initApp() {
  console.log('🏖️ Iniciando Zeus Balneario - Sistema de Gestión');
  
  try {
    // Verificar soporte de localStorage
    if (!isLocalStorageAvailable()) {
      alert('Tu navegador no soporta localStorage. La aplicación no funcionará correctamente.');
      return;
    }
    
    // Verificar si está configurado
    if (!isEstablishmentConfigured()) {
      console.log('⚙️ Primera vez - Mostrando configuración inicial');
      showSetupModal();
      return;
    }
    
    // Cargar configuración y actualizar UNIT_TYPES
    const resourcesConfig = getResourcesConfig();
    Object.keys(UNIT_TYPES).forEach(key => delete UNIT_TYPES[key]);
    Object.assign(UNIT_TYPES, resourcesConfig);
    
    console.log('✅ Configuración cargada:', UNIT_TYPES);
    
    // Actualizar nombre del establecimiento en el header
    const config = getEstablishmentConfig();
    if (config && config.establishmentName) {
      const headerTitle = document.querySelector('.main-header h1');
      if (headerTitle) {
        headerTitle.textContent = `🏖️ ${config.establishmentName.toUpperCase()}`;
      }
    }
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Migrar pagos antiguos al nuevo sistema (solo se ejecuta una vez)
    if (typeof migrateOldPayments === 'function') {
      migrateOldPayments();
    }
    
    // Inicializar interfaz
    initUI();
    
    // Inicializar búsqueda global
    if (typeof initializeSearch === 'function') {
      initializeSearch();
      console.log('🔍 Búsqueda global inicializada');
    }
    
    // Inicializar modo privacidad
    if (typeof initializePrivacyMode === 'function') {
      initializePrivacyMode();
      console.log('🔒 Modo privacidad inicializado');
    }
    
    // Configurar actualizaciones periódicas
    setupPeriodicUpdates();
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error);
    alert('Error al iniciar la aplicación. Por favor, recarga la página.');
  }
}

/**
 * Verificar si localStorage está disponible
 * @returns {boolean} true si está disponible
 */
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Cargar datos iniciales
 */
function loadInitialData() {
  const rentals = getRentals();
  console.log(`📦 Cargados ${rentals.length} alquileres desde localStorage`);
  
  // Si no hay datos, mostrar mensaje de bienvenida
  if (rentals.length === 0) {
    console.log('ℹ️ No hay alquileres registrados. Base de datos vacía.');
  }
}

/**
 * Configurar actualizaciones periódicas (opcional)
 */
function setupPeriodicUpdates() {
  // Actualizar estadísticas cada 30 segundos (por si hay múltiples pestañas abiertas)
  setInterval(() => {
    updateAvailabilityStats();
  }, 30000);
}

/**
 * Manejar cambios en localStorage desde otras pestañas
 */
window.addEventListener('storage', (e) => {
  if (e.key === 'zeus-rentals') {
    console.log('🔄 Datos actualizados desde otra pestaña');
    // Recargar la grilla y estadísticas
    location.reload();
  }
});

/**
 * Manejar errores globales
 */
window.addEventListener('error', (e) => {
  console.error('❌ Error global:', e.error);
});

/**
 * Manejar promesas rechazadas
 */
window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Promesa rechazada:', e.reason);
});

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Exportar para debugging en consola
window.ZeusApp = {
  initApp,
  getRentals
};
