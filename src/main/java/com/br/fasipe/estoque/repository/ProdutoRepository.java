package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para a entidade Produto.
 * Fornece operações de banco de dados para a tabela PRODUTO.
 */
@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Integer> {
    
    List<Produto> findByNomeContainingIgnoreCase(String nome);
    
    List<Produto> findByAlmoxarifadoId(Integer almoxarifadoId);
}
