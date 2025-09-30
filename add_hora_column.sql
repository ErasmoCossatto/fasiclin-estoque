-- Script para adicionar coluna HORAMOVIM na tabela MOVIMENTACAO
-- Execute este comando no seu banco MySQL

ALTER TABLE MOVIMENTACAO ADD COLUMN HORAMOVIM TIME NULL;

-- Atualizar registros existentes com hora atual
UPDATE MOVIMENTACAO SET HORAMOVIM = CURTIME() WHERE HORAMOVIM IS NULL;

-- Verificar se a coluna foi criada
DESCRIBE MOVIMENTACAO;