import os
import mimetypes
import zipfile
import tempfile
from flask import Blueprint, jsonify, send_from_directory, current_app, send_file, request
from pathlib import Path

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
        # Caminho base da pasta database
        database_path = os.path.join(current_app.static_folder, 'database')
        
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
                    'size': 'N/A',
                    'sizeInBytes': 0,
                    'lastModified': os.path.getmtime(item_path),
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
                    'size': format_file_size(file_size),
                    'sizeInBytes': file_size,
                    'lastModified': os.path.getmtime(item_path),
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
        database_path = os.path.join(current_app.static_folder, 'database')
        file_path = os.path.join(database_path, filepath)
        
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        directory = os.path.dirname(file_path)
        filename = os.path.basename(file_path)
        
        return send_from_directory(directory, filename, as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/download-zip', methods=['POST'])
def download_zip():
    """Download de múltiplos arquivos como ZIP"""
    try:
        data = request.get_json()
        file_paths = data.get('files', [])
        
        if not file_paths:
            return jsonify({'error': 'Nenhum arquivo especificado'}), 400
        
        database_path = os.path.join(current_app.static_folder, 'database')
        
        # Criar arquivo ZIP temporário
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in file_paths:
                full_file_path = os.path.join(database_path, file_path)
                
                if os.path.exists(full_file_path) and os.path.isfile(full_file_path):
                    # Adicionar arquivo ao ZIP mantendo a estrutura de pastas
                    zipf.write(full_file_path, file_path)
        
        # Enviar o arquivo ZIP
        return send_file(
            temp_zip.name,
            as_attachment=True,
            download_name=f'database_files_{int(os.time.time())}.zip',
            mimetype='application/zip'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@files_bp.route('/content/<path:filepath>')
def get_file_content(filepath):
    """Obter conteúdo de arquivo para pré-visualização"""
    try:
        database_path = os.path.join(current_app.static_folder, 'database')
        file_path = os.path.join(database_path, filepath)
        
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        file_type = get_file_type(filepath)
        
        if file_type in ['text', 'svg', 'html', 'css', 'js', 'code']:
            # Ler conteúdo de texto
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return jsonify({
                    'success': True,
                    'type': file_type,
                    'content': content
                })
            except UnicodeDecodeError:
                # Se não conseguir ler como UTF-8, tentar como binário
                return jsonify({
                    'success': False,
                    'error': 'Arquivo não pode ser lido como texto'
                })
        elif file_type in ['image', 'svg']:
            # Para imagens, retornar URL
            return jsonify({
                'success': True,
                'type': file_type,
                'url': f'/database/{filepath}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Tipo de arquivo não suportado para pré-visualização'
            })
            
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

