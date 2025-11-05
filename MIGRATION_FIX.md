# 🔧 Fix para Migración de Pagos

## Problema
Los pagos iniciales (`amountPaid`) del sistema antiguo no aparecen en el nuevo sistema de gestión de pagos.

## Solución Rápida

### Opción 1: Ejecutar desde la Consola del Navegador

1. Abre la aplicación en el navegador
2. Presiona `F12` para abrir las DevTools
3. Ve a la pestaña **Console**
4. Copia y pega este código:

```javascript
// Forzar re-migración de pagos
console.log('🔄 Iniciando migración forzada...');
localStorage.removeItem('zeus-payments-migrated');

const rentals = getRentals();
let payments = getAllPayments();
let migratedCount = 0;

rentals.forEach(rental => {
  const existingPayments = payments.filter(p => p.rentalId === rental.id);
  
  if (rental.amountPaid && rental.amountPaid > 0 && existingPayments.length === 0) {
    const payment = {
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      rentalId: rental.id,
      amount: rental.amountPaid,
      paymentMethod: rental.paymentMethod || 'efectivo',
      paymentDate: rental.startDate,
      notes: 'Pago inicial (migrado)',
      createdAt: rental.createdAt || new Date().toISOString()
    };
    payments.push(payment);
    migratedCount++;
    console.log(`  ✓ Migrado: ${rental.clientName} - $${rental.amountPaid}`);
  }
});

if (migratedCount > 0) {
  localStorage.setItem('zeus-payments', JSON.stringify(payments));
  console.log(`✅ Migrados ${migratedCount} pagos`);
  console.log('🔄 Recarga la página (F5) para ver los cambios');
} else {
  console.log('✅ No hay pagos para migrar');
}

localStorage.setItem('zeus-payments-migrated', 'true');
```

5. Presiona `Enter`
6. Deberías ver los mensajes de migración
7. **Recarga la página** (F5)
8. Abre cualquier reserva → "💰 Gestionar Pagos" → Deberías ver el pago inicial

---

### Opción 2: Función Simplificada (si la anterior ya se ejecutó)

Si ya ejecutaste el código anterior pero aún no funciona, ejecuta:

```javascript
forceMigratePayments();
location.reload();
```

---

### Opción 3: Migración Manual Individual

Si solo necesitas migrar UNA reserva específica:

```javascript
// 1. Primero encuentra el ID de la reserva
const rentals = getRentals();
rentals.forEach((r, i) => {
  console.log(`${i}: ${r.clientName} - ID: ${r.id} - Pagado: $${r.amountPaid || 0}`);
});

// 2. Copia el ID de la reserva que quieres migrar
const rentalId = 'PEGA_EL_ID_AQUI'; // Ej: 'rental-1234567890-abc123'

// 3. Ejecuta la migración para esa reserva
const rental = rentals.find(r => r.id === rentalId);
if (rental && rental.amountPaid > 0) {
  const payments = getAllPayments();
  const payment = {
    id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    rentalId: rental.id,
    amount: rental.amountPaid,
    paymentMethod: rental.paymentMethod || 'efectivo',
    paymentDate: rental.startDate,
    notes: 'Pago inicial',
    createdAt: new Date().toISOString()
  };
  payments.push(payment);
  localStorage.setItem('zeus-payments', JSON.stringify(payments));
  console.log('✅ Pago migrado, recarga la página');
  location.reload();
}
```

---

## Verificación

Para verificar que los pagos se migraron correctamente:

```javascript
// Ver todas las reservas y sus pagos
const rentals = getRentals();
rentals.forEach(rental => {
  const paidAmount = calculatePaidAmount(rental.id);
  const pending = calculatePendingAmount(rental.id);
  console.log(`${rental.clientName}:`, {
    total: rental.totalPrice,
    pagado: paidAmount,
    pendiente: pending,
    pagosRegistrados: getPaymentsByRental(rental.id).length
  });
});
```

---

## Prevención Futura

Este problema ya está solucionado en el código. Para nuevas instalaciones:
- ✅ La migración se ejecuta automáticamente al cargar la app
- ✅ Solo se ejecuta una vez
- ✅ No crea duplicados
- ✅ **NUEVO:** Al crear una reserva, el pago inicial se registra automáticamente en el nuevo sistema
- ✅ **NUEVO:** Ya no se usa `rental.amountPaid`, solo el sistema de pagos múltiples

---

## Cambios Implementados (v2)

### 1. Migración Automática Mejorada
- ✅ Detecta pagos antiguos y los convierte
- ✅ Incluye método de pago del rental original
- ✅ Logs detallados para debugging

### 2. Integración en createRental()
**Archivo:** `js/rentals.js`

Ahora cuando se crea una reserva:
```javascript
// Si hay un pago inicial, registrarlo en el nuevo sistema de pagos
if (cleanData.amountPaid > 0 && typeof addPayment === 'function') {
  const paymentData = {
    amount: cleanData.amountPaid,
    paymentMethod: cleanData.paymentMethod || 'efectivo',
    paymentDate: cleanData.startDate,
    notes: 'Pago inicial al crear la reserva'
  };
  
  const payment = addPayment(savedRental.id, paymentData);
}
```

**Resultado:** El pago inicial se registra automáticamente en el sistema de pagos múltiples.

---

## Notas Técnicas

**¿Por qué pasó esto?**
1. El sistema antiguo guardaba un solo pago en `rental.amountPaid`
2. El nuevo sistema guarda pagos en una colección separada `zeus-payments`
3. La migración automática tiene un flag `zeus-payments-migrated` que se activa una vez
4. Si el flag ya estaba activado (de pruebas anteriores) pero no había pagos, no migraba

**Solución implementada:**
- Mejorada la lógica de detección de pagos existentes
- Agregada función `forceMigratePayments()` para casos edge
- Logs mejorados para debugging

---

*Última actualización: 28 de Octubre, 2025*
