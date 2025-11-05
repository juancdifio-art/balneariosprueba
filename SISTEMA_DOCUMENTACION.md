# 🏖️ Zeus Balneario - Documentación del Sistema

## 📋 Información General

**Nombre**: Zeus Balneario - Sistema de Gestión para Balnearios de Playa  
**Versión**: 1.0.0  
**Ubicación**: Necochea, Argentina (Costa Atlántica)  
**Especialización**: Balnearios marítimos estilo Necochea/Mar del Plata  
**Tecnología**: HTML5, CSS3, JavaScript ES6+ (Vanilla JS)  
**Almacenamiento**: localStorage (sin base de datos externa)  

### 🌊 Características del Negocio de Balnearios de Playa
- **Temporada Principal**: Diciembre - Marzo (verano argentino)
- **Recursos Principales**: Sombrillas de playa, carpas familiares, estacionamiento, pileta
- **Público Objetivo**: Familias de turistas, grupos de amigos, locales de fin de semana
- **Operación Diaria**: 8:00-20:00 hrs con check-in matutino masivo
- **Modalidades de Pago**: Efectivo (predominante), transferencias, tarjeta, MercadoPago  

---

## 🏗️ Arquitectura del Sistema

### Estructura de Archivos

```
src/
├── index.html          # Página principal
├── app.js             # Punto de entrada de la aplicación
├── fix-migration.html # Herramienta de migración
├── css/
│   └── styles.css     # Estilos CSS
├── js/
│   ├── analytics.js   # Análisis y estadísticas
│   ├── charts.js      # Generador de gráficos SVG
│   ├── clients.js     # Gestión de clientes CRM
│   ├── config.js      # Configuración del establecimiento
│   ├── dashboard.js   # Dashboard principal
│   ├── payments.js    # Sistema de pagos múltiples
│   ├── pool.js        # Gestión de pileta
│   ├── pricing.js     # Gestión de tarifas
│   ├── rentals.js     # Lógica de alquileres
│   ├── search.js      # Búsqueda avanzada
│   ├── setup.js       # Configuración inicial
│   ├── storage.js     # Persistencia de datos
│   └── ui.js          # Interfaz de usuario
└── types/
    └── index.js       # Definiciones de tipos JSDoc
```

---

### 🔧 Recursos Disponibles

### Configuración de Recursos (config.js)

```javascript
const AVAILABLE_RESOURCE_TYPES = [
  { id: 'sombrilla', name: 'Sombrillas', emoji: '☂️', prefix: 'S' },
  { id: 'carpa', name: 'Carpas', emoji: '⛺', prefix: 'C' },
  { id: 'estacionamiento', name: 'Estacionamiento', emoji: '🚗', prefix: 'E' },
  { id: 'pileta', name: 'Pileta', emoji: '🏊', prefix: 'P', isSpecial: true }
];
```

**CONFIGURACIÓN ACTUAL**: Especializado para balnearios de playa con **sombrillas**, **carpas**, **estacionamiento** y **pileta**.

### 🏖️ Tipos de Recursos en Balnearios de Playa

#### **Sombrillas (☂️)**
- Recurso principal del balneario
- Ubicación: Primera línea de playa
- Capacidad: 4-6 personas
- Incluye: 2 reposeras + mesa

#### **Carpas (⛺)**
- Para familias numerosas o grupos
- Ubicación: Segunda línea
- Capacidad: 6-10 personas
- Incluye: Espacio techado + reposeras

#### **Estacionamiento (🚗)**
- Servicio esencial para turistas
- Ubicación: Acceso al balneario
- Tarifas: Por día o fracción

#### **Pileta (🏊)**
- Alternativa para días de viento/frío
- Entradas independientes o pases de estadía
- Complemento al servicio de playa

---

## 📊 Módulos Principales

### 1. **app.js** - Aplicación Principal

#### Funciones Principales:
- `initApp()` - Inicializa la aplicación
- `isLocalStorageAvailable()` - Verifica soporte de localStorage
- `isEstablishmentConfigured()` - Verifica si está configurado
- `showSetupModal()` - Muestra configuración inicial
- `loadInitialData()` - Carga datos iniciales

### 2. **storage.js** - Persistencia de Datos

#### Constantes:
```javascript
const STORAGE_KEY = 'zeus-rentals';
```

#### Funciones Principales:
- `generateUUID()` - Genera UUID único
- `getRentals()` - Obtiene todas las reservas
- `saveRental(rental)` - Guarda nueva reserva
- `updateRentalInStorage(id, updatedRental)` - Actualiza reserva
- `deleteRental(id)` - Elimina reserva
- `getRentalById(id)` - Busca reserva por ID
- `exportData()` - Exporta datos para backup
- `importData(data)` - Importa datos desde backup

### 3. **rentals.js** - Lógica de Alquileres

#### Funciones de Validación:
- `isValidPhone(phone)` - Valida teléfono argentino
- `isValidDNI(dni)` - Valida DNI argentino
- `isDateInSeason(date)` - Verifica fecha en temporada

#### Funciones de Cálculo:
- `calculateDays(startDate, endDate)` - Calcula días entre fechas
- `calculateTotalPrice(pricePerDay, days, clientId)` - Calcula precio total con descuentos
- `calculateTotalPriceSimple(pricePerDay, days)` - Versión simple sin descuentos

#### Funciones de Disponibilidad:
- `getUnitAvailability(type, unitNumber, date)` - Verifica disponibilidad
- `checkUnitConflicts(type, unitNumber, startDate, endDate, excludeId)` - Verifica conflictos
- `isUnitOccupied(type, unitNumber, date)` - Verifica ocupación

### 4. **ui.js** - Interfaz de Usuario

#### Estado Global:
```javascript
let currentType = null;
let currentView = 'dashboard';
let selectedCells = [];
let selectionMode = false;
let currentPeriodIndex = 0;
const DAYS_PER_PERIOD = 20;
```

#### Funciones de Formateo:
- `formatCurrency(amount)` - Formatea moneda argentina
- `formatDate(date)` - Formatea fecha YYYY-MM-DD
- `getClientNameShort(fullName)` - Obtiene iniciales del cliente

#### Funciones de Navegación:
- `switchToView(view)` - Cambia vista principal
- `switchToType(type)` - Cambia tipo de recurso
- `calculatePeriods()` - Calcula períodos de temporada

#### Funciones de Renderizado:
- `renderGrid(type)` - Renderiza grilla de disponibilidad
- `renderGridHeader(periods)` - Renderiza header de períodos
- `renderGridBody(type, periods)` - Renderiza cuerpo de grilla
- `renderUnit(type, unitNumber, periods)` - Renderiza fila de unidad

### 5. **clients.js** - Gestión de Clientes CRM

#### Constantes:
```javascript
const CLIENTS_STORAGE_KEY = 'zeus-clients';
```

#### Tipos de Cliente:
- `'regular'` - Cliente regular
- `'frecuente'` - Cliente frecuente (5+ reservas)
- `'vip'` - Cliente VIP (10+ reservas, $300k+ gasto)
- `'blacklist'` - Cliente en lista negra

#### Funciones Principales:
- `getAllClients()` - Obtiene todos los clientes
- `saveAllClients(clients)` - Guarda todos los clientes
- `getClientByDNI(dni)` - Busca cliente por DNI
- `getClientById(id)` - Busca cliente por ID
- `saveClient(clientData)` - Crea/actualiza cliente
- `updateClientStats(clientId)` - Actualiza estadísticas del cliente
- `calculateClientType(totalReservations, totalSpent)` - Calcula tipo de cliente

### 6. **payments.js** - Sistema de Pagos

#### Constantes:
```javascript
const PAYMENTS_STORAGE_KEY = 'zeus-payments';
```

#### Estados de Pago:
- `'pendiente'` - Sin pagos
- `'parcial'` - Pago parcial
- `'pagado'` - Totalmente pagado

#### Funciones Principales:
- `getAllPayments()` - Obtiene todos los pagos
- `addPayment(rentalId, paymentData)` - Agrega nuevo pago
- `getPaymentsByRental(rentalId)` - Obtiene pagos de una reserva
- `calculatePaidAmount(rentalId)` - Calcula monto pagado
- `updatePaymentStatus(rentalId)` - Actualiza estado de pago
- `deletePayment(paymentId)` - Elimina un pago

### 7. **pool.js** - Gestión de Pileta

#### Tipos de Entrada:
- `'day'` - Entrada diaria
- `'stay'` - Pase de estadía

#### Funciones Principales:
- `getPoolConfig()` - Obtiene configuración de pileta
- `savePoolConfig(config)` - Guarda configuración
- `getPoolEntries()` - Obtiene entradas de pileta
- `createPoolEntry(data)` - Crea nueva entrada
- `savePoolEntry(entry)` - Guarda entrada
- `deletePoolEntry(entryId)` - Elimina entrada

### 8. **pricing.js** - Gestión de Tarifas

#### Constantes:
```javascript
const PRICING_STORAGE_KEY = 'zeus-pricing';
```

#### Funciones Principales:
- `getAllPricing()` - Obtiene todas las tarifas
- `getPricingByType(type)` - Tarifas por tipo de recurso
- `savePricingByType(type, pricing)` - Guarda tarifas por tipo
- `getPriceForDate(type, date)` - Precio para fecha específica
- `getSuggestedPriceForRange(type, startDate, endDate)` - Precio sugerido

### 9. **search.js** - Búsqueda Avanzada

#### Configuración:
```javascript
const SEARCH_CONFIG = {
  minChars: 2,
  debounceDelay: 300,
  maxResults: 15,
  highlightClass: 'search-highlight'
};
```

#### Funciones Principales:
- `searchRentals(query, filters)` - Búsqueda principal
- `searchByClient(rental, query)` - Búsqueda por cliente
- `searchByUnit(rental, query)` - Búsqueda por unidad
- `applyFilters(results, filters)` - Aplica filtros
- `sortByRelevance(results, query)` - Ordena por relevancia

### 10. **analytics.js** - Análisis y Estadísticas

#### Funciones de Métricas:
- `calcularIngresosMes()` - Ingresos del mes actual
- `calcularIngresosTemporada()` - Ingresos de temporada
- `calcularOcupacionHoy()` - Ocupación de hoy
- `calcularOcupacionSemana()` - Ocupación promedio semanal
- `calcularPagosPendientes()` - Pagos pendientes
- `getCheckinsCheckoutsToday()` - Check-ins y check-outs de hoy

### 11. **dashboard.js** - Panel de Control

#### Funciones Principales:
- `renderDashboard()` - Renderiza dashboard completo
- `calculateDashboardMetrics()` - Calcula métricas del dashboard
- `renderKPICard(icon, title, value, subtitle, type)` - Renderiza tarjetas KPI
- `showClearDatabaseModal()` - Modal para limpiar base de datos
- `clearDatabase()` - Limpia toda la base de datos

### 12. **charts.js** - Gráficos SVG

#### Funciones de Visualización:
- `renderOccupancyBarChart(data, containerId)` - Gráfico de barras de ocupación
- `renderIncomeLineChart(data, containerId)` - Gráfico de línea de ingresos
- `createSVGElement(tag, attributes)` - Crea elementos SVG
- `formatChartTooltip(data)` - Formatea tooltips

### 13. **config.js** - Configuración del Sistema

#### Constantes de Configuración:
```javascript
const CONFIG_STORAGE_KEY = 'zeus-establishment-config';
const DEFAULT_CLIENT_CLASSIFICATION = {
  frequentMinReservations: 5,
  frequentDiscount: 5,
  vipMinReservations: 10,
  vipMinSpending: 300000,
  vipDiscount: 10
};
```

#### Funciones Principales:
- `getEstablishmentConfig()` - Obtiene configuración del establecimiento
- `saveEstablishmentConfig(config)` - Guarda configuración
- `getResourcesConfig()` - Obtiene configuración de recursos
- `saveResourcesConfig(config)` - Guarda configuración de recursos
- `isEstablishmentConfigured()` - Verifica si está configurado

### 14. **setup.js** - Configuración Inicial

#### Funciones de Setup:
- `showSetupModal()` - Muestra modal de configuración
- `renderResourceOptions()` - Renderiza opciones de recursos
- `setupModalEventListeners()` - Configura event listeners
- `validateSetupForm()` - Valida formulario de configuración
- `saveSetupConfiguration()` - Guarda configuración inicial

---

## 💾 Estructura de Datos

### Objeto Rental (Reserva)
```javascript
{
  id: "uuid-string",
  type: "sombrilla|carpa|estacionamiento|pileta",
  unitNumber: number,
  startDate: "YYYY-MM-DD",
  endDate: "YYYY-MM-DD",
  clientName: "string",
  clientPhone: "string",
  clientDNI: "string",
  clientId: "string|null",
  pricePerDay: number,
  totalPrice: number,
  paymentMethod: "efectivo|transferencia|tarjeta|mercadopago",
  paymentStatus: "pendiente|parcial|pagado",
  createdAt: "ISO-string"
}
```

### Objeto Client (Cliente)
```javascript
{
  id: "string",
  fullName: "string",
  dni: "string",
  phone: "string",
  email: "string?",
  origin: {
    country: "string",
    state: "string",
    city: "string",
    address: {
      neighborhood: "string",
      street: "string",
      number: "string",
      floor: "string?",
      zipCode: "string?"
    }
  },
  clientType: "regular|frecuente|vip|blacklist",
  totalReservations: number,
  totalSpent: number,
  firstVisit: "YYYY-MM-DD?",
  lastVisit: "YYYY-MM-DD?",
  notes: "string?",
  preferences: ["string"],
  blacklistReason: "string?",
  createdAt: "ISO-string",
  updatedAt: "ISO-string"
}
```

### Objeto Payment (Pago)
```javascript
{
  id: "string",
  rentalId: "string",
  amount: number,
  paymentMethod: "efectivo|transferencia|tarjeta|mercadopago",
  paymentDate: "YYYY-MM-DD",
  notes: "string",
  createdAt: "ISO-string"
}
```

### Objeto PoolEntry (Entrada de Pileta)
```javascript
{
  id: "string",
  type: "pool",
  entryType: "day|stay",
  clientId: "string?",
  clientName: "string",
  clientDNI: "string",
  clientPhone: "string",
  numberOfPeople: number,
  date: "YYYY-MM-DD?",  // Para entradas diarias
  dates: ["YYYY-MM-DD"], // Para pases de estadía
  basePrice: number,
  groupDiscount: number,
  totalPrice: number,
  paymentMethod: "string",
  paymentStatus: "pendiente|parcial|pagado",
  notes: "string",
  createdAt: "ISO-string"
}
```

---

## 🔑 Variables Globales Importantes

### En ui.js:
```javascript
let currentType = null;           // Tipo de recurso actual
let currentView = 'dashboard';    // Vista actual
let selectedCells = [];           // Celdas seleccionadas
let selectionMode = false;        // Modo de selección activo
let currentPeriodIndex = 0;       // Índice del período actual
const DAYS_PER_PERIOD = 20;      // Días por período
```

### En config.js:
```javascript
const AVAILABLE_RESOURCE_TYPES = [...]; // Tipos de recursos disponibles
let UNIT_TYPES = {};                    // Tipos configurados dinámicamente
```

### Constantes de Temporada:
```javascript
const SEASON = {
  startDate: "2024-12-01",
  endDate: "2025-03-31"
};
```

---

## 🎯 Funciones de Utilidad Críticas

### Formateo de Datos:
- `formatCurrency(amount)` - Formato moneda argentina
- `formatDate(date)` - Formato YYYY-MM-DD
- `normalizeString(str)` - Normaliza strings para búsqueda

### Validaciones:
- `isValidPhone(phone)` - Valida teléfono argentino
- `isValidDNI(dni)` - Valida DNI argentino
- `isDateInSeason(date)` - Verifica fecha en temporada

### Cálculos:
- `calculateDays(startDate, endDate)` - Días entre fechas
- `calculateTotalPrice(pricePerDay, days, clientId)` - Precio total
- `calculatePaidAmount(rentalId)` - Monto pagado

### Estado de Disponibilidad:
- `getUnitAvailability(type, unitNumber, date)` - Disponibilidad
- `isUnitOccupied(type, unitNumber, date)` - Ocupación
- `checkUnitConflicts(...)` - Conflictos de reserva

---

## 📱 Funcionalidades del Sistema

### 1. **Dashboard Principal**
- KPI cards (ingresos, ocupación, pagos pendientes, check-ins)
- Gráfico de ocupación 7 días antes/después
- Lista de reservas próximas
- Lista de pagos pendientes
- Acceso rápido a todas las secciones

### 2. **Gestión de Reservas**
- Grilla visual de disponibilidad por períodos
- Selección múltiple de fechas/unidades
- Formulario de nueva reserva
- Edición y cancelación de reservas
- Búsqueda avanzada por múltiples criterios

### 3. **Sistema CRM de Clientes**
- Base de datos completa de clientes
- Clasificación automática (regular/frecuente/VIP/blacklist)
- Historial de reservas por cliente
- Descuentos automáticos según tipo de cliente
- Estadísticas detalladas por cliente

### 4. **Sistema de Pagos**
- Múltiples pagos por reserva
- Estados: pendiente/parcial/pagado
- Métodos: efectivo/transferencia/tarjeta/MercadoPago
- Historial completo de pagos
- Reportes de pagos pendientes

### 5. **Gestión de Pileta**
- Entradas diarias y pases de estadía
- Precios por cantidad de personas
- Descuentos por grupo
- Integración con sistema de clientes

### 6. **Configuración de Tarifas**
- Tarifas por tipo de recurso
- Tarifas por período de temporada
- Precios sugeridos automáticos
- Flexibilidad total en configuración

### 7. **Búsqueda y Filtros**
- Búsqueda global en tiempo real
- Filtros por fecha, estado, tipo
- Resultados ordenados por relevancia
- Navegación con teclado

### 8. **Análisis y Reportes**
- Métricas de ocupación en tiempo real
- Análisis de ingresos por período
- Gráficos interactivos SVG
- Exportación de datos

---

## 🔄 Flujo de Trabajo Principal

### 1. **Configuración Inicial**
```
app.js → initApp() → isEstablishmentConfigured() → showSetupModal()
setup.js → renderResourceOptions() → saveSetupConfiguration()
```

### 2. **Creación de Reserva**
```
ui.js → renderGrid() → selección de celdas → showRentalModal()
rentals.js → validateRentalData() → calculateTotalPrice()
storage.js → saveRental() → updateRentalInStorage()
clients.js → saveClient() → updateClientStats()
```

### 3. **Gestión de Pagos**
```
payments.js → addPayment() → updatePaymentStatus()
ui.js → updatePaymentDisplay() → renderPaymentsList()
analytics.js → calcularPagosPendientes()
```

### 4. **Dashboard y Análisis**
```
dashboard.js → renderDashboard() → calculateDashboardMetrics()
analytics.js → calcular[Varios]() 
charts.js → renderOccupancyBarChart()
```

---

## 🛠️ Consideraciones Técnicas

### Compatibilidad:
- Navegadores modernos con soporte ES6+
- localStorage requerido
- Sin dependencias externas

### Performance:
- Datos almacenados localmente
- Renderizado optimizado por períodos
- Búsqueda con debounce
- Carga lazy de secciones

### Mantenimiento:
- Código modular por funcionalidad
- JSDoc para documentación de tipos
- Funciones puras y reutilizables
- Manejo de errores centralizado

---

## 🔐 Claves de localStorage

```javascript
'zeus-rentals'              // Reservas principales
'zeus-payments'             // Sistema de pagos
'zeus-clients'              // Base de datos CRM
'zeus-establishment-config' // Configuración del establecimiento
'zeus-pool-config'          // Configuración de pileta
'zeus-pool-entries'         // Entradas de pileta
'zeus-pricing'              // Tarifas por tipo y período
```

---

## 🚀 Próximas Funcionalidades Sugeridas

1. **Backup automático** a servidor remoto
2. **Notificaciones push** para check-ins
3. **Integración con WhatsApp** para comunicación
4. **Reportes PDF** automatizados
5. **Dashboard móvil** optimizado
6. **Integración con MercadoPago** API
7. **Sistema de descuentos** avanzado
8. **Calendario de eventos** especiales

---

*Documentación actualizada: Octubre 2025*  
*Sistema: Zeus Balneario v1.0.0*