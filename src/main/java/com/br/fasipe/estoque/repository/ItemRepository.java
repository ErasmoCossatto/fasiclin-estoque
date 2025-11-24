package com.br.fasipe.estoque.repository;

import com.br.fasipe.estoque.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para a entidade Item.
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {

    /**
     * Busca itens ativos.
     */
    List<Item> findByAtivo(String ativo);

    /**
     * Busca item por nome.
     */
    List<Item> findByNomeItemContainingIgnoreCase(String nome);
}
