# Sistema de Gestão de Estoque - Refatoração Completa

## 📋 Visão Geral

Sistema refatorado para gerenciar movimentações de estoque entre almoxarifados, com controle por lote e rastreabilidade completa.

## 🗂️ Estrutura de Tabelas

### Entidades Principais

1. **LOTE** - Controle de lotes de produtos
   - IDLOTE (PK)
   - NOME_LOTE
   - DATA_FABRICACAO
   - DATA_VALIDADE
   - OBSERVACAO

2. **ALMOXARIFADO** - Locais de armazenamento
   - IDALMOX (PK)
   - ID_SETOR (FK)
   - NOMEALMO
   - LOCALIZACAO
   - TELEFONE_CONTATO
   - EMAIL_CONTATO
   - ATIVO

3. **SETOR** - Setores da instituição
   - IDSETOR (PK)
   - NOMESETOR
   - ID_TIPOPROFI

4. **PRODUTO** - Cadastro de produtos
   - IDPRODUTO (PK)
   - NOME
   - DESCRICAO
   - ID_ALMOX (FK)
   - ID_UNMEDI
   - CODBARRAS
   - TEMPIDEAL
   - STQMAX, STQMIN, PNTPEDIDO

5. **ITENS_ALMOXARIFADOS** - Saldo por almoxarifado/lote
   - IDITEM_ALMOX (PK)
   - IDALMOX (FK)
   - IDITEM (FK → PRODUTO)
   - IDLOTE (FK)
   - QUANTIDADE
   - ESTOQUE_MINIMO, ESTOQUE_MAXIMO
   - ATIVO

6. **MOVIMENTACAO_ALMOXARIFADO** - Histórico
   - IDMOV (PK)
   - IDALMOX_ORIGEM (FK)
   - IDALMOX_DESTINO (FK)
   - IDITEM (FK → PRODUTO)
   - IDLOTE_ORIGEM (FK)
   - IDLOTE_DESTINO (FK)
   - QUANTIDADE
   - DATA_MOV
   - RESPONSAVEL
   - OBSERVACAO

## 🚀 Endpoints da API

### Movimentação
- `POST /api/movimentacao/transferir` - Transferir entre almoxarifados
- `POST /api/movimentacao/entrada` - Registrar entrada de estoque
- `GET /api/movimentacao/historico` - Consultar histórico

### Almoxarifado
- `GET /api/almoxarifado` - Listar todos
- `GET /api/almoxarifado/ativos` - Listar ativos
- `GET /api/almoxarifado/{id}/saldo` - Consultar saldo
- `POST /api/almoxarifado` - Criar
- `PUT /api/almoxarifado/{id}` - Atualizar
- `DELETE /api/almoxarifado/{id}` - Excluir

### Produto
- `GET /api/produto` - Listar todos
- `GET /api/produto/{id}` - Buscar por ID
- `GET /api/produto/{id}/saldo-total` - Saldo total do produto
- `POST /api/produto` - Criar
- `PUT /api/produto/{id}` - Atualizar
- `DELETE /api/produto/{id}` - Excluir

### Lote
- `GET /api/lote` - Listar todos
- `GET /api/lote/vencidos` - Lotes vencidos
- `GET /api/lote/proximo-vencimento` - Lotes próximos do vencimento
- `POST /api/lote` - Criar
- `PUT /api/lote/{id}` - Atualizar
- `DELETE /api/lote/{id}` - Excluir

## 📝 Exemplo de Uso

### Transferir Estoque

```json
POST /api/movimentacao/transferir
{
  "idProduto": 1,
  "idAlmoxOrigem": 1,
  "idAlmoxDestino": 2,
  "idLoteOrigem": 10,
  "idLoteDestino": 10,
  "quantidade": 50,
  "responsavel": "João Silva",
  "observacao": "Transferência para farmácia"
}
```

### Registrar Entrada

```json
POST /api/movimentacao/entrada
{
  "idProduto": 1,
  "idAlmoxDestino": 1,
  "idLoteDestino": 15,
  "quantidade": 100,
  "responsavel": "Maria Santos",
  "observacao": "Compra fornecedor XYZ"
}
```

## ⚙️ Regras de Negócio

### Validações Automáticas
✅ Quantidade deve ser > 0
✅ Responsável obrigatório
✅ Produto, almoxarifado e lote devem existir
✅ Almoxarifado deve estar ativo
✅ Saldo suficiente na origem

### Transacional (@Transactional)
1. Debita da origem (se houver)
2. Credita no destino (INSERT ou UPDATE)
3. Registra histórico
4. Rollback automático em caso de erro

### Características
- **Parametrizável**: Lote de destino não é fixo
- **Rastreável**: Histórico completo de movimentações
- **Seguro**: Controle transacional garante consistência
- **Flexível**: Suporta entrada, saída e transferência
- **Auditável**: Registra quem, quando e por quê

## 🎯 Benefícios

✅ **Controle total** por lote e almoxarifado
✅ **Rastreabilidade** completa de movimentações
✅ **FIFO/FEFO** pode ser implementado facilmente
✅ **Validade** de lotes monitorada
✅ **Integridade** garantida por transações
✅ **Escalável** e fácil de manter

## 🔧 Tecnologias

- Spring Boot 3.x
- Spring Data JPA
- Lombok
- Jakarta Persistence (JPA)
- PostgreSQL/MySQL (compatível)

## 📊 Estrutura do Projeto

```
src/main/java/com/br/fasipe/estoque/
├── model/
│   ├── Lote.java
│   ├── Almoxarifado.java
│   ├── Setor.java
│   ├── Produto.java
│   ├── ItensAlmoxarifados.java
│   └── MovimentacaoAlmoxarifado.java
├── repository/
│   ├── LoteRepository.java
│   ├── AlmoxarifadoRepository.java
│   ├── SetorRepository.java
│   ├── ProdutoRepository.java
│   ├── ItensAlmoxarifadosRepository.java
│   └── MovimentacaoAlmoxarifadoRepository.java
├── service/
│   └── MovimentacaoService.java
├── controller/
│   ├── MovimentacaoController.java
│   ├── AlmoxarifadoController.java
│   ├── ProdutoController.java
│   └── LoteController.java
└── exception/
    ├── EntidadeNaoEncontradaException.java
    ├── EstoqueInsuficienteException.java
    ├── OperacaoInvalidaException.java
    └── GlobalExceptionHandler.java
```

## 🚦 Como Executar

```bash
# Compilar
mvn clean install

# Executar
mvn spring-boot:run
```

## 📚 Documentação

A API segue os padrões REST e retorna:
- **200 OK** - Operação bem-sucedida
- **201 Created** - Recurso criado
- **400 Bad Request** - Dados inválidos
- **404 Not Found** - Entidade não encontrada
- **409 Conflict** - Estoque insuficiente
- **500 Internal Server Error** - Erro interno

Todas as exceções retornam JSON com:
```json
{
  "timestamp": "2025-11-15T10:30:00",
  "status": 409,
  "erro": "Estoque insuficiente",
  "mensagem": "Estoque insuficiente. Disponível: 30, Solicitado: 50"
}
```
