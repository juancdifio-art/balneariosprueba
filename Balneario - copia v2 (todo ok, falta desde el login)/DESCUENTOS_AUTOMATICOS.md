# 💰 Sistema de Descuentos Automáticos

## 📋 Descripción

El sistema aplica automáticamente descuentos en las reservas según la clasificación del cliente (VIP o Frecuente). Los descuentos se calculan en tiempo real al momento de crear la reserva.

## 🎯 Cómo Funciona

### 1. Clasificación del Cliente

Los clientes se clasifican automáticamente según:

- **Cliente Regular** (👤): 0-4 reservas (configurable)
  - Sin descuento

- **Cliente Frecuente** (⭐): 5+ reservas (configurable)
  - Descuento: 5% (configurable)

- **Cliente VIP** (👑): 10+ reservas O $300,000+ gastados (configurable)
  - Descuento: 10% (configurable)

### 2. Aplicación del Descuento

Cuando creas una nueva reserva:

1. **Seleccionas el cliente** (con búsqueda/autocomplete)
2. **Ingresas el precio por día** (precio base)
3. **El sistema calcula automáticamente**:
   - Subtotal (precio base × días)
   - Descuento aplicable según clasificación
   - Total final a pagar

### 3. Visualización en el Formulario

```
┌─────────────────────────────────────┐
│ 💰 Información de Pago              │
├─────────────────────────────────────┤
│ Precio base por día: $5,000         │
│                                     │
│ 👑 Cliente VIP                      │
│ Descuento aplicado automáticamente  │
│                                     │
│ Subtotal:        $30,000            │
│ 🎁 Descuento (10%): -$3,000        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Total a pagar:   $27,000            │
└─────────────────────────────────────┘
```

## 🔧 Configuración de Descuentos

### Cambiar Porcentajes y Umbrales

1. Ve a **👥 Clientes**
2. Clic en **⚙️ Configurar Clasificación**
3. Ajusta los valores:
   - Reservas mínimas para Frecuente
   - % Descuento para Frecuente
   - Reservas mínimas para VIP
   - Gasto mínimo para VIP
   - % Descuento para VIP
4. **Guardar** → Todos los clientes se reclasifican automáticamente

### Ejemplo de Configuración Personalizada

**Temporada Alta** (más restrictivo):
```
Frecuente: 8 reservas → 3% descuento
VIP: 15 reservas o $500,000 → 8% descuento
```

**Temporada Baja** (más permisivo):
```
Frecuente: 3 reservas → 8% descuento
VIP: 6 reservas o $150,000 → 15% descuento
```

## 💡 Ejemplos de Uso

### Caso 1: Cliente Nuevo (Regular)

- **Cliente**: Juan Pérez (0 reservas anteriores)
- **Días**: 5 días
- **Precio base**: $4,000/día
- **Cálculo**:
  - Subtotal: $20,000
  - Descuento: $0 (0%)
  - **Total: $20,000**

### Caso 2: Cliente Frecuente

- **Cliente**: María García (7 reservas anteriores)
- **Días**: 6 días
- **Precio base**: $5,000/día
- **Cálculo**:
  - Subtotal: $30,000
  - Descuento: $1,500 (5%)
  - **Total: $28,500**

### Caso 3: Cliente VIP

- **Cliente**: Carlos López (15 reservas anteriores)
- **Días**: 4 días
- **Precio base**: $6,000/día
- **Cálculo**:
  - Subtotal: $24,000
  - Descuento: $2,400 (10%)
  - **Total: $21,600**

### Caso 4: Cliente VIP por Gasto

- **Cliente**: Ana Martínez (8 reservas, $350,000 gastados)
- **Días**: 3 días
- **Precio base**: $5,500/día
- **Cálculo**:
  - Subtotal: $16,500
  - Descuento: $1,650 (10%)
  - **Total: $14,850**

## 📊 Registro de Descuentos

Cada reserva guarda:

```javascript
{
  id: "uuid",
  clientId: "client-uuid",
  clientName: "Juan Pérez",
  pricePerDay: 5000,
  basePrice: 30000,          // Precio sin descuento
  discount: 3000,             // Monto descontado
  discountPercentage: 10,     // % aplicado
  totalPrice: 27000,          // Precio final
  // ... otros campos
}
```

## 🔍 Verificación del Descuento

### En el Historial del Cliente

1. Ve a **👥 Clientes**
2. Busca el cliente
3. Clic en su nombre para ver perfil
4. **Historial de Reservas** muestra:
   - Precio base
   - Descuento aplicado
   - Total pagado

### En la Vista de Reserva

Al ver el detalle de una reserva existente:
- Se muestra el precio total (ya con descuento aplicado)
- El cliente mantiene su clasificación actual
- Si editas la reserva, se recalcula con la clasificación actual

## 🎁 Beneficios del Sistema

### Para el Negocio

✅ **Fidelización Automática**: Incentiva a los clientes a regresar
✅ **Gestión Simplificada**: No necesitas calcular descuentos manualmente
✅ **Flexibilidad**: Cambia los criterios según la temporada
✅ **Transparencia**: Los clientes ven claramente su beneficio

### Para los Clientes

✅ **Recompensa por Fidelidad**: Más visitas = mejores precios
✅ **Descuento Automático**: No necesitan pedir descuentos
✅ **Progresión Clara**: Saben cuánto falta para el siguiente nivel
✅ **Precio Justo**: Los clientes frecuentes pagan menos

## 🚀 Próximas Mejoras

- [ ] Notificar al cliente cuando sube de nivel
- [ ] Mostrar progreso hacia siguiente nivel en el perfil
- [ ] Dashboard con estadísticas de descuentos otorgados
- [ ] Reportes de impacto de descuentos en ingresos
- [ ] Límite de descuento por temporada
- [ ] Descuentos temporales o promocionales adicionales

## ⚠️ Notas Importantes

1. **Los descuentos se aplican sobre el precio base**, no son acumulativos
2. **La clasificación se actualiza tras cada reserva**, el descuento se aplica con la clasificación al momento de crear la reserva
3. **Los clientes en Lista Negra no reciben descuentos** (no pueden hacer reservas)
4. **Los descuentos no se aplican retroactivamente** a reservas anteriores

## 📞 Preguntas Frecuentes

### ¿Los descuentos se aplican automáticamente?
Sí, al seleccionar un cliente VIP o Frecuente en el formulario de reserva, el descuento se calcula y aplica automáticamente.

### ¿Puedo cambiar el descuento de un cliente específico?
No individualmente, los descuentos se aplican según la configuración global. Pero puedes ajustar el precio manualmente en cada reserva si lo necesitas.

### ¿Qué pasa si cambio la configuración de descuentos?
Los nuevos porcentajes se aplican a las nuevas reservas. Las reservas existentes mantienen el precio que tenían.

### ¿Un cliente puede perder su clasificación VIP?
No, una vez alcanzado un nivel, el cliente lo mantiene. La clasificación solo sube, nunca baja.

### ¿Cómo afectan los descuentos a las estadísticas del cliente?
El sistema registra:
- `totalSpent`: Suma de todos los totales finales (con descuento)
- Cada reserva guarda el precio base y el descuento aplicado

---

**Última actualización**: Implementación del sistema de descuentos automáticos
