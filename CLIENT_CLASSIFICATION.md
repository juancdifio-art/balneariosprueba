# 👥 Sistema de Clasificación de Clientes

## 📋 Descripción General

El sistema de clasificación de clientes de Zeus Balneario permite categorizar automáticamente a los clientes según su comportamiento de compra y fidelidad. Esta clasificación es **completamente configurable** desde la interfaz de usuario, sin necesidad de modificar código.

## 🎯 Categorías de Clientes

### 1. Cliente Regular (👤)
- **Descripción**: Clientes nuevos o con poca actividad
- **Criterio**: Por debajo de los umbrales de Cliente Frecuente
- **Beneficios**: Ninguno por defecto

### 2. Cliente Frecuente (⭐)
- **Descripción**: Clientes con actividad recurrente
- **Criterios Configurables**:
  - Número mínimo de reservas (default: 5)
  - Descuento aplicable (default: 5%)
- **Beneficios**: Descuento automático en reservas

### 3. Cliente VIP (👑)
- **Descripción**: Clientes de alto valor
- **Criterios Configurables**:
  - Número mínimo de reservas (default: 10) **O**
  - Gasto total mínimo (default: $300,000)
  - Descuento aplicable (default: 10%)
- **Beneficios**: Descuento premium automático

### 4. Lista Negra (🚫)
- **Descripción**: Clientes bloqueados
- **Criterio**: Marcado manual por el administrador
- **Efecto**: No pueden realizar nuevas reservas

## ⚙️ Configuración del Sistema

### Acceso a la Configuración

1. Ir a la vista **👥 Clientes**
2. Clic en **⚙️ Configurar Clasificación**
3. Ajustar los valores según necesidades del negocio
4. Guardar cambios

### Parámetros Configurables

#### Cliente Frecuente
- **Número mínimo de reservas**: Cantidad de reservas necesarias para alcanzar este nivel
- **Descuento (%)**: Porcentaje de descuento automático

#### Cliente VIP
- **Número mínimo de reservas**: Cantidad de reservas necesarias (criterio 1)
- **Gasto total mínimo**: Monto total gastado necesario (criterio 2 - alternativo)
- **Descuento (%)**: Porcentaje de descuento automático

> **Nota**: Para alcanzar el nivel VIP, el cliente debe cumplir **cualquiera** de los dos criterios (reservas O gasto total).

## 🔄 Reclasificación Automática

Cuando cambias la configuración, el sistema:

1. ✅ **Guarda los nuevos criterios** en localStorage
2. 🔄 **Reclasifica automáticamente** a todos los clientes existentes
3. 🛡️ **Preserva clientes en Lista Negra** (no son reclasificados)
4. 📊 **Actualiza las estadísticas** en tiempo real

## 💡 Casos de Uso Recomendados

### Temporada Alta
```
Cliente Frecuente: 8 reservas, 10% descuento
Cliente VIP: 15 reservas o $500,000, 15% descuento
```
Aumentas los requisitos para compensar la mayor demanda.

### Temporada Baja
```
Cliente Frecuente: 3 reservas, 5% descuento
Cliente VIP: 6 reservas o $150,000, 10% descuento
```
Reduces los umbrales para incentivar la fidelización.

### Estrategia Conservadora
```
Cliente Frecuente: 10 reservas, 3% descuento
Cliente VIP: 20 reservas o $800,000, 8% descuento
```
Premios más exclusivos para proteger márgenes.

### Estrategia Agresiva
```
Cliente Frecuente: 2 reservas, 8% descuento
Cliente VIP: 5 reservas o $100,000, 15% descuento
```
Incentivos fuertes para acelerar la fidelización.

## 🔍 Visualización en la Interfaz

### Vista de Clientes
- Las tarjetas de estadísticas muestran:
  - Cantidad de clientes en cada categoría
  - Descuento actual configurado (tooltip)
  - Criterios para alcanzar cada nivel (tooltip)

### Lista de Clientes
- Cada cliente muestra su categoría con badge visual:
  - 👤 Regular (gris)
  - ⭐ Frecuente (amarillo)
  - 👑 VIP (dorado)
  - 🚫 Lista Negra (rojo)

### Perfil de Cliente
- Muestra:
  - Categoría actual
  - Progreso hacia siguiente nivel
  - Historial de reservas
  - Total gastado

## 📱 Implementación Técnica

### Archivos Modificados
- `src/js/config.js`: Funciones de configuración
- `src/js/clients.js`: Lógica de clasificación automática
- `src/js/ui.js`: Interfaz de configuración
- `src/css/styles.css`: Estilos del modal

### Funciones Principales

#### `getClientClassificationConfig()`
Obtiene la configuración actual. Si no existe, devuelve valores por defecto.

#### `saveClientClassificationConfig(config)`
Guarda nueva configuración y reclasifica clientes.

#### `reclassifyAllClients()`
Reclasifica todos los clientes según nueva configuración.

#### `updateClientStats(clientId, amount, reservationDate)`
Actualiza estadísticas y clasificación tras cada reserva.

### Estructura de Datos

```javascript
// Configuración en localStorage
{
  clientClassification: {
    frequentMinReservations: 5,
    frequentDiscount: 5,
    vipMinReservations: 10,
    vipMinSpending: 300000,
    vipDiscount: 10
  }
}

// Cliente en localStorage
{
  id: "uuid",
  fullName: "Juan Pérez",
  clientType: "frecuente", // regular | frecuente | vip | blacklist
  totalReservations: 7,
  totalSpent: 245000,
  // ...otros campos
}
```

## 🚀 Próximas Mejoras (Futuras)

1. **Aplicación Automática de Descuentos**: Los descuentos se aplican automáticamente al momento de crear una reserva
2. **Notificaciones de Nivel**: Alertas cuando un cliente sube de categoría
3. **Análisis de Tendencias**: Dashboard con evolución de clasificaciones
4. **Sistema de Puntos**: Alternativa a las categorías fijas
5. **Configuración por Temporada**: Guardar múltiples configuraciones y alternarlas
6. **Exportación de Reportes**: Informes detallados por categoría de cliente

## ✅ Validaciones del Sistema

- ❌ No permite que VIP tenga menos reservas que Frecuente
- ✅ Reclasifica automáticamente al guardar
- ✅ Preserva clientes en Lista Negra
- ✅ Persiste configuración en localStorage
- ✅ Muestra valores actuales al abrir configuración

## 📞 Soporte

Para dudas o sugerencias sobre el sistema de clasificación, consulta la documentación principal del proyecto o contacta al equipo de desarrollo.

---

**Última actualización**: Implementación inicial - Sistema totalmente configurable desde UI
