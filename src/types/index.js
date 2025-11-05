/**
 * Definiciones de tipos para el sistema Zeus Balneario
 * Usando JSDoc para type checking en JavaScript vanilla
 */

/**
 * @typedef {Object} Rental
 * @property {string} id - UUID único del alquiler
 * @property {'sombrilla'|'carpa'|'estacionamiento'|'pileta'} type - Tipo de recurso alquilado
 * @property {number} unitNumber - Número de la unidad (1-50 para sombrillas/carpas, 1-100 para estacionamiento, N/A para pileta)
 * @property {string} startDate - Fecha de inicio en formato ISO (YYYY-MM-DD)
 * @property {string} endDate - Fecha de fin en formato ISO (YYYY-MM-DD)
 * @property {string} clientName - Nombre completo del cliente
 * @property {string} clientPhone - Teléfono del cliente (formato: 2262123456)
 * @property {string} clientDNI - DNI del cliente sin puntos (7-8 dígitos)
 * @property {number} pricePerDay - Precio por día en pesos argentinos
 * @property {number} totalPrice - Precio total calculado (pricePerDay * días)
 * @property {string} paymentMethod - Método de pago (efectivo, transferencia, tarjeta, mercadopago)
 * @property {'pendiente'|'parcial'|'pagado'} paymentStatus - Estado del pago
 * @property {number} amountPaid - Monto pagado hasta el momento
 * @property {string} createdAt - Timestamp de creación en formato ISO
 */

/**
 * @typedef {Object} DateRange
 * @property {string} start - Fecha de inicio ISO
 * @property {string} end - Fecha de fin ISO
 */

/**
 * @typedef {Object} UnitConfig
 * @property {'sombrilla'|'carpa'|'estacionamiento'|'pileta'} type - Tipo de recurso
 * @property {number} total - Cantidad total de unidades
 * @property {string} prefix - Prefijo para mostrar (S, C, E, P)
 * @property {string} icon - Emoji del recurso
 * @property {string} label - Etiqueta en español
 * @property {boolean} [isSpecial] - Indica si es un recurso especial (pileta)
 */

/**
 * Configuración de los tipos de recursos del balneario
 * @type {Object.<string, UnitConfig>}
 */
const UNIT_TYPES = {
  sombrilla: {
    type: 'sombrilla',
    total: 50,
    prefix: 'S',
    icon: '☂️',
    label: 'Sombrillas'
  },
  carpa: {
    type: 'carpa',
    total: 50,
    prefix: 'C',
    icon: '⛺',
    label: 'Carpas'
  },
  estacionamiento: {
    type: 'estacionamiento',
    total: 100,
    prefix: 'E',
    icon: '🚗',
    label: 'Estacionamiento'
  }
};

/**
 * Configuración de la temporada
 */
const SEASON = {
  startDate: '2025-11-01',
  endDate: '2026-03-31',
  totalDays: 151
};

/**
 * Estados de las celdas en la grilla
 */
const CELL_STATES = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  SELECTED: 'selected'
};

/**
 * Colores para los estados de las celdas
 */
const CELL_COLORS = {
  available: '#4CAF50',   // Verde
  occupied: '#f44336',    // Rojo
  selected: '#FFC107'     // Amarillo
};

/**
 * Métodos de pago disponibles
 */
const PAYMENT_METHODS = {
  efectivo: { label: 'Efectivo', icon: '💵', value: 'efectivo' },
  transferencia: { label: 'Transferencia', icon: '🏦', value: 'transferencia' },
  tarjeta: { label: 'Tarjeta', icon: '💳', value: 'tarjeta' },
  mercadopago: { label: 'MercadoPago', icon: '💰', value: 'mercadopago' },
  otro: { label: 'Otro', icon: '📝', value: 'otro' }
};

/**
 * Estados de pago
 */
const PAYMENT_STATUS = {
  pendiente: { label: 'Pendiente', value: 'pendiente', color: '#f44336' },
  parcial: { label: 'Pago Parcial', value: 'parcial', color: '#FF9800' },
  pagado: { label: 'Pagado', value: 'pagado', color: '#4CAF50' }
};

/**
 * Storage key para tarifas
 */
const PRICING_STORAGE_KEY = 'zeus-pricing';

/**
 * Calcular períodos de tarifas (cada 15 días)
 * @returns {Array} Array de períodos de tarifas
 */
function calculatePricingPeriods() {
  const periods = [];
  const seasonStart = new Date(SEASON.startDate);
  const seasonEnd = new Date(SEASON.endDate);
  
  // Fechas especiales: Carnaval 2026 (14, 15, 16, 17 de febrero)
  const carnavalStart = new Date('2026-02-14');
  const carnavalEnd = new Date('2026-02-17');
  
  let periodNumber = 1;
  let currentStart = new Date(seasonStart);
  
  while (currentStart <= seasonEnd) {
    let currentEnd = new Date(currentStart);
    
    // Verificar si estamos cerca del período de carnaval
    if (currentStart < carnavalStart && currentEnd.getTime() >= carnavalStart.getTime()) {
      // Si el período cruza el inicio de carnaval, terminar justo antes
      currentEnd = new Date(carnavalStart);
      currentEnd.setDate(currentEnd.getDate() - 1);
      
      const days = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1;
      periods.push({
        id: periodNumber,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        days: days,
        special: false
      });
      
      periodNumber++;
      currentStart = new Date(carnavalStart);
      continue;
    }
    
    // Si estamos en el inicio del carnaval, crear período especial
    if (currentStart.getTime() === carnavalStart.getTime()) {
      periods.push({
        id: periodNumber,
        startDate: carnavalStart.toISOString().split('T')[0],
        endDate: carnavalEnd.toISOString().split('T')[0],
        days: 4,
        special: true,
        label: '🎉 Carnaval'
      });
      
      periodNumber++;
      currentStart = new Date(carnavalEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      continue;
    }
    
    // Lógica normal para otros períodos
    currentEnd.setDate(currentEnd.getDate() + 14); // Intentar 15 días
    
    // Calcular días restantes hasta el fin de temporada
    const daysRemaining = Math.ceil((seasonEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1;
    
    // Si quedan 20 días o menos, incluirlos todos en este período
    if (daysRemaining <= 20 || currentEnd >= seasonEnd) {
      currentEnd = new Date(seasonEnd);
      
      periods.push({
        id: periodNumber,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        days: Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1,
        special: false
      });
      
      break;
    }
    
    periods.push({
      id: periodNumber,
      startDate: currentStart.toISOString().split('T')[0],
      endDate: currentEnd.toISOString().split('T')[0],
      days: 15,
      special: false
    });
    
    // Avanzar al siguiente período
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    periodNumber++;
  }
  
  return periods;
}
