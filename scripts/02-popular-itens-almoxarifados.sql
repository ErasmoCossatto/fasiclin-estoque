-- =====================================================
-- Script: Popular ITENS_ALMOXARIFADOS para Testes
-- Descrição: Distribui alguns lotes entre os almoxarifados
-- =====================================================

-- IMPORTANTE: Ajuste os IDs conforme necessário
-- Este script assume que você tem produtos e lotes já cadastrados

-- Exemplo: Distribuir Lote 1 (assumindo que é produto 1 - Esparadrapo)
-- Coloque 50 unidades no TESTE, 30 no FASICLIN, 20 no FASIPE
INSERT INTO ITENS_ALMOXARIFADOS (IDALMOX, IDITEM, IDLOTE, QUANTIDADE, ESTOQUE_MINIMO, ESTOQUE_MAXIMO, ATIVO)
VALUES 
-- Almoxarifado TESTE (ID presumível = 1)
(1, 1, 1, 50, 10, 100, 1),
(1, 2, 3, 30, 5, 50, 1),

-- Almoxarifado FASICLIN (ID presumível = 2)
(2, 1, 1, 30, 10, 100, 1),
(2, 5, 11, 25, 10, 75, 1),

-- Almoxarifado FASIPE (ID presumível = 3)
(3, 1, 1, 20, 10, 100, 1),
(3, 6, 19, 40, 15, 60, 1);

-- Verificar dados inseridos
SELECT 
    ia.IDITEM_ALMOX,
    a.NOMEALMO as Almoxarifado,
    p.NOME as Produto,
    l.IDLOTE as Lote,
    ia.QUANTIDADE
FROM ITENS_ALMOXARIFADOS ia
JOIN ALMOXARIFADO a ON ia.IDALMOX = a.IDALMOX
JOIN PRODUTO p ON ia.IDITEM = p.IDPRODUTO
JOIN LOTE l ON ia.IDLOTE = l.IDLOTE
ORDER BY a.NOMEALMO, p.NOME;
