package com.br.fasipe.estoque.MovimentacaoEstoque.services;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Setor;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.MovimentacaoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class MovimentacaoService {

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

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
        // Para desenvolvimento: criar entidades padrão se não fornecidas
        if (movimentacao.getEstoque() == null) {
            Estoque estoquePadrao = new Estoque();
            estoquePadrao.setId(1); // ID padrão para desenvolvimento
            movimentacao.setEstoque(estoquePadrao);
        }
        if (movimentacao.getUsuario() == null) {
            Usuario usuarioPadrao = new Usuario();
            usuarioPadrao.setId(1); // ID padrão para desenvolvimento
            movimentacao.setUsuario(usuarioPadrao);
        }
        if (movimentacao.getSetorOrigem() == null) {
            Setor setorPadrao = new Setor();
            setorPadrao.setId(1); // ID padrão para desenvolvimento
            movimentacao.setSetorOrigem(setorPadrao);
        }
        if (movimentacao.getSetorDestino() == null) {
            Setor setorPadrao = new Setor();
            setorPadrao.setId(2); // ID padrão diferente para desenvolvimento
            movimentacao.setSetorDestino(setorPadrao);
        }
        
        return movimentacaoRepository.save(movimentacao);
    }

    public Movimentacao update(Integer id, Movimentacao movimentacao) {
        Movimentacao entity = findById(id);
        updateData(entity, movimentacao);
        return movimentacaoRepository.save(entity);
    }

    public void delete(Integer id) {
        findById(id);
        movimentacaoRepository.deleteById(id);
    }

    private void updateData(Movimentacao entity, Movimentacao movimentacao) {
        entity.setTipoMovimentacao(movimentacao.getTipoMovimentacao());
        entity.setQuantidade(movimentacao.getQuantidade());
        entity.setDataMovimentacao(movimentacao.getDataMovimentacao());
        // Note: Relacionamentos com estoque, usuário e setores devem ser preservados
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