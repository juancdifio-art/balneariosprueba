/**
 * Módulo de lógica de negocio para gestión de alquileres
 * Zeus Balneario - Necochea
 */

/**
 * Validar formato de teléfono argentino
 * @param {string} phone - Número de teléfono
 * @returns {boolean} true si es válido
 */
function isValidPhone(phone) {
  // Formato argentino: 10 dígitos
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Validar formato de DNI argentino
 * @param {string} dni - Número de DNI
 * @returns {boolean} true si es válido
 */
function isValidDNI(dni) {
  // 7 u 8 dígitos sin puntos
  const dniRegex = /^\d{7,8}$/;
  return dniRegex.test(dni.replace(/\D/g, ''));
}

/**
 * Validar que una fecha esté dentro de la temporada
 * @param {string} date - Fecha en formato ISO
 * @returns {boolean} true si está dentro de la temporada
 */
function isDateInSeason(date) {
  return date >= SEASON.startDate && date <= SEASON.endDate;
}

/**
 * Calcular cantidad de días entre dos fechas (inclusivo)
 * @param {string} startDate - Fecha inicio ISO
 * @param {string} endDate - Fecha fin ISO
 * @returns {number} Cantidad de días
 */
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
  return diffDays;
}

/**
 * Calcular precio total del alquiler
 * @param {number} pricePerDay - Precio por día
 * @param {number} days - Cantidad de días
 * @param {string} clientId - ID del cliente (opcional)
 * @returns {Object} Objeto con precio base, descuento y precio final
 */
function calculateTotalPrice(pricePerDay, days, clientId = null) {
  const basePrice = pricePerDay * days;
  let discount = 0;
  let discountPercentage = 0;
  let clientType = 'regular';
  
  // Aplicar descuento si hay cliente seleccionado
  if (clientId) {
    const client = getClientById(clientId);
    if (client && client.clientType) {
      clientType = client.clientType;
      const config = getClientClassificationConfig();
      
      if (client.clientType === 'vip') {
        discountPercentage = config.vipDiscount;
      } else if (client.clientType === 'frecuente') {
        discountPercentage = config.frequentDiscount;
      }
      
      discount = (basePrice * discountPercentage) / 100;
    }
  }
  
  const finalPrice = basePrice - discount;
  
  return {
    basePrice,
    discount,
    discountPercentage,
    finalPrice,
    clientType
  };
}

/**
 * Versión simple de calculateTotalPrice para compatibilidad hacia atrás
 * @param {number} pricePerDay - Precio por día
 * @param {number} days - Cantidad de días
 * @returns {number} Precio total
 */
function calculateTotalPriceSimple(pricePerDay, days) {
  return pricePerDay * days;
}

/**
 * Verificar si una unidad está disponible en un rango de fechas
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de unidad
 * @param {string} startDate - Fecha inicio ISO
 * @param {string} endDate - Fecha fin ISO
 * @returns {boolean} true si está disponible
 */
function isUnitAvailable(type, unitNumber, startDate, endDate) {
  // Generar array de todas las fechas en el rango
  const dates = [];
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Verificar disponibilidad para cada fecha
  return dates.every(date => getUnitAvailability(type, unitNumber, date));
}

/**
 * Validar datos del alquiler antes de crear
 * @param {Object} rentalData - Datos del alquiler
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
function validateRentalData(rentalData) {
  const errors = [];
  
  // Validar campos obligatorios
  if (!rentalData.type) {
    errors.push('El tipo de recurso es obligatorio');
  }
  
  if (!rentalData.unitNumber || rentalData.unitNumber < 1) {
    errors.push('El número de unidad es inválido');
  }
  
  if (!rentalData.startDate) {
    errors.push('La fecha de inicio es obligatoria');
  }
  
  if (!rentalData.endDate) {
    errors.push('La fecha de fin es obligatoria');
  }
  
  if (!rentalData.clientName || rentalData.clientName.trim() === '') {
    errors.push('El nombre del cliente es obligatorio');
  }
  
  if (!rentalData.clientPhone) {
    errors.push('El teléfono es obligatorio');
  } else if (!isValidPhone(rentalData.clientPhone)) {
    errors.push('El teléfono debe tener 10 dígitos');
  }
  
  if (!rentalData.clientDNI) {
    errors.push('El DNI es obligatorio');
  } else if (!isValidDNI(rentalData.clientDNI)) {
    errors.push('El DNI debe tener 7 u 8 dígitos');
  }
  
  if (!rentalData.pricePerDay || rentalData.pricePerDay <= 0) {
    errors.push('El precio por día debe ser mayor a 0');
  }
  
  // Validar fechas
  if (rentalData.startDate && rentalData.endDate) {
    if (rentalData.startDate > rentalData.endDate) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
    
    if (!isDateInSeason(rentalData.startDate)) {
      errors.push('La fecha de inicio debe estar dentro de la temporada (01-Dic-2024 a 28-Feb-2025)');
    }
    
    if (!isDateInSeason(rentalData.endDate)) {
      errors.push('La fecha de fin debe estar dentro de la temporada (01-Dic-2024 a 28-Feb-2025)');
    }
  }
  
  // Validar tipo de unidad
  if (rentalData.type && !UNIT_TYPES[rentalData.type]) {
    errors.push('Tipo de recurso inválido');
  } else if (rentalData.type && rentalData.unitNumber) {
    const maxUnits = UNIT_TYPES[rentalData.type].total;
    if (rentalData.unitNumber > maxUnits) {
      errors.push(`El número de unidad no puede ser mayor a ${maxUnits}`);
    }
  }
  
  // Validar disponibilidad
  if (rentalData.type && rentalData.unitNumber && rentalData.startDate && rentalData.endDate) {
    if (!isUnitAvailable(rentalData.type, rentalData.unitNumber, rentalData.startDate, rentalData.endDate)) {
      errors.push('La unidad no está disponible en las fechas seleccionadas');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Crear un nuevo alquiler con validaciones
 * @param {Object} rentalData - Datos del alquiler
 * @returns {Object} { success: boolean, rental?: Object, errors?: Array<string> }
 */
function createRental(rentalData) {
  // Limpiar datos
  const cleanData = {
    type: rentalData.type,
    unitNumber: parseInt(rentalData.unitNumber),
    startDate: rentalData.startDate,
    endDate: rentalData.endDate,
    clientId: rentalData.clientId || null, // ID del cliente
    clientName: rentalData.clientName.trim(),
    clientPhone: rentalData.clientPhone.replace(/\D/g, ''),
    clientDNI: rentalData.clientDNI.replace(/\D/g, ''),
    pricePerDay: parseFloat(rentalData.pricePerDay),
    paymentMethod: rentalData.paymentMethod || 'efectivo',
    paymentStatus: rentalData.paymentStatus || 'pendiente',
    amountPaid: parseFloat(rentalData.amountPaid) || 0
  };
  
  // Validar datos
  const validation = validateRentalData(cleanData);
  
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  // Calcular días y precio total con descuento si aplica
  const days = calculateDays(cleanData.startDate, cleanData.endDate);
  const priceCalculation = calculateTotalPrice(cleanData.pricePerDay, days, cleanData.clientId);
  
  // Crear objeto completo del alquiler con información de descuento
  const rental = {
    ...cleanData,
    basePrice: priceCalculation.basePrice || (cleanData.pricePerDay * days),
    discount: priceCalculation.discount || 0,
    discountPercentage: priceCalculation.discountPercentage || 0,
    totalPrice: priceCalculation.finalPrice || (cleanData.pricePerDay * days)
  };
  
  // Guardar en localStorage
  const savedRental = saveRental(rental);
  
  if (!savedRental) {
    return {
      success: false,
      errors: ['Error al guardar el alquiler en el sistema']
    };
  }
  
  // Si hay un pago inicial, registrarlo en el nuevo sistema de pagos
  if (cleanData.amountPaid > 0 && typeof addPayment === 'function') {
    const paymentData = {
      amount: cleanData.amountPaid,
      paymentMethod: cleanData.paymentMethod || 'efectivo',
      paymentDate: new Date().toISOString().split('T')[0], // Fecha de HOY (cuando se recibe el pago)
      notes: 'Pago inicial al crear la reserva'
    };
    
    const payment = addPayment(savedRental.id, paymentData);
    
    if (!payment) {
      console.warn('⚠️ No se pudo registrar el pago inicial, pero la reserva se creó correctamente');
    } else {
      console.log('✅ Pago inicial registrado:', payment);
    }
  }
  
  return {
    success: true,
    rental: savedRental
  };
}

/**
 * Actualizar un alquiler existente
 * @param {string} id - ID del alquiler a actualizar
 * @param {Object} updatedData - Datos actualizados del alquiler
 * @returns {Object} { success: boolean, rental?: Object, errors?: Array<string> }
 */
function updateRental(id, updatedData) {
  // Obtener el alquiler existente
  const existingRental = getRentalById(id);
  
  if (!existingRental) {
    return {
      success: false,
      errors: ['No se encontró el alquiler a actualizar']
    };
  }
  
  // Limpiar datos actualizados
  const cleanData = {
    clientName: updatedData.clientName.trim(),
    clientPhone: updatedData.clientPhone.replace(/\D/g, ''),
    clientDNI: updatedData.clientDNI.replace(/\D/g, ''),
    pricePerDay: parseFloat(updatedData.pricePerDay),
    paymentMethod: updatedData.paymentMethod || 'efectivo',
    paymentStatus: updatedData.paymentStatus || 'pendiente',
    amountPaid: parseFloat(updatedData.amountPaid) || 0
  };
  
  // Validar datos básicos
  const errors = [];
  
  if (!cleanData.clientName) {
    errors.push('El nombre del cliente es obligatorio');
  }
  
  if (!cleanData.clientPhone || cleanData.clientPhone.length !== 10) {
    errors.push('El teléfono debe tener 10 dígitos');
  }
  
  if (!cleanData.clientDNI || (cleanData.clientDNI.length !== 7 && cleanData.clientDNI.length !== 8)) {
    errors.push('El DNI debe tener 7 u 8 dígitos');
  }
  
  if (!cleanData.pricePerDay || cleanData.pricePerDay <= 0) {
    errors.push('El precio por día debe ser mayor a 0');
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }
  
  // Recalcular precio total con descuento si aplica
  const days = calculateDays(existingRental.startDate, existingRental.endDate);
  const clientId = existingRental.clientId || null;
  const priceCalculation = calculateTotalPrice(cleanData.pricePerDay, days, clientId);
  
  // Crear objeto actualizado preservando campos inmutables
  const updatedRental = {
    ...existingRental,
    ...cleanData,
    basePrice: priceCalculation.basePrice || (cleanData.pricePerDay * days),
    discount: priceCalculation.discount || 0,
    discountPercentage: priceCalculation.discountPercentage || 0,
    totalPrice: priceCalculation.finalPrice || (cleanData.pricePerDay * days),
    updatedAt: new Date().toISOString()
  };
  
  // Actualizar en localStorage
  const result = updateRentalInStorage(id, updatedRental);
  
  if (!result) {
    return {
      success: false,
      errors: ['Error al actualizar el alquiler en el sistema']
    };
  }
  
  return {
    success: true,
    rental: updatedRental
  };
}

/**
 * Cancelar un alquiler existente
 * @param {string} id - ID del alquiler a cancelar
 * @returns {Object} { success: boolean, message: string }
 */
function cancelRental(id) {
  const deleted = deleteRental(id);
  
  if (deleted) {
    return {
      success: true,
      message: 'Alquiler cancelado correctamente'
    };
  } else {
    return {
      success: false,
      message: 'No se pudo cancelar el alquiler'
    };
  }
}

/**
 * Obtener unidades disponibles para un tipo en una fecha específica
 * @param {string} type - Tipo de recurso
 * @param {string} date - Fecha a verificar ISO
 * @returns {Array<number>} Array con números de unidades disponibles
 */
function getAvailableUnits(type, date) {
  if (!UNIT_TYPES[type]) {
    return [];
  }
  
  const totalUnits = UNIT_TYPES[type].total;
  const availableUnits = [];
  
  for (let i = 1; i <= totalUnits; i++) {
    if (getUnitAvailability(type, i, date)) {
      availableUnits.push(i);
    }
  }
  
  return availableUnits;
}

/**
 * Obtener resumen de disponibilidad para una fecha
 * @param {string} type - Tipo de recurso
 * @param {string} date - Fecha a verificar ISO
 * @returns {Object} { total: number, available: number, occupied: number }
 */
function getAvailabilitySummary(type, date) {
  if (!UNIT_TYPES[type]) {
    return { total: 0, available: 0, occupied: 0 };
  }
  
  const total = UNIT_TYPES[type].total;
  const availableUnits = getAvailableUnits(type, date);
  const available = availableUnits.length;
  const occupied = total - available;
  
  return { total, available, occupied };
}

/**
 * Generar array de todas las fechas de la temporada
 * @returns {Array<string>} Array de fechas en formato ISO
 */
function getSeasonDates() {
  const dates = [];
  const currentDate = new Date(SEASON.startDate);
  const endDate = new Date(SEASON.endDate);
  
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Encontrar primera plaza de estacionamiento disponible en un rango de fechas
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 * @returns {number|null} Número de plaza disponible o null si no hay
 */
function findAvailableParking(startDate, endDate) {
  const totalParkingSpots = UNIT_TYPES.estacionamiento.total;
  
  // Iterar desde la plaza 1 hasta la última
  for (let spotNumber = 1; spotNumber <= totalParkingSpots; spotNumber++) {
    if (isUnitAvailable('estacionamiento', spotNumber, startDate, endDate)) {
      return spotNumber;
    }
  }
  
  return null; // No hay plazas disponibles
}

/**
 * Formatear fecha para mostrar (DD-MMM)
 * @param {string} dateISO - Fecha en formato ISO
 * @returns {string} Fecha formateada (ej: "01-Dic")
 */
function formatDateDisplay(dateISO) {
  const monthsES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  const date = new Date(dateISO + 'T00:00:00');
  const day = String(date.getDate()).padStart(2, '0');
  const month = monthsES[date.getMonth()];
  
  return `${day}-${month}`;
}

/**
 * Obtener fecha de hoy en formato ISO
 * @returns {string} Fecha de hoy
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Mover una reserva a otra unidad del mismo tipo
 * @param {string} rentalId - ID de la reserva a mover
 * @param {number} newUnitNumber - Número de la nueva unidad
 * @returns {Object} { success: boolean, rental?: Object, errors?: Array<string> }
 */
function moveRental(rentalId, newUnitNumber) {
  // Obtener la reserva existente
  const rental = getRentalById(rentalId);
  
  if (!rental) {
    return {
      success: false,
      errors: ['No se encontró la reserva a mover']
    };
  }
  
  const { type, startDate, endDate } = rental;
  
  // Validar que la nueva unidad sea del mismo tipo
  const config = UNIT_TYPES[type];
  if (!config) {
    return {
      success: false,
      errors: ['Tipo de unidad no válido']
    };
  }
  
  if (newUnitNumber < 1 || newUnitNumber > config.total) {
    return {
      success: false,
      errors: [`El número debe estar entre 1 y ${config.total}`]
    };
  }
  
  // No permitir mover a la misma unidad
  if (newUnitNumber === rental.unitNumber) {
    return {
      success: false,
      errors: ['La reserva ya está en esa unidad']
    };
  }
  
  // Verificar disponibilidad de la nueva unidad (excluyendo la reserva actual)
  const allRentals = getRentals();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    
    // Buscar si hay otra reserva en la nueva unidad para esta fecha
    const conflictingRental = allRentals.find(r => 
      r.id !== rentalId && // Excluir la reserva actual
      r.type === type && 
      r.unitNumber === newUnitNumber &&
      r.startDate <= dateStr && 
      r.endDate >= dateStr
    );
    
    if (conflictingRental) {
      return {
        success: false,
        errors: [
          `La unidad ${config.prefix}${newUnitNumber} no está disponible para el ${formatDateDisplay(dateStr)}`,
          `Ya tiene una reserva de ${conflictingRental.clientName}`
        ]
      };
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  // Si llegamos aquí, la nueva unidad está disponible
  // Actualizar la reserva con el nuevo número de unidad
  const updatedRental = {
    ...rental,
    unitNumber: newUnitNumber
  };
  
  // Guardar cambios
  const allRentalsUpdated = allRentals.map(r => 
    r.id === rentalId ? updatedRental : r
  );
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allRentalsUpdated));
  
  return {
    success: true,
    rental: updatedRental,
    message: `Reserva movida exitosamente a ${config.prefix}${newUnitNumber}`
  };
}

/**
 * Calcular el estado actual de una plaza específica
 * @param {string} type - Tipo de recurso
 * @param {number} unitNumber - Número de la unidad
 * @param {Date} referenceDate - Fecha de referencia (por defecto: hoy)
 * @returns {Object} Estado de la plaza
 */
function calculateUnitStatus(type, unitNumber, referenceDate = new Date()) {
  // Normalizar fecha a medianoche para comparaciones
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  // Debug: log reference date and all rentals for this unit
  console.log(`[DEBUG] calculateUnitStatus: type=${type}, unit=${unitNumber}, referenceDate=${today.toISOString().slice(0,10)}`);
  
  const rentals = getRentals()
    .filter(r => r.type === type && r.unitNumber === unitNumber && r.status !== 'cancelled')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  rentals.forEach(r => {
    const start = new Date(r.startDate); start.setHours(0,0,0,0);
    const end = new Date(r.endDate); end.setHours(0,0,0,0);
    console.log(`[DEBUG]   rentalId=${r.id}, startDate=${start.toISOString().slice(0,10)}, endDate=${end.toISOString().slice(0,10)}, status=${r.status}`);
  });
  
  // Buscar reserva activa hoy
  const activeRental = rentals.find(r => {
    // Parse as local date to avoid timezone shift
    const [sy, sm, sd] = r.startDate.split('-').map(Number);
    const [ey, em, ed] = r.endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 0, 0, 0, 0);
    return today >= start && today <= end;
  });
  
  if (activeRental) {
    const endDate = new Date(activeRental.endDate);
    endDate.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calcular monto pagado sumando todos los pagos registrados
    const paidAmount = typeof calculatePaidAmount === 'function' 
      ? calculatePaidAmount(activeRental.id) 
      : (activeRental.amountPaid || 0);
    
    const amountDue = activeRental.totalPrice - paidAmount;
    const isOverdue = today > endDate;
    
    return {
      status: isOverdue ? 'overdue' : 'occupied',
      paymentStatus: amountDue > 100 ? 'partial' : 'paid', // Tolerancia de $100
      clientName: activeRental.clientName,
      clientId: activeRental.clientId,
      rentalId: activeRental.id,
      daysRemaining: Math.abs(daysRemaining),
      amountDue: Math.max(0, amountDue),
      startDate: activeRental.startDate,
      endDate: activeRental.endDate
    };
  }
  
  // Buscar próxima reserva futura
  const futureRental = rentals.find(r => {
    const [sy, sm, sd] = r.startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    return start > today;
  });
  
  if (futureRental) {
    const startDate = new Date(futureRental.startDate);
    startDate.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    
    // Si la reserva es en los próximos 7 días, mostrarla como "reserva próxima"
    if (daysUntilCheckIn <= 7) {
      return {
        status: 'reserved',
        clientName: futureRental.clientName,
        clientId: futureRental.clientId,
        rentalId: futureRental.id,
        daysUntilCheckIn,
        startDate: futureRental.startDate,
        endDate: futureRental.endDate
      };
    }
    
    // Plaza libre pero con reserva futura lejana
    return {
      status: 'free',
      daysUntilNextReservation: daysUntilCheckIn
    };
  }
  
  // Plaza completamente libre
  return {
    status: 'free',
    daysUntilNextReservation: null
  };
}

// Exportar función para uso en Vista Rápida
window.calculateUnitStatus = calculateUnitStatus;
