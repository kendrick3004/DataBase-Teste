import os
import mimetypes
import zipfile
import tempfile
import shutil
from flask import Blueprint, jsonify, send_from_directory, current_app, send_file, request
from pathlib import Path
from datetime import datetime

files_bp = Blueprint('files', __name__)

def get_file_type(filename):
    """Determinar tipo de arquivo pela extensão"""
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    type_map = {
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 
        'bmp': 'image', 'webp': 'image', 'ico': 'image',
        'svg': 'svg',
        'pdf': 'pdf',
        'doc': 'text', 'docx': 'text', 'txt': 'text', 'rtf': 'text', 
        'csv': 'text', 'md': 'text',
        'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video', 
        'flv': 'video', 'webm': 'video',
        'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio', 'ogg': 'audio',
        'html': 'html', 'css': 'css', 'js': 'js', 'jsx': 'js', 'ts': 'js', 'tsx': 'js',
        'py': 'code', 'java': 'code', 'cpp': 'code', 'c': 'code', 'php': 'code',
        'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive'
    }
    return type_map.get(ext, 'default')

@files_bp.route('/list')
@files_bp.route('/list/<path:subpath>')
def list_files(subpath=''):
    """Listar arquivos da pasta database"""
    try:
        # Caminho base da pasta database na raiz do projeto
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        database_path = os.path.join(project_root, 'database')
        
        # Caminho completo incluindo subpasta
        full_path = os.path.join(database_path, subpath) if subpath else database_path
        
        # Verificar se o caminho existe e é um diretório
        if not os.path.exists(full_path) or not os.path.isdir(full_path):
            return jsonify({'error': 'Diretório não encontrado'}), 404
        
        files = []
        
        # Listar todos os itens no diretório
        for item in os.listdir(full_path):
            item_path = os.path.join(full_path, item)
            relative_path = os.path.join(subpath, item) if subpath else item
            
            # Pular arquivos ocultos
            if item.startswith('.'):
                continue
            
            if os.path.isdir(item_path):
                # É um diretório
                files.append({
                    'id': relative_path,
                    'name': item,
                    'type': 'directory',
                    'isDirectory': True,
                    'path': relative_path,
                    'size': None,
                    'modified': datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat(),
                    'fullPath': f'database/{relative_path}'
                })
            else:
                # É um arquivo
                file_size = os.path.getsize(item_path)
                file_type = get_file_type(item)
                
                files.append({
                    'id': relative_path,
                    'name': item,
                    'type': file_type,
                    'isDirectory': False,
                    'path': relative_path,
                    'size': file_size,
                    'modified': datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat(),
                    'fullPath': f'database/{relative_path}'
                })
        
        # Ordenar: diretórios primeiro, depois arquivos, ambos alfabeticamente
        files.sort(key=lambda x: (not x['isDirectory'], x['name'].lower()))
        
        return jsonify({
            'success': True,
            'files': files,
            'currentPath': subpath
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/download/<path:filepath>')
def download_file(filepath):
    """Download de arquivo específico"""
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        database_path = os.path.join(project_root, 'database')
        file_path = os.path.join(database_path, filepath)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        if os.path.isdir(file_path):
            # Se for um diretório, criar ZIP
            return download_directory_as_zip(filepath)
        
        directory = os.path.dirname(file_path)
        filename = os.path.basename(file_path)
        
        return send_from_directory(directory, filename, as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def download_directory_as_zip(dir_path):
    """Download de diretório como ZIP"""
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        database_path = os.path.join(project_root, 'database')
        full_dir_path = os.path.join(database_path, dir_path)
        
        if not os.path.exists(full_dir_path) or not os.path.isdir(full_dir_path):
            return jsonify({'error': 'Diretório não encontrado'}), 404
        
        # Criar arquivo ZIP temporário
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Adicionar todos os arquivos do diretório recursivamente
            for root, dirs, files in os.walk(full_dir_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Calcular caminho relativo dentro do ZIP
                    arcname = os.path.relpath(file_path, full_dir_path)
                    zipf.write(file_path, arcname)
        
        # Nome do arquivo ZIP
        dir_name = os.path.basename(dir_path) if dir_path else 'database'
        zip_filename = f'{dir_name}.zip'
        
        return send_file(
            temp_zip.name,
            as_attachment=True,
            download_name=zip_filename,
            mimetype='application/zip'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/download-zip', methods=['POST'])
def download_zip():
    """Download de toda a pasta atual como ZIP"""
    try:
        data = request.get_json()
        current_path = data.get('path', '')
        include_all = data.get('includeAll', True)
        
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        database_path = os.path.join(project_root, 'database')
        full_path = os.path.join(database_path, current_path) if current_path else database_path
        
        if not os.path.exists(full_path) or not os.path.isdir(full_path):
            return jsonify({'error': 'Diretório não encontrado'}), 404
        
        # Criar arquivo ZIP temporário
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if include_all:
                # Incluir todos os arquivos da pasta atual recursivamente
                for root, dirs, files in os.walk(full_path):
                    for file in files:
                        if file.startswith('.'):
                            continue
                        file_path = os.path.join(root, file)
                        # Calcular caminho relativo
                        arcname = os.path.relpath(file_path, full_path)
                        zipf.write(file_path, arcname)
        
        # Nome do arquivo ZIP
        folder_name = os.path.basename(current_path) if current_path else 'database'
        zip_filename = f'{folder_name}-{datetime.now().strftime("%Y%m%d-%H%M%S")}.zip'
        
        return send_file(
            temp_zip.name,
            as_attachment=True,
            download_name=zip_filename,
            mimetype='application/zip'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/download-multiple', methods=['POST'])
def download_multiple():
    """Download de múltiplos arquivos/pastas selecionados como ZIP"""
    try:
        data = request.get_json()
        files_data = data.get('files', [])
        
        if not files_data:
            return jsonify({'error': 'Nenhum arquivo especificado'}), 400
        
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        database_path = os.path.join(project_root, 'database')
        
        # Criar arquivo ZIP temporário
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_data in files_data:
                file_path = file_data.get('path', '')
                is_directory = file_data.get('isDirectory', False)
                full_file_path = os.path.join(database_path, file_path)
                
                if not os.path.exists(full_file_path):
                    continue
                
                if is_directory:
                    # Adicionar diretório recursivamente
                    for root, dirs, files in os.walk(full_file_path):
                        for file in files:
                            if file.startswith('.'):
                                continue
                            file_full_path = os.path.join(root, file)
                            # Manter estrutura de pastas no ZIP
                            arcname = os.path.relpath(file_full_path, database_path)
                            zipf.write(file_full_path, arcname)
                else:
                    # Adicionar arquivo individual
                    if os.path.isfile(full_file_path):
                        zipf.write(full_file_path, file_path)
        
        # Nome do arquivo ZIP
        zip_filename = f'selected-files-{datetime.now().strftime("%Y%m%d-%H%M%S")}.zip'
        
        return send_file(
            temp_zip.name,
            as_attachment=True,
            download_name=zip_filename,
            mimetype='application/zip'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/preview/<path:filepath>')
def preview_file(filepath):
    """Pré-visualização de arquivo"""
    try:
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        database_path = os.path.join(project_root, 'database')
        file_path = os.path.join(database_path, filepath)
        
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        file_type = get_file_type(filepath)
        
        if file_type in ['image']:
            # Para imagens, servir diretamente
            directory = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            return send_from_directory(directory, filename)
        elif file_type in ['text', 'svg', 'html', 'css', 'js', 'code']:
            # Para arquivos de texto, retornar conteúdo
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Para SVG, retornar como HTML
                if file_type == 'svg':
                    return content, 200, {'Content-Type': 'image/svg+xml'}
                else:
                    return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
                    
            except UnicodeDecodeError:
                return jsonify({'error': 'Arquivo não pode ser lido como texto'}), 400
        else:
            return jsonify({'error': 'Tipo de arquivo não suportado para pré-visualização'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_file_size(bytes):
    """Formatar tamanho de arquivo"""
    if bytes == 0:
        return "0 Bytes"
    k = 1024
    sizes = ["Bytes", "KB", "MB", "GB"]
    i = 0
    while bytes >= k and i < len(sizes) - 1:
        bytes /= k
        i += 1
    return f"{bytes:.2f} {sizes[i]}"

