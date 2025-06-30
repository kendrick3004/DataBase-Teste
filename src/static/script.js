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
    downloadPreview: document.getElementById('download-preview')
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
    
    // Tecla ESC para fechar modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.previewModal.style.display !== 'none') {
            closePreview();
        }
    });
}

// Auto-refresh para detectar mudanças na pasta
function startAutoRefresh() {
    setInterval(() => {
        // Verificar mudanças a cada 5 segundos
        loadFiles(currentPath, true);
    }, 5000);
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
                     onclick="handleFileClick('${file.id}', ${file.isDirectory})">
                    ${!file.isDirectory ? `<input type="checkbox" class="file-checkbox" ${selectedFiles.includes(file.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleFileSelection('${file.id}')">` : ''}
                    <div class="file-icon ${file.type}">
                        ${getFilePreview(file)}
                    </div>
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-info">
                        ${file.isDirectory ? 'Pasta' : file.size}
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
                    <th width="30"></th>
                    <th>Nome</th>
                    <th width="100">Tipo</th>
                    <th width="100">Tamanho</th>
                    <th width="150">Modificado</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => `
                    <tr class="${file.isDirectory ? 'directory' : ''} ${selectedFiles.includes(file.id) ? 'selected' : ''}" 
                        onclick="handleFileClick('${file.id}', ${file.isDirectory})">
                        <td>
                            ${!file.isDirectory ? `<input type="checkbox" ${selectedFiles.includes(file.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleFileSelection('${file.id}')">` : ''}
                        </td>
                        <td>
                            <div class="file-name-cell">
                                <div class="file-icon ${file.type}">
                                    ${getFilePreview(file, true)}
                                </div>
                                <span title="${file.name}">${file.name}</span>
                            </div>
                        </td>
                        <td>${file.isDirectory ? 'Pasta' : file.type.toUpperCase()}</td>
                        <td>${file.isDirectory ? '-' : file.size}</td>
                        <td>${new Date(file.lastModified * 1000).toLocaleDateString('pt-BR')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    elements.fileContainer.innerHTML = html;
}

// Obter pré-visualização do arquivo
function getFilePreview(file, isSmall = false) {
    if (file.isDirectory) {
        return '📁';
    }
    
    const size = isSmall ? '24px' : '48px';
    
    if (file.type === 'image') {
        return `<img src="database/${file.path}" alt="${file.name}" 
                style="width: ${size}; height: ${size}; object-fit: cover; border-radius: 4px;" 
                onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                <span style="display:none;">🖼️</span>`;
    } else if (file.type === 'svg') {
        return `<div style="width: ${size}; height: ${size}; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 4px; background: #f8fafc;">
                    <object data="database/${file.path}" type="image/svg+xml" 
                    style="width: 100%; height: 100%; pointer-events: none;"
                    onload="this.style.display='block';" 
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                        <span style="display:none;">🎨</span>
                    </object>
                    <span style="display:none;">🎨</span>
                </div>`;
    } else if (file.type === 'text') {
        return '📄';
    } else {
        const icons = {
            pdf: '📕',
            video: '🎥',
            audio: '🎵',
            archive: '📦',
            code: '💻',
            html: '🌐',
            css: '🎨',
            js: '⚡',
            default: '📄'
        };
        return icons[file.type] || icons.default;
    }
}

// Manipular clique em arquivo
function handleFileClick(fileId, isDirectory) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    if (isDirectory) {
        navigateToPath(file.path);
    } else {
        showPreview(file);
    }
}

// Mostrar pré-visualização do arquivo
async function showPreview(file) {
    elements.previewTitle.textContent = file.name;
    elements.previewModal.style.display = 'flex';
    
    // Configurar botão de download
    elements.downloadPreview.onclick = () => downloadFile(file);
    
    try {
        const content = await loadFileContent(file);
        displayPreviewContent(file, content);
    } catch (error) {
        console.error('Erro ao carregar preview:', error);
        elements.previewContent.innerHTML = '<p>Erro ao carregar pré-visualização do arquivo.</p>';
    }
}

// Carregar conteúdo do arquivo para pré-visualização
async function loadFileContent(file) {
    try {
        const response = await fetch(`/api/files/content/${encodeURIComponent(file.path)}`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || 'Erro ao carregar conteúdo');
        }
    } catch (error) {
        console.error('Erro ao carregar arquivo:', error);
        // Fallback para conteúdo simulado
        return {
            type: file.type,
            content: `Erro ao carregar conteúdo do arquivo: ${file.name}\n\nTipo: ${file.type}\nTamanho: ${file.size}`
        };
    }
}

// Exibir conteúdo da pré-visualização
function displayPreviewContent(file, content) {
    let html = '';
    
    switch (content.type) {
        case 'image':
            html = `<div class="image-preview">
                        <img src="${content.url}" alt="${file.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <p style="display:none;">Não foi possível carregar a imagem.</p>
                    </div>`;
            break;
            
        case 'svg':
            if (content.content) {
                html = `<div class="svg-preview">
                            <div style="max-width: 100%; max-height: 400px; overflow: auto;">
                                ${content.content}
                            </div>
                        </div>`;
            } else if (content.url) {
                html = `<div class="svg-preview">
                            <object data="${content.url}" type="image/svg+xml" style="width: 100%; height: 400px;">
                                <p>Não foi possível carregar o SVG.</p>
                            </object>
                        </div>`;
            }
            break;
            
        case 'text':
        case 'html':
        case 'css':
        case 'js':
        case 'code':
            html = `<div class="text-preview"><pre>${escapeHtml(content.content || 'Conteúdo não disponível')}</pre></div>`;
            break;
            
        default:
            html = `<div class="text-preview">Pré-visualização não disponível para este tipo de arquivo.\n\nTipo: ${file.type}\nTamanho: ${file.size}</div>`;
    }
    
    elements.previewContent.innerHTML = html;
}

// Escapar HTML para exibição segura
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fechar pré-visualização
function closePreview() {
    elements.previewModal.style.display = 'none';
}

// Alternar seleção de arquivo
function toggleFileSelection(fileId) {
    if (selectedFiles.includes(fileId)) {
        selectedFiles = selectedFiles.filter(id => id !== fileId);
    } else {
        selectedFiles.push(fileId);
    }
    renderFiles();
}

// Selecionar todos os arquivos
function selectAll() {
    const selectableFiles = files.filter(f => !f.isDirectory);
    
    if (selectedFiles.length === selectableFiles.length) {
        selectedFiles = [];
    } else {
        selectedFiles = selectableFiles.map(f => f.id);
    }
    renderFiles();
}

// Limpar seleção
function clearSelection() {
    selectedFiles = [];
    renderFiles();
}

// Atualizar informações de seleção
function updateSelectionInfo() {
    const selectedCount = selectedFiles.length;
    const selectedFilesData = files.filter(f => selectedFiles.includes(f.id));
    const totalSize = selectedFilesData.reduce((total, file) => total + (file.sizeInBytes || 0), 0);
    
    if (selectedCount > 0) {
        elements.selectionInfo.style.display = 'flex';
        elements.selectionCount.textContent = `${selectedCount} arquivo${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`;
        elements.selectionSize.textContent = formatFileSize(totalSize);
        elements.downloadSelectedBtn.disabled = false;
        elements.downloadZipBtn.disabled = false;
    } else {
        elements.selectionInfo.style.display = 'none';
        elements.downloadSelectedBtn.disabled = true;
        elements.downloadZipBtn.disabled = false; // ZIP completo sempre disponível
    }
}

// Download de arquivos selecionados
function downloadSelected() {
    if (selectedFiles.length === 0) return;
    
    if (selectedFiles.length === 1) {
        const file = files.find(f => f.id === selectedFiles[0]);
        downloadFile(file);
    } else {
        downloadAsZip(true); // Apenas selecionados
    }
}

// Download como ZIP
async function downloadAsZip(onlySelected = false) {
    const filesToDownload = onlySelected ? 
        files.filter(f => selectedFiles.includes(f.id)) : 
        files.filter(f => !f.isDirectory);
    
    if (filesToDownload.length === 0) return;
    
    try {
        // Carregar JSZip dinamicamente
        const JSZip = await loadJSZip();
        const zip = new JSZip();
        
        // Adicionar arquivos ao ZIP
        for (const file of filesToDownload) {
            try {
                const response = await fetch(`/database/${file.path}`);
                if (response.ok) {
                    const blob = await response.blob();
                    zip.file(file.name, blob);
                } else {
                    // Adicionar arquivo com conteúdo de fallback
                    zip.file(file.name, `Arquivo: ${file.name}\nTipo: ${file.type}\nTamanho: ${file.size}`);
                }
            } catch (error) {
                console.warn(`Erro ao adicionar ${file.name} ao ZIP:`, error);
                zip.file(file.name, `Erro ao carregar: ${file.name}`);
            }
        }
        
        // Gerar e baixar o ZIP
        const zipBlob = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = onlySelected ? 
            `arquivos_selecionados_${new Date().getTime()}.zip` :
            `database_completo_${new Date().getTime()}.zip`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Erro ao criar ZIP:', error);
        alert('Erro ao criar arquivo ZIP');
    }
}

// Carregar JSZip dinamicamente
async function loadJSZip() {
    if (window.JSZip) return window.JSZip;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Download de arquivo único
function downloadFile(file) {
    const link = document.createElement('a');
    link.href = `/api/files/download/${encodeURIComponent(file.path)}`;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Formatar tamanho de arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utilitários de UI
function showLoading() {
    elements.loading.style.display = 'block';
    elements.fileContainer.style.display = 'none';
}

function hideLoading() {
    elements.loading.style.display = 'none';
    elements.fileContainer.style.display = 'block';
}

function showError(message) {
    elements.error.style.display = 'block';
    elements.errorMessage.textContent = message;
    elements.fileContainer.style.display = 'none';
}

function hideError() {
    elements.error.style.display = 'none';
}

