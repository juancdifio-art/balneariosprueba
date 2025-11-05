/**
 * Generador de Gráficos SVG
 * Sin dependencias externas
 */

/**
 * Crear gráfico de barras de ocupación
 * @param {Array} data - Datos de ocupación
 * @param {string} containerId - ID del contenedor
 */
function renderOccupancyBarChart(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const width = container.clientWidth || 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 50, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const barWidth = chartWidth / data.length - 8;
  const maxPercentage = 100;
  
  let svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="occupancy-chart">
      <!-- Grid lines -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#e0e0e0" stroke-width="1"/>
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#e0e0e0" stroke-width="2"/>
      
      <!-- Y-axis labels -->
      <text x="${padding.left - 10}" y="${padding.top + 5}" text-anchor="end" font-size="12" fill="#666">100%</text>
      <text x="${padding.left - 10}" y="${padding.top + chartHeight / 2}" text-anchor="end" font-size="12" fill="#666">50%</text>
      <text x="${padding.left - 10}" y="${height - padding.bottom + 5}" text-anchor="end" font-size="12" fill="#666">0%</text>
      
      <!-- Bars -->
  `;
  
  data.forEach((item, index) => {
    const barHeight = (item.percentage / maxPercentage) * chartHeight;
    const x = padding.left + (index * (barWidth + 8)) + 4;
    const y = height - padding.bottom - barHeight;
    
    // Color basado en si es hoy, pasado o futuro
    let color = '#4CAF50'; // Verde por defecto
    let strokeColor = 'none';
    let strokeWidth = 0;
    
    if (item.isToday) {
      // HOY - Púrpura con borde grueso
      color = '#9C27B0';
      strokeColor = '#7B1FA2';
      strokeWidth = 3;
    } else if (item.isPast) {
      // PASADO - Colores según ocupación
      if (item.percentage >= 80) color = '#2196F3'; // Azul
      else if (item.percentage >= 60) color = '#4CAF50'; // Verde
      else if (item.percentage >= 30) color = '#FF9800'; // Naranja
      else color = '#f44336'; // Rojo
    } else {
      // FUTURO - Colores más claros
      if (item.percentage >= 80) color = '#64B5F6'; // Azul claro
      else if (item.percentage >= 60) color = '#81C784'; // Verde claro
      else if (item.percentage >= 30) color = '#FFB74D'; // Naranja claro
      else color = '#E57373'; // Rojo claro
    }
    
    svg += `
      <rect 
        x="${x}" 
        y="${y}" 
        width="${barWidth}" 
        height="${barHeight}" 
        fill="${color}"
        stroke="${strokeColor}"
        stroke-width="${strokeWidth}"
        rx="4"
        class="chart-bar"
        data-percentage="${item.percentage}"
      >
        <title>${item.dateLabel}: ${item.percentage}% (${item.occupied}/${item.total})</title>
      </rect>
      
      <!-- Percentage label on top of bar -->
      <text 
        x="${x + barWidth / 2}" 
        y="${y - 5}" 
        text-anchor="middle" 
        font-size="10" 
        font-weight="bold"
        fill="#333"
      >${item.percentage}%</text>
      
      <!-- Date label below bar -->
      <text 
        x="${x + barWidth / 2}" 
        y="${height - padding.bottom + 20}" 
        text-anchor="middle" 
        font-size="${item.isToday ? '12' : '10'}"
        font-weight="${item.isToday ? 'bold' : 'normal'}"
        fill="${item.isToday ? '#9C27B0' : '#666'}"
      >${item.dateLabel}</text>
    `;
  });
  
  svg += `
    </svg>
  `;
  
  container.innerHTML = svg;
}

/**
 * Crear gráfico de dona simple para un porcentaje
 * @param {number} percentage - Porcentaje (0-100)
 * @param {string} containerId - ID del contenedor
 * @param {string} color - Color del gráfico
 */
function renderDonutChart(percentage, containerId, color = '#2196F3') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-chart">
      <!-- Background circle -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="#e0e0e0"
        stroke-width="${strokeWidth}"
      />
      
      <!-- Progress circle -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
        transform="rotate(-90 ${size / 2} ${size / 2})"
        class="donut-progress"
      />
      
      <!-- Percentage text -->
      <text
        x="${size / 2}"
        y="${size / 2 + 8}"
        text-anchor="middle"
        font-size="24"
        font-weight="bold"
        fill="${color}"
      >${percentage}%</text>
    </svg>
  `;
  
  container.innerHTML = svg;
}

/**
 * Crear gráfico de barras agrupadas por tipo de recurso
 * @param {Array} data - Datos de ocupación por tipo
 * @param {string} containerId - ID del contenedor
 */
function renderOccupancyByTypeChart(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const width = container.clientWidth || 1200;
  const height = 350;
  const padding = { top: 20, right: 50, bottom: 60, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const types = Object.keys(data[0].types);
  const groupWidth = chartWidth / data.length;
  const groupSpacing = 15; // Espacio entre grupos
  const barSpacing = 2; // Espacio entre barras del mismo grupo
  const barWidth = (groupWidth - groupSpacing - (barSpacing * (types.length - 1))) / types.length;
  const maxPercentage = 100;
  
  // Colores fijos por tipo de recurso - Más saturados y vibrantes
  const typeColors = {
    'sombrilla': '#E74C3C',      // Rojo intenso
    'carpa': '#16A085',          // Verde azulado fuerte
    'sombrillon': '#3498DB',     // Azul brillante
    'estacionamiento': '#F39C12', // Naranja dorado fuerte
    'cabana': '#27AE60',         // Verde intenso
    'dormi': '#2980B9',          // Azul oscuro
    'habitacion': '#8E44AD',     // Púrpura intenso
    'pileta': '#00BCD4'          // Celeste especial
  };
  
  let svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="occupancy-chart">
      <!-- Grid lines -->
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#e0e0e0" stroke-width="1"/>
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#e0e0e0" stroke-width="2"/>
      
      <!-- Y-axis labels (izquierda) -->
      <text x="${padding.left - 10}" y="${padding.top + 5}" text-anchor="end" font-size="13" font-weight="500" fill="#1a1a1a">100%</text>
      <text x="${padding.left - 10}" y="${padding.top + chartHeight / 2}" text-anchor="end" font-size="13" font-weight="500" fill="#1a1a1a">50%</text>
      <text x="${padding.left - 10}" y="${height - padding.bottom + 5}" text-anchor="end" font-size="13" font-weight="500" fill="#1a1a1a">0%</text>
      
      <!-- Y-axis labels (derecha) -->
      <text x="${width - padding.right + 10}" y="${padding.top + 5}" text-anchor="start" font-size="13" font-weight="500" fill="#1a1a1a">100%</text>
      <text x="${width - padding.right + 10}" y="${padding.top + chartHeight / 2}" text-anchor="start" font-size="13" font-weight="500" fill="#1a1a1a">50%</text>
      <text x="${width - padding.right + 10}" y="${height - padding.bottom + 5}" text-anchor="start" font-size="13" font-weight="500" fill="#1a1a1a">0%</text>
      
      <!-- Bars -->
  `;
  
  data.forEach((day, dayIndex) => {
    const groupX = padding.left + (dayIndex * groupWidth) + (groupSpacing / 2);
    
    types.forEach((type, typeIndex) => {
      const typeData = day.types[type];
      if (!typeData || typeData.total === 0) return;
      
      const barHeight = (typeData.percentage / maxPercentage) * chartHeight;
      const x = groupX + (typeIndex * (barWidth + barSpacing));
      const y = height - padding.bottom - barHeight;
      
      let color = typeColors[type] || '#999';
      let opacity = 1;
      
      // Ajustar opacidad según pasado/hoy/futuro - Más visibles
      if (day.isToday) {
        opacity = 1;
      } else if (day.isPast) {
        opacity = 0.9;
      } else {
        opacity = 0.75;
      }
      
      svg += `
        <rect 
          x="${x}" 
          y="${y}" 
          width="${barWidth}" 
          height="${barHeight}" 
          fill="${color}"
          fill-opacity="${opacity}"
          stroke="${day.isToday ? '#000' : 'none'}"
          stroke-width="${day.isToday ? '2' : '0'}"
          rx="3"
          class="chart-bar"
        >
          <title>${typeData.icon} ${day.dateLabel}: ${typeData.percentage}% (${typeData.occupied}/${typeData.total})</title>
        </rect>
        
        ${barHeight > 20 ? `
          <text 
            x="${x + barWidth / 2}" 
            y="${y - 3}" 
            text-anchor="middle" 
            font-size="11" 
            font-weight="bold"
            fill="#1a1a1a"
          >${typeData.percentage}%</text>
        ` : ''}
      `;
    });
    
    // Date label
    svg += `
      <text 
        x="${groupX + groupWidth / 2}" 
        y="${height - padding.bottom + 20}" 
        text-anchor="middle" 
        font-size="${day.isToday ? '14' : '12'}"
        font-weight="${day.isToday ? 'bold' : 'normal'}"
        fill="${day.isToday ? '#000' : '#1a1a1a'}"
      >${day.dateLabel}</text>
    `;
  });
  
  // Leyenda con emojis en la parte inferior (con más espacio)
  svg += `<!-- Leyenda -->`;
  const legendY = height - padding.bottom + 50;
  const legendItemWidth = chartWidth / types.length;
  
  types.forEach((type, index) => {
    const typeData = data[0].types[type];
    if (!typeData || typeData.total === 0) return;
    
    const legendX = padding.left + (index * legendItemWidth) + legendItemWidth / 2;
    const color = typeColors[type] || '#999';
    const config = UNIT_TYPES[type];
    const typeName = config ? config.label : type;
    
    svg += `
      <rect
        x="${legendX - 15}"
        y="${legendY - 8}"
        width="10"
        height="10"
        fill="${color}"
        rx="2"
      />
      <text
        x="${legendX - 2}"
        y="${legendY}"
        font-size="16"
        text-anchor="start"
      >${typeData.icon}</text>
      <text
        x="${legendX + 18}"
        y="${legendY}"
        font-size="13"
        font-weight="500"
        text-anchor="start"
        fill="#1a1a1a"
      >${typeName}</text>
    `;
  });
  
  svg += `</svg>`;
  
  container.innerHTML = svg;
}
