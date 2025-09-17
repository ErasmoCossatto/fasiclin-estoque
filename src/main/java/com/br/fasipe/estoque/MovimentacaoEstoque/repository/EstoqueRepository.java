package com.br.fasipe.estoque.MovimentacaoEstoque.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Estoque;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;


import java.util.List;


import jakarta.persistence.QueryHint;

@Repository
public interface EstoqueRepository extends JpaRepository<Estoque, Integer> {
   
    //POR IDESTOQUE
    @Query("SELECT e FROM Estoque e WHERE e.id = :id")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Estoque findByIdEstoque(@Param("id") Integer id);

    //POR ID_PRODUTO
    @Query("SELECT e FROM Estoque e WHERE e.produto.id = :idProduto")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Estoque> findByIdProduto(@Param("idProduto") Integer idProduto);

    //por ID_LOTE
    @Query("SELECT e FROM Estoque e WHERE e.lote.id = :idLote")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Estoque> findByIdLote(@Param("idLote") Integer idLote);

    //por QTDESTOQUE
    @Query("SELECT e FROM Estoque e WHERE e.quantidadeEstoque = :quantidadeEstoque")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Estoque> findByQuantidadeEstoque(@Param("quantidadeEstoque") Integer quantidadeEstoque);

    //Atualizar Estoque 
    @Query("UPDATE Estoque e SET e.quantidadeEstoque = :quantidadeEstoque WHERE e.id = :id")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    int updateQuantidadeEstoque(@Param("quantidadeEstoque") Integer quantidadeEstoque, @Param("id") Integer id);

    
}
