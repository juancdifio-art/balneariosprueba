/**
 * Mostrar modal para limpiar la base de datos
 */
function showClearDatabaseModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-medium">
      <div class="modal-header">
        <h3>🧹 Limpiar Base de Datos</h3>
        <button class="modal-close" id="close-clear-db-modal">×</button>
      </div>
      <div class="modal-body">
        <p>¿Seguro que quieres borrar <b>TODAS</b> las reservas, pagos y clientes? Esta acción no se puede deshacer.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-clear-db">Cancelar</button>
        <button class="btn btn-danger" id="confirm-clear-db">🧹 Limpiar Base</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('close-clear-db-modal').onclick = () => modal.remove();
  document.getElementById('cancel-clear-db').onclick = () => modal.remove();
  document.getElementById('confirm-clear-db').onclick = () => {
    clearDatabase();
    modal.remove();
  };
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

/**
 * Limpiar la base de datos (reservas, pagos y clientes)
 */
function clearDatabase() {
  try {
    localStorage.removeItem('zeus-rentals');
    localStorage.removeItem('zeus-payments');
    localStorage.removeItem('zeus-clients');
    showNotification('🧹 Base de datos limpiada correctamente.', 'success');
    setTimeout(() => renderDashboard(), 500);
  } catch (err) {
    showNotification('❌ Error al limpiar la base de datos.', 'error');
  }
}

// Exportar función para el botón global
window.showClearDatabaseModal = showClearDatabaseModal;

// Exportar función para el botón global (después de todas las definiciones)
window.showClearDatabaseModal = showClearDatabaseModal;
/**
 * Módulo del Dashboard
 * Renderización y gestión del dashboard principal
 */

// Constante STORAGE_KEY se declara en storage.js

/**
 * Renderizar el dashboard completo
 */
function renderDashboard() {
  const container = document.getElementById('dashboard-container');
  if (!container) return;
  
  const metrics = calculateDashboardMetrics();
  
  container.innerHTML = `
    <!-- Dashboard Header con Controles -->
    <div class="dashboard-header-controls">
      <h2 style="margin: 0; color: var(--color-primary);">📊 Panel de Control</h2>
      <div class="dashboard-actions">
        <button class="btn btn-secondary btn-sm" onclick="collapseAllSections()">
          ▲ Ocultar Todas
        </button>
        <button class="btn btn-secondary btn-sm" onclick="expandAllSections()">
          ▼ Mostrar Todas
        </button>
        <button class="btn btn-warning btn-sm" onclick="showDemoDataModal()" id="demo-data-btn">
          🧪 Cargar Demo
        </button>
        <button class="btn btn-danger btn-sm" onclick="showClearDatabaseModal()" id="clear-db-btn">
          🧹 Limpiar Base
        </button>
      </div>
    </div>
    
    <!-- KPI Cards -->
    <div class="kpi-cards">
      ${renderKPICard('💰', 'Ingresos del Mes', `$${metrics.ingresos.mes.toLocaleString('es-AR')}`, `Temporada: $${metrics.ingresos.temporada.toLocaleString('es-AR')}`, 'income')}
      ${renderKPICard('📊', 'Ocupación Hoy', `${metrics.ocupacion.hoy.percentage}%`, `${metrics.ocupacion.hoy.occupied} de ${metrics.ocupacion.hoy.total} unidades`, 'occupancy')}
      ${renderKPICard('💳', 'Pagos Pendientes', `$${metrics.pagos.pendientes.toLocaleString('es-AR')}`, `${metrics.pagos.cantidad} reserva(s) pendiente(s)`, 'pending')}
      ${renderKPICard('📅', 'Check-ins Hoy', `${metrics.reservas.checkinsHoy.length}`, `Check-outs: ${metrics.reservas.checkoutsHoy.length}`, 'checkins')}
    </div>
    
    <!-- Chart Section -->
    <div class="chart-section collapsible-section">
      <h3 class="section-title collapsible-header" onclick="toggleSection(this)">
        <span>📈 Ocupación - 7 Días Antes y 7 Días Después</span>
        <span class="collapse-icon">▼</span>
      </h3>
      <div class="collapsible-content">
        <div class="chart-container">
          <div id="occupancy-chart"></div>
        </div>
      </div>
    </div>
    
    <!-- Lists Section -->
    <div class="dashboard-lists">
      <!-- Pagos Pendientes -->
      <div class="dashboard-list collapsible-section">
        <h3 class="section-title collapsible-header" onclick="toggleSection(this)">
          <span>⚠️ Pagos Pendientes</span>
          <span class="collapse-icon">▼</span>
        </h3>
        <div class="collapsible-content">
          ${renderPendingPaymentsList(metrics)}
        </div>
      </div>
      
      <!-- Top Recursos -->
      <div class="dashboard-list collapsible-section">
        <h3 class="section-title collapsible-header" onclick="toggleSection(this)">
          <span>🏆 Top 5 Recursos Más Rentados</span>
          <span class="collapse-icon">▼</span>
        </h3>
        <div class="collapsible-content">
          ${renderTopResourcesList(metrics.topRecursos)}
        </div>
      </div>
    </div>
    
    <!-- Próximos Check-ins y Check-outs -->
    <div class="checkins-checkouts-grid">
      ${metrics.reservas.proximosCheckins.length > 0 ? `
        <div class="upcoming-checkins collapsible-section">
          <h3 class="section-title collapsible-header" onclick="toggleSection(this)">
            <span>📅 Próximos Check-ins (7 días)</span>
            <span class="collapse-icon">▼</span>
          </h3>
          <div class="collapsible-content">
            ${renderUpcomingCheckins(metrics.reservas.proximosCheckins)}
          </div>
        </div>
      ` : ''}
      
      ${metrics.reservas.proximosCheckouts.length > 0 ? `
        <div class="upcoming-checkins collapsible-section">
          <h3 class="section-title collapsible-header" onclick="toggleSection(this)">
            <span>🚪 Próximos Check-outs (7 días)</span>
            <span class="collapse-icon">▼</span>
          </h3>
          <div class="collapsible-content">
            ${renderUpcomingCheckouts(metrics.reservas.proximosCheckouts)}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  // Renderizar gráfico
  setTimeout(() => {
    renderOccupancyByTypeChart(metrics.ocupacionPorTipo, 'occupancy-chart');
  }, 100);
}

/**
 * Renderizar una tarjeta KPI
 */
function renderKPICard(icon, title, value, subtitle, type) {
  return `
    <div class="kpi-card kpi-${type}">
      <div class="kpi-icon">${icon}</div>
      <div class="kpi-content">
        <div class="kpi-title">${title}</div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-subtitle">${subtitle}</div>
      </div>
    </div>
  `;
}

/**
 * Renderizar lista de pagos pendientes
 */
function renderPendingPaymentsList(metrics) {
  const rentals = getRentals()
    .filter(r => calculatePendingAmount(r.id) > 0)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 10);
  
  if (rentals.length === 0) {
    return '<p class="empty-message">✅ No hay pagos pendientes</p>';
  }
  
  return `
    <div class="list-items">
      ${rentals.map(rental => {
        const config = UNIT_TYPES[rental.type];
        const pending = calculatePendingAmount(rental.id);
        const daysUntilCheckin = Math.ceil((new Date(rental.startDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
          <div class="list-item">
            <div class="list-item-main">
              <div class="list-item-title">
                ${config.icon} ${config.prefix}${rental.unitNumber} - ${rental.clientName}
              </div>
              <div class="list-item-subtitle">
                Check-in: ${formatDateDisplay(rental.startDate)} 
                ${daysUntilCheckin > 0 ? `(en ${daysUntilCheckin} día${daysUntilCheckin !== 1 ? 's' : ''})` : 
                  daysUntilCheckin === 0 ? '(HOY)' : '(En curso)'}
              </div>
            </div>
            <div class="list-item-actions">
              <div class="list-item-amount">$${pending.toLocaleString('es-AR')}</div>
              <button class="btn-mini" onclick="showRentalDetails('${rental.id}')" title="Ver detalles">
                👁️
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Renderizar lista de top recursos
 */
function renderTopResourcesList(topRecursos) {
  if (topRecursos.length === 0) {
    return '<p class="empty-message">No hay datos suficientes</p>';
  }
  
  return `
    <div class="list-items">
      ${topRecursos.map((resource, index) => {
        return `
          <div class="list-item">
            <div class="list-item-main">
              <div class="list-item-rank">${index + 1}</div>
              <div>
                <div class="list-item-title">
                  ${resource.icon} ${resource.prefix}${resource.unitNumber}
                </div>
                <div class="list-item-subtitle">
                  ${resource.rentals} reserva${resource.rentals !== 1 ? 's' : ''} · ${resource.days} día${resource.days !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div class="list-item-actions">
              <div class="list-item-amount">$${resource.totalIncome.toLocaleString('es-AR')}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Renderizar próximos check-ins
 */
function renderUpcomingCheckins(checkins) {
  return `
    <div class="upcoming-checkins-list">
      ${checkins.slice(0, 5).map(rental => {
        const config = UNIT_TYPES[rental.type];
        const daysUntil = Math.ceil((new Date(rental.startDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Parsear fecha correctamente para evitar problemas de zona horaria
        const [year, month, day] = rental.startDate.split('-').map(Number);
        const startDate = new Date(year, month - 1, day);
        
        const formattedDate = startDate.toLocaleDateString('es-AR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
        
        let countdownText = '';
        if (daysUntil === 0) {
          countdownText = '¡Hoy!';
        } else if (daysUntil === 1) {
          countdownText = 'Mañana';
        } else if (daysUntil < 0) {
          countdownText = 'En curso';
        } else {
          countdownText = `En ${daysUntil} días`;
        }
        
        return `
          <div class="checkin-item">
            <div class="checkin-date">${formattedDate}</div>
            <div class="checkin-client">${rental.clientName}</div>
            <div class="checkin-resource">${config.icon} ${config.prefix}${rental.unitNumber}</div>
            <div class="checkin-countdown">${countdownText}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Renderizar próximos check-outs
 */
function renderUpcomingCheckouts(checkouts) {
  return `
    <div class="upcoming-checkins-list">
      ${checkouts.slice(0, 5).map(rental => {
        const config = UNIT_TYPES[rental.type];
        const daysUntil = Math.ceil((new Date(rental.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Parsear fecha correctamente para evitar problemas de zona horaria
        const [year, month, day] = rental.endDate.split('-').map(Number);
        const endDate = new Date(year, month - 1, day);
        
        const formattedDate = endDate.toLocaleDateString('es-AR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        });
        
        let countdownText = '';
        if (daysUntil === 0) {
          countdownText = '¡Hoy!';
        } else if (daysUntil === 1) {
          countdownText = 'Mañana';
        } else if (daysUntil < 0) {
          countdownText = 'Finalizado';
        } else {
          countdownText = `En ${daysUntil} días`;
        }
        
        return `
          <div class="checkin-item">
            <div class="checkin-date">${formattedDate}</div>
            <div class="checkin-client">${rental.clientName}</div>
            <div class="checkin-resource">${config.icon} ${config.prefix}${rental.unitNumber}</div>
            <div class="checkin-countdown checkout-badge">${countdownText}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Refrescar dashboard
 */
function refreshDashboard() {
  renderDashboard();
  console.log('🔄 Dashboard actualizado');
}

/**
 * Toggle colapsar/expandir sección del dashboard
 * @param {HTMLElement} header - Elemento header clickeado
 */
function toggleSection(header) {
  const section = header.closest('.collapsible-section');
  const content = section.querySelector('.collapsible-content');
  const icon = header.querySelector('.collapse-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
    section.classList.remove('collapsed');
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
    section.classList.add('collapsed');
  }
}

/**
 * Colapsar todas las secciones del dashboard
 */
function collapseAllSections() {
  const sections = document.querySelectorAll('.collapsible-section');
  sections.forEach(section => {
    const content = section.querySelector('.collapsible-content');
    const icon = section.querySelector('.collapse-icon');
    if (content && icon) {
      content.style.display = 'none';
      icon.textContent = '▶';
      section.classList.add('collapsed');
    }
  });
}

/**
 * Expandir todas las secciones del dashboard
 */
function expandAllSections() {
  const sections = document.querySelectorAll('.collapsible-section');
  sections.forEach(section => {
    const content = section.querySelector('.collapsible-content');
    const icon = section.querySelector('.collapse-icon');
    if (content && icon) {
      content.style.display = 'block';
      icon.textContent = '▼';
      section.classList.remove('collapsed');
    }
  });
}

// ============================================================================
// GENERADOR DE DATOS DEMO
// ============================================================================

/**
 * Mostrar modal para cargar datos demo
 */
function showDemoDataModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-medium">
      <div class="modal-header">
        <h3>🧪 Cargar Datos de Prueba</h3>
        <button class="modal-close" id="close-demo-modal">×</button>
      </div>
      
      <div class="modal-body">
        <div class="demo-warning">
          <p>⚠️ Esto creará reservas ficticias para probar el sistema.</p>
          <p>Los datos incluyen:</p>
          <ul>
            <li>✅ Clientes con nombres falsos</li>
            <li>✅ Reservas en sombrillas, carpas y estacionamiento</li>
            <li>✅ Estados de pago variados (pagado/parcial/pendiente)</li>
            <li>✅ Fechas pasadas y futuras</li>
          </ul>
        </div>
        
        <div class="form-group">
          <label for="demo-count">¿Cuántas reservas crear?</label>
          <select id="demo-count" class="form-control">
            <option value="10">10 reservas</option>
            <option value="20">20 reservas</option>
            <option value="30" selected>30 reservas</option>
            <option value="50">50 reservas</option>
          </select>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-demo">Cancelar</button>
        <button class="btn btn-warning" id="create-demo">🧪 Crear Datos Demo</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('close-demo-modal').addEventListener('click', () => modal.remove());
  document.getElementById('cancel-demo').addEventListener('click', () => modal.remove());
  document.getElementById('create-demo').addEventListener('click', () => {
    const count = parseInt(document.getElementById('demo-count').value);
    modal.remove();
    generateDemoData(count);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Generar datos demo
 */
function generateDemoData(count = 30) {
  try {
    showNotification('🧪 Generando datos demo...', 'info');
    
    // Utilidades
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = arr => arr[rand(0, arr.length - 1)];
    
    // Obtener recursos configurados
    const resourcesConfig = getResourcesConfig();
    const resources = Object.entries(resourcesConfig);
    
    if (!resources || resources.length === 0) {
      showNotification('❌ No hay recursos configurados. Ve a configuración primero.', 'error');
      return;
    }
    
    // Bases de datos
    const rentals = getRentals();
    const payments = getAllPayments();
    const clients = getAllClients();
    
    // Nombres ficticios
    const firstNames = ['Juan','María','Lucía','Sofía','Pedro','Diego','Carla','Nicolás','Rocío','Franco','Martina','Valentina','Agustín','Camila','Julián','Paula','Tomás','Gonzalo','Florencia','Emilia'];
    const lastNames  = ['Pérez','García','López','Martínez','Rodríguez','Gómez','Fernández','Sánchez','Díaz','Torres','Romero','Alvarez','Suárez','Ruiz','Arias','Vega','Castro','Silva','Molina','Rivas'];
    const payMethods = ['efectivo','transferencia','tarjeta','mercadopago'];
    
    // Función para crear cliente
    const createClient = () => {
      const dni = String(rand(15000000, 50000000));
      const name = `${pick(firstNames)} ${pick(lastNames)}`;
      const phone = `11${rand(40000000, 69999999)}`;
      
      // Verificar si ya existe
      let client = clients.find(c => c.dni === dni);
      if (!client) {
        client = {
          id: `client-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
          fullName: name,
          dni: dni,
          phone: phone,
          email: '',
          origin: { country: '', state: '', city: '', address: { neighborhood: '', street: '', number: '', floor: '', zipCode: '' }},
          notes: 'Cliente demo',
          preferences: [],
          vip: false,
          blacklist: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        clients.push(client);
      }
      return client;
    };
    
    // Generar reservas evitando superposiciones
    let created = 0;
    let maxTries = count * 20;
    let tries = 0;
    let startDayOffset = 0;
    while (created < count && tries < maxTries) {
      tries++;
      // Elegir cliente y duración
      const client = createClient();
      const nights = rand(1, 7);
      // Buscar unidad y fechas libres
      let found = false;
      let resourceOrder = resources.map((r, idx) => idx);
      // Mezclar el orden de recursos
      for (let i = resourceOrder.length - 1; i > 0; i--) {
        const j = rand(0, i);
        [resourceOrder[i], resourceOrder[j]] = [resourceOrder[j], resourceOrder[i]];
      }
      for (let rIdx of resourceOrder) {
        const [resourceType, resourceInfo] = resources[rIdx];
        let unitOrder = [];
        for (let u = 1; u <= resourceInfo.total; u++) unitOrder.push(u);
        // Mezclar el orden de unidades
        for (let i = unitOrder.length - 1; i > 0; i--) {
          const j = rand(0, i);
          [unitOrder[i], unitOrder[j]] = [unitOrder[j], unitOrder[i]];
        }
        for (let unitNumber of unitOrder) {
          // Buscar la primera fecha libre para esta unidad
          // Buscar la próxima fecha libre en la unidad, sin superponer ningún día
          let candidateStart = new Date(new Date().getFullYear(), 10, 1 + startDayOffset); // 1 de noviembre + offset
          let candidateEnd = new Date(candidateStart.getTime() + (nights - 1) * 24 * 60 * 60 * 1000);
          let maxSearchDays = 60;
          let searchTries = 0;
          let busy = true;
          while (busy && searchTries < maxSearchDays) {
            busy = false;
            // Verificar todas las reservas existentes en la unidad (incluyendo las agregadas en este ciclo)
            const unitRentals = rentals.filter(r => r.type === resourceType && r.unitNumber === unitNumber);
            // Generar array de todas las fechas del rango candidato
            let candidateDates = [];
            let d = new Date(candidateStart);
            while (d <= candidateEnd) {
              candidateDates.push(d.toISOString().slice(0,10));
              d.setDate(d.getDate() + 1);
            }
            // Verificar si alguna de esas fechas está ocupada por una reserva existente
            for (let r of unitRentals) {
              let rStart = new Date(r.startDate);
              let rEnd = new Date(r.endDate);
              let rDates = [];
              let rd = new Date(rStart);
              while (rd <= rEnd) {
                rDates.push(rd.toISOString().slice(0,10));
                rd.setDate(rd.getDate() + 1);
              }
              // Si alguna fecha se repite, marcar como ocupado
              if (candidateDates.some(date => rDates.includes(date))) {
                busy = true;
                break;
              }
            }
            if (busy) {
              candidateStart.setDate(candidateStart.getDate() + 1);
              candidateEnd = new Date(candidateStart.getTime() + (nights - 1) * 24 * 60 * 60 * 1000);
            }
            searchTries++;
          }
          if (!busy) {
            const pricePerDay = rand(20000, 60000);
            const days = nights;
            const totalPrice = pricePerDay * days;
            const paymentStatus = pick(['paid','partial','pending','paid']);
            // Asignar color aleatorio (paleta extendida, tonos claros y pastel)
            const demoColors = [
              '#2ecc40','#0074d9','#ff4136','#ff851b','#b10dc9','#39cccc','#01ff70','#85144b','#3d9970','#111111','#aaaaaa',
              '#a3e4d7','#f9e79f','#fad7a0','#d2b4de','#aed6f1','#f5b7b1','#f7cac9','#ffe5b4','#b2dfdb','#e1bee7','#c5cae9',
              '#f8bbd0','#dcedc8','#fff9c4','#ffe0b2','#b3e5fc','#c8e6c9','#e6ee9c','#ffccbc','#d7ccc8','#f0f4c3','#f5f5f5'
            ];
            const color = pick(demoColors);
            const rental = {
              id: `rental-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
              type: resourceType,
              unitId: `${resourceInfo.prefix}${unitNumber}`,
              unitNumber: unitNumber,
              clientId: client.id,
              clientName: client.fullName,
              clientPhone: client.phone,
              clientDNI: client.dni,
              startDate: formatDate(candidateStart),
              endDate: formatDate(candidateEnd),
              pricePerDay: pricePerDay,
              totalPrice: totalPrice,
              paymentStatus: paymentStatus,
              notes: 'Reserva demo generada automáticamente',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              color: color
            };
            rentals.push(rental);
            if (paymentStatus === 'paid') {
              payments.push({
                id: `payment-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                rentalId: rental.id,
                amount: totalPrice,
                method: pick(payMethods),
                date: rental.createdAt,
                notes: 'Pago demo'
              });
            } else if (paymentStatus === 'partial') {
              const paidAmount = Math.round(totalPrice * pick([0.25, 0.4, 0.5, 0.6, 0.75]));
              payments.push({
                id: `payment-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                rentalId: rental.id,
                amount: paidAmount,
                method: pick(payMethods),
                date: rental.createdAt,
                notes: 'Pago parcial demo'
              });
            }
            created++;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) startDayOffset++;
    }
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rentals));
    saveAllPayments(payments);
    saveAllClients(clients);
    
    // Ocultar botón demo
    const demoBtn = document.getElementById('demo-data-btn');
    if (demoBtn) {
      demoBtn.style.display = 'none';
    }
    
    showNotification(`✅ ${count} reservas demo creadas correctamente!`, 'success');
    
    // Recargar dashboard
    setTimeout(() => {
      renderDashboard();
      // Si está en otra vista, cambiar al dashboard
      if (currentView !== 'dashboard') {
        switchTab('dashboard');
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error generando datos demo:', error);
    showNotification('❌ Error generando datos demo. Ver consola.', 'error');
  }
}
