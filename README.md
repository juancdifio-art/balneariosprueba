# 🏖️ Zeus Balneario - Sistema de Gestión

Sistema de gestión de alquileres para Zeus Balneario en Necochea, Argentina. Permite administrar el alquiler de sombrillas, carpas y plazas de estacionamiento durante la temporada de verano.

## 📋 Descripción

Zeus Balneario es un sistema web completo desarrollado con tecnologías vanilla (HTML5, CSS3, JavaScript ES6+) que permite gestionar de manera visual e intuitiva los alquileres de:

- **50 Sombrillas** (S1 a S50)
- **50 Carpas** (C1 a C50)
- **100 Plazas de Estacionamiento** (E1 a E100)

### Temporada

📅 **Del 1 de noviembre al 31 de marzo** (151 días)  
🔄 **Navegación por períodos de 20 días** para mejor visualización

### Características principales

✅ **Visualización tipo calendario**: Matriz visual que muestra cada unidad por día del período actual  
✅ **Navegación por períodos**: Avanza o retrocede entre períodos de 20 días para mejor manejo  
✅ **Sistema de colores diferenciados**: 10 colores distintos para identificar cada reserva visualmente  
✅ **Iniciales de clientes**: Cada celda ocupada muestra las iniciales del cliente  
✅ **Gestión completa de alquileres**: Crear, ver detalles, editar y cancelar alquileres  
✅ **Sistema de pagos**: Seguimiento de método de pago, estado y montos  
✅ **Tabla de reservas**: Lista completa con filtros y acciones rápidas  
✅ **Validaciones robustas**: Validación de datos de clientes, fechas y disponibilidad  
✅ **Persistencia local**: Almacenamiento en localStorage (no requiere servidor)  
✅ **Responsive design**: Funciona en desktop, tablet y móvil  
✅ **Interfaz moderna**: Diseño limpio con paleta de colores veraniega  

## 🚀 Instalación

### Requisitos previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere instalación de dependencias ni servidor

### Pasos de instalación

1. **Descargar o clonar el proyecto**:
   ```bash
   # Si tienes git instalado
   git clone <url-del-repositorio>
   
   # O descargar el ZIP y extraerlo
   ```

2. **Abrir el archivo HTML**:
   - Navega a la carpeta `src/`
   - Abre `index.html` con tu navegador preferido
   - También puedes hacer doble click en el archivo

3. **¡Listo!** El sistema está funcionando y listo para usar.

### Instalación opcional con servidor local

Si prefieres usar un servidor local:

```bash
# Con Python 3
cd src
python -m http.server 8000

# Con Node.js (npx)
cd src
npx serve

# Con PHP
cd src
php -S localhost:8000
```

Luego abre `http://localhost:8000` en tu navegador.

## 📁 Estructura del Proyecto

```
zeus-beach-resort/
├── src/
│   ├── index.html          # Página principal
│   ├── app.js              # Punto de entrada de la aplicación
│   ├── css/
│   │   └── styles.css      # Estilos completos del sistema
│   ├── js/
│   │   ├── storage.js      # Manejo de localStorage
│   │   ├── rentals.js      # Lógica de negocio
│   │   └── ui.js           # Manejo de la interfaz
│   └── types/
│       └── index.js        # Definiciones de tipos (JSDoc)
├── package.json            # Metadata del proyecto
├── agent.MD                # Especificaciones del proyecto
└── README.md               # Este archivo
```

### Descripción de archivos

- **`index.html`**: Estructura HTML principal con secciones para pestañas, estadísticas, leyenda y grilla
- **`app.js`**: Inicializa la aplicación, configura listeners y maneja el estado global
- **`storage.js`**: Funciones CRUD para localStorage (guardar, leer, eliminar alquileres)
- **`rentals.js`**: Lógica de negocio (validaciones, cálculos, disponibilidad)
- **`ui.js`**: Renderizado de UI, modales, grilla, notificaciones
- **`styles.css`**: Estilos completos con CSS Grid, Flexbox y responsive design
- **`types/index.js`**: Definiciones de tipos usando JSDoc para type checking

## 🎯 Cómo Usar el Sistema

### 1. Vista Principal

Al abrir la aplicación verás:
- **Pestañas superiores**: Sombrillas, Carpas, Estacionamiento
- **Resumen de disponibilidad**: Estadísticas del día actual
- **Leyenda de colores**: Para entender los estados
- **Grilla principal**: Calendario visual con todas las unidades y días

### 2. Crear un Nuevo Alquiler

1. Haz click en una celda **verde** (disponible) de la grilla
2. Se abrirá un selector de fechas
3. Selecciona la fecha final del alquiler
4. Haz click en "Continuar"
5. Completa el formulario con:
   - Nombre del cliente
   - Teléfono (10 dígitos)
   - DNI (7-8 dígitos)
   - Precio por día
6. Revisa el total calculado automáticamente
7. Haz click en "Confirmar Alquiler"

Las celdas se pintarán de **rojo** indicando que están ocupadas.

### 3. Ver Detalles de un Alquiler

1. Haz click en una celda **roja** (ocupada)
2. Se abrirá un modal con toda la información:
   - Datos del cliente
   - Unidad alquilada
   - Fechas del alquiler
   - Precio total

### 4. Cancelar un Alquiler

1. Abre los detalles del alquiler (click en celda roja)
2. Haz click en "❌ Cancelar Alquiler"
3. Confirma la acción
4. Las celdas volverán a estar **verdes** (disponibles)

### 5. Cambiar entre Tipos de Recursos

- Usa las pestañas superiores para cambiar entre Sombrillas, Carpas y Estacionamiento
- Cada tipo tiene su propia grilla independiente

## 🗓️ Temporada

El sistema está configurado para la temporada de verano:

- **Inicio**: 1 de Diciembre 2024
- **Fin**: 28 de Febrero 2025
- **Total**: 90 días

## 💾 Persistencia de Datos

Los datos se guardan automáticamente en **localStorage** del navegador:

- ✅ No se pierden al cerrar el navegador
- ✅ No requiere conexión a internet
- ✅ Cada navegador tiene su propia base de datos
- ⚠️ Si borras el caché del navegador, se pierden los datos
- ⚠️ Los datos no se comparten entre dispositivos

### Backup manual

Para hacer un backup de los datos:

1. Abre la consola del navegador (F12)
2. Ejecuta: `localStorage.getItem('zeus-rentals')`
3. Copia el texto y guárdalo en un archivo

Para restaurar:

1. Abre la consola
2. Ejecuta: `localStorage.setItem('zeus-rentals', 'TU_BACKUP_AQUI')`
3. Recarga la página

## 🎨 Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con CSS Grid y Flexbox
- **JavaScript ES6+**: Módulos, arrow functions, destructuring, etc.
- **localStorage**: Persistencia de datos en el navegador
- **Responsive Design**: Mobile-first approach

### Sin dependencias externas

- ✅ No usa jQuery
- ✅ No usa React, Vue ni Angular
- ✅ No requiere npm install
- ✅ No necesita compilación o build
- ✅ JavaScript vanilla puro

## 🎯 Validaciones Implementadas

El sistema valida automáticamente:

- ✅ Formato de teléfono (10 dígitos)
- ✅ Formato de DNI (7-8 dígitos)
- ✅ Fechas dentro de la temporada
- ✅ Fecha final posterior a fecha inicial
- ✅ Disponibilidad de la unidad (sin solapamientos)
- ✅ Campos obligatorios completados
- ✅ Precios positivos

## 📱 Responsive Design

El sistema se adapta a diferentes tamaños de pantalla:

- **Desktop** (>768px): Vista completa con grilla amplia
- **Tablet** (768px - 480px): Grilla con scroll horizontal
- **Mobile** (<480px): Interfaz optimizada para móvil

## 🔧 Configuración

### Modificar la temporada

Edita `src/types/index.js`:

```javascript
export const SEASON = {
  startDate: '2024-12-01',  // Cambiar aquí
  endDate: '2025-02-28',    // Cambiar aquí
  totalDays: 90             // Actualizar según corresponda
};
```

### Modificar cantidad de unidades

Edita `src/types/index.js`:

```javascript
export const UNIT_TYPES = {
  sombrilla: {
    total: 50,  // Cambiar cantidad aquí
    // ...
  },
  // ...
};
```

### Cambiar colores

Edita las variables CSS en `src/css/styles.css`:

```css
:root {
  --color-available: #4CAF50;   /* Verde */
  --color-occupied: #f44336;    /* Rojo */
  --color-selected: #FFC107;    /* Amarillo */
  /* ... más colores ... */
}
```

## 🐛 Solución de Problemas

### Los datos no se guardan

- Verifica que localStorage esté habilitado en tu navegador
- No uses modo incógnito/privado
- Verifica que no haya bloqueadores de cookies

### La grilla no se muestra correctamente

- Asegúrate de estar usando un navegador moderno actualizado
- Verifica que JavaScript esté habilitado
- Abre la consola (F12) y busca errores

### Errores al cargar módulos

- Asegúrate de abrir el archivo desde un servidor web (no `file://`)
- Usa alguno de los métodos de servidor local mencionados arriba

## 📊 Características Futuras (Nice to Have)

Ideas para expandir el sistema:

- [ ] Búsqueda de clientes por nombre/DNI
- [ ] Exportar reportes a CSV/PDF
- [ ] Sistema de usuarios y permisos
- [ ] Notificaciones de alquileres próximos a vencer
- [ ] Integración con sistema de pagos
- [ ] Backend con base de datos real
- [ ] Multi-idioma (español/inglés)
- [ ] Dashboard con estadísticas y gráficos
- [ ] Aplicación móvil nativa

## 👨‍💻 Desarrollo

### Debugging

Abre la consola del navegador (F12) para ver logs:

```javascript
// Objeto global disponible en consola
ZeusApp.getRentals()  // Ver todos los alquileres
```

### Estructura de datos

Los alquileres se guardan en este formato:

```javascript
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
}
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features:

- Abre un issue en GitHub
- Contacta al equipo de desarrollo

## 🏖️ Sobre Zeus Balneario

Zeus Balneario es un balneario ubicado en Necochea, Argentina, que ofrece servicios de playa de calidad para toda la familia durante la temporada de verano.

---

**Desarrollado con ❤️ para Zeus Balneario - Necochea, Argentina**

*Última actualización: Octubre 2024*
