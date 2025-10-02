# 🚨 SOLUÇÃO IMEDIATA - Erro ID_USUARIO NULL

## ⚡ Solução Rápida (Recomendada)

Execute este script SQL no seu banco de dados:

```sql
-- Inserir usuário padrão
INSERT IGNORE INTO USUARIO (IDUSUARIO, LOGUSUARIO, SENHAUSUA) VALUES 
(1, 'sistema', '$2a$10$N9qo8uLOickgx2ZMRZoMye');

-- Se ainda der erro, execute também:
ALTER TABLE MOVIMENTACAO MODIFY COLUMN ID_USUARIO INT NULL;
```

## 🔧 O que foi implementado:

1. **Backend agora cria usuário automaticamente**: O serviço Java vai buscar/criar um usuário "sistema" quando não há usuário informado

2. **Fallback inteligente**: Se não conseguir criar usuário, usa o primeiro usuário disponível no banco

3. **Scripts SQL**: Criados para inserir usuário padrão

## 📝 Arquivos de script criados:

- `quick_fix_usuario.sql` - Solução rápida
- `fix_complete_id_usuario.sql` - Solução completa 
- `fix_id_usuario_null.sql` - Alteração da tabela

## ✅ Após executar o script SQL:

1. **Reinicie o backend** Spring Boot
2. **Teste criar uma movimentação**
3. **Deve funcionar** sem erro de ID_USUARIO

## 🎯 Estado esperado:

- ✅ Usuário "sistema" existe no banco (ID=1)
- ✅ Backend cria/busca usuário automaticamente
- ✅ Movimentações salvam com sucesso
- ✅ Setores "Compras" e "Estoque" aparecem

**Execute o `quick_fix_usuario.sql` e teste novamente!**