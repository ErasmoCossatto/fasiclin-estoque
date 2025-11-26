-- Script para atualizar os itens de estoque para produtos reais (Papel Higiênico, Soro, Canetas)
-- Isso facilita os testes e a visualização no frontend.

-- 1. Atualizar o registro 3 (Lote 3) para Item 2 (Papel Higiênico)
UPDATE ITENS_ALMOXARIFADOS SET IDITEM = 2 WHERE IDITEM_ALMOX = 3;
UPDATE LOTE SET IDITEM = 2 WHERE IDLOTE = 3;

-- 2. Atualizar o registro 4 (Lote 20) para Item 3 (Soro)
UPDATE ITENS_ALMOXARIFADOS SET IDITEM = 3 WHERE IDITEM_ALMOX = 4;
UPDATE LOTE SET IDITEM = 3 WHERE IDLOTE = 20;

-- 3. Atualizar os registros 5 e 6 (Lote 1) para Item 4 (Canetas)
-- Nota: Como o Lote 1 é usado em dois almoxarifados (IDs 5 e 6), ambos passarão a ser "Canetas"
UPDATE ITENS_ALMOXARIFADOS SET IDITEM = 4 WHERE IDITEM_ALMOX IN (5, 6);
UPDATE LOTE SET IDITEM = 4 WHERE IDLOTE = 1;

-- 4. (Opcional) Atualizar histórico de movimentações para manter consistência
-- Se houver movimentações antigas desses lotes, elas também passarão a apontar para os novos itens
UPDATE MOVIMENTACAO_ALMOXARIFADO SET IDITEM = 2 WHERE IDLOTE_ORIGEM = 3 OR IDLOTE_DESTINO = 3;
UPDATE MOVIMENTACAO_ALMOXARIFADO SET IDITEM = 3 WHERE IDLOTE_ORIGEM = 20 OR IDLOTE_DESTINO = 20;
UPDATE MOVIMENTACAO_ALMOXARIFADO SET IDITEM = 4 WHERE IDLOTE_ORIGEM = 1 OR IDLOTE_DESTINO = 1;

-- Verificar os resultados
SELECT * FROM ITENS_ALMOXARIFADOS;
