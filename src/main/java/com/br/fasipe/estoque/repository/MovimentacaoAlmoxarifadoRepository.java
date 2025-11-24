package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.MovimentacaoAlmoxarifado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository para a entidade MovimentacaoAlmoxarifado.
 */
@Repository
public interface MovimentacaoAlmoxarifadoRepository extends JpaRepository<MovimentacaoAlmoxarifado, Integer> {
    
    List<MovimentacaoAlmoxarifado> findByAlmoxarifadoOrigemId(Integer almoxarifadoId);
    
    List<MovimentacaoAlmoxarifado> findByAlmoxarifadoDestinoId(Integer almoxarifadoId);
    
    List<MovimentacaoAlmoxarifado> findByItemId(Integer itemId);
    
    List<MovimentacaoAlmoxarifado> findByDataMovimentacaoBetween(LocalDateTime dataInicio, LocalDateTime dataFim);
    
    @Query("SELECT m FROM MovimentacaoAlmoxarifado m WHERE " +
           "(m.almoxarifadoOrigem IS NOT NULL AND m.almoxarifadoOrigem.id = :almoxarifadoId) " +
           "OR (m.almoxarifadoDestino IS NOT NULL AND m.almoxarifadoDestino.id = :almoxarifadoId) " +
           "ORDER BY m.dataMovimentacao DESC")
    List<MovimentacaoAlmoxarifado> findByAlmoxarifadoOrigemOrDestino(@Param("almoxarifadoId") Integer almoxarifadoId);
}
