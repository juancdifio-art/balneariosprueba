# 🎨 Guía de Estilos de Botones - Zeus Balneario

## 📋 Índice
1. [Botones Principales](#botones-principales)
2. [Botones de Modal](#botones-de-modal)
3. [Botones de Navegación](#botones-de-navegación)
4. [Botones de Tabla](#botones-de-tabla)
5. [Botones Especiales](#botones-especiales)
6. [Guía de Uso](#guía-de-uso)

---

## 1. Botones Principales

### 🔵 `.btn-primary` - Acción Principal
**Uso:** Acciones principales y confirmaciones

```html
<button class="btn btn-primary">Guardar</button>
<button class="btn btn-primary">Confirmar Alquiler</button>
```

**CSS:**
```css
.btn-primary {
  background: var(--color-primary);        /* #0288D1 - Azul */
  color: var(--text-light);                /* #FFFFFF - Blanco */
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #01579B;                     /* Azul más oscuro */
  box-shadow: var(--shadow-md);
}
```

---

### ⚪ `.btn-secondary` - Acción Secundaria
**Uso:** Acciones secundarias, cancelar

```html
<button class="btn btn-secondary">Cancelar</button>
<button class="btn btn-secondary">Cerrar</button>
```

**CSS:**
```css
.btn-secondary {
  background: var(--bg-secondary);         /* #F5F5F5 - Gris claro */
  color: var(--text-primary);              /* #212121 - Negro */
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--border-color);   /* #E0E0E0 */
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E0E0E0;                     /* Gris más oscuro */
}
```

---

### 🔴 `.btn-danger` - Acción Destructiva
**Uso:** Eliminar, cancelar reservas, acciones peligrosas

```html
<button class="btn btn-danger">❌ Eliminar</button>
<button class="btn btn-danger">Cancelar Reserva</button>
```

**CSS:**
```css
.btn-danger {
  background: #dc3545;                     /* Rojo */
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid #dc3545;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: #c82333;                     /* Rojo más oscuro */
  border-color: #bd2130;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}
```

---

### 💙 `.btn-info` - Información
**Uso:** Acciones informativas, ver detalles

```html
<button class="btn btn-info">ℹ️ Ver Detalles</button>
```

**CSS:**
```css
.btn-info {
  background: #00ACC1;                     /* Cyan */
  color: var(--text-light);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-info:hover {
  background: #0097A7;                     /* Cyan más oscuro */
  box-shadow: var(--shadow-md);
}
```

---

## 2. Botones de Modal

### ✖️ `.modal-close` - Botón Cerrar Modal
**Uso:** Cerrar ventanas modales (el ícono × en la esquina)

```html
<button class="modal-close" onclick="closeModal()">×</button>
```

**CSS:**
```css
.modal-close {
  background: none;
  border: none;
  color: var(--text-light);                /* #FFFFFF */
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);    /* Fondo semi-transparente */
}
```

**⚠️ IMPORTANTE:** Siempre usar `.modal-close` para el botón × de cerrar modal, NO `.close-button`

---

## 3. Botones de Navegación

### ⬅️➡️ `.btn-nav` - Navegación de Períodos
**Uso:** Navegar entre períodos, fechas, páginas

```html
<button class="btn-nav" onclick="previousPeriod()">← Anterior</button>
<button class="btn-nav" onclick="nextPeriod()">Siguiente →</button>
```

**CSS:**
```css
.btn-nav {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-weight: 600;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.btn-nav:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-nav:disabled {
  background: var(--border-color);
  cursor: not-allowed;
  opacity: 0.5;
}
```

---

### ℹ️ `.btn-action` - Botón de Acción Rápida
**Uso:** Información contextual, ayuda

```html
<button class="btn-action">
  ℹ️ Para crear un alquiler, haz click en una celda verde
</button>
```

**CSS:**
```css
.btn-action {
  background: linear-gradient(135deg, #FFA000, #FF6F00);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-lg);
  font-weight: 600;
  border-radius: 50px;
  cursor: help;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

## 4. Botones de Tabla

### 👁️ `.btn-table-view` - Ver Detalles
**Uso:** Ver detalles de una fila en tabla

```html
<button class="btn-table-view" onclick="viewRental(id)">👁️</button>
```

### 🔄 `.btn-table-move` - Mover/Modificar
**Uso:** Modificar o mover una reserva

```html
<button class="btn-table-move" onclick="moveRental(id)">🔄</button>
```

### 🗑️ `.btn-table-delete` - Eliminar
**Uso:** Eliminar una fila

```html
<button class="btn-table-delete" onclick="deleteRental(id)">🗑️</button>
```

**CSS Común:**
```css
.btn-table-view,
.btn-table-move,
.btn-table-delete {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: var(--spacing-xs);
  transition: transform 0.2s ease;
}

.btn-table-view:hover,
.btn-table-move:hover,
.btn-table-delete:hover {
  transform: scale(1.3);
}
```

---

## 5. Botones Especiales

### 💰 `.btn-pricing` - Gestionar Tarifas
**Uso:** Abrir gestión de precios

```html
<button class="btn-pricing" onclick="openPricingModal()">
  💰 Gestionar Tarifas
</button>
```

**CSS:**
```css
.btn-pricing {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  border-radius: var(--border-radius);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.btn-pricing:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

### ✅ `.btn-check` - Verificar
**Uso:** Revisar disponibilidad

```html
<button class="btn-check" onclick="checkAvailability()">
  ✅ Verificar Disponibilidad
</button>
```

**CSS:**
```css
.btn-check {
  background: linear-gradient(135deg, #00ACC1, #0097A7);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  border-radius: var(--border-radius);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.btn-check:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

### 🔄 `.btn-reconfigure` - Reconfigurar
**Uso:** Abrir asistente de configuración

```html
<button class="btn-reconfigure" onclick="openSetupModal()">
  ⚙️ Reconfigurar
</button>
```

**CSS:**
```css
.btn-reconfigure {
  background: linear-gradient(135deg, #FF6B6B, #EE5A6F);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
  transition: all 0.3s ease;
}

.btn-reconfigure:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}
```

---

### 📥📤 `.btn-export` / `.btn-import` - Importar/Exportar
**Uso:** Operaciones de backup

```html
<button class="btn-export" onclick="exportData()">📥 Exportar</button>
<button class="btn-import" onclick="importData()">📤 Importar</button>
```

**CSS:**
```css
.btn-export {
  background: #4CAF50;
  color: white;
  /* ... resto similar a btn-primary */
}

.btn-import {
  background: #2196F3;
  color: white;
  /* ... resto similar a btn-primary */
}
```

---

### 🧹 `.btn-clear-filters` - Limpiar Filtros
**Uso:** Resetear filtros de búsqueda

```html
<button class="btn-clear-filters" onclick="clearFilters()">
  🧹 Limpiar Filtros
</button>
```

**CSS:**
```css
.btn-clear-filters {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear-filters:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}
```

---

## 6. Guía de Uso

### ✅ Reglas Generales

1. **Usar clases semánticas:**
   - `.btn-primary` para acciones principales
   - `.btn-secondary` para acciones secundarias
   - `.btn-danger` para acciones destructivas

2. **Botón de cerrar modal:**
   ```html
   <!-- ✅ CORRECTO -->
   <button class="modal-close">×</button>
   
   <!-- ❌ INCORRECTO -->
   <button class="close-button">×</button>
   ```

3. **Estructura de modal:**
   ```html
   <div class="modal-overlay">
     <div class="modal">
       <div class="modal-header">
         <h3>Título</h3>
         <button class="modal-close">×</button>
       </div>
       <div class="modal-body">
         <!-- Contenido -->
       </div>
       <div class="modal-footer">
         <button class="btn btn-secondary">Cancelar</button>
         <button class="btn btn-primary">Guardar</button>
       </div>
     </div>
   </div>
   ```

4. **Combinación con emojis:**
   - Usa emojis para mejorar la UX visual
   - Coloca el emoji al inicio del texto
   ```html
   <button class="btn btn-primary">💾 Guardar</button>
   <button class="btn btn-danger">❌ Eliminar</button>
   <button class="btn btn-info">ℹ️ Ver Detalles</button>
   ```

5. **Estados deshabilitados:**
   ```html
   <button class="btn btn-primary" disabled>
     No disponible
   </button>
   ```

---

### 📦 Tamaños de Botones

**Agregar clase adicional si necesitas tamaños específicos:**

```css
/* Pequeño */
.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

/* Mediano (por defecto) */
.btn-md {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
}

/* Grande */
.btn-lg {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
}

/* Extra grande */
.btn-xl {
  padding: var(--spacing-xl) 2rem;
  font-size: 1.25rem;
}
```

**Ejemplo:**
```html
<button class="btn btn-primary btn-sm">Pequeño</button>
<button class="btn btn-primary">Mediano</button>
<button class="btn btn-primary btn-lg">Grande</button>
```

---

### 🎨 Variables CSS Usadas

```css
/* Colores */
--color-primary: #0288D1;
--color-primary-hover: #01579B;
--color-error: #F44336;
--text-light: #FFFFFF;
--text-primary: #212121;
--bg-secondary: #F5F5F5;
--border-color: #E0E0E0;

/* Espaciado */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

/* Tipografía */
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-md: 1.125rem;
--font-size-lg: 1.25rem;

/* Sombras */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
--shadow-md: 0 4px 8px rgba(0,0,0,0.15);
--shadow-lg: 0 8px 16px rgba(0,0,0,0.2);

/* Bordes */
--border-radius: 8px;
```

---

### 📝 Checklist para Crear un Botón Nuevo

- [ ] ¿Es una acción principal? → `.btn-primary`
- [ ] ¿Es cancelar/cerrar? → `.btn-secondary`
- [ ] ¿Es eliminar/destructivo? → `.btn-danger`
- [ ] ¿Es informativo? → `.btn-info`
- [ ] ¿Es cerrar modal? → `.modal-close`
- [ ] ¿Necesita emoji? → Añade al inicio del texto
- [ ] ¿Tiene hover effect? → Ya incluido en las clases
- [ ] ¿Necesita estado disabled? → Usa atributo `disabled`
- [ ] ¿Está en un modal footer? → Usa orden: secundario + primario

---

**Última actualización:** 30 de Octubre, 2025
**Versión:** 1.0
