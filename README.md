# Database Viewer

Um visualizador de arquivos web moderno e responsivo para explorar o conteúdo da pasta database.

## Funcionalidades

- ✅ **Visualização de Imagens Reais**: Exibe a imagem real de arquivos PNG, JPG, SVG e outros formatos de imagem em vez de ícones genéricos
- 📁 Navegação por pastas
- 🖼️ Pré-visualização de arquivos (imagens, texto, código)
- 📥 Download de arquivos individuais ou múltiplos
- 📦 Download como ZIP
- 🔍 Visualização em grade ou lista
- 📱 Interface responsiva
- ⚡ Auto-refresh para detectar mudanças

## Como Usar

1. Instale as dependências:
```bash
pip install flask flask-cors flask-sqlalchemy
```

2. Execute a aplicação:
```bash
python3 src/main.py
```

3. Acesse no navegador:
```
http://localhost:5000
```

## Estrutura do Projeto

```
DataBase-Viewer-Final/
├── src/
│   ├── main.py              # Aplicação Flask principal
│   ├── models/
│   │   └── user.py          # Modelos de dados
│   ├── routes/
│   │   ├── files.py         # Rotas para manipulação de arquivos
│   │   └── user.py          # Rotas de usuário
│   ├── static/
│   │   ├── index.html       # Interface principal
│   │   ├── script.js        # JavaScript com funcionalidade de thumbnails
│   │   └── styles.css       # Estilos CSS
│   └── database/            # Pasta de arquivos para visualização
└── README.md
```

## Modificações Implementadas

### Exibição de Imagens Reais

O sistema agora exibe a imagem real dos arquivos em vez de ícones genéricos para:
- PNG, JPG, JPEG, GIF, BMP, WebP
- SVG
- Outros formatos de imagem

### Código Modificado

**script.js**: Funções `getFileIcon()` e `getFileIconClass()` foram modificadas para retornar elementos `<img>` que carregam a imagem real via API `/api/files/preview/`.

**styles.css**: Adicionados estilos para `.file-thumbnail` com efeitos hover e responsividade.

## Tecnologias

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados**: SQLite (SQLAlchemy)
- **Estilo**: CSS Grid/Flexbox responsivo

## Autor

Desenvolvido com modificações para exibir imagens reais em vez de ícones genéricos.

