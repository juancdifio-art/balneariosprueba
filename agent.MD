# PROYECTO: Sistema de Gestión para Zeus Balneario - Necochea

## ESTRUCTURA DE ARCHIVOS REQUERIDA

Crear EXACTAMENTE esta estructura:

```
zeus-beach-resort/
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── storage.js
│   │   ├── rentals.js
│   │   └── ui.js
│   └── types/
│       └── index.js
├── package.json
└── README.md
```

## TECNOLOGÍAS

- HTML5, CSS3, JavaScript ES6+ vanilla (SIN frameworks ni librerías externas)
- localStorage como base de datos persistente
- Responsive design (mobile-first)
- NO usar React, Vue ni ningún framework

## DESCRIPCIÓN DEL NEGOCIO

Zeus es un balneario en Necochea, Argentina, que alquila por DÍA:

- 50 Sombrillas (numeradas S1 a S50)
- 50 Carpas (numeradas C1 a C50)
- 100 Plazas de Estacionamiento (numeradas E1 a E100)

## SISTEMA DE VISUALIZACIÓN - MUY IMPORTANTE

### Matriz Tipo Calendario

Crear UNA GRILLA VISUAL por cada tipo de recurso (sombrillas, carpas, estacionamiento):

**ESTRUCTURA DE LA GRILLA:**

- **FILAS**: Cada fila representa una unidad (Ej: Sombrilla 1, Sombrilla 2, etc.)
- **COLUMNAS**: Cada columna representa un DÍA de la temporada (90 días: Diciembre, Enero, Febrero)
- **CELDAS**: Cada celda representa el estado de esa unidad en ese día específico

**EJEMPLO VISUAL:**

```
        | 01-Dic | 02-Dic | 03-Dic | 04-Dic | ... | 28-Feb |
--------|--------|--------|--------|--------|-----|--------|
S1      | LIBRE  | LIBRE  | [OCUPADA - Juan Pérez] | LIBRE  |
S2      | [OCUPADA - María García.........]  | LIBRE  |
S3      | LIBRE  | LIBRE  | LIBRE  | LIBRE  | ... | LIBRE  |
...
```

**COLORES:**

- Verde (#4CAF50): Día libre/disponible
- Rojo (#f44336): Día ocupado
- Amarillo (#FFC107): Día seleccionado para nuevo alquiler
- Al hacer hover sobre una celda ocupada, mostrar tooltip con datos del cliente

## FUNCIONALIDADES DETALLADAS

### 1. PÁGINA INICIAL (index.html)

**LAYOUT:**

```
+----------------------------------+
|       🏖️ ZEUS BALNEARIO         |
|     Sistema de Gestión          |
+----------------------------------+
| [Pestañas/Tabs]                 |
| [☂️ Sombrillas] [⛺ Carpas] [🚗 Est.]|
+----------------------------------+
| 📊 Resumen de Disponibilidad    |
| Hoy: X/50 disponibles           |
+----------------------------------+
|                                  |
|   [GRILLA CALENDARIO AQUÍ]      |
|                                  |
+----------------------------------+
| ➕ Nuevo Alquiler [Botón]       |
+----------------------------------+
```

**COMPORTAMIENTO:**

- Por defecto mostrar pestaña "Sombrillas"
- La grilla debe tener scroll horizontal (muchos días) y vertical (muchas unidades)
- Headers de columnas fijos al hacer scroll vertical
- Headers de filas fijos al hacer scroll horizontal

### 2. PROCESO DE ALQUILER

**PASO 1 - Seleccionar en la grilla:**

- Usuario hace click en una celda LIBRE (verde)
- La celda se pone AMARILLA
- Aparece selector: "¿Hasta qué día?" - usuario selecciona rango
- Todas las celdas del rango se pintan AMARILLAS
- VALIDACIÓN: Si algún día del rango está ocupado, mostrar error y no permitir

**PASO 2 - Formulario emergente (modal):**

Cuando el usuario confirma el rango, abrir modal con:

```
+--------------------------------+
| Nuevo Alquiler                |
|--------------------------------|
| Sombrilla: S12                |
| Período: 15-Dic a 20-Dic      |
| (6 días)                      |
|                               |
| Nombre: [_______________]     |
| Teléfono: [_______________]   |
| DNI: [_______________]        |
| Precio por día: $[____]       |
| TOTAL: $XXXX                  |
|                               |
| [Cancelar] [Confirmar Alquiler]|
+--------------------------------+
```

**PASO 3 - Confirmación:**

- Guardar en localStorage
- Pintar las celdas de ROJO con el nombre del cliente
- Mostrar mensaje: "✅ Alquiler registrado correctamente"
- Actualizar contador de disponibilidad

### 3. VER/EDITAR ALQUILER EXISTENTE

**AL HACER CLICK EN CELDA ROJA (ocupada):**

Mostrar modal con información:

```
+--------------------------------+
| Detalle del Alquiler          |
|--------------------------------|
| Cliente: Juan Pérez           |
| Teléfono: 2262-123456         |
| DNI: 12.345.678               |
| Sombrilla: S12                |
| Desde: 15-Dic-2024            |
| Hasta: 20-Dic-2024            |
| Días: 6                       |
| Precio/día: $5000             |
| TOTAL: $30000                 |
|                               |
| [Cerrar] [❌ Cancelar Alquiler]|
+--------------------------------+
```

**CANCELAR ALQUILER:**

- Confirmar con: "¿Seguro que desea cancelar este alquiler?"
- Eliminar de localStorage
- Pintar celdas de VERDE nuevamente
- Actualizar disponibilidad

### 4. GESTIÓN DE FECHAS

**TEMPORADA:**

- Inicio: 1 de Diciembre 2024
- Fin: 28 de Febrero 2025
- Total: 90 días

**FORMATO DE FECHAS:**

- Headers de columnas: "01-Dic", "02-Dic", etc.
- En formularios: usar `<input type="date">`
- Guardar en formato ISO: "2024-12-01"

## ARQUITECTURA DE ARCHIVOS

### src/types/index.js

Definir tipos/interfaces con JSDoc:

```javascript
/**
 * @typedef {Object} Rental
 * @property {string} id - UUID único
 * @property {string} type - 'sombrilla' | 'carpa' | 'estacionamiento'
 * @property {number} unitNumber - Número de la unidad
 * @property {string} startDate - Fecha inicio ISO
 * @property {string} endDate - Fecha fin ISO
 * @property {string} clientName
 * @property {string} clientPhone
 * @property {string} clientDNI
 * @property {number} pricePerDay
 * @property {number} totalPrice
 * @property {Date} createdAt
 */
```

### src/js/storage.js

Manejo de localStorage:

```javascript
// Funciones requeridas:
- saveRental(rental) // Guardar alquiler
- getRentals() // Obtener todos
- deleteRental(id) // Eliminar por ID
- getRentalsByType(type) // Filtrar por tipo
- getRentalsByDateRange(start, end) // Por rango de fechas
- getUnitAvailability(type, unitNumber, date) // Verificar disponibilidad
```

### src/js/rentals.js

Lógica de negocio:

```javascript
// Funciones requeridas:
- createRental(data) // Crear nuevo alquiler con validaciones
- isUnitAvailable(type, unitNumber, startDate, endDate) // Validar disponibilidad
- calculateTotalPrice(pricePerDay, days) // Calcular precio
- cancelRental(id) // Cancelar alquiler
- getAvailableUnits(type, date) // Unidades libres en fecha
```

### src/js/ui.js

Interacción con el DOM:

```javascript
// Funciones requeridas:
- renderGrid(type) // Renderizar grilla de calendario
- renderModal(modalType, data) // Mostrar modales
- updateAvailabilityStats() // Actualizar contadores
- highlightCells(cells, color) // Pintar celdas
- showNotification(message, type) // Mensajes toast
- handleCellClick(event) // Manejar clicks en celdas
```

### src/js/app.js

Inicialización y orquestación:

```javascript
// Punto de entrada principal
- Inicializar la aplicación
- Cargar datos de localStorage
- Configurar event listeners
- Renderizar vista inicial
```

### src/css/styles.css

**DISEÑO REQUERIDO:**

- Paleta de colores veraniega/playera (azul cielo, amarillo sol, verde mar)
- Grilla con bordes claros, celdas de 40px x 40px mínimo
- Sticky headers (columnas y filas)
- Modales centrados con overlay oscuro
- Botones con hover effects
- Responsive: en móvil, grilla con scroll horizontal obligatorio
- Usar CSS Grid para la grilla principal
- Usar Flexbox para layouts generales

## VALIDACIONES IMPORTANTES

- No permitir alquileres superpuestos en la misma unidad
- Validar que el rango de fechas sea válido (inicio < fin)
- Validar que las fechas estén dentro de la temporada
- Campos obligatorios: nombre, teléfono, DNI, precio
- Teléfono: formato argentino (10 dígitos)
- DNI: 7-8 dígitos sin puntos
- Precio: número positivo

## PERSISTENCIA DE DATOS (localStorage)

**ESTRUCTURA DE DATOS:**

```javascript
{
  "zeus-rentals": [
    {
      id: "uuid-1234",
      type: "sombrilla",
      unitNumber: 12,
      startDate: "2024-12-15",
      endDate: "2024-12-20",
      clientName: "Juan Pérez",
      clientPhone: "2262123456",
      clientDNI: "12345678",
      pricePerDay: 5000,
      totalPrice: 30000,
      createdAt: "2024-12-01T10:30:00Z"
    },
    // ... más alquileres
  ]
}
```

## REQUERIMIENTOS DE UX

- Feedback visual inmediato en todas las acciones
- Confirmaciones para acciones destructivas (cancelar alquiler)
- Mensajes de error claros y en español
- Loading states si es necesario
- Tooltips informativos al hacer hover
- Accesibilidad: usar etiquetas semánticas, ARIA labels donde corresponda

## FUNCIONALIDADES ADICIONALES (NICE TO HAVE)

- Búsqueda de cliente por nombre/DNI
- Exportar reporte del día a CSV
- Vista de "Hoy" con resumen rápido
- Filtro por estado (todos/disponibles/ocupados)
- Leyenda de colores visible

## INSTRUCCIONES FINALES

- Generar TODOS los archivos completos y funcionales
- Código bien comentado en español
- Usar nombres de variables descriptivos
- Seguir principios SOLID y DRY
- Manejar errores apropiadamente (try-catch)
- Console.log para debugging en desarrollo
- Código listo para producción (sin TODOs ni placeholders)

## README.md

Incluir:

- Descripción del proyecto
- Instrucciones de instalación (abrir index.html)
- Estructura de archivos explicada
- Cómo usar el sistema (guía rápida)
- Tecnologías utilizadas

---

# 🚀 ROADMAP DE COMERCIALIZACIÓN

**Fecha de creación:** 28 de Octubre, 2025

---

## Plan Estratégico para Comercialización

Este documento contiene el plan completo para convertir el sistema Zeus Balneario en un producto comercial viable.

---

### **FASE 1: Funcionalidades Core Faltantes** (2-3 semanas)

#### 1.1 **Gestión de Pagos Mejorada** ⭐ PRIORITARIO
```javascript
// Necesitas poder registrar múltiples pagos por reserva
- Agregar pago parcial (con fecha y método)
- Historial de pagos por reserva
- Comprobante individual por cada pago
- Recordatorios de pagos pendientes
- Registro de método: efectivo/transferencia/tarjeta
```

#### 1.2 **Búsqueda Avanzada de Reservas**
```javascript
- Buscar por nombre/apellido
- Buscar por DNI
- Buscar por teléfono
- Buscar por número de unidad
- Filtros combinados
```

#### 1.3 **Reportes en PDF/Excel**
```javascript
- Reporte de ingresos por período
- Lista de reservas (con filtros)
- Estado de cuenta del cliente
- Comprobantes en PDF profesionales
- Exportar a Excel para contabilidad
```

#### 1.4 **Gestión de Clientes Mejorada**
```javascript
// Mini CRM
- Base de datos de clientes
- Historial de reservas por cliente
- Notas especiales (ej: "Siempre pide sombrilla 15")
- Clientes VIP/frecuentes
- Blacklist (clientes problemáticos)
```

#### 1.5 **Mejoras en Tarifas**
```javascript
- Precios por día de la semana (lunes-jueves más barato)
- Descuentos por cantidad de días (7+ días)
- Promociones por temporada baja
- Early bird (reserva anticipada)
```

---

### **FASE 2: Backend y Base de Datos** (3-4 semanas) ⭐⭐ CRÍTICO

#### Opción A: **Supabase** (Recomendado - más rápido)
```javascript
// Ventajas:
✅ PostgreSQL automático
✅ API REST generada automáticamente
✅ Autenticación incluida
✅ Gratis hasta 500MB
✅ Setup en 1 día

// Stack:
- Frontend: Actual (HTML/CSS/JS)
- Backend: Supabase (API REST)
- Base de datos: PostgreSQL (en Supabase)
- Autenticación: Supabase Auth
```

#### Opción B: **Node.js + Express** (Control total)
```javascript
// Más trabajo pero más control
- Backend: Node.js + Express
- Base de datos: PostgreSQL o MongoDB
- Autenticación: JWT + bcrypt
- Hosting: Railway/Render/Heroku
```

**Arquitectura con Backend:**
```
┌─────────────────────────────────────────────┐
│  FRONTEND (Tu app actual)                   │
│  HTML + CSS + JavaScript                    │
└─────────────┬───────────────────────────────┘
              │ Fetch API / Axios
              ↓
┌─────────────────────────────────────────────┐
│  BACKEND API (Node.js + Express)            │
│  ├─ /api/auth (login, register)             │
│  ├─ /api/rentals (CRUD reservas)            │
│  ├─ /api/payments (pagos)                   │
│  ├─ /api/clients (clientes)                 │
│  ├─ /api/reports (reportes)                 │
│  └─ /api/analytics (estadísticas)           │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│  BASE DE DATOS (PostgreSQL)                 │
│  ├─ users (usuarios del sistema)            │
│  ├─ establishments (configuración)          │
│  ├─ rentals (reservas)                      │
│  ├─ payments (pagos)                        │
│  ├─ clients (clientes)                      │
│  └─ pricing (tarifas)                       │
└─────────────────────────────────────────────┘
```

---

### **FASE 3: Sistema de Autenticación** (1 semana)

```javascript
// Roles de usuario:
1. SUPER ADMIN
   - Configurar establecimiento
   - Gestionar usuarios
   - Ver todos los reportes
   - Exportar datos

2. ADMIN
   - Crear/editar/cancelar reservas
   - Gestionar pagos
   - Ver reportes
   - Gestionar tarifas

3. EMPLEADO
   - Crear reservas
   - Registrar pagos
   - Ver disponibilidad
   - Ver lista de reservas

4. CONSULTA (opcional)
   - Solo ver disponibilidad
   - Ver reportes básicos
```

**Pantalla de Login:**
```html
┌─────────────────────────────────┐
│   🏖️ ZEUS BALNEARIO             │
│                                 │
│   📧 Email:                     │
│   [________________]            │
│                                 │
│   🔒 Contraseña:                │
│   [________________]            │
│                                 │
│   [  🔑 Iniciar Sesión  ]      │
│                                 │
│   ¿Olvidaste tu contraseña?    │
└─────────────────────────────────┘
```

---

### **FASE 4: Multi-tenant (Multi-establecimiento)** (2 semanas)

```javascript
// Preparar para vender a múltiples balnearios
- Un balneario = Un tenant
- Datos completamente separados
- URL personalizada: zeus-balneario.miapp.com
- Logo y colores personalizables
```

---

### **FASE 5: Portal de Reservas Online** (3-4 semanas)

**Sitio público para clientes:**
```html
┌─────────────────────────────────────────────┐
│  🏖️ ZEUS BALNEARIO - Reservá Online        │
├─────────────────────────────────────────────┤
│                                             │
│  📅 Selecciona tus fechas:                  │
│  [15/12/2025] → [22/12/2025]                │
│                                             │
│  🏖️ ¿Qué querés reservar?                  │
│  [ ] Sombrillas (10 disponibles)            │
│  [ ] Carpas (5 disponibles)                 │
│  [ ] Estacionamiento                        │
│                                             │
│  💰 Total: $42,000                          │
│  💳 Seña 30%: $12,600                       │
│                                             │
│  [  🛒 Reservar Ahora  ]                   │
│                                             │
└─────────────────────────────────────────────┘
```

**Funcionalidades:**
- Calendario de disponibilidad en tiempo real
- Selección de fechas
- Cálculo automático de precios
- Pago de seña online (MercadoPago/Stripe)
- Confirmación automática por email/WhatsApp
- Código QR para check-in

---

### **FASE 6: Integraciones** (2 semanas)

#### 6.1 **MercadoPago / Stripe**
```javascript
- Pago de seña online
- Pago total online
- Link de pago por WhatsApp
- QR para cobrar en el balneario
```

#### 6.2 **WhatsApp Business API**
```javascript
- Confirmación automática de reserva
- Recordatorio 24hs antes del check-in
- Envío de comprobante
- Recordatorio de pago pendiente
```

#### 6.3 **Email (SendGrid / Mailgun)**
```javascript
- Confirmación de reserva
- Comprobante en PDF
- Recordatorios
- Newsletter (ofertas)
```

#### 6.4 **Google Calendar**
```javascript
- Sincronizar reservas
- Compartir con empleados
- Recordatorios automáticos
```

---

### **FASE 7: App Móvil** (4-6 semanas)

#### Opción A: **PWA** (Recomendado primero)
```javascript
// Tu app actual convertida en PWA
- Instalable en teléfono
- Funciona offline (datos en caché)
- Notificaciones push
- Ícono en home screen
- Desarrollo: 1 semana
```

#### Opción B: **App Nativa** (React Native / Flutter)
```javascript
// Después si tiene éxito
- iOS + Android
- Mejor performance
- Más funcionalidades nativas
- Desarrollo: 6-8 semanas
```

---

### **FASE 8: Marketing y Ventas** (Paralelo)

#### Landing Page de Venta
```html
┌─────────────────────────────────────────────┐
│  🏖️ Sistema de Gestión para Balnearios     │
│                                             │
│  ✅ Gestiona reservas fácilmente            │
│  ✅ Cobra seña online                       │
│  ✅ Dashboard con estadísticas              │
│  ✅ Ahorra 10+ horas semanales              │
│                                             │
│  💰 Desde $15,000/mes                       │
│                                             │
│  [  🚀 Probá Gratis 30 Días  ]             │
│                                             │
│  🎥 Ver Demo     💬 Hablar con Ventas      │
└─────────────────────────────────────────────┘
```

#### Estrategia de Venta
```javascript
// Mercado objetivo:
1. Balnearios (costa argentina: 500+)
2. Campings (2000+)
3. Clubes náuticos (300+)
4. Complejos turísticos (1000+)

// Precio sugerido:
💰 Plan BÁSICO: $15,000/mes
   - 1 establecimiento
   - Hasta 100 unidades
   - Soporte por email

💰 Plan PRO: $25,000/mes
   - 1 establecimiento
   - Hasta 300 unidades
   - Reservas online
   - Soporte prioritario

💰 Plan ENTERPRISE: $40,000/mes
   - Multi-establecimiento
   - Unidades ilimitadas
   - White-label
   - Soporte 24/7
   - Onboarding personalizado

// O venta perpetua:
💵 Licencia única: $200,000
   + $30,000/año mantenimiento
```

---

## 🎯 Plan de Acción Inmediato (Próximas 2 semanas)

### Semana 1: Core Features
- [ ] Gestión de pagos mejorada (múltiples pagos)
- [ ] Búsqueda avanzada
- [ ] Historial de pagos por reserva
- [ ] Comprobantes de pago individuales

### Semana 2: Backend Básico
- [ ] Setup Supabase
- [ ] Migrar localStorage a Supabase
- [ ] API de autenticación básica
- [ ] Deploy en Vercel/Netlify

---

## 💡 Recomendaciones Técnicas

### Stack Moderno Recomendado:
```javascript
// Frontend
- Mantener actual (HTML/CSS/JS) ✅
- O migrar a React/Vue (más escalable)
- Tailwind CSS (diseño más rápido)

// Backend
- Supabase (recomendado) ✅✅✅
  * Más rápido
  * Menos código
  * Auth incluida
  * Real-time DB
  
// Hosting
- Frontend: Vercel/Netlify (gratis)
- Backend: Supabase (gratis hasta 500MB)
- Dominio: .com.ar ($500/año)

// Pagos
- MercadoPago (mercado argentino)
- Stripe (internacional)

// Comunicación
- WhatsApp Business API
- SendGrid (emails)
```

---

## 📊 Proyección de Negocio

### Escenario Conservador (Año 1):
```
Mes 1-3: Setup + Primeros 5 clientes
  → 5 × $15,000 = $75,000/mes

Mes 4-6: Growth + 10 clientes más
  → 15 × $15,000 = $225,000/mes

Mes 7-12: Consolidación + 20 clientes
  → 35 × $15,000 = $525,000/mes

Ingresos Año 1: ~$3,000,000
Costos (hosting, marketing): ~$500,000
Utilidad Neta: ~$2,500,000
```

### Escenario Optimista (Año 2):
```
100 clientes × $20,000/mes promedio
= $2,000,000/mes
= $24,000,000/año
```

---

## 🚀 Prioridades Inmediatas Recomendadas

1. **✅ Gestión de Pagos Mejorada** (1 semana)
   - Lo que más valor agrega al usuario actual
   - Crítico para uso diario

2. **✅ Setup Supabase + Migración** (1 semana)
   - Base para todo lo demás
   - Permite trabajo remoto

3. **✅ Sistema de Autenticación** (3 días)
   - Seguridad básica
   - Multi-usuario

4. **✅ Reportes PDF** (3 días)
   - Valor agregado importante
   - Facturación/contabilidad

---

## 📝 Notas de Desarrollo

### Estado Actual del Proyecto
- ✅ Dashboard funcional con KPIs
- ✅ Gráfico de ocupación (14 días)
- ✅ Sistema de configuración dinámica
- ✅ Gestión básica de reservas
- ✅ Exportar/Importar datos
- ✅ Filtros de búsqueda
- ✅ Comprobantes imprimibles
- ✅ Secciones colapsables en dashboard
- ✅ Gráfico por tipo de recurso

### Próximos Pasos Técnicos
1. Implementar historial de pagos múltiples
2. Mejorar sistema de búsqueda
3. Agregar reportes en PDF
4. Configurar Supabase
5. Migrar de localStorage a base de datos

---

**Última actualización:** 28 de Octubre, 2025
