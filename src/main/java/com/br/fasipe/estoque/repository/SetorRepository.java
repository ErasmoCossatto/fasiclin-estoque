package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.Setor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para a entidade Setor.
 */
@Repository
public interface SetorRepository extends JpaRepository<Setor, Integer> {
    
    List<Setor> findByNomeSetorContainingIgnoreCase(String nome);
}
