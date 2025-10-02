-- SCRIPT FINAL - PERMITIR ID_USUARIO NULL PARA TESTES
-- Execute este script no MySQL para resolver o problema definitivamente

-- =============================================
-- SOLUÇÃO: PERMITIR NULL NA COLUNA ID_USUARIO
-- =============================================

-- 1. Verificar estrutura atual
SELECT 'ANTES DA ALTERAÇÃO:' as STATUS;
DESCRIBE MOVIMENTACAO;

-- 2. Alterar coluna para aceitar NULL
ALTER TABLE MOVIMENTACAO 
MODIFY COLUMN ID_USUARIO INT NULL;

-- 3. Verificar se alteração foi aplicada
SELECT 'APÓS A ALTERAÇÃO:' as STATUS;
DESCRIBE MOVIMENTACAO;

-- 4. Verificar detalhes da coluna
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MOVIMENTACAO' 
AND COLUMN_NAME = 'ID_USUARIO';

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
SELECT '✅ CONFIGURAÇÃO CONCLUÍDA!' as STATUS;
SELECT 'ID_USUARIO agora aceita NULL - Sistema pronto para testes!' as MENSAGEM;

-- NOTA: Quando implementar variável global de usuário:
-- 1. Altere o frontend para enviar { id: window.usuarioLogado.id }
-- 2. Torne a coluna NOT NULL novamente com: 
--    ALTER TABLE MOVIMENTACAO MODIFY COLUMN ID_USUARIO INT NOT NULL;