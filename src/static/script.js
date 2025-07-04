// Estado da aplicação
let currentPath = '';
let files = [];
let selectedFiles = [];
let viewMode = 'grid';
let lastUpdateCheck = Date.now();

// Elementos DOM
const elements = {
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    fileContainer: document.getElementById('file-container'),
    breadcrumbPath: document.getElementById('breadcrumb-path'),
    gridViewBtn: document.getElementById('grid-view'),
    listViewBtn: document.getElementById('list-view'),
    selectAllBtn: document.getElementById('select-all'),
    clearSelectionBtn: document.getElementById('clear-selection'),
    downloadSelectedBtn: document.getElementById('download-selected'),
    downloadZipBtn: document.getElementById('download-zip'),
    selectionInfo: document.getElementById('selection-info'),
    selectionCount: document.getElementById('selection-count'),
    selectionSize: document.getElementById('selection-size'),
    previewModal: document.getElementById('preview-modal'),
    previewTitle: document.getElementById('preview-title'),
    previewContent: document.getElementById('preview-content'),
    closePreview: document.getElementById('close-preview'),
    downloadPreview: document.getElementById('download-preview'),
    downloadModal: document.getElementById('download-modal'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadFiles();
    startAutoRefresh();
});

// Event Listeners
function initializeEventListeners() {
    elements.retryBtn.addEventListener('click', loadFiles);
    elements.gridViewBtn.addEventListener('click', () => setViewMode('grid'));
    elements.listViewBtn.addEventListener('click', () => setViewMode('list'));
    elements.selectAllBtn.addEventListener('click', selectAll);
    elements.clearSelectionBtn.addEventListener('click', clearSelection);
    elements.downloadSelectedBtn.addEventListener('click', downloadSelected);
    elements.downloadZipBtn.addEventListener('click', downloadAsZip);
    elements.closePreview.addEventListener('click', closePreview);
    
    // Fechar modal clicando fora
    elements.previewModal.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) {
            closePreview();
        }
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl+A - Selecionar todos
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            selectAll();
        }
        
        // Ctrl+D - Baixar selecionados
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (selectedFiles.length > 0) {
                downloadSelected();
            }
        }
        
        // Escape - Fechar modal
        if (e.key === 'Escape') {
            if (elements.previewModal.style.display !== 'none') {
                closePreview();
            }
            if (elements.downloadModal.style.display !== 'none') {
                hideDownloadModal();
            }
        }
        
        // Delete - Limpar seleção
        if (e.key === 'Delete') {
            clearSelection();
        }
    });
}

// Auto-refresh para detectar mudanças na pasta
function startAutoRefresh() {
    setInterval(() => {
        // Verificar mudanças a cada 10 segundos
        loadFiles(currentPath, true);
    }, 10000);
}

// Carregar arquivos da pasta database via API
async function loadFiles(path = currentPath, silent = false) {
    if (!silent) showLoading();
    hideError();
    
    try {
        const apiPath = path ? `/api/files/list/${encodeURIComponent(path)}` : '/api/files/list';
        const response = await fetch(apiPath);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            files = data.files;
            currentPath = data.currentPath;
            updateBreadcrumb();
            renderFiles();
            if (!silent) hideLoading();
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        showError(error.message);
        if (!silent) hideLoading();
    }
}

// Atualizar breadcrumb
function updateBreadcrumb() {
    const pathParts = currentPath ? currentPath.split('/') : [];
    let breadcrumbHtml = '<span class="breadcrumb-item" onclick="navigateToPath(\'\')">database</span>';
    
    let currentPathBuild = '';
    pathParts.forEach((part, index) => {
        if (part) {
            currentPathBuild += (currentPathBuild ? '/' : '') + part;
            breadcrumbHtml += ` / <span class="breadcrumb-item" onclick="navigateToPath('${currentPathBuild}')">${part}</span>`;
        }
    });
    
    elements.breadcrumbPath.innerHTML = breadcrumbHtml;
}

// Navegar para um caminho
function navigateToPath(path) {
    selectedFiles = [];
    updateSelectionInfo();
    loadFiles(path);
}

// Definir modo de visualização
function setViewMode(mode) {
    viewMode = mode;
    elements.gridViewBtn.classList.toggle('active', mode === 'grid');
    elements.listViewBtn.classList.toggle('active', mode === 'list');
    renderFiles();
}

// Renderizar arquivos
function renderFiles() {
    if (viewMode === 'grid') {
        renderGridView();
    } else {
        renderListView();
    }
    updateSelectionInfo();
}

// Renderizar visualização em grade
function renderGridView() {
    const html = `
        <div class="file-grid">
            ${files.map(file => `
                <div class="file-card ${file.isDirectory ? 'directory' : ''} ${selectedFiles.includes(file.id) ? 'selected' : ''}" 
                     data-file-id="${file.id}" onclick="handleFileClick('${file.id}', event)">
                    <input type="checkbox" class="file-checkbox" 
                           ${selectedFiles.includes(file.id) ? 'checked' : ''} 
                           onchange="toggleFileSelection('${file.id}')" 
                           onclick="event.stopPropagation()">
                    <div class="file-icon ${getFileIconClass(file)}">
                        ${getFileIcon(file)}
                    </div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-info">
                        ${file.isDirectory ? 'Pasta' : formatFileSize(file.size)}
                        <br>
                        <small>${formatDate(file.modified)}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    elements.fileContainer.innerHTML = html;
}

// Renderizar visualização em lista
function renderListView() {
    const html = `
        <table class="file-list">
            <thead>
                <tr>
                    <th style="width: 40px;">
                        <input type="checkbox" id="select-all-checkbox" onchange="toggleSelectAll()" 
                               ${selectedFiles.length === files.length && files.length > 0 ? 'checked' : ''}>
                    </th>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Tamanho</th>
                    <th>Modificado</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => `
                    <tr class="${file.isDirectory ? 'directory' : ''} ${selectedFiles.includes(file.id) ? 'selected' : ''}" 
                        data-file-id="${file.id}">
                        <td class="checkbox-cell">
                            <input type="checkbox" 
                                   ${selectedFiles.includes(file.id) ? 'checked' : ''} 
                                   onchange="toggleFileSelection('${file.id}')" 
                                   onclick="event.stopPropagation()">
                        </td>
                        <td class="file-name-cell" onclick="handleFileClick('${file.id}', event)">
                            <div class="file-icon ${getFileIconClass(file)}">
                                ${getFileIcon(file)}
                            </div>
                            ${file.name}
                        </td>
                        <td>${file.isDirectory ? 'Pasta' : getFileType(file.name)}</td>
                        <td>${file.isDirectory ? '-' : formatFileSize(file.size)}</td>
                        <td>${formatDate(file.modified)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.fileContainer.innerHTML = html;
}

// Obter classe do ícone do arquivo
function getFileIconClass(file) {
    if (file.isDirectory) return 'directory';
        const extension = file.name.split(".").pop().toLowerCase();
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
        return 'image';
    } else if (extension === "svg") {
        return 'svg';
    } else if (['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
        return 'text';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'archive';
    } else {
        return 'default';
    }
}

// Obter ícone do arquivo
function getFileIcon(file) {
    if (file.isDirectory) return '📁';

    const extension = file.name.split('.').pop().toLowerCase();
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
        return `<img src="/api/files/preview/${encodeURIComponent(filePath)}" alt="${file.name}" class="file-thumbnail" />`;
    } else if (extension === 'svg') {
        return `<img src="/api/files/preview/${encodeURIComponent(filePath)}" alt="${file.name}" class="file-thumbnail" />`;
    } else if (['txt', 'md'].includes(extension)) {
        return '📄';
    } else if (['json', 'xml'].includes(extension)) {
        return '📋';
    } else if (extension === 'csv') {
        return '📊';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return '📦';
    } else if (['html', 'htm'].includes(extension)) {
        return '🌐';
    } else if (['js', 'css', 'py', 'php'].includes(extension)) {
        return '💻';
    } else {
        return '📄';
    }
}

// Obter tipo do arquivo
function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return extension.toUpperCase();
}

// Manipular clique no arquivo
function handleFileClick(fileId, event) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    if (file.isDirectory) {
        const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        navigateToPath(newPath);
    } else {
        // Pré-visualizar arquivo
        previewFile(file);
    }
}

// Alternar seleção de arquivo
function toggleFileSelection(fileId) {
    const index = selectedFiles.indexOf(fileId);
    if (index > -1) {
        selectedFiles.splice(index, 1);
    } else {
        selectedFiles.push(fileId);
    }
    
    updateSelectionInfo();
    updateFileVisualState();
    updateSelectAllCheckbox();
}

// Alternar seleção de todos
function toggleSelectAll() {
    const checkbox = document.getElementById('select-all-checkbox');
    if (checkbox.checked) {
        selectAll();
    } else {
        clearSelection();
    }
}

// Selecionar todos os arquivos
function selectAll() {
    selectedFiles = files.map(file => file.id);
    updateSelectionInfo();
    updateFileVisualState();
    updateSelectAllCheckbox();
}

// Limpar seleção
function clearSelection() {
    selectedFiles = [];
    updateSelectionInfo();
    updateFileVisualState();
    updateSelectAllCheckbox();
}

// Atualizar estado visual dos arquivos
function updateFileVisualState() {
    // Atualizar cards na visualização em grade
    document.querySelectorAll('.file-card').forEach(card => {
        const fileId = card.dataset.fileId;
        const checkbox = card.querySelector('.file-checkbox');
        const isSelected = selectedFiles.includes(fileId);
        
        card.classList.toggle('selected', isSelected);
        if (checkbox) checkbox.checked = isSelected;
    });
    
    // Atualizar linhas na visualização em lista
    document.querySelectorAll('.file-list tr[data-file-id]').forEach(row => {
        const fileId = row.dataset.fileId;
        const checkbox = row.querySelector('input[type="checkbox"]');
        const isSelected = selectedFiles.includes(fileId);
        
        row.classList.toggle('selected', isSelected);
        if (checkbox) checkbox.checked = isSelected;
    });
}

// Atualizar checkbox "Selecionar Todos"
function updateSelectAllCheckbox() {
    const checkbox = document.getElementById('select-all-checkbox');
    if (checkbox) {
        checkbox.checked = selectedFiles.length === files.length && files.length > 0;
        checkbox.indeterminate = selectedFiles.length > 0 && selectedFiles.length < files.length;
    }
}

// Atualizar informações de seleção
function updateSelectionInfo() {
    const selectedCount = selectedFiles.length;
    const selectedFilesData = files.filter(file => selectedFiles.includes(file.id));
    const totalSize = selectedFilesData.reduce((sum, file) => sum + (file.size || 0), 0);
    
    // Atualizar contadores
    elements.selectionCount.textContent = `${selectedCount} ${selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}`;
    elements.selectionSize.textContent = formatFileSize(totalSize);
    
    // Mostrar/ocultar elementos baseado na seleção
    if (selectedCount > 0) {
        elements.selectionInfo.style.display = 'flex';
        elements.downloadSelectedBtn.style.display = 'inline-block';
        elements.downloadZipBtn.style.display = 'inline-block';
        elements.downloadSelectedBtn.disabled = false;
        
        // Mostrar atalhos de teclado
        const keyboardShortcuts = document.querySelector('.keyboard-shortcuts');
        if (keyboardShortcuts) {
            keyboardShortcuts.style.display = 'block';
        }
    } else {
        elements.selectionInfo.style.display = 'none';
        elements.downloadSelectedBtn.style.display = 'none';
        elements.downloadZipBtn.style.display = 'none';
        elements.downloadSelectedBtn.disabled = true;
        
        // Ocultar atalhos de teclado
        const keyboardShortcuts = document.querySelector('.keyboard-shortcuts');
        if (keyboardShortcuts) {
            keyboardShortcuts.style.display = 'none';
        }
    }
    
    updateSelectAllCheckbox();
}

// Baixar arquivos selecionados
async function downloadSelected() {
    if (selectedFiles.length === 0) return;
    
    showDownloadModal();
    
    try {
        const selectedFilesData = files.filter(file => selectedFiles.includes(file.id));
        
        if (selectedFilesData.length === 1 && !selectedFilesData[0].isDirectory) {
            // Download único
            await downloadSingleFile(selectedFilesData[0]);
        } else {
            // Download múltiplo como ZIP
            await downloadMultipleFiles(selectedFilesData);
        }
    } catch (error) {
        console.error('Erro no download:', error);
        alert('Erro ao baixar arquivos: ' + error.message);
    } finally {
        hideDownloadModal();
    }
}

// Baixar como ZIP
async function downloadAsZip() {
    showDownloadModal();
    
    try {
        updateProgress(10, 'Preparando arquivos...');
        
        const response = await fetch('/api/files/download-zip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                path: currentPath,
                includeAll: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        updateProgress(50, 'Compactando arquivos...');
        
        const blob = await response.blob();
        updateProgress(90, 'Finalizando download...');
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database-${currentPath || 'root'}-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        updateProgress(100, 'Download concluído!');
        
        setTimeout(() => {
            hideDownloadModal();
        }, 1000);
        
    } catch (error) {
        console.error('Erro no download ZIP:', error);
        alert('Erro ao baixar ZIP: ' + error.message);
        hideDownloadModal();
    }
}

// Download de arquivo único
async function downloadSingleFile(file) {
    updateProgress(20, `Baixando ${file.name}...`);
    
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const response = await fetch(`/api/files/download/${encodeURIComponent(filePath)}`);
    
    if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    updateProgress(70, 'Processando arquivo...');
    
    const blob = await response.blob();
    updateProgress(90, 'Finalizando download...');
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    updateProgress(100, 'Download concluído!');
}

// Download de múltiplos arquivos
async function downloadMultipleFiles(filesData) {
    updateProgress(20, 'Preparando múltiplos arquivos...');
    
    const response = await fetch('/api/files/download-multiple', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            files: filesData.map(file => ({
                name: file.name,
                path: currentPath ? `${currentPath}/${file.name}` : file.name,
                isDirectory: file.isDirectory
            }))
        })
    });
    
    if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    updateProgress(60, 'Compactando arquivos...');
    
    const blob = await response.blob();
    updateProgress(90, 'Finalizando download...');
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-files-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    updateProgress(100, 'Download concluído!');
}

// Pré-visualizar arquivo
async function previewFile(file) {
    elements.previewTitle.textContent = file.name;
    elements.downloadPreview.onclick = () => downloadSingleFile(file);
    
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const extension = file.name.split('.').pop().toLowerCase();
    
    try {
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
            // Pré-visualização de imagem
            elements.previewContent.innerHTML = `
                <div class="image-preview">
                    <img src="/api/files/preview/${encodeURIComponent(filePath)}" alt="${file.name}" />
                </div>
            `;
        } else if (extension === 'svg') {
            // Pré-visualização de SVG
            const response = await fetch(`/api/files/preview/${encodeURIComponent(filePath)}`);
            const svgContent = await response.text();
            elements.previewContent.innerHTML = `
                <div class="svg-preview">
                    ${svgContent}
                </div>
            `;
        } else if (['txt', 'md', 'json', 'xml', 'csv', 'html', 'htm', 'js', 'css', 'py'].includes(extension)) {
            // Pré-visualização de texto
            const response = await fetch(`/api/files/preview/${encodeURIComponent(filePath)}`);
            const textContent = await response.text();
            const isCode = ['js', 'css', 'py', 'html', 'htm'].includes(extension);
            elements.previewContent.innerHTML = `
                <div class="${isCode ? 'code-preview' : 'text-preview'}">
                    ${escapeHtml(textContent)}
                </div>
            `;
        } else {
            // Arquivo não suportado para pré-visualização
            elements.previewContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                    <h3>Pré-visualização não disponível</h3>
                    <p>Este tipo de arquivo não pode ser visualizado no navegador.</p>
                    <p><strong>Tipo:</strong> ${extension.toUpperCase()}</p>
                    <p><strong>Tamanho:</strong> ${formatFileSize(file.size)}</p>
                </div>
            `;
        }
        
        elements.previewModal.style.display = 'flex';
    } catch (error) {
        console.error('Erro na pré-visualização:', error);
        elements.previewContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #dc2626;">
                <h3>Erro na pré-visualização</h3>
                <p>${error.message}</p>
            </div>
        `;
        elements.previewModal.style.display = 'flex';
    }
}

// Fechar pré-visualização
function closePreview() {
    elements.previewModal.style.display = 'none';
}

// Mostrar modal de download
function showDownloadModal() {
    elements.downloadModal.style.display = 'flex';
    updateProgress(0, 'Iniciando...');
}

// Esconder modal de download
function hideDownloadModal() {
    elements.downloadModal.style.display = 'none';
}

// Atualizar progresso
function updateProgress(percentage, text) {
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
}

// Utilitários
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    elements.loading.style.display = 'block';
    elements.fileContainer.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
    elements.fileContainer.style.display = 'block';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.style.display = 'block';
    elements.fileContainer.style.display = 'none';
}

function hideError() {
    elements.error.style.display = 'none';
}

