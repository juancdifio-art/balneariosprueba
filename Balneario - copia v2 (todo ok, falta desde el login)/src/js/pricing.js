/**
 * Módulo de gestión de tarifas
 * Zeus Balneario - Necochea
 */

/**
 * Obtener todas las tarifas guardadas
 * @returns {Object} Objeto con tarifas por tipo
 */
function getAllPricing() {
  try {
    const data = localStorage.getItem(PRICING_STORAGE_KEY);
    return data ? JSON.parse(data) : {
      sombrilla: {},
      carpa: {},
      estacionamiento: {}
    };
  } catch (error) {
    console.error('Error al obtener tarifas:', error);
    return {
      sombrilla: {},
      carpa: {},
      estacionamiento: {}
    };
  }
}

/**
 * Obtener tarifas de un tipo específico
 * @param {string} type - Tipo de recurso
 * @returns {Object} Tarifas por período
 */
function getPricingByType(type) {
  const allPricing = getAllPricing();
  return allPricing[type] || {};
}

/**
 * Guardar tarifas para un tipo
 * @param {string} type - Tipo de recurso
 * @param {Object} pricing - Objeto con tarifas por período
 * @returns {boolean} true si se guardó correctamente
 */
function savePricingByType(type, pricing) {
  try {
    const allPricing = getAllPricing();
    allPricing[type] = pricing;
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(allPricing));
    console.log(`✅ Tarifas guardadas para ${type}`);
    return true;
  } catch (error) {
    console.error('Error al guardar tarifas:', error);
    return false;
  }
}

/**
 * Obtener precio para una fecha específica
 * @param {string} type - Tipo de recurso
 * @param {string} date - Fecha en formato ISO
 * @returns {number|null} Precio por día o null si no está configurado
 */
function getPriceForDate(type, date) {
  const pricing = getPricingByType(type);
  const periods = calculatePricingPeriods();
  
  // Encontrar el período que contiene esta fecha
  const period = periods.find(p => {
    return date >= p.startDate && date <= p.endDate;
  });
  
  if (!period) {
    return null;
  }
  
  // Retornar el precio configurado para ese período
  return pricing[`period_${period.id}`] || null;
}

/**
 * Obtener precio sugerido para un rango de fechas
 * @param {string} type - Tipo de recurso
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 * @returns {number|null} Precio promedio o null
 */
function getSuggestedPriceForRange(type, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let totalPrice = 0;
  let daysWithPrice = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const price = getPriceForDate(type, dateStr);
    
    if (price !== null) {
      totalPrice += price;
      daysWithPrice++;
    }
  }
  
  if (daysWithPrice === 0) {
    return null;
  }
  
  // Retornar precio promedio redondeado
  return Math.round(totalPrice / daysWithPrice);
}

/**
 * Verificar si todas las tarifas están configuradas
 * @param {string} type - Tipo de recurso
 * @returns {Object} { complete: boolean, missingPeriods: Array }
 */
function checkPricingComplete(type) {
  const pricing = getPricingByType(type);
  const periods = calculatePricingPeriods();
  const missingPeriods = [];
  
  periods.forEach(period => {
    const key = `period_${period.id}`;
    if (!pricing[key] || pricing[key] <= 0) {
      missingPeriods.push(period);
    }
  });
  
  return {
    complete: missingPeriods.length === 0,
    missingPeriods
  };
}
