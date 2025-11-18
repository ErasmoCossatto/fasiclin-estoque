# Script de Configuração Inicial - Sistema de Estoque Fasiclin

## 📋 Ordem de Execução

### 1️⃣ Criar Novos Almoxarifados
Execute o arquivo: `01-criar-almoxarifados.sql`

**Resultado esperado:**
- 3 almoxarifados ativos: TESTE, FASICLIN, FASIPE

### 2️⃣ Popular Itens dos Almoxarifados (OPCIONAL)
Execute o arquivo: `02-popular-itens-almoxarifados.sql`

**⚠️ IMPORTANTE:** Ajuste os IDs antes de executar!
- Verifique os IDs reais dos almoxarifados criados
- Ajuste os IDs dos produtos (IDITEM)
- Confirme os IDs dos lotes (IDLOTE)

**Resultado esperado:**
- Alguns produtos distribuídos entre os 3 almoxarifados para teste

---

## 🧪 Como Testar a Movimentação

### Teste 1: Verificar Almoxarifados Disponíveis
```
GET http://localhost:8080/api/almoxarifado/ativos
```

**Resposta esperada:**
```json
[
  {"id": 1, "nome": "TESTE", "ativo": true},
  {"id": 2, "nome": "FASICLIN", "ativo": true},
  {"id": 3, "nome": "FASIPE", "ativo": true}
]
```

### Teste 2: Consultar Estoque de um Almoxarifado
```
GET http://localhost:8080/api/almoxarifado/1/saldo
```

### Teste 3: Verificar Disponibilidade para Transferência
```
GET http://localhost:8080/api/estoque/verificar-disponibilidade?almoxarifadoId=1&produtoId=1&loteId=1&quantidade=10
```

**Resposta esperada:**
```json
{
  "disponivel": true,
  "quantidadeDisponivel": 50,
  "quantidadeSolicitada": 10
}
```

### Teste 4: Realizar Transferência Entre Almoxarifados
```
POST http://localhost:8080/api/movimentacao/transferir
Content-Type: application/json

{
  "idProduto": 1,
  "idAlmoxOrigem": 1,
  "idAlmoxDestino": 2,
  "idLoteOrigem": 1,
  "idLoteDestino": 1,
  "quantidade": 10,
  "responsavel": "Seu Nome",
  "observacao": "Teste de transferência"
}
```

### Teste 5: Consultar Histórico
```
GET http://localhost:8080/api/movimentacao/historico
```

---

## 📊 Resultado Esperado das Transferências

**Antes da transferência:**
- TESTE (Almox 1): 50 unidades do Produto 1, Lote 1
- FASICLIN (Almox 2): 30 unidades do Produto 1, Lote 1

**Após transferir 10 unidades de TESTE → FASICLIN:**
- TESTE (Almox 1): 40 unidades (-10)
- FASICLIN (Almox 2): 40 unidades (+10)

---

## ⚠️ Observações Importantes

1. **Os lotes existentes no banco NÃO têm ID_PRODUTO**
   - Você precisará ajustar manualmente no script `02-popular-itens-almoxarifados.sql`
   - Ou criar novos lotes via sistema com produto associado

2. **Frontend:** 
   - Ao abrir a tela de movimentação, os 3 almoxarifados devem aparecer nos selects
   - Você escolhe origem, destino, produto, lote e quantidade

3. **Validações:**
   - Sistema verifica se há estoque suficiente
   - Mensagens de erro são claras e informativas
   - Transação é atômica (ou tudo acontece, ou nada)

---

## 🚀 Próximos Passos

1. Execute `01-criar-almoxarifados.sql` no banco
2. (Opcional) Execute `02-popular-itens-almoxarifados.sql` ajustado
3. Reinicie a aplicação Spring Boot
4. Abra a tela de movimentação no navegador
5. Teste as transferências!
