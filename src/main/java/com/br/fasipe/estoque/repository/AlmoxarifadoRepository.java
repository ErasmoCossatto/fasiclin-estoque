package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.Almoxarifado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para a entidade Almoxarifado.
 */
@Repository
public interface AlmoxarifadoRepository extends JpaRepository<Almoxarifado, Integer> {
    
    List<Almoxarifado> findByAtivoTrue();
    
    List<Almoxarifado> findByNomeAlmoxarifadoContainingIgnoreCase(String nome);
}
