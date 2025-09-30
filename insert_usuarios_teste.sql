-- Script para inserir usuários de teste no formato correto
-- Execute este script no seu banco de dados MySQL

-- Inserir usuários de teste compatíveis com o modelo Usuario.java
INSERT INTO USUARIO (IDUSUARIO, LOGUSUARIO, SENHAUSUA) VALUES 
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
(2, 'operador', '$2a$10$N9qo8uLOickgx2ZMRZoMye'),
(3, 'farmaceutico', '$2a$10$N9qo8uLOickgx2ZMRZoMye');

-- Verificar se os usuários foram inseridos
SELECT * FROM USUARIO;

-- Caso precise limpar os dados existentes antes (CUIDADO - isso apaga TODOS os usuários)
-- DELETE FROM USUARIO;