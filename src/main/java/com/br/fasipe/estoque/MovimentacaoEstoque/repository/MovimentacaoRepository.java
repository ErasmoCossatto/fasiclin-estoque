package com.br.fasipe.estoque.MovimentacaoEstoque.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.Movimentacao.TipoMovimentacao;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovimentacaoRepository extends JpaRepository<Movimentacao, Integer> {
    
    // Métodos básicos usando Spring Data JPA
    List<Movimentacao> findByTipoMovimentacao(TipoMovimentacao tipoMovimentacao);
    List<Movimentacao> findByQuantidade(Integer quantidade);
    List<Movimentacao> findByDataMovimentacao(LocalDate dataMovimentacao);
    
    // Para consultas mais complexas, vamos usar streams no service
}