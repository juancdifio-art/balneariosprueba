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
    
    // Asegurar configuración (crear por defecto si no existe)
    ensureConfiguration();
    
    // Verificar si está configurado manualmente
    if (!isEstablishmentConfigured()) {
      console.log('⚙️ Primera vez - Mostrando configuración inicial');
      showSetupModal();
      return;
    }
    
    // Cargar configuración y actualizar UNIT_TYPES
    const resourcesConfig = getResourcesConfig();
    if (Object.keys(resourcesConfig).length > 0) {
      // Limpiar UNIT_TYPES actual
      Object.keys(UNIT_TYPES).forEach(key => delete UNIT_TYPES[key]);
      
      // Agregar recursos configurados con formato compatible
      Object.keys(resourcesConfig).forEach(key => {
        const config = resourcesConfig[key];
        UNIT_TYPES[key] = {
          type: key,
          total: config.total,
          prefix: config.prefix,
          icon: config.icon,
          label: config.label
        };
      });
    }
    
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
    
    // Mostrar barra de usuario si está autenticado
    if (typeof showUserBar === 'function') {
      if (isAuthenticated()) {
        showUserBar();
        console.log('👤 Barra de usuario mostrada');
      } else {
        console.log('🔒 Usuario no autenticado, no se muestra barra');
      }
    } else {
      console.log('❌ Función showUserBar no está disponible');
    }
    
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
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}

/**
 * Función de inicio que verifica autenticación
 */
function startApplication() {
  console.log('🏖️ Iniciando Zeus Balneario - Sistema de Gestión');
  
  // Debug: Verificar estado de autenticación
  const sessionData = localStorage.getItem('zeus-session');
  console.log('🔍 Debug - Datos de sesión en localStorage:', sessionData);
  
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      console.log('📅 Debug - Sesión encontrada:', {
        usuario: session.username,
        rol: session.role,
        loginTime: new Date(session.loginTime).toLocaleString(),
        expirado: Date.now() - session.loginTime > (8 * 60 * 60 * 1000)
      });
    } catch (e) {
      console.log('❌ Debug - Error al parsear sesión:', e);
    }
  } else {
    console.log('🔍 Debug - No hay datos de sesión en localStorage');
  }
  
  // NUEVA LÓGICA: Verificar autenticación antes de inicializar
  if (!isAuthenticated()) {
    console.log('🔐 Usuario no autenticado, mostrando login...');
    showLoginModal();
    return;
  }
  
  console.log('✅ Usuario autenticado, iniciando aplicación...');
  initApp();
}

/**
 * Reinicializar app después del login
 */
function initializeAuthenticatedApp() {
  initApp();
}

// Exportar funciones para uso desde auth.js
window.initializeAuthenticatedApp = initializeAuthenticatedApp;

/**
 * Función de conveniencia para login automático (solo para desarrollo)
 */
function autoLoginDev(role = 'admin') {
  if (typeof authenticate === 'function') {
    const credentials = role === 'admin' 
      ? { username: 'admin', password: 'admin2024' }
      : { username: 'operador', password: 'operador2024' };
    
    const result = authenticate(credentials.username, credentials.password);
    if (result.success) {
      console.log('🔑 Auto-login exitoso:', result.user.fullName);
      showUserBar();
      return true;
    }
  }
  return false;
}

// Exportar para debugging en consola
window.ZeusApp = {
  initApp,
  getRentals,
  startApplication,
  initializeAuthenticatedApp,
  autoLoginDev,
  resetPrivacyMode: () => typeof resetPrivacyMode === 'function' ? resetPrivacyMode() : 'Función no disponible'
};
