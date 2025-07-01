# 🚀 Instruções de Deploy - Database Viewer

## 📋 Pré-requisitos

- Python 3.7 ou superior
- pip (gerenciador de pacotes Python)
- Sistema operacional: Windows, macOS ou Linux

## 🛑 Como Matar o Processo Anterior

### No Windows:
```cmd
# Encontrar o processo Python rodando na porta 5000
netstat -ano | findstr :5000

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# Ou matar todos os processos Python
taskkill /IM python.exe /F
```

### No Linux/macOS:
```bash
# Encontrar o processo na porta 5000
lsof -i :5000

# Matar o processo (substitua PID pelo número encontrado)
kill -9 <PID>

# Ou matar todos os processos Python
pkill -f python

# Ou usar fuser para matar processo na porta
fuser -k 5000/tcp
```

### Método Universal (se souber o PID):
```bash
# Se você souber o PID do processo
kill <PID>

# Forçar encerramento
kill -9 <PID>
```

## 🚀 Instalação e Execução

### Passo 1: Preparar o Ambiente
```bash
# Navegar até o diretório do projeto
cd DataBase-Teste-Modified

# (Opcional) Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# No Windows:
venv\Scripts\activate
# No Linux/macOS:
source venv/bin/activate
```

### Passo 2: Instalar Dependências
```bash
# Instalar dependências do projeto
pip install -r requirements.txt

# Se der erro, instalar manualmente:
pip install flask flask-cors flask-sqlalchemy
```

### Passo 3: Executar a Aplicação
```bash
# Navegar para o diretório src
cd src

# Executar a aplicação
python main.py
```

### Passo 4: Acessar a Aplicação
- Abra seu navegador
- Acesse: `http://localhost:5000`
- A aplicação estará rodando!

## 🔧 Configurações Avançadas

### Alterar Porta (se necessário)
Edite o arquivo `src/main.py` na última linha:
```python
# Alterar de:
app.run(host='0.0.0.0', port=5000, debug=True)

# Para (exemplo porta 8080):
app.run(host='0.0.0.0', port=8080, debug=True)
```

### Configurar Pasta Database
1. Crie uma pasta chamada `database` em `src/static/`
2. Coloque seus arquivos nesta pasta
3. A aplicação detectará automaticamente

### Modo Produção
Para executar em produção, altere `debug=False`:
```python
app.run(host='0.0.0.0', port=5000, debug=False)
```

## 🐛 Solução de Problemas

### Erro: "Porta já em uso"
```bash
# Verificar qual processo está usando a porta
netstat -tulpn | grep :5000  # Linux
netstat -ano | findstr :5000  # Windows

# Matar o processo conforme instruções acima
```

### Erro: "Módulo não encontrado"
```bash
# Reinstalar dependências
pip install --upgrade -r requirements.txt

# Ou instalar individualmente
pip install flask flask-cors flask-sqlalchemy
```

### Erro: "Permissão negada"
```bash
# Linux/macOS - executar com sudo se necessário
sudo python main.py

# Ou alterar permissões da pasta
chmod -R 755 DataBase-Teste-Modified
```

### Pasta database não aparece
1. Verifique se existe `src/static/database/`
2. Adicione alguns arquivos de teste
3. Reinicie a aplicação

## 📁 Estrutura de Arquivos

```
DataBase-Teste-Modified/
├── src/
│   ├── static/
│   │   ├── database/          # 👈 COLOQUE SEUS ARQUIVOS AQUI
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── script.js
│   │   └── favicon.ico
│   ├── routes/
│   ├── models/
│   └── main.py               # 👈 ARQUIVO PRINCIPAL
├── requirements.txt
└── README.md
```

## 🎯 Funcionalidades Disponíveis

### ✅ Seleção de Arquivos
- **Ctrl+A**: Selecionar todos
- **Ctrl+D**: Baixar selecionados
- **Delete**: Limpar seleção
- **Escape**: Fechar modais

### ✅ Downloads
- Arquivos individuais
- Múltiplos arquivos como ZIP
- Pastas completas com estrutura
- Toda a pasta atual como ZIP

### ✅ Interface
- Visualização em grade ou lista
- Checkboxes sempre visíveis
- Pré-visualização de arquivos
- Design responsivo

## 🔄 Atualizações Futuras

Para atualizar o projeto:
1. Pare a aplicação (Ctrl+C)
2. Substitua os arquivos
3. Reinstale dependências se necessário
4. Reinicie a aplicação

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme que a porta 5000 está livre
3. Verifique se a pasta `database` existe
4. Consulte os logs no terminal para erros específicos

## 🎉 Pronto!

Sua aplicação Database Viewer melhorada está funcionando com:
- ✅ Seleção múltipla (Ctrl+A)
- ✅ Download de pastas
- ✅ Interface moderna
- ✅ Checkboxes visíveis
- ✅ Atalhos de teclado

