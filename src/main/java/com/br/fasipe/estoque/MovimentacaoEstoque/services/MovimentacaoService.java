package com.br.fasipe.estoque.MovimentacaoEstoque.services;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Setor;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.MovimentacaoRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.EstoqueRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.UsuarioRepository;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.SetorRepository;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class MovimentacaoService {

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;
    
    @Autowired
    private EstoqueRepository estoqueRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private SetorRepository setorRepository;

    public List<Movimentacao> findAll() {
        try {
            List<Movimentacao> movimentacoes = movimentacaoRepository.findAll();
            System.out.println("MovimentacaoService.findAll() - Encontradas " + movimentacoes.size() + " movimentações");
            return movimentacoes;
        } catch (Exception e) {
            System.err.println("Erro no MovimentacaoService.findAll(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Movimentacao findById(Integer id) {
        Optional<Movimentacao> obj = movimentacaoRepository.findById(id);
        return obj.orElseThrow(() -> new RuntimeException("Movimentação não encontrada!"));
    }

    public Movimentacao insert(Movimentacao movimentacao) {
        log.info("Inserindo nova movimentação - Tipo: {}, Quantidade: {}", 
                movimentacao.getTipoMovimentacao(), movimentacao.getQuantidade());
                
        // Validações básicas
        if (movimentacao.getQuantidade() == null || movimentacao.getQuantidade() <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }
        
        if (movimentacao.getDataMovimentacao() == null) {
            movimentacao.setDataMovimentacao(LocalDate.now());
        }
        
        // Validar se as entidades relacionadas existem
        validateRelatedEntities(movimentacao);
        
        try {
            Movimentacao novaMovimentacao = movimentacaoRepository.save(movimentacao);
            log.info("Movimentação inserida com sucesso - ID: {}", novaMovimentacao.getId());
            return novaMovimentacao;
        } catch (Exception e) {
            log.error("Erro ao inserir movimentação: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao registrar movimentação: " + e.getMessage());
        }
    }
    
    private void validateRelatedEntities(Movimentacao movimentacao) {
        // Validar estoque
        if (movimentacao.getEstoque() == null || movimentacao.getEstoque().getId() == null) {
            throw new IllegalArgumentException("Estoque deve ser informado");
        }
        
        // Buscar estoque completo para verificar se existe
        Optional<Estoque> estoque = estoqueRepository.findById(movimentacao.getEstoque().getId());
        if (estoque.isEmpty()) {
            throw new IllegalArgumentException("Estoque não encontrado");
        }
        movimentacao.setEstoque(estoque.get());
        
        // Validar usuário
        if (movimentacao.getUsuario() == null || movimentacao.getUsuario().getId() == null) {
            throw new IllegalArgumentException("Usuário deve ser informado");
        }
        
        Optional<Usuario> usuario = usuarioRepository.findById(movimentacao.getUsuario().getId());
        if (usuario.isEmpty()) {
            throw new IllegalArgumentException("Usuário não encontrado");
        }
        movimentacao.setUsuario(usuario.get());
        
        // Validar setor origem
        if (movimentacao.getSetorOrigem() == null || movimentacao.getSetorOrigem().getId() == null) {
            throw new IllegalArgumentException("Setor de origem deve ser informado");
        }
        
        Optional<Setor> setorOrigem = setorRepository.findById(movimentacao.getSetorOrigem().getId());
        if (setorOrigem.isEmpty()) {
            throw new IllegalArgumentException("Setor de origem não encontrado");
        }
        movimentacao.setSetorOrigem(setorOrigem.get());
        
        // Validar setor destino
        if (movimentacao.getSetorDestino() == null || movimentacao.getSetorDestino().getId() == null) {
            throw new IllegalArgumentException("Setor de destino deve ser informado");
        }
        
        Optional<Setor> setorDestino = setorRepository.findById(movimentacao.getSetorDestino().getId());
        if (setorDestino.isEmpty()) {
            throw new IllegalArgumentException("Setor de destino não encontrado");
        }
        movimentacao.setSetorDestino(setorDestino.get());
        
        // Validar se setor origem é diferente do destino
        if (movimentacao.getSetorOrigem().getId().equals(movimentacao.getSetorDestino().getId())) {
            throw new IllegalArgumentException("Setor de origem deve ser diferente do setor de destino");
        }
    }

    public Movimentacao update(Integer id, Movimentacao movimentacao) {
        log.info("Atualizando movimentação ID: {}", id);
        
        Movimentacao entity = findById(id);
        
        // Validar se as entidades relacionadas existem antes de atualizar
        validateRelatedEntities(movimentacao);
        
        updateData(entity, movimentacao);
        
        try {
            Movimentacao movimentacaoAtualizada = movimentacaoRepository.save(entity);
            log.info("Movimentação atualizada com sucesso - ID: {}", id);
            return movimentacaoAtualizada;
        } catch (Exception e) {
            log.error("Erro ao atualizar movimentação ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao atualizar movimentação: " + e.getMessage());
        }
    }

    public void delete(Integer id) {
        log.info("Removendo movimentação ID: {}", id);
        
        // Verifica se existe antes de tentar deletar
        findById(id);
        
        try {
            movimentacaoRepository.deleteById(id);
            log.info("Movimentação removida com sucesso - ID: {}", id);
        } catch (Exception e) {
            log.error("Erro ao remover movimentação ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao remover movimentação: " + e.getMessage());
        }
    }

    private void updateData(Movimentacao entity, Movimentacao movimentacao) {
        if (movimentacao.getTipoMovimentacao() != null) {
            entity.setTipoMovimentacao(movimentacao.getTipoMovimentacao());
        }
        if (movimentacao.getQuantidade() != null && movimentacao.getQuantidade() > 0) {
            entity.setQuantidade(movimentacao.getQuantidade());
        }
        if (movimentacao.getDataMovimentacao() != null) {
            entity.setDataMovimentacao(movimentacao.getDataMovimentacao());
        }
        
        // Atualizar relacionamentos se fornecidos
        if (movimentacao.getEstoque() != null) {
            entity.setEstoque(movimentacao.getEstoque());
        }
        if (movimentacao.getUsuario() != null) {
            entity.setUsuario(movimentacao.getUsuario());
        }
        if (movimentacao.getSetorOrigem() != null) {
            entity.setSetorOrigem(movimentacao.getSetorOrigem());
        }
        if (movimentacao.getSetorDestino() != null) {
            entity.setSetorDestino(movimentacao.getSetorDestino());
        }
    }

    public List<Movimentacao> findByQuantidade(Integer quantidade) {
        return movimentacaoRepository.findByQuantidade(quantidade);
    }

    public List<Movimentacao> findByQuantidadeBetween(Integer quantidadeMinima, Integer quantidadeMaxima) {
        // Como não temos método específico no repository, vamos usar stream
        return movimentacaoRepository.findAll().stream()
                .filter(m -> m.getQuantidade() >= quantidadeMinima && m.getQuantidade() <= quantidadeMaxima)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByDataMovimentacao(LocalDate data) {
        return movimentacaoRepository.findAll().stream()
                .filter(m -> m.getDataMovimentacao().equals(data))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByDataMovimentacaoBetween(LocalDate dataInicial, LocalDate dataFinal) {
        return movimentacaoRepository.findAll().stream()
                .filter(m -> !m.getDataMovimentacao().isBefore(dataInicial) && !m.getDataMovimentacao().isAfter(dataFinal))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByTipoMovimentacao(TipoMovimentacao tipo) {
        return movimentacaoRepository.findByTipoMovimentacao(tipo);
    }

    /**
     * Método para criar dados de teste (temporário para desenvolvimento)
     */
    public void criarDadosTeste() {
        try {
            // Verificar se já existem dados
            List<Movimentacao> existentes = movimentacaoRepository.findAll();
            if (!existentes.isEmpty()) {
                System.out.println("Já existem " + existentes.size() + " movimentações no banco");
                return;
            }

            // Criar dados básicos de teste primeiro
            criarDadosBasicos();

            // Criar algumas movimentações de teste
            Movimentacao mov1 = new Movimentacao();
            mov1.setTipoMovimentacao(TipoMovimentacao.ENTRADA);
            mov1.setQuantidade(100);
            mov1.setDataMovimentacao(java.time.LocalDate.now());
            
            // Criar entidades padrão para teste
            Estoque estoque1 = new Estoque();
            estoque1.setId(1);
            mov1.setEstoque(estoque1);
            
            Usuario usuario1 = new Usuario();
            usuario1.setId(1);
            mov1.setUsuario(usuario1);
            
            Setor setor1 = new Setor();
            setor1.setId(1);
            mov1.setSetorOrigem(setor1);
            
            Setor setor2 = new Setor();
            setor2.setId(2);
            mov1.setSetorDestino(setor2);
            
            Movimentacao mov2 = new Movimentacao();
            mov2.setTipoMovimentacao(TipoMovimentacao.SAIDA);
            mov2.setQuantidade(50);
            mov2.setDataMovimentacao(java.time.LocalDate.now().minusDays(1));
            
            // Reutilizar as mesmas entidades para mov2
            mov2.setEstoque(estoque1);
            mov2.setUsuario(usuario1);
            mov2.setSetorOrigem(setor2);
            mov2.setSetorDestino(setor1);

            movimentacaoRepository.save(mov1);
            movimentacaoRepository.save(mov2);
            
            System.out.println("Dados de teste criados com sucesso!");
        } catch (Exception e) {
            System.err.println("Erro ao criar dados de teste: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Método para criar dados básicos necessários para testes
     */
    private void criarDadosBasicos() {
        // Este método deveria idealmente criar dados nas outras tabelas também
        // Por enquanto, usamos apenas IDs que devem existir no banco
        System.out.println("Criando dados básicos...");
        // Aqui você pode adicionar lógica para criar produtos, estoques, usuários e setores
        // se eles não existirem no banco
    }
}