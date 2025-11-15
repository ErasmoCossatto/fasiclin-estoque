package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.ItensAlmoxarifados;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para a entidade ItensAlmoxarifados.
 */
@Repository
public interface ItensAlmoxarifadosRepository extends JpaRepository<ItensAlmoxarifados, Integer> {
    
    Optional<ItensAlmoxarifados> findByAlmoxarifadoIdAndProdutoIdAndLoteId(
        Integer almoxarifadoId, Integer produtoId, Integer loteId);
    
    List<ItensAlmoxarifados> findByAlmoxarifadoId(Integer almoxarifadoId);
    
    List<ItensAlmoxarifados> findByProdutoId(Integer produtoId);
    
    List<ItensAlmoxarifados> findByLoteId(Integer loteId);
    
    @Query("SELECT i FROM ItensAlmoxarifados i WHERE i.quantidade < i.estoqueMinimo AND i.ativo = true")
    List<ItensAlmoxarifados> findAbaixoEstoqueMinimo();
    
    @Query("SELECT SUM(i.quantidade) FROM ItensAlmoxarifados i WHERE i.produto.id = :produtoId AND i.ativo = true")
    Integer somarQuantidadePorProduto(@Param("produtoId") Integer produtoId);
}
