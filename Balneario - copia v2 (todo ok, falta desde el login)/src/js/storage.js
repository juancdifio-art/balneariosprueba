/**
 * Módulo de gestión de localStorage para Zeus Balneario
 * Maneja toda la persistencia de datos de alquileres
 */

const STORAGE_KEY = 'zeus-rentals';

/**
 * Genera un UUID simple para identificar alquileres
 * @returns {string} UUID generado
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Obtener todos los alquileres del localStorage
 * @returns {Array} Array de objetos Rental
 */
function getRentals() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error al leer rentals desde localStorage:', error);
    return [];
  }
}

/**
 * Guardar un nuevo alquiler en localStorage
 * @param {Object} rental - Objeto con datos del alquiler
 * @returns {Object|null} El alquiler guardado con ID generado, o null si hay error
 */
function saveRental(rental) {
  try {
    const rentals = getRentals();
    
    // Generar ID y timestamp si no existen
    const newRental = {
      ...rental,
      id: rental.id || generateUUID(),
      createdAt: rental.createdAt || new Date().toISOString()
    };
    
    rentals.push(newRental);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rentals));
    
    console.log('✅ Alquiler guardado:', newRental);
    return newRental;
  } catch (error) {
    console.error('❌ Error al guardar alquiler:', error);
    return null;
  }
}

/**
 * Actualizar un alquiler existente
 * @param {string} id - ID del alquiler a actualizar
 * @param {Object} updatedRental - Objeto del alquiler con datos actualizados
 * @returns {boolean} true si se actualizó correctamente, false si no
 */
function updateRentalInStorage(id, updatedRental) {
  try {
    const rentals = getRentals();
    const rentalIndex = rentals.findIndex(rental => rental.id === id);
    
    if (rentalIndex === -1) {
      console.warn('⚠️ No se encontró alquiler con ID:', id);
      return false;
    }
    
    rentals[rentalIndex] = updatedRental;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rentals));
    console.log('✅ Alquiler actualizado:', id);
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar alquiler:', error);
    return false;
  }
}

/**
 * Eliminar un alquiler por ID
 * @param {string} id - ID del alquiler a eliminar
 * @returns {boolean} true si se eliminó correctamente, false si no
 */
function deleteRental(id) {
  try {
    const rentals = getRentals();
    const filteredRentals = rentals.filter(rental => rental.id !== id);
    
    if (filteredRentals.length === rentals.length) {
      console.warn('⚠️ No se encontró alquiler con ID:', id);
      return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRentals));
    console.log('✅ Alquiler eliminado:', id);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar alquiler:', error);
    return false;
  }
}

/**
 * Obtener alquileres filtrados por tipo de recurso
 * @param {string} type - 'sombrilla' | 'carpa' | 'estacionamiento'
 * @returns {Array} Array de alquileres del tipo especificado
 */
function getRentalsByType(type) {
  const rentals = getRentals();
  return rentals.filter(rental => rental.type === type);
}

/**
 * Obtener alquileres en un rango de fechas específico
 * @param {string} startDate - Fecha inicio (ISO format)
 * @param {string} endDate - Fecha fin (ISO format)
 * @returns {Array} Array de alquileres que coinciden con el rango
 */
function getRentalsByDateRange(startDate, endDate) {
  const rentals = getRentals();
  
  return rentals.filter(rental => {
    // Verificar si hay solapamiento de fechas
    return !(rental.endDate < startDate || rental.startDate > endDate);
  });
}

/**
 * Verificar disponibilidad de una unidad en una fecha específica
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} date - Fecha a verificar (ISO format)
 * @returns {boolean} true si está disponible, false si está ocupada
 */
function getUnitAvailability(type, unitNumber, date) {
  const rentals = getRentals();
  
  const isOccupied = rentals.some(rental => {
    return rental.type === type &&
           rental.unitNumber === unitNumber &&
           date >= rental.startDate &&
           date <= rental.endDate;
  });
  
  return !isOccupied;
}

/**
 * Obtener el alquiler de una unidad en una fecha específica
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} date - Fecha a verificar (ISO format)
 * @returns {Object|null} El alquiler encontrado o null
 */
function getRentalByUnitAndDate(type, unitNumber, date) {
  const rentals = getRentals();
  
  return rentals.find(rental => {
    return rental.type === type &&
           rental.unitNumber === unitNumber &&
           date >= rental.startDate &&
           date <= rental.endDate;
  }) || null;
}

/**
 * Obtener un alquiler por su ID
 * @param {string} id - ID del alquiler
 * @returns {Object|null} El alquiler encontrado o null
 */
function getRentalById(id) {
  const rentals = getRentals();
  return rentals.find(rental => rental.id === id) || null;
}

/**
 * Limpiar todos los alquileres (útil para testing o reset)
 * @returns {boolean} true si se limpió correctamente
 */
function clearAllRentals() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Todos los alquileres eliminados');
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar alquileres:', error);
    return false;
  }
}

/**
 * Exportar datos para backup (retorna JSON string)
 * @returns {string} JSON string de todos los alquileres
 */
function exportData() {
  const rentals = getRentals();
  return JSON.stringify(rentals, null, 2);
}

/**
 * Importar datos desde backup
 * @param {string} jsonData - JSON string con los datos a importar
 * @returns {boolean} true si se importó correctamente
 */
function importData(jsonData) {
  try {
    const rentals = JSON.parse(jsonData);
    
    if (!Array.isArray(rentals)) {
      throw new Error('Los datos deben ser un array de alquileres');
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rentals));
    console.log('✅ Datos importados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al importar datos:', error);
    return false;
  }
}

/**
 * Exporta todos los datos del sistema a un archivo JSON
 * @returns {Object} Objeto con todos los datos del sistema
 */
function exportAllData() {
  try {
    // Obtener todos los pagos del localStorage
    let allPayments = [];
    try {
      const paymentsData = localStorage.getItem('zeus-payments');
      if (paymentsData) {
        allPayments = JSON.parse(paymentsData);
      }
      console.log('📤 Exportando pagos:', allPayments.length);
      if (allPayments.length > 0) {
        console.log('📋 Ejemplo de pago exportado:', allPayments[0]);
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar los pagos para exportar:', error);
    }
    
    // Obtener todos los clientes
    let allClients = [];
    try {
      const clientsData = localStorage.getItem('zeus-clients');
      if (clientsData) {
        allClients = JSON.parse(clientsData);
      }
      console.log('📤 Exportando clientes:', allClients.length);
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar los clientes para exportar:', error);
    }
    
    const data = {
      version: '3.0', // Incrementada para incluir clientes
      exportDate: new Date().toISOString(),
      rentals: getRentals(),
      payments: allPayments,
      clients: allClients, // ✅ NUEVO: Incluir todos los clientes
      pricing: {
        sombrilla: getPricingByType('sombrilla'),
        carpa: getPricingByType('carpa'),
        estacionamiento: getPricingByType('estacionamiento')
      }
    };
    
    console.log('✅ Datos exportados correctamente');
    console.log(`   - ${data.rentals.length} reservas`);
    console.log(`   - ${data.payments.length} pagos`);
    console.log(`   - ${data.clients.length} clientes`);
    console.log(`   - Tarifas de 3 tipos de recursos`);
    return data;
  } catch (error) {
    console.error('❌ Error al exportar datos:', error);
    throw error;
  }
}

/**
 * Importa datos desde un objeto JSON
 * @param {Object} data - Objeto con los datos a importar
 * @returns {Object} Resultado de la importación con estadísticas
 */
function importAllData(data) {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Formato de datos inválido');
    }
    
    const stats = {
      rentalsImported: 0,
      paymentsImported: 0,
      clientsImported: 0, // ✅ NUEVO: Contador de clientes
      pricingImported: 0,
      errors: []
    };
    
    // Importar reservas
    if (Array.isArray(data.rentals)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.rentals));
      stats.rentalsImported = data.rentals.length;
      console.log(`✅ ${data.rentals.length} reservas importadas`);
    }
    
    // ✅ NUEVO: Importar pagos
    if (Array.isArray(data.payments)) {
      console.log('📦 Importando pagos:', data.payments.length);
      console.log('📋 Ejemplo de pago:', data.payments[0]);
      localStorage.setItem('zeus-payments', JSON.stringify(data.payments));
      stats.paymentsImported = data.payments.length;
      console.log(`✅ ${data.payments.length} pagos importados`);
      
      // Verificar que se guardaron correctamente
      const savedPayments = localStorage.getItem('zeus-payments');
      const parsedPayments = JSON.parse(savedPayments);
      console.log('✅ Verificación: Pagos guardados en localStorage:', parsedPayments.length);
    } else {
      // Si no hay pagos en el backup, crear array vacío
      localStorage.setItem('zeus-payments', JSON.stringify([]));
      console.log('ℹ️ No había pagos en el backup (versión anterior)');
    }
    
    // ✅ NUEVO: Importar clientes
    if (Array.isArray(data.clients)) {
      console.log('📦 Importando clientes:', data.clients.length);
      localStorage.setItem('zeus-clients', JSON.stringify(data.clients));
      stats.clientsImported = data.clients.length;
      console.log(`✅ ${data.clients.length} clientes importados`);
    } else {
      // Si no hay clientes en el backup, crear array vacío
      localStorage.setItem('zeus-clients', JSON.stringify([]));
      console.log('ℹ️ No había clientes en el backup (versión anterior)');
    }
    
    // Importar tarifas
    if (data.pricing && typeof data.pricing === 'object') {
      ['sombrilla', 'carpa', 'estacionamiento'].forEach(type => {
        if (data.pricing[type]) {
          savePricingByType(type, data.pricing[type]);
          stats.pricingImported++;
        }
      });
      console.log(`✅ Tarifas importadas para ${stats.pricingImported} tipos de recursos`);
    }
    
    return stats;
  } catch (error) {
    console.error('❌ Error al importar datos:', error);
    throw error;
  }
}

/**
 * Descarga los datos como archivo JSON
 * @param {Object} data - Datos a descargar
 * @param {string} filename - Nombre del archivo
 */
function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exporta SOLO los pagos del sistema
 * @returns {Object} Objeto con los pagos
 */
function exportPaymentsOnly() {
  try {
    const paymentsData = localStorage.getItem('zeus-payments');
    const payments = paymentsData ? JSON.parse(paymentsData) : [];
    
    const data = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      type: 'payments-only',
      payments: payments,
      totalPayments: payments.length
    };
    
    console.log('💳 Pagos exportados:', payments.length);
    return data;
  } catch (error) {
    console.error('❌ Error al exportar pagos:', error);
    throw error;
  }
}

/**
 * Importa SOLO pagos (sin tocar reservas ni tarifas)
 * @param {Object} data - Objeto con los pagos a importar
 * @returns {Object} Resultado de la importación
 */
function importPaymentsOnly(data) {
  try {
    if (!data || data.type !== 'payments-only') {
      throw new Error('Este archivo no contiene solo pagos. Use "Importar Todo" para archivos de backup completo.');
    }
    
    if (!Array.isArray(data.payments)) {
      throw new Error('Formato de pagos inválido');
    }
    
    // Guardar pagos
    localStorage.setItem('zeus-payments', JSON.stringify(data.payments));
    
    console.log(`✅ ${data.payments.length} pagos importados`);
    
    return {
      paymentsImported: data.payments.length,
      success: true
    };
  } catch (error) {
    console.error('❌ Error al importar pagos:', error);
    throw error;
  }
}
