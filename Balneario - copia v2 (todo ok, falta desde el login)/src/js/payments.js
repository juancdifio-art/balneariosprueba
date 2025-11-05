/**
 * Módulo de Gestión de Pagos
 * Maneja múltiples pagos por reserva
 */

const PAYMENTS_STORAGE_KEY = 'zeus-payments';

/**
 * Obtener todos los pagos
 * @returns {Array}
 */
function getAllPayments() {
  try {
    const payments = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    return payments ? JSON.parse(payments) : [];
  } catch (error) {
    console.error('❌ Error al obtener pagos:', error);
    return [];
  }
}

/**
 * Guardar todos los pagos
 * @param {Array} payments - Array de pagos
 */
function saveAllPayments(payments) {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    console.log('✅ Pagos guardados:', payments.length);
  } catch (error) {
    console.error('❌ Error al guardar pagos:', error);
  }
}

/**
 * Generar ID único para pago
 * @returns {string}
 */
function generatePaymentId() {
  return 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Agregar un nuevo pago a una reserva
 * @param {string} rentalId - ID de la reserva
 * @param {Object} paymentData - Datos del pago
 * @returns {Object|null} - Pago creado o null si hay error
 */
function addPayment(rentalId, paymentData) {
  try {
    // Validar datos
    if (!rentalId || !paymentData.amount || paymentData.amount <= 0) {
      console.error('❌ Datos de pago inválidos');
      return null;
    }

    // Verificar que la reserva existe
    const rentals = getRentals();
    const rental = rentals.find(r => r.id === rentalId);
    if (!rental) {
      console.error('❌ Reserva no encontrada:', rentalId);
      return null;
    }

    // Verificar que el pago no exceda el total
    const paidAmount = calculatePaidAmount(rentalId);
    const pendingAmount = rental.totalPrice - paidAmount;
    
    if (paymentData.amount > pendingAmount) {
      console.error('❌ El pago excede el monto pendiente');
      return null;
    }

    // Crear nuevo pago
    const payment = {
      id: generatePaymentId(),
      rentalId: rentalId,
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.paymentMethod || 'efectivo',
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      notes: paymentData.notes || '',
      createdAt: new Date().toISOString()
    };

    // Guardar pago
    const payments = getAllPayments();
    payments.push(payment);
    saveAllPayments(payments);

    console.log('✅ Pago agregado:', payment);
    return payment;
  } catch (error) {
    console.error('❌ Error al agregar pago:', error);
    return null;
  }
}

/**
 * Obtener todos los pagos de una reserva
 * @param {string} rentalId - ID de la reserva
 * @returns {Array}
 */
function getPaymentsByRental(rentalId) {
  const payments = getAllPayments();
  return payments.filter(p => p.rentalId === rentalId)
    .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
}

/**
 * Calcular el monto total pagado de una reserva
 * @param {string} rentalId - ID de la reserva
 * @returns {number}
 */
function calculatePaidAmount(rentalId) {
  const payments = getPaymentsByRental(rentalId);
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Calcular el monto pendiente de una reserva
 * @param {string} rentalId - ID de la reserva
 * @returns {number}
 */
function calculatePendingAmount(rentalId) {
  const rentals = getRentals();
  const rental = rentals.find(r => r.id === rentalId);
  
  if (!rental) return 0;
  
  const paidAmount = calculatePaidAmount(rentalId);
  return rental.totalPrice - paidAmount;
}

/**
 * Verificar si una reserva está completamente pagada
 * @param {string} rentalId - ID de la reserva
 * @returns {boolean}
 */
function isFullyPaid(rentalId) {
  return calculatePendingAmount(rentalId) <= 0;
}

/**
 * Eliminar un pago
 * @param {string} paymentId - ID del pago
 * @returns {boolean}
 */
function deletePayment(paymentId) {
  try {
    const payments = getAllPayments();
    const index = payments.findIndex(p => p.id === paymentId);
    
    if (index === -1) {
      console.error('❌ Pago no encontrado:', paymentId);
      return false;
    }

    payments.splice(index, 1);
    saveAllPayments(payments);
    
    console.log('✅ Pago eliminado:', paymentId);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar pago:', error);
    return false;
  }
}

/**
 * Obtener resumen de pagos de una reserva
 * @param {string} rentalId - ID de la reserva
 * @returns {Object}
 */
function getPaymentSummary(rentalId) {
  const rentals = getRentals();
  const rental = rentals.find(r => r.id === rentalId);
  
  if (!rental) return null;

  const payments = getPaymentsByRental(rentalId);
  const paidAmount = calculatePaidAmount(rentalId);
  const pendingAmount = rental.totalPrice - paidAmount;
  const paymentPercentage = rental.totalPrice > 0 
    ? Math.round((paidAmount / rental.totalPrice) * 100) 
    : 0;

  return {
    totalPrice: rental.totalPrice,
    paidAmount: paidAmount,
    pendingAmount: pendingAmount,
    paymentPercentage: paymentPercentage,
    isFullyPaid: pendingAmount <= 0,
    paymentCount: payments.length,
    payments: payments
  };
}

/**
 * Migrar pagos antiguos (de amountPaid a sistema nuevo)
 * Solo se ejecuta una vez
 */
function migrateOldPayments() {
  try {
    // Verificar si ya se migró
    const migrated = localStorage.getItem('zeus-payments-migrated');
    if (migrated) {
      console.log('✅ Pagos ya migrados anteriormente');
      return;
    }

    const rentals = getRentals();
    let payments = getAllPayments();
    let migratedCount = 0;

    rentals.forEach(rental => {
      // Si tiene amountPaid y no tiene pagos registrados para esta reserva
      const existingPayments = payments.filter(p => p.rentalId === rental.id);
      
      if (rental.amountPaid && rental.amountPaid > 0 && existingPayments.length === 0) {
        const payment = {
          id: generatePaymentId(),
          rentalId: rental.id,
          amount: rental.amountPaid,
          paymentMethod: rental.paymentMethod || 'efectivo',
          paymentDate: rental.startDate,
          notes: 'Pago inicial (migrado del sistema anterior)',
          createdAt: rental.createdAt || new Date().toISOString()
        };
        payments.push(payment);
        migratedCount++;
        console.log(`  ✓ Migrado pago de $${rental.amountPaid} para reserva ${rental.clientName}`);
      }
    });

    if (migratedCount > 0) {
      saveAllPayments(payments);
      console.log(`✅ Migrados ${migratedCount} pagos antiguos al nuevo sistema`);
    } else {
      console.log('✅ No hay pagos antiguos para migrar');
    }

    // Marcar como migrado
    localStorage.setItem('zeus-payments-migrated', 'true');
  } catch (error) {
    console.error('❌ Error en migración de pagos:', error);
  }
}

/**
 * Forzar re-migración de pagos (útil para debugging)
 * CUIDADO: Puede crear duplicados si se usa incorrectamente
 */
function forceMigratePayments() {
  console.log('🔄 Forzando re-migración de pagos...');
  localStorage.removeItem('zeus-payments-migrated');
  migrateOldPayments();
}

/**
 * Obtener estadísticas de pagos por método
 * @returns {Object}
 */
function getPaymentStatsByMethod() {
  const payments = getAllPayments();
  const stats = {};

  Object.keys(PAYMENT_METHODS).forEach(method => {
    stats[method] = {
      count: 0,
      total: 0
    };
  });

  payments.forEach(payment => {
    const method = payment.paymentMethod || 'efectivo';
    if (stats[method]) {
      stats[method].count++;
      stats[method].total += payment.amount;
    }
  });

  return stats;
}

/**
 * Obtener pagos de un período
 * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha fin (YYYY-MM-DD)
 * @returns {Array}
 */
function getPaymentsByPeriod(startDate, endDate) {
  const payments = getAllPayments();
  const start = new Date(startDate);
  const end = new Date(endDate);

  return payments.filter(payment => {
    const paymentDate = new Date(payment.paymentDate);
    return paymentDate >= start && paymentDate <= end;
  });
}
