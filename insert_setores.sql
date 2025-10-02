-- Script para inserir setores faltantes
-- Execute este script no seu banco de dados MySQL

-- Primeiro verificar os setores existentes
SELECT * FROM SETOR;

-- Inserir setores 'Compras' e 'Estoque' se não existirem
INSERT IGNORE INTO SETOR (IDSETOR, NOMESETOR) VALUES 
(1, 'Compras'),
(2, 'Teste'),
(3, 'Estoque');

-- Verificar se os setores foram inseridos
SELECT * FROM SETOR ORDER BY IDSETOR;

-- Caso precise limpar os dados existentes antes (CUIDADO - isso apaga TODOS os setores)
-- DELETE FROM SETOR;