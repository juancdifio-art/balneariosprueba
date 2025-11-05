/**
 * ZEUS BALNEARIO - OPTIMIZACIONES DE PERFORMANCE
 * Sistema de renderizado virtual para grillas grandes
 * ==============================================
 */

/**
 * Configuración de virtualización
 */
const VIRTUALIZATION_CONFIG = {
  // Número de filas extras a renderizar fuera del viewport (buffer)
  bufferSize: 8, // Más buffer para scroll más suave
  // Altura estimada de cada fila en pixels
  estimatedRowHeight: 60,
  // Número de columnas por fila
  columnsPerRow: 10,
  // Mínimo de elementos antes de activar virtualización
  minElementsForVirtualization: 150, // Aumentar threshold
  // Configuración de scroll suave
  smoothScrolling: true,
  scrollSensitivity: 0.3 // Reducir sensibilidad del scroll
};

/**
 * Cache para elementos DOM reutilizables
 */
class DOMElementCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 200;
  }

  /**
   * Obtener elemento del cache o crear uno nuevo
   */
  getElement(type, config) {
    const cacheKey = `${type}_${config.id || 'default'}`;
    
    if (this.cache.has(cacheKey)) {
      const element = this.cache.get(cacheKey);
      // Remover del cache y devolver
      this.cache.delete(cacheKey);
      return element;
    }

    // Crear nuevo elemento si no está en cache
    return this.createElement(type, config);
  }

  /**
   * Devolver elemento al cache para reutilización
   */
  returnElement(element, type, config) {
    if (this.cache.size >= this.maxCacheSize) {
      // Limpiar elementos más antiguos si el cache está lleno
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const cacheKey = `${type}_${config.id || 'default'}`;
    
    // Limpiar contenido y eventos antes de guardar en cache
    this.cleanElement(element);
    this.cache.set(cacheKey, element);
  }

  /**
   * Crear nuevo elemento DOM
   */
  createElement(type, config) {
    const element = document.createElement('div');
    element.className = `unit-card ${type}-unit`;
    element.dataset.unitType = type;
    return element;
  }

  /**
   * Limpiar elemento para reutilización
   */
  cleanElement(element) {
    // Remover event listeners clonando el elemento
    const cleaned = element.cloneNode(false);
    element.parentNode?.replaceChild(cleaned, element);
    return cleaned;
  }

  /**
   * Limpiar todo el cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Sistema de renderizado virtual para grillas grandes
 */
class VirtualGridRenderer {
  constructor(containerSelector, config = {}) {
    this.container = document.querySelector(containerSelector);
    this.config = { ...VIRTUALIZATION_CONFIG, ...config };
    this.elementCache = new DOMElementCache();
    
    // Estado de renderizado
    this.totalItems = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.scrollTop = 0;
    
    // Elementos DOM
    this.scrollContainer = null;
    this.viewport = null;
    this.spacerTop = null;
    this.spacerBottom = null;
    
    // Data y configuración
    this.items = [];
    this.itemRenderer = null;
    
    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = 0;
    
    this.init();
  }

  /**
   * Inicializar el renderizador virtual
   */
  init() {
    if (!this.container) {
      console.error('❌ Contenedor no encontrado para virtualización');
      return;
    }

    this.createVirtualStructure();
    this.attachScrollListeners();
    
    console.log('🚀 Renderizado virtual inicializado');
  }

  /**
   * Crear estructura DOM para virtualización
   */
  createVirtualStructure() {
    this.container.innerHTML = `
      <div class="virtual-scroll-container" style="
        height: 600px; 
        overflow-y: auto; 
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: #999 #f1f1f1;
      ">
        <div class="virtual-spacer-top" style="height: 0px;"></div>
        <div class="virtual-viewport"></div>
        <div class="virtual-spacer-bottom" style="height: 0px;"></div>
        
        <!-- Controles de navegación -->
        <div class="scroll-controls" style="
          position: absolute;
          right: 20px;
          top: 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          z-index: 100;
        ">
          <button class="scroll-btn scroll-up" style="
            background: rgba(255,255,255,0.9);
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 12px;
          ">▲</button>
          <button class="scroll-btn scroll-down" style="
            background: rgba(255,255,255,0.9);
            border: 1px solid #ddd;
            border-radius: 3px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 12px;
          ">▼</button>
        </div>
      </div>
      <div class="performance-stats" style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 1000;">
        <div>Elementos renderizados: <span id="rendered-count">0</span></div>
        <div>Tiempo de render: <span id="render-time">0</span>ms</div>
        <div>Rango visible: <span id="visible-range">0-0</span></div>
        <div>Scroll suave: <input type="checkbox" id="smooth-scroll-toggle" checked> ON</div>
      </div>
    `;

    this.scrollContainer = this.container.querySelector('.virtual-scroll-container');
    this.viewport = this.container.querySelector('.virtual-viewport');
    this.spacerTop = this.container.querySelector('.virtual-spacer-top');
    this.spacerBottom = this.container.querySelector('.virtual-spacer-bottom');
    
    // Configurar controles de navegación
    this.setupNavigationControls();
  }

  /**
   * Configurar datos y función de renderizado
   */
  setData(items, itemRenderer) {
    this.items = items;
    this.itemRenderer = itemRenderer;
    this.totalItems = items.length;
    
    // Decidir si usar virtualización
    if (this.totalItems < this.config.minElementsForVirtualization) {
      console.log(`📊 ${this.totalItems} elementos - Renderizado normal`);
      this.renderAll();
    } else {
      console.log(`📊 ${this.totalItems} elementos - Renderizado virtual activado`);
      this.calculateDimensions();
      this.renderVirtual();
    }
  }

  /**
   * Calcular dimensiones para virtualización
   */
  calculateDimensions() {
    const itemsPerRow = this.config.columnsPerRow;
    const totalRows = Math.ceil(this.totalItems / itemsPerRow);
    const totalHeight = totalRows * this.config.estimatedRowHeight;
    
    // Configurar altura total del scroll
    const totalHeightPx = totalHeight + 'px';
    this.spacerTop.style.height = '0px';
    this.spacerBottom.style.height = totalHeightPx;
  }

  /**
   * Renderizar todos los elementos (modo sin virtualización)
   */
  renderAll() {
    const startTime = performance.now();
    
    this.viewport.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'units-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.config.columnsPerRow}, 1fr);
      gap: 10px;
    `;
    
    this.items.forEach((item, index) => {
      const element = this.itemRenderer(item, index);
      grid.appendChild(element);
    });
    
    this.viewport.appendChild(grid);
    
    const endTime = performance.now();
    this.updatePerformanceStats(this.totalItems, endTime - startTime, '0-' + this.totalItems);
  }

  /**
   * Renderizado virtual (solo elementos visibles)
   */
  renderVirtual() {
    const startTime = performance.now();
    
    const containerHeight = this.scrollContainer.clientHeight;
    const scrollTop = this.scrollContainer.scrollTop;
    
    // Calcular rango visible
    const itemsPerRow = this.config.columnsPerRow;
    const rowHeight = this.config.estimatedRowHeight;
    
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);
    
    // Agregar buffer
    const bufferStart = Math.max(0, startRow - this.config.bufferSize);
    const bufferEnd = Math.min(Math.ceil(this.totalItems / itemsPerRow), endRow + this.config.bufferSize);
    
    const startIndex = bufferStart * itemsPerRow;
    const endIndex = Math.min(this.totalItems, bufferEnd * itemsPerRow);
    
    // Actualizar spacers
    this.spacerTop.style.height = (bufferStart * rowHeight) + 'px';
    const remainingRows = Math.ceil(this.totalItems / itemsPerRow) - bufferEnd;
    this.spacerBottom.style.height = (remainingRows * rowHeight) + 'px';
    
    // Renderizar solo elementos visibles
    this.viewport.innerHTML = '';
    
    const grid = document.createElement('div');
    grid.className = 'units-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.config.columnsPerRow}, 1fr);
      gap: 10px;
    `;
    
    for (let i = startIndex; i < endIndex; i++) {
      if (this.items[i]) {
        const element = this.itemRenderer(this.items[i], i);
        grid.appendChild(element);
      }
    }
    
    this.viewport.appendChild(grid);
    
    const endTime = performance.now();
    const visibleCount = endIndex - startIndex;
    this.updatePerformanceStats(visibleCount, endTime - startTime, `${startIndex}-${endIndex}`);
    
    this.renderCount++;
  }

  /**
   * Configurar listeners de scroll con throttling mejorado
   */
  attachScrollListeners() {
    let scrollTimeout;
    let isScrolling = false;
    
    // Scroll más suave y controlado
    this.scrollContainer.addEventListener('scroll', (e) => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Reducir la velocidad de scroll si es muy rápida
      if (!isScrolling) {
        isScrolling = true;
        
        // Throttling más agresivo para scroll suave
        scrollTimeout = setTimeout(() => {
          if (this.totalItems >= this.config.minElementsForVirtualization) {
            this.renderVirtual();
          }
          isScrolling = false;
        }, 32); // ~30fps más controlado
      }
    }, { passive: true });

    // Agregar wheel event para controlar velocidad de scroll con mouse
    this.scrollContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      const delta = e.deltaY;
      const scrollSpeed = 3; // Reducir velocidad de scroll
      const currentScrollTop = this.scrollContainer.scrollTop;
      const maxScroll = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;
      
      let newScrollTop = currentScrollTop + (delta * scrollSpeed);
      newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));
      
      this.scrollContainer.scrollTop = newScrollTop;
    }, { passive: false });

    // Agregar soporte para scroll suave con teclas
    this.scrollContainer.addEventListener('keydown', (e) => {
      const rowHeight = this.config.estimatedRowHeight;
      const currentScrollTop = this.scrollContainer.scrollTop;
      const containerHeight = this.scrollContainer.clientHeight;
      const maxScroll = this.scrollContainer.scrollHeight - containerHeight;
      
      let newScrollTop = currentScrollTop;
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newScrollTop = Math.max(0, currentScrollTop - rowHeight);
          break;
        case 'ArrowDown':
          e.preventDefault(); 
          newScrollTop = Math.min(maxScroll, currentScrollTop + rowHeight);
          break;
        case 'PageUp':
          e.preventDefault();
          newScrollTop = Math.max(0, currentScrollTop - containerHeight);
          break;
        case 'PageDown':
          e.preventDefault();
          newScrollTop = Math.min(maxScroll, currentScrollTop + containerHeight);
          break;
        case 'Home':
          e.preventDefault();
          newScrollTop = 0;
          break;
        case 'End':
          e.preventDefault();
          newScrollTop = maxScroll;
          break;
      }
      
      if (newScrollTop !== currentScrollTop) {
        this.scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: 'smooth'
        });
      }
    });
    
    // Focus para permitir navegación con teclado
    this.scrollContainer.setAttribute('tabindex', '0');
  }

  /**
   * Configurar controles de navegación
   */
  setupNavigationControls() {
    const scrollUpBtn = this.container.querySelector('.scroll-up');
    const scrollDownBtn = this.container.querySelector('.scroll-down');
    const smoothScrollToggle = this.container.querySelector('#smooth-scroll-toggle');
    
    if (scrollUpBtn) {
      scrollUpBtn.addEventListener('click', () => {
        const rowHeight = this.config.estimatedRowHeight;
        const currentScrollTop = this.scrollContainer.scrollTop;
        const newScrollTop = Math.max(0, currentScrollTop - rowHeight * 3); // 3 filas por vez
        
        this.scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: this.config.smoothScrolling ? 'smooth' : 'auto'
        });
      });
    }
    
    if (scrollDownBtn) {
      scrollDownBtn.addEventListener('click', () => {
        const rowHeight = this.config.estimatedRowHeight;
        const currentScrollTop = this.scrollContainer.scrollTop;
        const maxScroll = this.scrollContainer.scrollHeight - this.scrollContainer.clientHeight;
        const newScrollTop = Math.min(maxScroll, currentScrollTop + rowHeight * 3); // 3 filas por vez
        
        this.scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: this.config.smoothScrolling ? 'smooth' : 'auto'
        });
      });
    }
    
    if (smoothScrollToggle) {
      smoothScrollToggle.addEventListener('change', (e) => {
        this.config.smoothScrolling = e.target.checked;
        this.scrollContainer.style.scrollBehavior = e.target.checked ? 'smooth' : 'auto';
      });
    }
  }

  /**
   * Actualizar estadísticas de performance
   */
  updatePerformanceStats(renderedCount, renderTime, range) {
    const renderedCountEl = document.getElementById('rendered-count');
    const renderTimeEl = document.getElementById('render-time');
    const visibleRangeEl = document.getElementById('visible-range');
    
    if (renderedCountEl) renderedCountEl.textContent = renderedCount;
    if (renderTimeEl) renderTimeEl.textContent = renderTime.toFixed(2);
    if (visibleRangeEl) visibleRangeEl.textContent = range;
  }

  /**
   * Destruir el renderizador y limpiar recursos
   */
  destroy() {
    this.elementCache.clearCache();
    this.scrollContainer?.removeEventListener('scroll', this.renderVirtual);
    console.log('🗑️ Renderizado virtual destruido');
  }
}

/**
 * Factory para crear renderizador virtual
 */
function createVirtualGridRenderer(containerSelector, config) {
  return new VirtualGridRenderer(containerSelector, config);
}

/**
 * Utilidades de performance
 */
const PerformanceUtils = {
  /**
   * Crear datos de prueba masivos
   */
  generateMassiveTestData(count = 500) {
    const types = ['sombrillas', 'carpas', 'estacionamiento'];
    const data = [];
    
    for (let i = 1; i <= count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      data.push({
        id: `${type}_${i}`,
        type: type,
        number: i,
        status: Math.random() > 0.7 ? 'occupied' : 'available',
        price: Math.floor(Math.random() * 5000) + 1000
      });
    }
    
    console.log(`🏗️ Generados ${count} elementos de prueba`);
    return data;
  },

  /**
   * Medir tiempo de ejecución de una función
   */
  measureTime(fn, label = 'Operación') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  /**
   * Throttle para eventos frecuentes
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Exponer globalmente para uso en otros archivos
window.VirtualGridRenderer = VirtualGridRenderer;
window.createVirtualGridRenderer = createVirtualGridRenderer;
window.PerformanceUtils = PerformanceUtils;

console.log('🚀 Sistema de optimización de performance cargado');