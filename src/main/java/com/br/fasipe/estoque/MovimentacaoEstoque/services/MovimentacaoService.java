package com.br.fasipe.estoque.MovimentacaoEstoque.services;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.MovimentacaoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;





@Service
public class MovimentacaoService {

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    public List<Movimentacao> findAll() {
        return movimentacaoRepository.findAll();
    }

    public Movimentacao findById(Integer id) {
        Optional<Movimentacao> obj = movimentacaoRepository.findById(id);
        return obj.orElseThrow(() -> new RuntimeException("Movimentação não encontrada!"));
    }

    public Movimentacao insert(Movimentacao movimentacao) {
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
        // Note: Produto relationship should be added to the Movimentacao model
    }

    public List<Movimentacao> findByQuantidade(Integer quantidade) {
        return movimentacaoRepository.findByQuantidade(quantidade);
    }

    public List<Movimentacao> findByQuantidadeBetween(Integer quantidadeMinima, Integer quantidadeMaxima) {
        // No repository não temos um método específico para intervalo de quantidade
        // Vamos usar JPQL para isso
        return movimentacaoRepository.findAll().stream()
                .filter(m -> m.getQuantidade() >= quantidadeMinima && m.getQuantidade() <= quantidadeMaxima)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Movimentacao> findByDataMovimentacao(LocalDate data) {
        LocalDateTime dataInicio = data.atStartOfDay();
        LocalDateTime dataFim = data.atTime(23, 59, 59);
        return movimentacaoRepository.findByPeriodo(dataInicio, dataFim);
    }

    public List<Movimentacao> findByDataMovimentacaoBetween(LocalDate dataInicial, LocalDate dataFinal) {
        LocalDateTime dataInicialLocal = dataInicial.atStartOfDay();
        LocalDateTime dataFinalLocal = dataFinal.atTime(23, 59, 59);
        return movimentacaoRepository.findByPeriodo(dataInicialLocal, dataFinalLocal);
    }

    public List<Movimentacao> findByTipoMovimentacao(TipoMovimentacao tipo) {
        return movimentacaoRepository.findByTipoMovimentacao(tipo);
    }
}