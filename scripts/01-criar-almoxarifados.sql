-- =====================================================
-- Script: Criar Almoxarifados Adicionais
-- Descrição: Insere 2 novos almoxarifados para testes
-- =====================================================

-- Inserir FASICLIN
INSERT INTO ALMOXARIFADO (ID_SETOR, NOMEALMO, LOCALIZACAO, RESPONSAVEL, TELEFONE_CONTATO, EMAIL_CONTATO, ATIVO)
VALUES (1, 'FASICLIN', 'Prédio A - Sala 101', 'Responsável Fasiclin', '(66) 3421-0001', 'fasiclin@fasipe.edu.br', 'S');

-- Inserir FASIPE
INSERT INTO ALMOXARIFADO (ID_SETOR, NOMEALMO, LOCALIZACAO, RESPONSAVEL, TELEFONE_CONTATO, EMAIL_CONTATO, ATIVO)
VALUES (1, 'FASIPE', 'Prédio B - Sala 205', 'Responsável Fasipe', '(66) 3421-0002', 'fasipe@fasipe.edu.br', 'S');

-- Verificar almoxarifados criados
SELECT * FROM ALMOXARIFADO ORDER BY IDALMOX;
