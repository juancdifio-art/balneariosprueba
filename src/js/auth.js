/**
 * Sistema de autenticación y autorización para Zeus Balneario
 * Especializado para balnearios de playa
 */

const AUTH_STORAGE_KEY = 'zeus-auth';
const SESSION_STORAGE_KEY = 'zeus-session';
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas

// Usuarios predeterminados
const DEFAULT_USERS = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin2024',
    role: 'admin',
    fullName: 'Administrador',
    createdAt: new Date().toISOString()
  },
  {
    id: 'operator-001',
    username: 'operador',
    password: 'operador2024',
    role: 'operador',
    fullName: 'Operador de Balneario',
    createdAt: new Date().toISOString()
  }
];

// Definición de permisos por rol
const ROLE_PERMISSIONS = {
  admin: {
    // Reservas
    canCreateReservation: true,
    canEditReservation: true,
    canDeleteReservation: true,
    canCancelReservation: true,
    
    // Clientes
    canViewClients: true,
    canEditClients: true,
    canDeleteClients: true,
    
    // Pagos
    canReceivePayments: true,
    canDeletePayments: true,
    
    // Configuración
    canAccessConfiguration: true,
    canManageConfig: true,
    canManagePricing: true,
    canClearDatabase: true,
    canLoadDemoData: true,
    
    // Dashboard y reportes
    canViewDashboard: true,
    canViewReports: true,
    canExportData: true
  },
  
  operador: {
    // Reservas
    canCreateReservation: true,
    canEditReservation: false,
    canDeleteReservation: false,
    canCancelReservation: true, // Solo cancelar, no eliminar
    
    // Clientes
    canViewClients: true,
    canEditClients: false,
    canDeleteClients: false,
    
    // Pagos
    canReceivePayments: true,
    canDeletePayments: false,
    
    // Configuración
    canAccessConfiguration: false,
    canManagePricing: false,
    canClearDatabase: false,
    canLoadDemoData: false,
    
    // Dashboard y reportes
    canViewDashboard: true,
    canViewReports: true,
    canExportData: false
  }
};

/**
 * Inicializa usuarios predeterminados si no existen
 */
function initializeDefaultUsers() {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers(DEFAULT_USERS);
    console.log('✅ Usuarios predeterminados creados');
  }
}

/**
 * Obtiene todos los usuarios
 */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

/**
 * Guarda usuarios en localStorage
 */
function saveUsers(users) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error al guardar usuarios:', error);
  }
}

/**
 * Autentica un usuario
 */
function authenticate(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const session = {
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    console.log(`✅ Usuario ${user.username} autenticado como ${user.role}`);
    return { success: true, user: session };
  }
  
  return { success: false, message: 'Usuario o contraseña incorrectos' };
}

/**
 * Obtiene la sesión actual
 */
function getCurrentSession() {
  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    
    // Verificar expiración de sesión
    if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
      logout();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    return null;
  }
}

/**
 * Actualiza la última actividad de la sesión
 */
function updateLastActivity() {
  const session = getCurrentSession();
  if (session) {
    session.lastActivity = Date.now();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
  return getCurrentSession() !== null;
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
function hasPermission(permission) {
  const session = getCurrentSession();
  if (!session) return false;
  
  const permissions = ROLE_PERMISSIONS[session.role];
  return permissions && permissions[permission] === true;
}

/**
 * Requiere autenticación para continuar
 */
function requireAuth() {
  if (!isAuthenticated()) {
    showLoginModal();
    return false;
  }
  updateLastActivity();
  return true;
}

/**
 * Requiere un permiso específico
 */
function requirePermission(permission, showError = true) {
  if (!requireAuth()) return false;
  
  if (!hasPermission(permission)) {
    if (showError && typeof showNotification === 'function') {
      showNotification('No tienes permisos para realizar esta acción', 'error');
    }
    return false;
  }
  
  return true;
}

/**
 * Cierra la sesión actual
 */
function logout() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  console.log('✅ Sesión cerrada');
  
  // Limpiar UI
  const userBar = document.getElementById('user-bar');
  if (userBar) {
    userBar.remove();
  }
  
  document.body.classList.remove('authenticated');
  
  // Mostrar login nuevamente
  showLoginModal();
}

/**
 * Muestra el modal de login
 */
function showLoginModal() {
  const existingModal = document.getElementById('login-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container login-modal">
      <div class="login-header">
        <h2>🏖️ Zeus Balneario</h2>
        <p>Sistema de Gestión</p>
      </div>
      
      <form id="login-form" class="login-form">
        <div class="form-group">
          <label for="username">Usuario:</label>
          <input type="text" id="username" required autocomplete="username">
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input type="password" id="password" required autocomplete="current-password">
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            🔑 Iniciar Sesión
          </button>
        </div>
        
        <div id="login-error" class="error-message"></div>
        
        <div class="login-help">
          <small>
            <strong>Cuentas predeterminadas:</strong><br>
            👨‍💼 Admin: admin / admin2024<br>
            👤 Operador: operador / operador2024
          </small>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
      showLoginError('Por favor completa todos los campos');
      return;
    }
    
    const result = authenticate(username, password);
    
    if (result.success) {
      modal.remove();
      showUserBar();
      
      // NUEVO: Inicializar la aplicación después del login
      if (typeof initializeAuthenticatedApp === 'function') {
        initializeAuthenticatedApp();
      }
      
      // Mostrar notificación si existe la función
      if (typeof showNotification === 'function') {
        showNotification(`¡Bienvenido ${result.user.fullName}!`, 'success');
      } else {
        console.log(`¡Bienvenido ${result.user.fullName}!`);
      }
    } else {
      showLoginError(result.message);
    }
  });
  
  function showLoginError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
  
  // Focus en el primer campo
  setTimeout(() => {
    document.getElementById('username').focus();
  }, 100);
}

/**
 * Muestra la barra de usuario
 */
function showUserBar() {
  const session = getCurrentSession();
  if (!session) return;
  
  let userBar = document.getElementById('user-bar');
  if (!userBar) {
    userBar = document.createElement('div');
    userBar.id = 'user-bar';
    document.body.insertBefore(userBar, document.body.firstChild);
  }
  
  const roleDisplay = session.role === 'admin' ? '👨‍💼 Administrador' : '👤 Operador';
  
  userBar.innerHTML = `
    <div class="user-info">
      <span class="user-name">${roleDisplay}: ${session.fullName}</span>
      <span class="login-time">Ingresó: ${new Date(session.loginTime).toLocaleTimeString()}</span>
    </div>
    <div class="user-actions">
      <button onclick="logout()" class="btn-logout">
        🚪 Cerrar Sesión
      </button>
    </div>
  `;
  
  document.body.classList.add('authenticated');
  
  // NUEVO: Aplicar restricciones después de mostrar la barra
  setTimeout(() => {
    applyPermissionRestrictions();
  }, 500);
}

/**
 * Oculta elementos restringidos según el rol
 */
function applyPermissionRestrictions() {
  const session = getCurrentSession();
  if (!session) return;
  
  console.log(`🔒 Aplicando restricciones para rol: ${session.role}`);
  
  if (session.role === 'operador') {
    // Selectores específicos con IDs y clases exactas
    const restrictedSelectors = [
      // Botones del dashboard
      '#demo-data-btn',
      '#clear-db-btn',
      'button[onclick*="showDemoDataModal"]',
      'button[onclick*="showClearDatabaseModal"]',
      
      // Botones de tarifas/precios
      'button[onclick*="showPricingModal"]',
      'button[onclick*="showReconfigureModal"]',
      
      // Clases generales de admin
      '.admin-only',
      '.configuration-section',
      
      // Botones de configuración en las secciones
      '.pricing-actions',
      '.config-actions'
    ];
    
    let hiddenCount = 0;
    
    // Esperar un momento para asegurar que los elementos estén en el DOM
    setTimeout(() => {
      restrictedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.style.display = 'none';
          el.disabled = true;
          el.classList.add('operator-hidden');
          hiddenCount++;
        });
      });
      
      console.log(`🔒 ${hiddenCount} elementos administrativos ocultados`);
    }, 100);
    
    // Agregar clase CSS para elementos restringidos
    document.body.classList.add('operator-mode');
    
    // También ocultar elementos que puedan agregarse dinámicamente
    hideOperatorRestrictedElements();
  } else {
    // Si es admin, mostrar todos los elementos
    document.body.classList.remove('operator-mode');
    const hiddenElements = document.querySelectorAll('.operator-hidden');
    hiddenElements.forEach(el => {
      el.style.display = '';
      el.disabled = false;
      el.classList.remove('operator-hidden');
    });
  }
}

/**
 * Función específica para ocultar elementos de operador
 */
function hideOperatorRestrictedElements() {
  // Ocultar botones de tarifas cuando se renderizan las secciones
  const observer = new MutationObserver(() => {
    if (getCurrentSession()?.role === 'operador') {
      // Buscar y ocultar botones de configuración de precios
      const pricingButtons = document.querySelectorAll('button[onclick*="showPricingModal"]');
      pricingButtons.forEach(btn => {
        btn.style.display = 'none';
        btn.disabled = true;
        btn.classList.add('operator-hidden');
      });
      
      // Ocultar botones específicos del dashboard
      const demoBtn = document.getElementById('demo-data-btn');
      const clearBtn = document.getElementById('clear-db-btn');
      
      if (demoBtn) {
        demoBtn.style.display = 'none';
        demoBtn.disabled = true;
        demoBtn.classList.add('operator-hidden');
      }
      
      if (clearBtn) {
        clearBtn.style.display = 'none';
        clearBtn.disabled = true;
        clearBtn.classList.add('operator-hidden');
      }
    }
  });
  
  // Observar cambios en el DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Guardar referencia para poder desconectar después
  window.permissionObserver = observer;
}

/**
 * Función de prueba para verificar permisos
 */
function testPermissions() {
  const session = getCurrentSession();
  if (!session) {
    console.log('❌ No hay sesión activa');
    return;
  }
  
  console.log(`🔍 Testeando permisos para rol: ${session.role}`);
  
  const permissions = ROLE_PERMISSIONS[session.role];
  Object.entries(permissions).forEach(([permission, allowed]) => {
    const icon = allowed ? '✅' : '❌';
    console.log(`${icon} ${permission}: ${allowed}`);
  });
  
  return permissions;
}

// Exportar funciones al ámbito global
window.authenticate = authenticate;
window.getCurrentSession = getCurrentSession;
window.isAuthenticated = isAuthenticated;
window.logout = logout;
window.updateLastActivity = updateLastActivity;
window.getUsers = getUsers;
window.showLoginModal = showLoginModal;
window.showUserBar = showUserBar;
window.hasPermission = hasPermission;
window.requireAuth = requireAuth;
window.requirePermission = requirePermission;
window.applyPermissionRestrictions = applyPermissionRestrictions;
window.testPermissions = testPermissions;
window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

// Inicializar usuarios predeterminados
initializeDefaultUsers();

console.log('🔐 Sistema de autenticación inicializado');