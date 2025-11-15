p # API REST - Sistema de Estoque com Lotes e Almoxarifados

**Base URL:** `http://localhost:8080`

## ✅ Configurações Frontend

- ✅ **CORS habilitado** para:
  - `http://localhost:3000` (React/Next.js)
  - `http://localhost:4200` (Angular)
  - `http://localhost:5173` (Vite)
- ✅ **CSRF desabilitado** (facilitado para desenvolvimento)
- ✅ **Autenticação desabilitada** (temporariamente)
- ✅ Todos os métodos HTTP permitidos: GET, POST, PUT, DELETE, OPTIONS, PATCH

---

## 📦 1. Almoxarifados

### 1.1 Listar todos os almoxarifados
```http
GET /api/almoxarifado
```
**Resposta:** Array de almoxarifados

### 1.2 Listar almoxarifados ativos
```http
GET /api/almoxarifado/ativos
```

### 1.3 Buscar almoxarifado por ID
```http
GET /api/almoxarifado/{id}
```

### 1.4 Consultar saldo de um almoxarifado
```http
GET /api/almoxarifado/{id}/saldo
```
**Resposta:** Array de itens com estoque disponível

### 1.5 Criar almoxarifado
```http
POST /api/almoxarifado
Content-Type: application/json

{
  "descricao": "Almoxarifado Central",
  "idSetor": 1,
  "responsavel": "João Silva",
  "telefone": "(67) 3321-5500",
  "email": "almox.central@empresa.com",
  "ativo": true
}
```

### 1.6 Atualizar almoxarifado
```http
PUT /api/almoxarifado/{id}
Content-Type: application/json

{
  "descricao": "Almoxarifado Central Atualizado",
  "idSetor": 1,
  "ativo": true
}
```

### 1.7 Excluir almoxarifado
```http
DELETE /api/almoxarifado/{id}
```

---

## 🏷️ 2. Produtos

### 2.1 Listar todos os produtos
```http
GET /api/produto
```

### 2.2 Buscar produto por ID
```http
GET /api/produto/{id}
```

### 2.3 Consultar saldo total de um produto (soma de todos os almoxarifados)
```http
GET /api/produto/{id}/saldo-total
```
**Resposta:**
```json
{
  "produtoId": 10,
  "quantidadeTotal": 1500
}
```

### 2.4 Criar produto
```http
POST /api/produto
Content-Type: application/json

{
  "nome": "Parafuso M8 x 50mm",
  "descricao": "Parafuso sextavado aço carbono",
  "unidadeMedida": "UN",
  "estoqueMinimo": 100,
  "estoqueMaximo": 5000
}
```

### 2.5 Atualizar produto
```http
PUT /api/produto/{id}
Content-Type: application/json
```

### 2.6 Excluir produto
```http
DELETE /api/produto/{id}
```

---

## 📅 3. Lotes

### 3.1 Listar todos os lotes
```http
GET /api/lote
```

### 3.2 Buscar lote por ID
```http
GET /api/lote/{id}
```

### 3.3 Listar lotes vencidos
```http
GET /api/lote/vencidos
```
**Uso:** Alertas de lotes vencidos

### 3.4 Listar lotes próximos ao vencimento (30 dias)
```http
GET /api/lote/proximo-vencimento
```
**Uso:** Dashboard de alertas

### 3.5 Criar lote
```http
POST /api/lote
Content-Type: application/json

{
  "numero": "LOTE-2025-001",
  "dataFabricacao": "2025-01-15",
  "dataValidade": "2026-01-15",
  "observacao": "Recebido do fornecedor XYZ"
}
```

### 3.6 Atualizar lote
```http
PUT /api/lote/{id}
Content-Type: application/json
```

### 3.7 Excluir lote
```http
DELETE /api/lote/{id}
```

---

## 🔄 4. Movimentação de Estoque (PRINCIPAL)

### 4.1 Transferir estoque entre almoxarifados
```http
POST /api/movimentacao/transferir
Content-Type: application/json

{
  "idProduto": 10,
  "idAlmoxOrigem": 1,
  "idAlmoxDestino": 2,
  "idLoteOrigem": 5,
  "idLoteDestino": 5,
  "quantidade": 100,
  "responsavel": "João Silva",
  "observacao": "Transferência para filial Norte"
}
```

**Campos:**
- `idLoteOrigem` e `idLoteDestino`: podem ser iguais (mesmo lote) ou diferentes (troca de lote)
- `quantidade`: deve ser > 0
- `responsavel`: obrigatório
- `observacao`: opcional

**Validações automáticas:**
- ✅ Verifica se há estoque suficiente no almoxarifado de origem
- ✅ Debita do estoque de origem
- ✅ Credita no estoque de destino
- ✅ Registra a movimentação com timestamp automático
- ✅ Transação atômica (tudo ou nada)

**Resposta de Sucesso (201):**
```json
{
  "id": 123,
  "idProduto": 10,
  "idAlmoxOrigem": 1,
  "idAlmoxDestino": 2,
  "idLoteOrigem": 5,
  "idLoteDestino": 5,
  "quantidade": 100,
  "responsavel": "João Silva",
  "observacao": "Transferência para filial Norte",
  "dataHora": "2025-11-15T14:30:00"
}
```

**Erros possíveis:**
- `400 Bad Request`: Estoque insuficiente
- `404 Not Found`: Produto, almoxarifado ou lote não encontrado

### 4.2 Registrar entrada de estoque (sem origem)
```http
POST /api/movimentacao/entrada
Content-Type: application/json

{
  "idProduto": 10,
  "idAlmoxDestino": 1,
  "idLoteDestino": 5,
  "quantidade": 500,
  "responsavel": "Maria Santos",
  "observacao": "Recebimento de compra - NF 12345"
}
```

**Uso:** Recebimento de compras, produção, ajustes de inventário

### 4.3 Consultar histórico de movimentações
```http
GET /api/movimentacao/historico
```

**Com filtro por almoxarifado:**
```http
GET /api/movimentacao/historico?almoxarifadoId=1
```

**Resposta:**
```json
[
  {
    "id": 123,
    "idProduto": 10,
    "idAlmoxOrigem": 1,
    "idAlmoxDestino": 2,
    "quantidade": 100,
    "responsavel": "João Silva",
    "dataHora": "2025-11-15T14:30:00"
  }
]
```

---

## 🎯 Exemplos de Uso no Frontend

### Exemplo React/TypeScript - Transferir Estoque

```typescript
interface TransferenciaRequest {
  idProduto: number;
  idAlmoxOrigem: number;
  idAlmoxDestino: number;
  idLoteOrigem: number;
  idLoteDestino: number;
  quantidade: number;
  responsavel: string;
  observacao?: string;
}

async function transferirEstoque(dados: TransferenciaRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/movimentacao/transferir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados)
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.message || 'Erro na transferência');
    }

    const movimentacao = await response.json();
    return movimentacao;
  } catch (error) {
    console.error('Erro ao transferir estoque:', error);
    throw error;
  }
}

// Uso:
transferirEstoque({
  idProduto: 10,
  idAlmoxOrigem: 1,
  idAlmoxDestino: 2,
  idLoteOrigem: 5,
  idLoteDestino: 5,
  quantidade: 100,
  responsavel: 'João Silva',
  observacao: 'Transferência urgente'
});
```

### Exemplo React - Listar Lotes Próximos ao Vencimento

```typescript
async function buscarLotesVencendo() {
  const response = await fetch('http://localhost:8080/api/lote/proximo-vencimento');
  const lotes = await response.json();
  return lotes;
}

// Uso em componente:
useEffect(() => {
  buscarLotesVencendo().then(lotes => {
    setAlertasVencimento(lotes);
  });
}, []);
```

### Exemplo Angular - Consultar Saldo de Almoxarifado

```typescript
// service
consultarSaldoAlmoxarifado(almoxarifadoId: number): Observable<ItensAlmoxarifado[]> {
  return this.http.get<ItensAlmoxarifado[]>(
    `http://localhost:8080/api/almoxarifado/${almoxarifadoId}/saldo`
  );
}

// component
this.almoxarifadoService.consultarSaldoAlmoxarifado(1)
  .subscribe(itens => {
    this.itensEstoque = itens;
  });
```

---

## 🔒 Tratamento de Erros

Todos os endpoints retornam erros padronizados:

### Formato de Erro
```json
{
  "timestamp": "2025-11-15T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Estoque insuficiente no almoxarifado de origem",
  "path": "/api/movimentacao/transferir"
}
```

### Códigos HTTP
- `200 OK`: Operação bem-sucedida (GET, PUT)
- `201 Created`: Recurso criado com sucesso (POST)
- `204 No Content`: Exclusão bem-sucedida (DELETE)
- `400 Bad Request`: Dados inválidos ou regra de negócio violada
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

---

## 🔍 Regras de Negócio Implementadas

### Transferência de Estoque
1. ✅ Quantidade deve ser maior que zero
2. ✅ Produto, almoxarifados e lotes devem existir
3. ✅ Estoque de origem deve ter quantidade suficiente
4. ✅ Débito e crédito acontecem na mesma transação (atomicidade)
5. ✅ Histórico completo de todas as movimentações
6. ✅ Timestamp automático em cada movimentação

### Entrada de Estoque
1. ✅ Cria novo registro de estoque se não existir
2. ✅ Incrementa estoque existente
3. ✅ Não valida estoque mínimo/máximo (compras podem exceder)

### Alertas de Lotes
1. ✅ Lote vencido: `dataValidade < hoje`
2. ✅ Próximo ao vencimento: `hoje <= dataValidade <= hoje + 30 dias`

---

## 📊 Dashboard Sugerido

### Indicadores Úteis
1. **Total de produtos em estoque** - `GET /api/produto`
2. **Lotes vencidos** - `GET /api/lote/vencidos` (badge vermelho)
3. **Lotes próximos ao vencimento** - `GET /api/lote/proximo-vencimento` (badge amarelo)
4. **Almoxarifados ativos** - `GET /api/almoxarifado/ativos`
5. **Histórico recente** - `GET /api/movimentacao/historico` (últimas 10)

### Telas Recomendadas
- Dashboard com KPIs e alertas
- Listagem de produtos com saldo total
- Gestão de almoxarifados
- Formulário de transferência entre almoxarifados
- Registro de entrada de estoque
- Consulta de histórico de movimentações
- Relatório de lotes (vencidos e a vencer)

---

## 🚀 Status do Sistema

✅ **Sistema 100% funcional**
- Backend rodando em `http://localhost:8080`
- Banco MySQL conectado
- Todas as validações implementadas
- CORS configurado para frontend
- Transações atômicas garantidas
- Exception handling global

**Pronto para integração com frontend React, Angular, Vue ou qualquer framework!**
