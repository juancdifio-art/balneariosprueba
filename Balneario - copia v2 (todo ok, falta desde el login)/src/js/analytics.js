/**
 * Módulo de Análisis y Estadísticas
 * Cálculos para el Dashboard
 */

/**
 * Obtener fecha de hoy en formato ISO
 * @returns {string}
 */
function getTodayDateForAnalytics() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Calcular ingresos del mes actual
 * @returns {number}
 */
function calcularIngresosMes() {
  const rentals = getRentals();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  return rentals
    .filter(rental => {
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      
      // Verificar si la reserva tiene algún día en el mes actual
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      
      // La reserva está en el mes si hay overlap entre las fechas
      return (startDate <= monthEnd && endDate >= monthStart);
    })
    .reduce((sum, rental) => sum + calculatePaidAmount(rental.id), 0);
}

/**
 * Calcular ingresos de toda la temporada
 * @returns {number}
 */
function calcularIngresosTemporada() {
  const rentals = getRentals();
  return rentals.reduce((sum, rental) => sum + calculatePaidAmount(rental.id), 0);
}

/**
 * Calcular ocupación de hoy
 * @returns {Object} { percentage, occupied, total }
 */
function calcularOcupacionHoy() {
  const today = getTodayDateForAnalytics();
  const types = Object.keys(UNIT_TYPES);
  
  let totalUnits = 0;
  let occupiedUnits = 0;
  
  types.forEach(type => {
    const config = UNIT_TYPES[type];
    totalUnits += config.total;
    
    for (let i = 1; i <= config.total; i++) {
      if (!getUnitAvailability(type, i, today)) {
        occupiedUnits++;
      }
    }
  });
  
  return {
    percentage: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
    occupied: occupiedUnits,
    total: totalUnits
  };
}

/**
 * Calcular ocupación promedio de la semana actual
 * @returns {number}
 */
function calcularOcupacionSemana() {
  const today = new Date();
  const types = Object.keys(UNIT_TYPES);
  let totalUnits = 0;
  
  types.forEach(type => {
    totalUnits += UNIT_TYPES[type].total;
  });
  
  let totalOccupancy = 0;
  
  // Últimos 7 días
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    let occupiedUnits = 0;
    types.forEach(type => {
      const config = UNIT_TYPES[type];
      for (let j = 1; j <= config.total; j++) {
        if (!getUnitAvailability(type, j, dateStr)) {
          occupiedUnits++;
        }
      }
    });
    
    totalOccupancy += (occupiedUnits / totalUnits) * 100;
  }
  
  return Math.round(totalOccupancy / 7);
}

/**
 * Calcular ocupación promedio del mes actual
 * @returns {number}
 */
function calcularOcupacionMes() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const types = Object.keys(UNIT_TYPES);
  
  let totalUnits = 0;
  types.forEach(type => {
    totalUnits += UNIT_TYPES[type].total;
  });
  
  let totalOccupancy = 0;
  let daysCount = 0;
  
  // Desde el primer día del mes hasta hoy
  for (let d = new Date(firstDayOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    let occupiedUnits = 0;
    types.forEach(type => {
      const config = UNIT_TYPES[type];
      for (let j = 1; j <= config.total; j++) {
        if (!getUnitAvailability(type, j, dateStr)) {
          occupiedUnits++;
        }
      }
    });
    
    totalOccupancy += (occupiedUnits / totalUnits) * 100;
    daysCount++;
  }
  
  return daysCount > 0 ? Math.round(totalOccupancy / daysCount) : 0;
}

/**
 * Calcular total de pagos pendientes
 * @returns {number}
 */
function calcularPagosPendientes() {
  const rentals = getRentals();
  
  return rentals.reduce((sum, rental) => {
    const pending = calculatePendingAmount(rental.id);
    return sum + pending;
  }, 0);
}

/**
 * Contar cantidad de reservas con pagos pendientes
 * @returns {number}
 */
function contarPagosPendientes() {
  const rentals = getRentals();
  return rentals.filter(rental => calculatePendingAmount(rental.id) > 0).length;
}

/**
 * Obtener check-ins de hoy
 * @returns {Array}
 */
function obtenerCheckinsHoy() {
  const today = getTodayDateForAnalytics();
  const rentals = getRentals();
  
  return rentals.filter(rental => rental.startDate === today);
}

/**
 * Obtener check-outs de hoy
 * @returns {Array}
 */
function obtenerCheckoutsHoy() {
  const today = getTodayDateForAnalytics();
  const rentals = getRentals();
  
  return rentals.filter(rental => rental.endDate === today);
}

/**
 * Obtener próximos check-ins (próximos N días)
 * @param {number} days - Cantidad de días hacia adelante
 * @returns {Array}
 */
function obtenerProximosCheckins(days = 7) {
  const today = new Date();
  const rentals = getRentals();
  
  return rentals
    .filter(rental => {
      const startDate = new Date(rental.startDate);
      const diffTime = startDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= days;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

/**
 * Obtener próximos check-outs
 * @param {number} days - Días a futuro
 * @returns {Array}
 */
function obtenerProximosCheckouts(days = 7) {
  const today = new Date();
  const rentals = getRentals();
  
  return rentals
    .filter(rental => {
      const endDate = new Date(rental.endDate);
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= days;
    })
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
}

/**
 * Obtener top recursos más rentados
 * @param {number} limit - Cantidad de recursos a retornar
 * @returns {Array}
 */
function obtenerTopRecursos(limit = 5) {
  const rentals = getRentals();
  const stats = {};
  
  rentals.forEach(rental => {
    const key = `${rental.type}-${rental.unitNumber}`;
    if (!stats[key]) {
      const config = UNIT_TYPES[rental.type];
      stats[key] = {
        type: rental.type,
        unitNumber: rental.unitNumber,
        icon: config ? config.icon : '📦',
        prefix: config ? config.prefix : '',
        label: config ? config.label : rental.type,
        rentals: 0,
        totalIncome: 0,
        days: 0
      };
    }
    stats[key].rentals++;
    stats[key].totalIncome += calculatePaidAmount(rental.id);
    stats[key].days += calculateDays(rental.startDate, rental.endDate);
  });
  
  return Object.values(stats)
    .sort((a, b) => b.totalIncome - a.totalIncome)
    .slice(0, limit);
}

/**
 * Obtener ocupación de los últimos N días
 * @param {number} days - Cantidad de días
 * @returns {Array}
 */
/**
 * Obtener ocupación de días anteriores y posteriores
 * @param {number} daysBefore - Días antes de hoy
 * @param {number} daysAfter - Días después de hoy
 * @returns {Array}
 */
function obtenerOcupacionRangoDias(daysBefore = 7, daysAfter = 7) {
  const today = new Date();
  const types = Object.keys(UNIT_TYPES);
  const data = [];
  
  let totalUnits = 0;
  types.forEach(type => {
    totalUnits += UNIT_TYPES[type].total;
  });
  
  // Días anteriores (de más antiguo a más reciente)
  for (let i = daysBefore; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    let occupiedUnits = 0;
    types.forEach(type => {
      const config = UNIT_TYPES[type];
      for (let j = 1; j <= config.total; j++) {
        if (!getUnitAvailability(type, j, dateStr)) {
          occupiedUnits++;
        }
      }
    });
    
    const percentage = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    data.push({
      date: dateStr,
      dateLabel: formatDateShort(dateStr),
      occupied: occupiedUnits,
      total: totalUnits,
      percentage: percentage,
      isToday: false,
      isPast: true
    });
  }
  
  // Hoy
  const todayStr = today.toISOString().split('T')[0];
  let occupiedToday = 0;
  types.forEach(type => {
    const config = UNIT_TYPES[type];
    for (let j = 1; j <= config.total; j++) {
      if (!getUnitAvailability(type, j, todayStr)) {
        occupiedToday++;
      }
    }
  });
  
  const percentageToday = totalUnits > 0 ? Math.round((occupiedToday / totalUnits) * 100) : 0;
  
  data.push({
    date: todayStr,
    dateLabel: 'Hoy',
    occupied: occupiedToday,
    total: totalUnits,
    percentage: percentageToday,
    isToday: true,
    isPast: false
  });
  
  // Días posteriores
  for (let i = 1; i <= daysAfter; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    let occupiedUnits = 0;
    types.forEach(type => {
      const config = UNIT_TYPES[type];
      for (let j = 1; j <= config.total; j++) {
        if (!getUnitAvailability(type, j, dateStr)) {
          occupiedUnits++;
        }
      }
    });
    
    const percentage = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    data.push({
      date: dateStr,
      dateLabel: formatDateShort(dateStr),
      occupied: occupiedUnits,
      total: totalUnits,
      percentage: percentage,
      isToday: false,
      isPast: false
    });
  }
  
  return data;
}

/**
 * Obtener ocupación por tipo de recurso
 * @param {number} daysBefore - Días antes de hoy
 * @param {number} daysAfter - Días después de hoy
 * @returns {Array}
 */
function obtenerOcupacionPorTipo(daysBefore = 7, daysAfter = 7) {
  const today = new Date();
  const types = Object.keys(UNIT_TYPES);
  const data = [];
  
  // Días anteriores (de más antiguo a más reciente)
  for (let i = daysBefore; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = {
      date: dateStr,
      dateLabel: formatDateShort(dateStr),
      isToday: false,
      isPast: true,
      types: {}
    };
    
    types.forEach(type => {
      const config = UNIT_TYPES[type];
      let occupiedUnits = 0;
      
      for (let j = 1; j <= config.total; j++) {
        if (!getUnitAvailability(type, j, dateStr)) {
          occupiedUnits++;
        }
      }
      
      dayData.types[type] = {
        occupied: occupiedUnits,
        total: config.total,
        percentage: config.total > 0 ? Math.round((occupiedUnits / config.total) * 100) : 0,
        icon: config.icon
      };
    });
    
    data.push(dayData);
  }
  
  // Hoy
  const todayStr = today.toISOString().split('T')[0];
  const todayData = {
    date: todayStr,
    dateLabel: 'Hoy',
    isToday: true,
    isPast: false,
    types: {}
  };
  
  types.forEach(type => {
    const config = UNIT_TYPES[type];
    let occupiedUnits = 0;
    
    for (let j = 1; j <= config.total; j++) {
      if (!getUnitAvailability(type, j, todayStr)) {
        occupiedUnits++;
      }
    }
    
    todayData.types[type] = {
      occupied: occupiedUnits,
      total: config.total,
      percentage: config.total > 0 ? Math.round((occupiedUnits / config.total) * 100) : 0,
      icon: config.icon
    };
  });
  
  data.push(todayData);
  
  // Días posteriores
  for (let i = 1; i <= daysAfter; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = {
      date: dateStr,
      dateLabel: formatDateShort(dateStr),
      isToday: false,
      isPast: false,
      types: {}
    };
    
    types.forEach(type => {
      const config = UNIT_TYPES[type];
      let occupiedUnits = 0;
      
      for (let j = 1; j <= config.total; j++) {
        if (!getUnitAvailability(type, j, dateStr)) {
          occupiedUnits++;
        }
      }
      
      dayData.types[type] = {
        occupied: occupiedUnits,
        total: config.total,
        percentage: config.total > 0 ? Math.round((occupiedUnits / config.total) * 100) : 0,
        icon: config.icon
      };
    });
    
    data.push(dayData);
  }
  
  return data;
}

/**
 * Formatear fecha corta (ej: "Lun 28")
 * @param {string} dateStr - Fecha en formato ISO
 * @returns {string}
 */
function formatDateShort(dateStr) {
  // Parsear fecha manualmente para evitar problemas de timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Calcular todas las métricas del dashboard
 * @returns {Object}
 */
function calculateDashboardMetrics() {
  return {
    ingresos: {
      mes: calcularIngresosMes(),
      temporada: calcularIngresosTemporada()
    },
    ocupacion: {
      hoy: calcularOcupacionHoy(),
      semana: calcularOcupacionSemana(),
      mes: calcularOcupacionMes()
    },
    pagos: {
      pendientes: calcularPagosPendientes(),
      cantidad: contarPagosPendientes()
    },
    reservas: {
      checkinsHoy: obtenerCheckinsHoy(),
      checkoutsHoy: obtenerCheckoutsHoy(),
      proximosCheckins: obtenerProximosCheckins(7),
      proximosCheckouts: obtenerProximosCheckouts(7)
    },
    topRecursos: obtenerTopRecursos(5),
    ocupacionGrafico: obtenerOcupacionRangoDias(7, 7),
    ocupacionPorTipo: obtenerOcupacionPorTipo(7, 7)
  };
}
