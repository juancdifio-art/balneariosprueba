/**
 * Generador de Gráficos SVG
 * Sin dependencias externas
 */

/**
 * Crear gráfico de barras de ocupación mejorado
 * @param {Array} data - Datos de ocupación
 * @param {string} containerId - ID del contenedor
 */
function renderOccupancyBarChart(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const width = container.clientWidth || 800;
  const height = 350;
  const padding = { top: 30, right: 30, bottom: 60, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const barWidth = Math.max(40, (chartWidth / data.length) - 12);
  const maxPercentage = 100;
  
  let svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="occupancy-chart">
        <defs>
            <!-- Gradientes modernos -->
            <linearGradient id="gradient-today" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6"/>
                <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
            <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#06b6d4"/>
                <stop offset="100%" stop-color="#0891b2"/>
            </linearGradient>
            <linearGradient id="gradient-good" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#10b981"/>
                <stop offset="100%" stop-color="#059669"/>
            </linearGradient>
            <linearGradient id="gradient-medium" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#d97706"/>
            </linearGradient>
            <linearGradient id="gradient-low" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ef4444"/>
                <stop offset="100%" stop-color="#dc2626"/>
            </linearGradient>
            
            <!-- Filtros para efectos -->
            <filter id="shadow-chart" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/>
            </filter>
            <filter id="glow-chart" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        <!-- Fondo con patrón sutil -->
        <rect x="${padding.left}" y="${padding.top}" width="${chartWidth}" height="${chartHeight}" 
              fill="rgba(59, 130, 246, 0.05)" rx="8"/>
        
        <!-- Grid lines horizontales más elegantes -->
        <g stroke="#e2e8f0" stroke-width="1" opacity="0.7">
            <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}"/>
            <line x1="${padding.left}" y1="${padding.top + chartHeight/4}" x2="${width - padding.right}" y2="${padding.top + chartHeight/4}"/>
            <line x1="${padding.left}" y1="${padding.top + chartHeight/2}" x2="${width - padding.right}" y2="${padding.top + chartHeight/2}"/>
            <line x1="${padding.left}" y1="${padding.top + 3*chartHeight/4}" x2="${width - padding.right}" y2="${padding.top + 3*chartHeight/4}"/>
            <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke-width="2"/>
        </g>
        
        <!-- Eje Y mejorado -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" 
              stroke="#64748b" stroke-width="2"/>
        
        <!-- Etiquetas Y-axis con mejor tipografía -->
        <text x="${padding.left - 15}" y="${padding.top + 5}" text-anchor="end" font-size="13" font-weight="600" fill="#475569">100%</text>
        <text x="${padding.left - 15}" y="${padding.top + chartHeight/4 + 5}" text-anchor="end" font-size="12" fill="#64748b">75%</text>
        <text x="${padding.left - 15}" y="${padding.top + chartHeight/2 + 5}" text-anchor="end" font-size="12" fill="#64748b">50%</text>
        <text x="${padding.left - 15}" y="${padding.top + 3*chartHeight/4 + 5}" text-anchor="end" font-size="12" fill="#64748b">25%</text>
        <text x="${padding.left - 15}" y="${height - padding.bottom + 5}" text-anchor="end" font-size="13" font-weight="600" fill="#475569">0%</text>
        
        <!-- Barras con efectos -->
  `;
  
  data.forEach((item, index) => {
    const barHeight = Math.max(4, (item.percentage / maxPercentage) * chartHeight);
    const x = padding.left + (index * (barWidth + 12)) + 6;
    const y = height - padding.bottom - barHeight;
    
    // Seleccionar gradiente y efectos
    let fillColor;
    let filter = 'filter="url(#shadow-chart)"';
    
    if (item.isToday) {
      fillColor = 'url(#gradient-today)';
      filter = 'filter="url(#glow-chart)"';
    } else if (item.percentage >= 80) {
      fillColor = 'url(#gradient-excellent)';
    } else if (item.percentage >= 60) {
      fillColor = 'url(#gradient-good)';
    } else if (item.percentage >= 30) {
      fillColor = 'url(#gradient-medium)';
    } else {
      fillColor = 'url(#gradient-low)';
    }
    
    svg += `
        <!-- Barra principal con efectos -->
        <rect 
            x="${x}" 
            y="${y}" 
            width="${barWidth}" 
            height="${barHeight}" 
            fill="${fillColor}"
            rx="6"
            ry="6"
            class="chart-bar"
            ${filter}
            data-percentage="${item.percentage}"
            style="cursor: pointer; transition: all 0.3s ease;"
        >
            <title>${item.dateLabel}: ${item.percentage}% (${item.occupied}/${item.total})</title>
        </rect>
        
        <!-- Highlight en la parte superior -->
        <rect 
            x="${x + 2}" 
            y="${y + 2}" 
            width="${barWidth - 4}" 
            height="8" 
            fill="rgba(255,255,255,0.4)"
            rx="4"
        />
        
        <!-- Etiqueta de porcentaje con mejor estilo -->
        <text 
            x="${x + barWidth / 2}" 
            y="${y - 8}" 
            text-anchor="middle" 
            font-size="11" 
            font-weight="700"
            fill="${item.isToday ? '#7c3aed' : '#374151'}"
        >${item.percentage}%</text>
        
        <!-- Etiqueta de fecha con énfasis en "hoy" -->
        <text 
            x="${x + barWidth / 2}" 
            y="${height - padding.bottom + 20}" 
            text-anchor="middle" 
            font-size="${item.isToday ? '13' : '11'}"
            font-weight="${item.isToday ? '700' : '500'}"
            fill="${item.isToday ? '#7c3aed' : '#64748b'}"
        >${item.dateLabel}</text>
        
        ${item.isToday ? `
        <!-- Indicador especial para hoy -->
        <circle 
            cx="${x + barWidth / 2}" 
            cy="${height - padding.bottom + 35}" 
            r="4" 
            fill="#7c3aed"
            filter="url(#glow-chart)"
        />
        ` : ''}
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
  
  // Colores fijos por tipo de recurso - Balnearios de playa
  const typeColors = {
    'sombrilla': '#E74C3C',      // Rojo intenso - Recurso principal
    'carpa': '#16A085',          // Verde azulado fuerte - Familias
    'estacionamiento': '#F39C12', // Naranja dorado fuerte - Servicio esencial
    'pileta': '#00BCD4'          // Celeste especial - Alternativa a playa
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
