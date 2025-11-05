/**
 * Sistema de Búsqueda Avanzada
 * Búsqueda en tiempo real de reservas por múltiples criterios
 */

// ===================================
// CONFIGURACIÓN
// ===================================

const SEARCH_CONFIG = {
  minChars: 2,           // Mínimo de caracteres para buscar
  debounceDelay: 300,    // Delay en ms para debounce
  maxResults: 15,        // Máximo de resultados a mostrar
  highlightClass: 'search-highlight'
};

// ===================================
// FUNCIONES DE BÚSQUEDA
// ===================================

/**
 * Búsqueda principal - busca en todos los campos
 * @param {string} query - Término de búsqueda
 * @param {Object} filters - Filtros adicionales (estado, fechas, tipo)
 * @returns {Array} - Array de reservas que coinciden
 */
function searchRentals(query, filters = {}) {
  if (!query || query.length < SEARCH_CONFIG.minChars) {
    return [];
  }

  const allRentals = getRentals();
  const normalizedQuery = normalizeString(query);
  
  let results = allRentals.filter(rental => {
    // Búsqueda por cliente
    const clientMatch = searchByClient(rental, normalizedQuery);
    
    // Búsqueda por unidad
    const unitMatch = searchByUnit(rental, normalizedQuery);
    
    // Búsqueda por ID
    const idMatch = rental.id.toLowerCase().includes(normalizedQuery);
    
    return clientMatch || unitMatch || idMatch;
  });

  // Aplicar filtros adicionales
  results = applyFilters(results, filters);

  // Ordenar por relevancia (coincidencias exactas primero)
  results = sortByRelevance(results, normalizedQuery);

  // Limitar resultados
  return results.slice(0, SEARCH_CONFIG.maxResults);
}

/**
 * Búsqueda por datos del cliente
 * @param {Object} rental - Objeto de reserva
 * @param {string} query - Término normalizado
 * @returns {boolean}
 */
function searchByClient(rental, query) {
  const clientName = normalizeString(rental.clientName || '');
  const clientDNI = (rental.clientDNI || '').toString();
  const clientPhone = normalizeString(rental.clientPhone || '');
  const clientEmail = normalizeString(rental.clientEmail || '');

  return (
    clientName.includes(query) ||
    clientDNI.includes(query) ||
    clientPhone.includes(query) ||
    clientEmail.includes(query)
  );
}

/**
 * Búsqueda por unidad/recurso
 * @param {Object} rental - Objeto de reserva
 * @param {string} query - Término normalizado
 * @returns {boolean}
 */
function searchByUnit(rental, query) {
  const unitNumber = rental.unitNumber.toString().toLowerCase();
  const unitType = rental.type.toLowerCase();
  
  // Obtener configuración del tipo de unidad
  const config = UNIT_TYPES[rental.type];
  const unitLabel = config ? normalizeString(config.label) : '';
  const unitPrefix = config ? config.prefix.toLowerCase() : '';

  return (
    unitNumber.includes(query) ||
    unitType.includes(query) ||
    unitLabel.includes(query) ||
    unitPrefix.includes(query) ||
    `${unitPrefix}${unitNumber}`.includes(query)
  );
}

/**
 * Búsqueda por rango de fechas
 * @param {Object} rental - Objeto de reserva
 * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha fin (YYYY-MM-DD)
 * @returns {boolean}
 */
function searchByDateRange(rental, startDate, endDate) {
  const rentalStart = new Date(rental.startDate);
  const rentalEnd = new Date(rental.endDate);
  const searchStart = startDate ? new Date(startDate) : null;
  const searchEnd = endDate ? new Date(endDate) : null;

  // Si no hay fechas de búsqueda, incluir todas
  if (!searchStart && !searchEnd) return true;

  // Verificar si hay overlap entre las fechas
  if (searchStart && searchEnd) {
    return (rentalStart <= searchEnd && rentalEnd >= searchStart);
  } else if (searchStart) {
    return rentalEnd >= searchStart;
  } else if (searchEnd) {
    return rentalStart <= searchEnd;
  }

  return true;
}

/**
 * Aplicar filtros adicionales
 * @param {Array} results - Resultados de búsqueda
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array}
 */
function applyFilters(results, filters) {
  let filtered = [...results];

  // Filtro por estado de pago
  if (filters.paymentStatus) {
    filtered = filtered.filter(rental => {
      const paidAmount = calculatePaidAmount(rental.id);
      const totalAmount = rental.totalPrice;
      
      if (filters.paymentStatus === 'paid') {
        return paidAmount >= totalAmount;
      } else if (filters.paymentStatus === 'partial') {
        return paidAmount > 0 && paidAmount < totalAmount;
      } else if (filters.paymentStatus === 'pending') {
        return paidAmount === 0;
      }
      
      return true;
    });
  }

  // Filtro por tipo de recurso
  if (filters.resourceType) {
    filtered = filtered.filter(rental => rental.type === filters.resourceType);
  }

  // Filtro por rango de fechas
  if (filters.startDate || filters.endDate) {
    filtered = filtered.filter(rental => 
      searchByDateRange(rental, filters.startDate, filters.endDate)
    );
  }

  // Filtro por estado activo/finalizado
  if (filters.status) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(rental => {
      const endDate = new Date(rental.endDate);
      const isActive = endDate >= today;
      
      if (filters.status === 'active') {
        return isActive;
      } else if (filters.status === 'finished') {
        return !isActive;
      }
      
      return true;
    });
  }

  return filtered;
}

/**
 * Ordenar resultados por relevancia
 * @param {Array} results - Resultados a ordenar
 * @param {string} query - Término de búsqueda
 * @returns {Array}
 */
function sortByRelevance(results, query) {
  return results.sort((a, b) => {
    // Puntuación por tipo de coincidencia
    const scoreA = calculateRelevanceScore(a, query);
    const scoreB = calculateRelevanceScore(b, query);
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Mayor score primero
    }
    
    // Si tienen el mismo score, ordenar por fecha (más recientes primero)
    return new Date(b.startDate) - new Date(a.startDate);
  });
}

/**
 * Calcular puntuación de relevancia
 * @param {Object} rental - Reserva
 * @param {string} query - Término de búsqueda
 * @returns {number}
 */
function calculateRelevanceScore(rental, query) {
  let score = 0;
  const normalizedName = normalizeString(rental.clientName || '');
  const dni = (rental.clientDNI || '').toString();
  const phone = normalizeString(rental.clientPhone || '');
  const config = UNIT_TYPES[rental.type];
  const unitRef = config ? `${config.prefix}${rental.unitNumber}`.toLowerCase() : '';

  // Coincidencia exacta del nombre (peso 10)
  if (normalizedName === query) {
    score += 10;
  }
  // Nombre empieza con la búsqueda (peso 7)
  else if (normalizedName.startsWith(query)) {
    score += 7;
  }
  // Nombre contiene la búsqueda (peso 5)
  else if (normalizedName.includes(query)) {
    score += 5;
  }

  // Coincidencia exacta de DNI (peso 10)
  if (dni === query) {
    score += 10;
  }
  // DNI empieza con búsqueda (peso 8)
  else if (dni.startsWith(query)) {
    score += 8;
  }

  // Coincidencia exacta de unidad (peso 8)
  if (unitRef === query) {
    score += 8;
  }

  // Coincidencia en teléfono (peso 6)
  if (phone.includes(query)) {
    score += 6;
  }

  // Bonus por reserva activa (peso 2)
  const today = new Date();
  const endDate = new Date(rental.endDate);
  if (endDate >= today) {
    score += 2;
  }

  return score;
}

/**
 * Normalizar string para búsqueda (remover acentos, lowercase)
 * @param {string} str - String a normalizar
 * @returns {string}
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .trim();
}

/**
 * Resaltar términos de búsqueda en texto
 * @param {string} text - Texto original
 * @param {string} query - Término a resaltar
 * @returns {string} - HTML con términos resaltados
 */
function highlightSearchTerms(text, query) {
  if (!query || !text) return text;

  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);
  
  // Si no hay coincidencia, devolver texto original
  if (!normalizedText.includes(normalizedQuery)) {
    return text;
  }

  // Crear regex para búsqueda case-insensitive sin acentos
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  
  return text.replace(regex, `<mark class="${SEARCH_CONFIG.highlightClass}">$1</mark>`);
}

/**
 * Escapar caracteres especiales para regex
 * @param {string} str - String a escapar
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Debounce function - retrasa la ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en ms
 * @returns {Function}
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Obtener estadísticas de búsqueda
 * @param {Array} results - Resultados de búsqueda
 * @returns {Object}
 */
function getSearchStats(results) {
  const stats = {
    total: results.length,
    byStatus: {
      paid: 0,
      partial: 0,
      pending: 0
    },
    byType: {},
    totalAmount: 0,
    paidAmount: 0
  };

  results.forEach(rental => {
    // Calcular estado de pago
    const paidAmount = calculatePaidAmount(rental.id);
    const totalAmount = rental.totalPrice;
    
    if (paidAmount >= totalAmount) {
      stats.byStatus.paid++;
    } else if (paidAmount > 0) {
      stats.byStatus.partial++;
    } else {
      stats.byStatus.pending++;
    }

    // Contar por tipo
    stats.byType[rental.type] = (stats.byType[rental.type] || 0) + 1;

    // Sumar montos
    stats.totalAmount += totalAmount;
    stats.paidAmount += paidAmount;
  });

  return stats;
}

// ===================================
// EXPORTS (si se usa como módulo)
// ===================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    searchRentals,
    searchByClient,
    searchByUnit,
    searchByDateRange,
    applyFilters,
    highlightSearchTerms,
    debounce,
    getSearchStats,
    SEARCH_CONFIG
  };
}
