-- Script para permitir ID_USUARIO NULL na tabela MOVIMENTACAO
-- Execute este script no seu banco de dados MySQL

-- Verificar estrutura atual da tabela
DESCRIBE MOVIMENTACAO;

-- Alterar a coluna ID_USUARIO para aceitar NULL
ALTER TABLE MOVIMENTACAO 
MODIFY COLUMN ID_USUARIO INT NULL;

-- Verificar se a alteração foi aplicada
DESCRIBE MOVIMENTACAO;

-- Verificar constraint atual
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MOVIMENTACAO' 
AND COLUMN_NAME = 'ID_USUARIO';

-- Mensagem de sucesso
SELECT 'Coluna ID_USUARIO agora aceita valores NULL' as STATUS;