/**
 * ZEUS BALNEARIO - SISTEMA DE BACKUP Y EXPORTACIÓN
 * Sistema completo de respaldo y restauración de datos
 * ===============================================
 */

/**
 * Configuración del sistema de backup
 */
const BACKUP_CONFIG = {
  // Versión del formato de backup para compatibilidad
  version: '1.0',
  // Datos que se incluyen en el backup
  dataKeys: [
    'zeus-rentals',
    'zeus-payments', 
    'zeus-clients',
    'zeus-pricing',
    'zeus-establishment-config',
    'zeus-pool-config',
    'zeus-user-preferences'
  ],
  // Configuración de auto-backup
  autoBackup: {
    enabled: true,
    intervalDays: 7, // Backup cada 7 días
    maxBackups: 5 // Mantener máximo 5 backups automáticos
  }
};

/**
 * Clase principal para manejo de backups
 */
class BackupManager {
  constructor() {
    this.initAutoBackup();
  }

  /**
   * Crear backup completo del sistema
   * @returns {Object} Objeto con todos los datos del sistema
   */
  createFullBackup() {
    const backup = {
      metadata: {
        version: BACKUP_CONFIG.version,
        timestamp: new Date().toISOString(),
        source: 'Zeus Balneario System',
        dataCount: {},
        establishmentName: this.getEstablishmentName()
      },
      data: {}
    };

    // Recopilar todos los datos
    BACKUP_CONFIG.dataKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          backup.data[key] = parsedData;
          
          // Contar elementos para metadata
          if (Array.isArray(parsedData)) {
            backup.metadata.dataCount[key] = parsedData.length;
          } else if (typeof parsedData === 'object') {
            backup.metadata.dataCount[key] = Object.keys(parsedData).length;
          } else {
            backup.metadata.dataCount[key] = 1;
          }
        } catch (e) {
          console.warn(`⚠️ Error parseando ${key}:`, e);
          backup.data[key] = data; // Guardar como string si no se puede parsear
        }
      }
    });

    console.log('📦 Backup creado:', backup.metadata);
    return backup;
  }

  /**
   * Exportar backup como archivo JSON
   */
  exportAsJSON() {
    try {
      const backup = this.createFullBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      
      const filename = `zeus-balneario-backup-${this.formatDateForFilename(new Date())}.json`;
      this.downloadFile(blob, filename);
      
      showNotification('📦 Backup exportado correctamente como JSON', 'success');
      return true;
    } catch (error) {
      console.error('❌ Error exportando JSON:', error);
      showNotification('❌ Error al exportar backup: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Exportar datos como CSV (para Excel)
   */
  exportAsCSV() {
    try {
      const rentals = this.getRentals();
      const payments = this.getPayments();
      const clients = this.getClients();
      
      // CSV de reservas
      const rentalsCSV = this.convertToCSV(rentals, [
        'id', 'clientName', 'clientPhone', 'clientEmail', 'type', 'unitNumber', 
        'startDate', 'endDate', 'totalDays', 'pricePerDay', 'totalAmount', 'status'
      ]);
      
      // CSV de pagos
      const paymentsCSV = this.convertToCSV(payments, [
        'id', 'rentalId', 'clientName', 'amount', 'method', 'date', 'reference', 'status'
      ]);
      
      // Crear archivos ZIP
      this.createZipExport({
        'reservas.csv': rentalsCSV,
        'pagos.csv': paymentsCSV,
        'clientes.json': JSON.stringify(clients, null, 2)
      });
      
      showNotification('📊 Datos exportados como CSV/Excel', 'success');
      return true;
    } catch (error) {
      console.error('❌ Error exportando CSV:', error);
      showNotification('❌ Error al exportar CSV: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Importar backup desde archivo
   * @param {File} file - Archivo de backup
   */
  async importBackup(file) {
    try {
      const content = await this.readFileAsText(file);
      const backup = JSON.parse(content);
      
      // Validar formato
      if (!backup.metadata || !backup.data) {
        throw new Error('Formato de backup inválido');
      }
      
      // Confirmar importación
      const confirmMsg = `¿Confirmar importación del backup?\n\n` +
                        `Fecha: ${new Date(backup.metadata.timestamp).toLocaleString('es-AR')}\n` +
                        `Establecimiento: ${backup.metadata.establishmentName || 'No especificado'}\n` +
                        `Datos: ${Object.entries(backup.metadata.dataCount).map(([k, v]) => `${k}: ${v}`).join(', ')}\n\n` +
                        `⚠️ ATENCIÓN: Esto sobrescribirá todos los datos actuales.\n` +
                        `🛡️ NOTA: Se creará automáticamente un punto de restauración de los datos actuales.`;
      
      if (!confirm(confirmMsg)) {
        return false;
      }
      
      // Mostrar progreso
      showNotification('🔄 Creando punto de restauración y preparando importación...', 'info');
      
      // Crear backup automático antes de importar (característica de seguridad)
      const currentBackupKey = this.createAutoBackup('pre-import');
      console.log('🛡️ Punto de restauración creado antes de importación:', currentBackupKey);
      
      // Pequeña pausa para mostrar el progreso
      setTimeout(() => {
        // Importar datos
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        
        showNotification('✅ Backup importado correctamente. Punto de restauración guardado. Recargando...', 'success');
        
        // Recargar página para refrescar toda la aplicación
        setTimeout(() => window.location.reload(), 2000);
      }, 1000);
      
      // Recargar página para refrescar toda la aplicación
      setTimeout(() => window.location.reload(), 2000);
      
      return true;
    } catch (error) {
      console.error('❌ Error importando backup:', error);
      showNotification('❌ Error al importar backup: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Crear backup automático
   */
  createAutoBackup(suffix = '') {
    try {
      const backup = this.createFullBackup();
      const timestamp = Date.now();
      const key = `zeus-auto-backup-${timestamp}${suffix ? '-' + suffix : ''}`;
      
      localStorage.setItem(key, JSON.stringify(backup));
      
      // Limpiar backups viejos
      this.cleanOldAutoBackups();
      
      console.log('🔄 Auto-backup creado:', key);
      return key;
    } catch (error) {
      console.error('❌ Error en auto-backup:', error);
    }
  }

  /**
   * Limpiar backups automáticos viejos
   */
  cleanOldAutoBackups() {
    try {
      const autoBackupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('zeus-auto-backup-'))
        .sort()
        .reverse(); // Más recientes primero
      
      // Eliminar backups excedentes
      if (autoBackupKeys.length > BACKUP_CONFIG.autoBackup.maxBackups) {
        const toDelete = autoBackupKeys.slice(BACKUP_CONFIG.autoBackup.maxBackups);
        toDelete.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Eliminados', toDelete.length, 'auto-backups viejos');
      }
    } catch (error) {
      console.error('❌ Error limpiando auto-backups:', error);
    }
  }

  /**
   * Eliminar todos los backups automáticos
   */
  clearAllAutoBackups() {
    try {
      const autoBackupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('zeus-auto-backup-'));
      
      if (autoBackupKeys.length === 0) {
        showNotification('ℹ️ No hay backups automáticos para eliminar', 'info');
        return false;
      }
      
      const confirmMsg = `¿Confirmar eliminación de ${autoBackupKeys.length} backup(s) automático(s)?\n\nEsta acción no se puede deshacer.`;
      
      if (!confirm(confirmMsg)) {
        return false;
      }
      
      autoBackupKeys.forEach(key => localStorage.removeItem(key));
      
      showNotification(`🧹 Eliminados ${autoBackupKeys.length} backups automáticos correctamente`, 'success');
      console.log('🧹 Todos los auto-backups eliminados:', autoBackupKeys.length);
      
      return true;
    } catch (error) {
      console.error('❌ Error eliminando auto-backups:', error);
      showNotification('❌ Error al eliminar backups: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Listar backups automáticos disponibles
   */
  listAutoBackups() {
    const autoBackupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('zeus-auto-backup-'))
      .map(key => {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          return {
            key: key,
            timestamp: backup.metadata.timestamp,
            establishmentName: backup.metadata.establishmentName,
            dataCount: backup.metadata.dataCount
          };
        } catch (e) {
          return null;
        }
      })
      .filter(backup => backup !== null)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return autoBackupKeys;
  }

  /**
   * Restaurar desde auto-backup
   */
  restoreAutoBackup(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup no encontrado');
      }
      
      const backup = JSON.parse(backupData);
      
      // Mostrar mensaje informativo sobre el punto de restauración
      showNotification('🔄 Creando punto de restauración antes de restaurar...', 'info');
      
      // Crear backup del estado actual antes de restaurar (característica de seguridad)
      const currentBackupKey = this.createAutoBackup('pre-restore');
      console.log('🛡️ Punto de restauración creado:', currentBackupKey);
      
      // Pequeña pausa para mostrar el mensaje
      setTimeout(() => {
        // Restaurar datos
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        
        showNotification('✅ Datos restaurados correctamente. Punto de restauración guardado. Recargando...', 'success');
        setTimeout(() => window.location.reload(), 2000);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Error restaurando auto-backup:', error);
      showNotification('❌ Error al restaurar: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * Inicializar sistema de auto-backup
   */
  initAutoBackup() {
    if (!BACKUP_CONFIG.autoBackup.enabled) return;
    
    const lastBackupKey = 'zeus-last-auto-backup';
    const lastBackup = localStorage.getItem(lastBackupKey);
    const now = Date.now();
    const intervalMs = BACKUP_CONFIG.autoBackup.intervalDays * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > intervalMs) {
      // Crear backup automático
      setTimeout(() => {
        this.createAutoBackup();
        localStorage.setItem(lastBackupKey, now.toString());
      }, 5000); // Esperar 5 segundos después de cargar la página
    }
  }

  // === MÉTODOS AUXILIARES ===

  getRentals() {
    try {
      return JSON.parse(localStorage.getItem('zeus-rentals') || '[]');
    } catch {
      return [];
    }
  }

  getPayments() {
    try {
      return JSON.parse(localStorage.getItem('zeus-payments') || '[]');
    } catch {
      return [];
    }
  }

  getClients() {
    try {
      return JSON.parse(localStorage.getItem('zeus-clients') || '[]');
    } catch {
      return [];
    }
  }

  getEstablishmentName() {
    try {
      const config = JSON.parse(localStorage.getItem('zeus-establishment-config') || '{}');
      return config.name || 'Balneario Zeus';
    } catch {
      return 'Balneario Zeus';
    }
  }

  formatDateForFilename(date) {
    return date.toISOString().slice(0, 19).replace(/[:.]/g, '-');
  }

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  convertToCSV(data, headers) {
    if (!data.length) return '';
    
    const csvRows = [];
    
    // Headers
    csvRows.push(headers.join(','));
    
    // Data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escapar comillas y comas
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  createZipExport(files) {
    // Para simplificar, crear múltiples descargas
    // En una implementación más avanzada se podría usar JSZip
    Object.entries(files).forEach(([filename, content]) => {
      const blob = new Blob([content], { 
        type: filename.endsWith('.json') ? 'application/json' : 'text/csv' 
      });
      this.downloadFile(blob, `zeus-export-${this.formatDateForFilename(new Date())}-${filename}`);
    });
  }
}

// Crear instancia global del backup manager
const backupManager = new BackupManager();

// Exponer funciones globalmente
window.backupManager = backupManager;
window.exportBackupJSON = () => backupManager.exportAsJSON();
window.exportBackupCSV = () => backupManager.exportAsCSV();
window.showBackupModal = showBackupModal;
window.clearAllAutoBackups = () => backupManager.clearAllAutoBackups();
window.clearAllAutoBackupsAndRefresh = clearAllAutoBackupsAndRefresh;
window.createManualAutoBackup = createManualAutoBackup;

/**
 * Mostrar modal de backup y exportación
 */
function showBackupModal() {
  const autoBackups = backupManager.listAutoBackups();
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-large">
      <div class="modal-header">
        <h3>💾 Sistema de Backup y Exportación</h3>
        <button class="modal-close" id="close-backup-modal">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Exportar Backup -->
        <div class="backup-section">
          <h4>📤 Exportar Datos</h4>
          <div class="backup-actions">
            <button class="btn btn-primary" onclick="exportBackupJSON()">
              📦 Descargar Backup Completo (JSON)
            </button>
            <button class="btn btn-secondary" onclick="exportBackupCSV()">
              📊 Exportar para Excel (CSV)
            </button>
            <button class="btn btn-success" onclick="createManualAutoBackup()">
              🔄 Crear Backup Automático Ahora
            </button>
          </div>
          <p class="help-text">
            • <strong>Backup Completo</strong>: Incluye todas las configuraciones y datos del sistema<br>
            • <strong>Excel/CSV</strong>: Solo datos de reservas y pagos para análisis<br>
            • <strong>Backup Automático</strong>: Guarda en el sistema para restaurar después
          </p>
        </div>
        
        <!-- Importar Backup -->
        <div class="backup-section">
          <h4>📥 Importar Backup</h4>
          <div class="file-upload-area">
            <input type="file" id="backup-file" accept=".json" style="display: none;">
            <div class="file-drop-zone" onclick="document.getElementById('backup-file').click()">
              <div class="drop-icon">📁</div>
              <p><strong>Click para seleccionar archivo</strong></p>
              <p>o arrastra un archivo .json aquí</p>
            </div>
          </div>
          <p class="help-text warning">
            ⚠️ <strong>Advertencia</strong>: Importar un backup sobrescribirá todos los datos actuales
          </p>
        </div>
        
        <!-- Auto-backups -->
        ${autoBackups.length > 0 ? `
          <div class="backup-section">
            <h4>🔄 Backups Automáticos</h4>
            <div class="backup-actions">
              <button class="btn btn-danger btn-sm" onclick="clearAllAutoBackupsAndRefresh()" title="Eliminar todos los backups automáticos">
                🗑️ Limpiar Todos los Backups Automáticos
              </button>
            </div>
            <div class="auto-backups-list">
              ${autoBackups.map(backup => `
                <div class="auto-backup-item">
                  <div class="backup-info">
                    <div class="backup-date">
                      ${new Date(backup.timestamp).toLocaleString('es-AR')}
                    </div>
                    <div class="backup-details">
                      ${backup.establishmentName} • 
                      ${Object.entries(backup.dataCount).map(([k, v]) => `${v} ${k.replace('zeus-', '')}`).join(', ')}
                    </div>
                  </div>
                  <button class="btn-mini" onclick="restoreAutoBackup('${backup.key}')" title="Restaurar backup">
                    🔄 Restaurar
                  </button>
                </div>
              `).join('')}
            </div>
            <p class="help-text">
              Los backups automáticos se crean cada 7 días y antes de operaciones críticas.<br>
              <strong>🛡️ Seguridad:</strong> Al restaurar cualquier backup, se crea automáticamente un punto de restauración del estado actual.<br>
              <strong>💡 Tip:</strong> Usa "Limpiar Todos" si el sistema se vuelve lento por exceso de datos.
            </p>
          </div>
        ` : `
          <div class="backup-section">
            <h4>🔄 Backups Automáticos</h4>
            <p class="help-text">No hay backups automáticos disponibles.</p>
          </div>
        `}
      </div>
      
      <div class="modal-buttons">
        <button class="btn btn-secondary" onclick="closeBackupModal()">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const closeBtn = modal.querySelector('#close-backup-modal');
  const fileInput = modal.querySelector('#backup-file');
  const dropZone = modal.querySelector('.file-drop-zone');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        backupManager.importBackup(file);
      }
    });
  }
  
  // Drag and drop
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/json') {
        backupManager.importBackup(file);
      } else {
        showNotification('❌ Solo se permiten archivos .json', 'error');
      }
    });
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function closeBackupModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

function restoreAutoBackup(backupKey) {
  backupManager.restoreAutoBackup(backupKey);
}

function clearAllAutoBackupsAndRefresh() {
  const success = backupManager.clearAllAutoBackups();
  if (success) {
    // Cerrar modal actual y volver a abrirlo para refrescar la lista
    closeBackupModal();
    setTimeout(() => {
      showBackupModal();
    }, 500);
  }
}

function createManualAutoBackup() {
  try {
    // Mostrar indicador de carga
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Creando backup...';
    button.disabled = true;
    
    const backupKey = backupManager.createAutoBackup('manual');
    if (backupKey) {
      const now = new Date().toLocaleString('es-AR');
      showNotification(`✅ Backup automático creado correctamente (${now})`, 'success');
      
      // Cerrar modal actual y volver a abrirlo para mostrar el nuevo backup
      closeBackupModal();
      setTimeout(() => {
        showBackupModal();
      }, 500);
    } else {
      // Restaurar botón en caso de error
      button.innerHTML = originalText;
      button.disabled = false;
      showNotification('❌ Error al crear el backup automático', 'error');
    }
  } catch (error) {
    console.error('❌ Error creando backup manual:', error);
    showNotification('❌ Error al crear backup: ' + error.message, 'error');
    
    // Restaurar botón en caso de error
    if (event && event.target) {
      event.target.innerHTML = '🔄 Crear Backup Automático Ahora';
      event.target.disabled = false;
    }
  }
}

console.log('💾 Sistema de Backup inicializado');