-- Script para garantir que existe um usuário de teste para as movimentações
-- Execute este script no seu banco de dados MySQL

-- Primeiro verificar os usuários existentes
SELECT * FROM USUARIO;

-- Inserir usuário de teste padrão se não existir (ID=1)
INSERT IGNORE INTO USUARIO (IDUSUARIO, LOGUSUARIO, SENHAUSUA) VALUES 
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
(2, 'operador', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
(3, 'farmaceutico', '$2a$10$N9qo8uLOickgx2ZMRZoMye');

-- Verificar se os usuários foram inseridos
SELECT * FROM USUARIO ORDER BY IDUSUARIO;

-- IMPORTANTE: Certifique-se que existe pelo menos um registro de estoque para teste
-- Verificar estoques existentes
SELECT e.*, p.NOME as NOME_PRODUTO FROM ESTOQUE e 
LEFT JOIN PRODUTO p ON e.ID_PRODUTO = p.IDPRODUTO 
LIMIT 5;

-- Se não houver estoque, será necessário criar produtos e estoques de teste
-- (Isso deve ser feito através da aplicação ou scripts específicos)