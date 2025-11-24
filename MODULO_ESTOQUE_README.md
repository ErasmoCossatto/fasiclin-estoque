# 📦 Módulo de Controle de Estoque - FasiClin

> **Sistema unificado de gerenciamento de movimentações e transferências de lotes entre almoxarifados**

## 📋 Visão Geral

Este é um módulo completo e independente de controle de estoque, pronto para ser integrado em sistemas maiores. Gerencia:

- ✅ Movimentações de entrada/saída
- ✅ Transferências entre almoxarifados
- ✅ Transferências de lotes (com split automático)
- ✅ Controle de validade de lotes
- ✅ Rastreabilidade completa

## 🎯 Funcionalidades Principais

### 1. **Movimentações de Estoque**
- Registro de entradas e saídas
- Transferências entre almoxarifados
- Validação de estoque em tempo real
- Histórico completo com paginação

### 2. **Transferência de Lotes** 🆕
- Visualização de lotes disponíveis por almoxarifado
- Filtro por almoxarifado
- Indicadores de validade (vencido, próximo ao vencimento, válido)
- **Transferência TOTAL**: Move o lote inteiro
- **Transferência PARCIAL**: Cria novo lote derivado (split automático)
- Validação em tempo real

### 3. **Interface Unificada**
- Design Apple-inspired moderno
- Responsivo (desktop e mobile)
- Modais fluidos com animações
- Feedback visual claro

## 🏗️ Arquitetura

```
fasiclin-estoque/
├── frontend/
│   ├── movimentacao.html           # Interface principal (TUDO INTEGRADO)
│   └── assets/
│       ├── css/
│       │   ├── global.css          # Estilos globais
│       │   ├── movimentacao.css    # Estilos do módulo
│       │   └── responsive.css      # Mobile-friendly
│       └── js/
│           ├── ApiManager.js       # Gerenciador de APIs
│           └── MovimentacaoManager.js  # Lógica principal (UNIFICADA)
│
└── src/main/java/com/br/fasipe/estoque/
    ├── controller/
    │   └── MovimentacaoController.java
    ├── service/
    │   ├── MovimentacaoService.java           # Movimentações gerais
    │   └── TransferenciaLoteService.java      # Transferências de lotes
    ├── model/
    │   ├── MovimentacaoAlmoxarifado.java
    │   ├── Lote.java
    │   ├── ItensAlmoxarifados.java
    │   └── ...
    └── repository/
        └── ...
```

## 🚀 Como Executar

### **Backend (Spring Boot)**

```bash
# Navegar até o diretório do projeto
cd "c:\Users\Erasmo\Desktop\Projeto Estoque\fasiclin-estoque"

# Compilar e executar
mvn spring-boot:run
```

**Servidor roda em**: `http://localhost:8080`

### **Frontend**

Abrir no navegador:
```
http://localhost:8080/frontend/movimentacao.html
```

## 📖 Guia de Uso

### **1. Criar Movimentação Regular**

1. Clique em **"➕ Nova Movimentação"**
2. Selecione o produto
3. Escolha origem e destino
4. Defina o tipo (ENTRADA/SAÍDA)
5. Digite a quantidade
6. Salve

### **2. Transferir Lote entre Almoxarifados**

1. Clique em **"🔄 Transferir Lote"**
2. **Selecione um lote** na lista (lado esquerdo)
   - Veja informações detalhadas
   - Status de validade
   - Quantidade disponível
3. Escolha o **almoxarifado de destino**
4. Digite a **quantidade** a transferir
5. Informe o **responsável**
6. Adicione **observações** (opcional)
7. Clique em **"✅ Transferir Lote"**

### **3. Filtrar Lotes**

Use o dropdown "Filtrar por Almoxarifado" para ver apenas lotes de um local específico.

## 🎨 Regras de Negócio

### **Transferência de Lotes**

#### **Cenário 1: Transferência TOTAL**
- Quantidade solicitada = Quantidade disponível
- **Resultado**: Lote inteiro é movido (mesmo ID de lote)
- Estoque origem fica zerado

#### **Cenário 2: Transferência PARCIAL**
- Quantidade solicitada < Quantidade disponível
- **Resultado**: Sistema faz "split" do lote
  - Lote origem: quantidade reduzida
  - Lote destino: **novo lote derivado** criado
- Rastreabilidade mantida

### **Validações**

- ✅ Origem ≠ Destino
- ✅ Quantidade > 0
- ✅ Quantidade ≤ Disponível
- ✅ Responsável obrigatório
- ✅ Produto e almoxarifado ativos

## 🔌 Endpoints da API

### **Movimentações**

```http
GET    /movimentacao/historico
POST   /movimentacao/entre-setores
DELETE /movimentacao/{id}
```

### **Transferência de Lotes**

```http
GET  /movimentacao/lotes-disponiveis
GET  /movimentacao/lotes-disponiveis?almoxarifadoId={id}
POST /movimentacao/transferir-lote
```

**Payload de Transferência**:
```json
{
  "idLoteOrigem": 1,
  "idAlmoxOrigem": 2,
  "idAlmoxDestino": 3,
  "quantidade": 50,
  "responsavel": "João Silva",
  "observacao": "Transferência urgente"
}
```

## 💡 Indicadores Visuais

### **Status de Validade de Lotes**

- 🟢 **Verde**: Dentro da validade (✅)
- 🟡 **Amarelo**: Próximo ao vencimento (⚠️ Próx. venc.)
- 🔴 **Vermelho**: Vencido (⚠️ VENCIDO)

### **Mensagens de Validação**

- ✅ **Verde**: Operação permitida
- ⚠️ **Amarelo**: Aviso importante
- ❌ **Vermelho**: Operação bloqueada

## 🛠️ Tecnologias Utilizadas

### **Backend**
- Java 17+
- Spring Boot 3.x
- Spring Data JPA
- Hibernate
- PostgreSQL / MySQL
- Lombok

### **Frontend**
- HTML5
- CSS3 (Flexbox, Grid, Animations)
- Vanilla JavaScript (ES6+)
- Fetch API
- Design System Apple-inspired

## 📊 Modelo de Dados (Simplificado)

```sql
-- Movimentações
MovimentacaoAlmoxarifado
├── id
├── almoxarifadoOrigem
├── almoxarifadoDestino
├── produto
├── loteOrigem
├── loteDestino
├── quantidade
├── dataMovimentacao
└── responsavel

-- Lotes
Lote
├── id
├── nomeLote
├── dataValidade
├── produto
└── ativo

-- Estoque por Almoxarifado
ItensAlmoxarifados
├── id
├── almoxarifado
├── produto
├── lote
├── quantidade
└── ativo
```

## 🔐 Segurança

- Validações server-side em todos os endpoints
- Transações ACID no banco de dados
- Controle de integridade referencial
- Logs detalhados de operações

## 🧪 Testando

### **Cenário de Teste Completo**

1. **Criar produtos e almoxarifados** (via API ou interface)
2. **Popular estoque inicial** com lotes
3. **Testar movimentação regular**: Entrada → Almox A
4. **Testar transferência total**: Mover lote completo de A → B
5. **Testar transferência parcial**: Mover parte do lote de B → C
6. **Verificar histórico**: Conferir todas as operações registradas

## 📈 Melhorias Futuras (Roadmap)

- [ ] Dashboard com gráficos e métricas
- [ ] Relatórios em PDF/Excel
- [ ] Alertas automáticos de vencimento
- [ ] Integração com código de barras
- [ ] App mobile nativo
- [ ] API REST completa (Swagger/OpenAPI)

## 🤝 Integração com Sistemas Maiores

Este módulo foi projetado para ser **plug-and-play**:

1. **Rota Única**: Tudo em `movimentacao.html`
2. **API RESTful**: Fácil integração backend
3. **Estilos Isolados**: Não conflita com outros sistemas
4. **JavaScript Modular**: Gerenciadores independentes

### **Como Integrar**:

```html
<!-- No seu sistema principal -->
<iframe src="/modulos/estoque/movimentacao.html"></iframe>

<!-- OU -->
<a href="/modulos/estoque/movimentacao.html">Ir para Estoque</a>
```

## 📞 Suporte

Para dúvidas ou sugestões, consulte a documentação técnica em:
- `INTEGRACAO_TRANSFERENCIA_LOTES.md`
- `API_FRONTEND.md`

---

**Versão**: 2.0.0 (Unificada)  
**Data**: 23/11/2025  
**Status**: ✅ Produção Ready
