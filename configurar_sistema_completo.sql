-- Script completo para configurar dados básicos do sistema
-- Execute este script no seu banco de dados MySQL na ordem apresentada

-- =============================================
-- PASSO 1: INSERIR SETORES
-- =============================================
INSERT IGNORE INTO SETOR (IDSETOR, NOMESETOR) VALUES 
(1, 'Compras'),
(2, 'Teste'),
(3, 'Estoque');

-- Verificar setores inseridos
SELECT 'SETORES CRIADOS:' as STATUS;
SELECT * FROM SETOR ORDER BY IDSETOR;

-- =============================================
-- PASSO 2: INSERIR USUÁRIOS
-- =============================================
INSERT IGNORE INTO USUARIO (IDUSUARIO, LOGUSUARIO, SENHAUSUA) VALUES 
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
(2, 'operador', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
(3, 'farmaceutico', '$2a$10$N9qo8uLOickgx2ZMRZoMye');

-- Verificar usuários inseridos
SELECT 'USUÁRIOS CRIADOS:' as STATUS;
SELECT * FROM USUARIO ORDER BY IDUSUARIO;

-- =============================================
-- PASSO 3: VERIFICAR PRODUTOS E ESTOQUES
-- =============================================
SELECT 'PRODUTOS EXISTENTES:' as STATUS;
SELECT COUNT(*) as TOTAL_PRODUTOS FROM PRODUTO;

SELECT 'ESTOQUES EXISTENTES:' as STATUS;
SELECT COUNT(*) as TOTAL_ESTOQUES FROM ESTOQUE;

-- Listar alguns estoques para verificação
SELECT 'PRIMEIROS 5 ESTOQUES:' as STATUS;
SELECT e.IDESTOQUE, e.ID_PRODUTO, p.NOME as PRODUTO_NOME, e.QTDESTOQUE 
FROM ESTOQUE e 
LEFT JOIN PRODUTO p ON e.ID_PRODUTO = p.IDPRODUTO 
LIMIT 5;

-- =============================================
-- RESULTADO FINAL
-- =============================================
SELECT 'CONFIGURAÇÃO CONCLUÍDA!' as STATUS;
SELECT 
    (SELECT COUNT(*) FROM SETOR) as SETORES,
    (SELECT COUNT(*) FROM USUARIO) as USUARIOS,
    (SELECT COUNT(*) FROM PRODUTO) as PRODUTOS,
    (SELECT COUNT(*) FROM ESTOQUE) as ESTOQUES;

-- NOTA: Se não houver produtos/estoques, será necessário criar através da aplicação