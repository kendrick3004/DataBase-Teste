# Database Viewer - Versão Melhorada

## Descrição

Esta é uma versão melhorada do Database Viewer com funcionalidades aprimoradas de seleção e download de arquivos e pastas.

## Novas Funcionalidades

### ✨ Melhorias de Design
- Interface mais moderna com gradientes e animações
- Efeitos visuais aprimorados nos cards e botões
- Melhor responsividade para dispositivos móveis
- Indicadores visuais de progresso para downloads

### 🎯 Funcionalidades de Seleção
- **Ctrl+A**: Seleciona todos os arquivos e pastas
- **Ctrl+D**: Baixa os arquivos selecionados
- **Delete**: Limpa a seleção atual
- **Escape**: Fecha modais abertos
- Checkboxes visíveis em todos os itens
- Seleção múltipla com indicadores visuais

### 📁 Download de Pastas
- Download de pastas completas como ZIP
- Preservação da estrutura de diretórios
- Download de múltiplos itens selecionados
- Barra de progresso durante downloads

### 🔧 Melhorias Técnicas
- API aprimorada para suporte a pastas
- Melhor tratamento de erros
- Pré-visualização melhorada de arquivos
- Auto-refresh da lista de arquivos

## Estrutura do Projeto

```
DataBase-Teste-Modified/
├── src/
│   ├── static/
│   │   ├── index.html          # Interface principal
│   │   ├── styles.css          # Estilos melhorados
│   │   ├── script.js           # JavaScript com novas funcionalidades
│   │   ├── favicon.ico         # Ícone do site
│   │   └── database/           # Pasta de arquivos
│   ├── routes/
│   │   ├── files.py            # API melhorada para arquivos
│   │   └── user.py             # Rotas de usuário
│   ├── models/
│   │   └── user.py             # Modelos de dados
│   └── main.py                 # Aplicação principal
├── requirements.txt            # Dependências Python
└── README.md                   # Esta documentação
```

## Instalação e Execução

### Pré-requisitos
- Python 3.7+
- pip (gerenciador de pacotes Python)

### Passos para Instalação

1. **Clone ou extraia o projeto**
2. **Navegue até o diretório do projeto**
3. **Instale as dependências**
4. **Execute a aplicação**

Veja o arquivo `DEPLOY_INSTRUCTIONS.md` para instruções detalhadas.

## Atalhos de Teclado

| Atalho | Função |
|--------|--------|
| `Ctrl+A` | Selecionar todos os arquivos |
| `Ctrl+D` | Baixar arquivos selecionados |
| `Delete` | Limpar seleção |
| `Escape` | Fechar modal |

## Funcionalidades da Interface

### Seleção de Arquivos
- Clique nos checkboxes para seleção individual
- Use "Selecionar Todos" para selecionar tudo
- Indicador visual mostra quantos itens estão selecionados

### Downloads
- **Baixar Selecionados**: Baixa apenas os itens marcados
- **Baixar ZIP**: Baixa toda a pasta atual como ZIP
- **Download de Pastas**: Clique em uma pasta para baixá-la completa

### Visualizações
- **Grade**: Visualização em cards com ícones
- **Lista**: Visualização em tabela com detalhes

### Pré-visualização
- Clique em arquivos para pré-visualizar
- Suporte para imagens, textos, SVG e código
- Modal com opção de download direto

## API Endpoints

### Listar Arquivos
- `GET /api/files/list` - Lista arquivos da raiz
- `GET /api/files/list/<path>` - Lista arquivos de uma subpasta

### Downloads
- `GET /api/files/download/<path>` - Download de arquivo ou pasta
- `POST /api/files/download-zip` - Download da pasta atual como ZIP
- `POST /api/files/download-multiple` - Download de múltiplos itens

### Pré-visualização
- `GET /api/files/preview/<path>` - Pré-visualização de arquivo

## Tecnologias Utilizadas

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados**: SQLite (opcional)
- **Compressão**: zipfile (Python)

## Melhorias Implementadas

1. **Interface Moderna**: Design atualizado com gradientes e animações
2. **Seleção Avançada**: Ctrl+A e outros atalhos de teclado
3. **Download de Pastas**: Suporte completo para download de diretórios
4. **Checkboxes Visíveis**: Sempre visíveis para facilitar seleção
5. **Progresso Visual**: Barras de progresso para downloads
6. **Responsividade**: Melhor suporte para dispositivos móveis
7. **API Robusta**: Endpoints melhorados para todas as funcionalidades

## Licença

Este projeto é uma versão melhorada do Database Viewer original.

