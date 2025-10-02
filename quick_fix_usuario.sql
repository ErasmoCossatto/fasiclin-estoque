-- SOLUÇÃO RÁPIDA: Inserir usuário padrão do sistema
-- Execute este script para resolver o problema de ID_USUARIO null

-- 1. Inserir usuário "sistema" se não existir
INSERT IGNORE INTO USUARIO (IDUSUARIO, LOGUSUARIO, SENHAUSUA) VALUES 
(1, 'sistema', '$2a$10$N9qo8uLOickgx2ZMRZoMye');

-- 2. Verificar se foi inserido
SELECT 'USUÁRIO SISTEMA CRIADO:' as STATUS;
SELECT * FROM USUARIO WHERE LOGUSUARIO = 'sistema';

-- 3. Verificar estrutura da tabela MOVIMENTACAO
SELECT 'ESTRUTURA MOVIMENTACAO:' as STATUS;
DESCRIBE MOVIMENTACAO;

-- 4. Se necessário, alterar coluna para aceitar NULL temporariamente
-- (Descomente a linha abaixo se der erro de constraint)
-- ALTER TABLE MOVIMENTACAO MODIFY COLUMN ID_USUARIO INT NULL;

SELECT 'CONFIGURAÇÃO CONCLUÍDA - TESTE AS MOVIMENTAÇÕES!' as STATUS;