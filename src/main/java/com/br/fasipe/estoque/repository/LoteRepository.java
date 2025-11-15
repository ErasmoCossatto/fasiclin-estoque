package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository para a entidade Lote.
 */
@Repository
public interface LoteRepository extends JpaRepository<Lote, Integer> {
    
    Optional<Lote> findByNomeLote(String nomeLote);
    
    List<Lote> findByDataValidadeBefore(LocalDate data);
    
    List<Lote> findByDataValidadeBetween(LocalDate dataInicio, LocalDate dataFim);
}
