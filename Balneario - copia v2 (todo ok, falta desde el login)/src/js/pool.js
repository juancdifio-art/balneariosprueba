/**
 * pool.js - Gestión de Pileta
 * Sistema para vender entradas de pileta por día o pase de estadía
 */

// ============================================================================
// CONFIGURACIÓN DE PILETA
// ============================================================================

/**
 * Obtener configuración de pileta desde localStorage
 * @returns {Object} Configuración de pileta
 */
function getPoolConfig() {
  const config = localStorage.getItem('zeus-pool-config');
  if (config) {
    return JSON.parse(config);
  }
  
  // Si no existe configuración, devolver null (no crear por defecto)
  return null;
}

/**
 * Guardar configuración de pileta
 * @param {Object} config - Nueva configuración
 */
function savePoolConfig(config) {
  localStorage.setItem('zeus-pool-config', JSON.stringify(config));
}

// ============================================================================
// GESTIÓN DE ENTRADAS
// ============================================================================

/**
 * Obtener todas las entradas de pileta
 * @returns {Array} Array de entradas
 */
function getPoolEntries() {
  const entries = localStorage.getItem('zeus-pool-entries');
  return entries ? JSON.parse(entries) : [];
}

/**
 * Guardar entrada de pileta
 * @param {Object} entry - Entrada a guardar
 * @returns {Object} Entrada guardada
 */
function savePoolEntry(entry) {
  const entries = getPoolEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  localStorage.setItem('zeus-pool-entries', JSON.stringify(entries));
  return entry;
}

/**
 * Eliminar entrada de pileta
 * @param {string} entryId - ID de la entrada
 */
function deletePoolEntry(entryId) {
  const entries = getPoolEntries();
  const filtered = entries.filter(e => e.id !== entryId);
  localStorage.setItem('zeus-pool-entries', JSON.stringify(filtered));
}

/**
 * Crear nueva entrada de pileta
 * @param {Object} data - Datos de la entrada
 * @returns {Object} Entrada creada
 */
function createPoolEntry(data) {
  const entry = {
    id: `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'pool',
    entryType: data.entryType, // 'day' o 'stay'
    
    // Cliente
    clientId: data.clientId || null,
    clientName: data.clientName,
    clientDNI: data.clientDNI || '',
    clientPhone: data.clientPhone || '',
    
    // Detalles
    numberOfPeople: data.numberOfPeople,
    date: data.date || null,           // Para entradas diarias
    dates: data.dates || [],            // Para pases de estadía
    
    // Precios
    basePrice: data.basePrice,
    groupDiscount: data.groupDiscount || 0,
    totalPrice: data.totalPrice,
    
    // Pago
    amountPaid: data.amountPaid || 0,
    paymentStatus: data.paymentStatus || 'pending',
    paymentMethod: data.paymentMethod || 'efectivo',
    paymentDate: data.paymentDate || new Date().toISOString(),
    
    // Vinculación
    linkedRentalId: data.linkedRentalId || null,
    
    // Metadatos
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return savePoolEntry(entry);
}

// ============================================================================
// CÁLCULOS Y VALIDACIONES
// ============================================================================

/**
 * Calcular precio de entrada de pileta
 * @param {number} numberOfPeople - Cantidad de personas
 * @param {string} entryType - 'day' o 'stay'
 * @param {number} numberOfDays - Cantidad de días (solo para 'stay')
 * @returns {Object} Desglose de precios
 */
function calculatePoolEntryPrice(numberOfPeople, entryType, numberOfDays = 1) {
  const config = getPoolConfig();
  
  let basePrice = entryType === 'day' 
    ? config.prices.dayPass 
    : config.prices.stayPassPerDay;
  
  // Precio base total
  let subtotal = basePrice * numberOfPeople * numberOfDays;
  
  // Aplicar descuento por grupo
  let groupDiscount = 0;
  if (numberOfPeople >= 5) {
    groupDiscount = config.groupDiscounts[5] || 0.15;
  } else if (config.groupDiscounts[numberOfPeople]) {
    groupDiscount = config.groupDiscounts[numberOfPeople];
  }
  
  const discountAmount = subtotal * groupDiscount;
  const totalPrice = subtotal - discountAmount;
  
  return {
    basePrice,
    numberOfPeople,
    numberOfDays,
    subtotal: Math.round(subtotal),
    groupDiscount,
    discountAmount: Math.round(discountAmount),
    totalPrice: Math.round(totalPrice)
  };
}

/**
 * Obtener ocupación de pileta por fecha
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Object} Información de ocupación
 */
function getPoolOccupancyByDate(date) {
  const entries = getPoolEntries();
  const config = getPoolConfig();
  const dateStr = typeof date === 'string' ? date : formatDate(date);
  
  let totalPeople = 0;
  const entriesForDate = [];
  
  entries.forEach(entry => {
    if (entry.paymentStatus === 'cancelled') return;
    
    let isForThisDate = false;
    
    // Entrada diaria
    if (entry.entryType === 'day' && entry.date === dateStr) {
      isForThisDate = true;
    }
    
    // Pase de estadía
    if (entry.entryType === 'stay' && entry.dates && entry.dates.includes(dateStr)) {
      isForThisDate = true;
    }
    
    if (isForThisDate) {
      totalPeople += entry.numberOfPeople;
      entriesForDate.push(entry);
    }
  });
  
  return {
    date: dateStr,
    currentOccupancy: totalPeople,
    maxCapacity: config.maxCapacity,
    percentOccupied: Math.round((totalPeople / config.maxCapacity) * 100),
    available: config.maxCapacity - totalPeople,
    entries: entriesForDate
  };
}

/**
 * Validar si se puede agregar entrada
 * @param {string} date - Fecha
 * @param {number} numberOfPeople - Cantidad de personas
 * @returns {Object} Resultado de validación
 */
function canAddPoolEntry(date, numberOfPeople) {
  const occupancy = getPoolOccupancyByDate(date);
  
  if (occupancy.currentOccupancy + numberOfPeople > occupancy.maxCapacity) {
    return {
      valid: false,
      message: `No hay capacidad suficiente para ${numberOfPeople} personas. Disponible: ${occupancy.available}`,
      available: occupancy.available
    };
  }
  
  return { valid: true };
}

/**
 * Validar entrada de pase de estadía
 * @param {Array} dates - Array de fechas
 * @param {number} numberOfPeople - Cantidad de personas
 * @returns {Object} Resultado de validación
 */
function validateStayPassDates(dates, numberOfPeople) {
  for (const date of dates) {
    const validation = canAddPoolEntry(date, numberOfPeople);
    if (!validation.valid) {
      return {
        valid: false,
        message: `${formatDate(date)}: ${validation.message}`,
        date
      };
    }
  }
  
  return { valid: true };
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Obtener ingresos de pileta por fecha
 * @param {string} date - Fecha
 * @returns {Object} Información de ingresos
 */
function getPoolRevenueByDate(date) {
  const entries = getPoolEntries();
  const dateStr = typeof date === 'string' ? date : formatDate(date);
  
  let totalRevenue = 0;
  let paidRevenue = 0;
  let pendingRevenue = 0;
  let entriesCount = 0;
  let paidEntriesCount = 0;
  
  // Solo contar ingresos de las entradas que fueron creadas/pagadas este día
  entries.forEach(entry => {
    if (entry.paymentStatus === 'cancelled') return;
    
    // Obtener la fecha de creación de la entrada
    const entryDate = entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : 
                      (entry.entryType === 'day' ? entry.date : entry.dates[0]);
    
    // Solo contar ingresos si la entrada se registró este día
    if (entryDate === dateStr) {
      entriesCount++;
      totalRevenue += entry.totalPrice;
      
      if (entry.paymentStatus === 'paid') {
        paidRevenue += entry.amountPaid;
        paidEntriesCount++;
      } else if (entry.paymentStatus === 'partial') {
        paidRevenue += entry.amountPaid;
        pendingRevenue += (entry.totalPrice - entry.amountPaid);
      } else {
        pendingRevenue += entry.totalPrice;
      }
    }
  });
  
  // Obtener ocupación del día para el conteo de personas
  const occupancy = getPoolOccupancyByDate(dateStr);
  
  return {
    date: dateStr,
    totalRevenue: Math.round(totalRevenue),
    paidRevenue: Math.round(paidRevenue),
    pendingRevenue: Math.round(pendingRevenue),
    entriesCount,
    paidEntriesCount,
    peopleCount: occupancy.currentOccupancy
  };
}

/**
 * Obtener estadísticas de pileta por rango de fechas
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 * @returns {Object} Estadísticas agregadas
 */
function getPoolStatsByDateRange(startDate, endDate) {
  const dates = getDateRange(startDate, endDate);
  
  let totalRevenue = 0;
  let totalPeople = 0;
  let totalEntries = 0;
  
  dates.forEach(date => {
    const revenue = getPoolRevenueByDate(date);
    totalRevenue += revenue.paidRevenue;
    totalPeople += revenue.peopleCount;
    totalEntries += revenue.entriesCount;
  });
  
  return {
    startDate,
    endDate,
    days: dates.length,
    totalRevenue,
    totalPeople,
    totalEntries,
    averageRevenuePerDay: Math.round(totalRevenue / dates.length),
    averagePeoplePerDay: Math.round(totalPeople / dates.length)
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtener rango de fechas entre dos fechas
 * @param {string} start - Fecha inicio YYYY-MM-DD
 * @param {string} end - Fecha fin YYYY-MM-DD
 * @returns {Array} Array de fechas en formato YYYY-MM-DD
 */
function getDateRange(start, end) {
  // Crear fechas sin problemas de zona horaria
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  
  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);
  const dates = [];
  
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// ============================================================================
// EXPORTAR FUNCIONES
// ============================================================================

if (typeof window !== 'undefined') {
  window.getPoolConfig = getPoolConfig;
  window.savePoolConfig = savePoolConfig;
  window.getPoolEntries = getPoolEntries;
  window.savePoolEntry = savePoolEntry;
  window.deletePoolEntry = deletePoolEntry;
  window.createPoolEntry = createPoolEntry;
  window.calculatePoolEntryPrice = calculatePoolEntryPrice;
  window.getPoolOccupancyByDate = getPoolOccupancyByDate;
  window.canAddPoolEntry = canAddPoolEntry;
  window.validateStayPassDates = validateStayPassDates;
  window.getPoolRevenueByDate = getPoolRevenueByDate;
  window.getPoolStatsByDateRange = getPoolStatsByDateRange;
  window.getDateRange = getDateRange;
}
