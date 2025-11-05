/**
 * Módulo de Gestión de Clientes
 * Sistema CRM para base de datos de clientes
 */

const CLIENTS_STORAGE_KEY = 'zeus-clients';

/**
 * @typedef {Object} ClientOrigin
 * @property {string} country - País
 * @property {string} state - Provincia/Estado
 * @property {string} city - Ciudad
 * @property {Object} address - Domicilio
 * @property {string} address.neighborhood - Barrio
 * @property {string} address.street - Calle
 * @property {string} address.number - Número
 * @property {string} [address.floor] - Piso/Depto (opcional)
 * @property {string} [address.zipCode] - Código postal (opcional)
 */

/**
 * @typedef {Object} Client
 * @property {string} id - UUID único
 * @property {string} fullName - Nombre completo
 * @property {string} dni - DNI/Pasaporte (único)
 * @property {string} phone - Teléfono
 * @property {string} [email] - Email (opcional)
 * @property {ClientOrigin} origin - Datos de procedencia
 * @property {string} clientType - 'regular' | 'frecuente' | 'vip' | 'blacklist'
 * @property {number} totalReservations - Total de reservas realizadas
 * @property {number} totalSpent - Total gastado histórico
 * @property {string} [firstVisit] - Fecha primera reserva
 * @property {string} [lastVisit] - Fecha última reserva
 * @property {string} [notes] - Notas especiales
 * @property {Array<string>} [preferences] - Preferencias del cliente
 * @property {string} [blacklistReason] - Razón de blacklist
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Última actualización
 */

/**
 * Obtener todos los clientes
 * @returns {Array<Client>}
 */
function getAllClients() {
  try {
    const clients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return clients ? JSON.parse(clients) : [];
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    return [];
  }
}

/**
 * Guardar todos los clientes
 * @param {Array<Client>} clients - Array de clientes
 */
function saveAllClients(clients) {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    console.log('✅ Clientes guardados:', clients.length);
  } catch (error) {
    console.error('❌ Error al guardar clientes:', error);
  }
}

/**
 * Generar ID único para cliente
 * @returns {string}
 */
function generateClientId() {
  return 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Buscar cliente por DNI
 * @param {string} dni - DNI del cliente
 * @returns {Client|null}
 */
function getClientByDNI(dni) {
  const clients = getAllClients();
  const normalizedDNI = dni.toString().replace(/\D/g, ''); // Quitar puntos/espacios
  return clients.find(c => c.dni.replace(/\D/g, '') === normalizedDNI) || null;
}

/**
 * Buscar cliente por ID
 * @param {string} id - ID del cliente
 * @returns {Client|null}
 */
function getClientById(id) {
  const clients = getAllClients();
  return clients.find(c => c.id === id) || null;
}

/**
 * Crear o actualizar cliente
 * @param {Object} clientData - Datos del cliente
 * @returns {Client|null}
 */
function saveClient(clientData) {
  try {
    const clients = getAllClients();
    
    // Validar datos obligatorios
    if (!clientData.fullName || !clientData.dni) {
      console.error('❌ Faltan datos obligatorios: nombre y DNI');
      return null;
    }

    // Verificar si el cliente ya existe (actualización)
    const existingIndex = clients.findIndex(c => c.id === clientData.id);
    
    if (existingIndex >= 0) {
      // Actualizar cliente existente
      const existingClient = clients[existingIndex];
      const updatedClient = {
        ...existingClient,
        ...clientData,
        updatedAt: new Date().toISOString()
      };
      clients[existingIndex] = updatedClient;
      saveAllClients(clients);
      console.log('✅ Cliente actualizado:', updatedClient.fullName);
      return updatedClient;
    } else {
      // Crear nuevo cliente
      const newClient = {
        id: generateClientId(),
        fullName: clientData.fullName,
        dni: clientData.dni,
        phone: clientData.phone || '',
        email: clientData.email || '',
        origin: clientData.origin || {
          country: '',
          state: '',
          city: '',
          address: {
            neighborhood: '',
            street: '',
            number: '',
            floor: '',
            zipCode: ''
          }
        },
        clientType: 'regular',
        totalReservations: 0,
        totalSpent: 0,
        firstVisit: null,
        lastVisit: null,
        notes: clientData.notes || '',
        preferences: clientData.preferences || [],
        blacklistReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      clients.push(newClient);
      saveAllClients(clients);
      console.log('✅ Nuevo cliente creado:', newClient.fullName);
      return newClient;
    }
  } catch (error) {
    console.error('❌ Error al guardar cliente:', error);
    return null;
  }
}

/**
 * Eliminar un cliente por ID
 * @param {string} clientId - ID del cliente a eliminar
 * @returns {boolean} - true si se eliminó correctamente, false si no se encontró
 */
function deleteClientById(clientId) {
  try {
    const clients = getAllClients();
    const filtered = clients.filter(c => c.id !== clientId);
    
    if (filtered.length === clients.length) {
      console.warn('⚠️ Cliente no encontrado:', clientId);
      return false; // Client not found
    }
    
    saveAllClients(filtered);
    console.log('✅ Cliente eliminado:', clientId);
    return true;
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    return false;
  }
}

/**
 * Actualizar estadísticas del cliente después de una reserva
 * @param {string} clientId - ID del cliente
 * @param {number} amount - Monto de la reserva
 * @param {string} reservationDate - Fecha de la reserva
 */
function updateClientStats(clientId, amount, reservationDate) {
  try {
    const clients = getAllClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex >= 0) {
      const client = clients[clientIndex];
      
      // Actualizar estadísticas
      client.totalReservations += 1;
      client.totalSpent += amount;
      client.lastVisit = reservationDate;
      
      if (!client.firstVisit) {
        client.firstVisit = reservationDate;
      }
      
      // Actualizar clasificación automática según configuración
      const config = getClientClassificationConfig();
      
      if (client.totalReservations >= config.vipMinReservations || 
          client.totalSpent >= config.vipMinSpending) {
        client.clientType = 'vip';
      } else if (client.totalReservations >= config.frequentMinReservations) {
        client.clientType = 'frecuente';
      }
      
      client.updatedAt = new Date().toISOString();
      
      clients[clientIndex] = client;
      saveAllClients(clients);
      
      console.log(`✅ Estadísticas actualizadas para ${client.fullName}`);
      return client;
    }
  } catch (error) {
    console.error('❌ Error al actualizar estadísticas del cliente:', error);
  }
  return null;
}

/**
 * Buscar clientes (por nombre o DNI)
 * @param {string} query - Texto de búsqueda
 * @returns {Array<Client>}
 */
function searchClients(query) {
  const clients = getAllClients();
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return clients;
  
  return clients.filter(client => 
    client.fullName.toLowerCase().includes(normalizedQuery) ||
    client.dni.includes(normalizedQuery) ||
    client.phone.includes(normalizedQuery)
  );
}

/**
 * Obtener clientes por tipo
 * @param {string} type - Tipo de cliente
 * @returns {Array<Client>}
 */
function getClientsByType(type) {
  const clients = getAllClients();
  return clients.filter(c => c.clientType === type);
}

/**
 * Eliminar cliente
 * @param {string} clientId - ID del cliente
 * @returns {boolean}
 */
function deleteClient(clientId) {
  try {
    const clients = getAllClients();
    const filtered = clients.filter(c => c.id !== clientId);
    
    if (filtered.length < clients.length) {
      saveAllClients(filtered);
      console.log('✅ Cliente eliminado');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    return false;
  }
}

/**
 * Marcar cliente en blacklist
 * @param {string} clientId - ID del cliente
 * @param {string} reason - Razón del blacklist
 * @returns {boolean}
 */
function markAsBlacklist(clientId, reason) {
  try {
    const clients = getAllClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex >= 0) {
      clients[clientIndex].clientType = 'blacklist';
      clients[clientIndex].blacklistReason = reason;
      clients[clientIndex].updatedAt = new Date().toISOString();
      saveAllClients(clients);
      console.log('⚠️ Cliente marcado en blacklist');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error al marcar blacklist:', error);
    return false;
  }
}

/**
 * Quitar cliente de blacklist
 * @param {string} clientId - ID del cliente
 * @returns {boolean}
 */
function removeFromBlacklist(clientId) {
  try {
    const clients = getAllClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    
    if (clientIndex >= 0) {
      clients[clientIndex].clientType = 'regular';
      clients[clientIndex].blacklistReason = '';
      clients[clientIndex].updatedAt = new Date().toISOString();
      saveAllClients(clients);
      console.log('✅ Cliente removido de blacklist');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error al remover de blacklist:', error);
    return false;
  }
}

/**
 * Obtener estadísticas de clientes
 * @returns {Object}
 */
function getClientStats() {
  const clients = getAllClients();
  
  return {
    totalClients: clients.length,
    regularCount: clients.filter(c => c.clientType === 'regular').length,
    frequentCount: clients.filter(c => c.clientType === 'frecuente').length,
    vipCount: clients.filter(c => c.clientType === 'vip').length,
    blacklistCount: clients.filter(c => c.clientType === 'blacklist').length
  };
}
