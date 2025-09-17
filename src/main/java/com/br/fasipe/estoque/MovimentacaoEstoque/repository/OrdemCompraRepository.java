package com.br.fasipe.estoque.MovimentacaoEstoque.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.OrdemCompra;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.OrdemCompra.StatusOrdem;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.QueryHint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;




@Repository
public interface OrdemCompraRepository extends JpaRepository<OrdemCompra, Integer> {
    
    //POR IDORDCOMP
    @Query("SELECT o FROM OrdemCompra o WHERE o.id = :IDORDCOMP")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<OrdemCompra> findByIDORDCOMP(@Param("IDORDCOMP") Integer IDORDCOMP);

    //POR STATUSORD
    @Query("SELECT o FROM OrdemCompra o WHERE o.status = :STATUSORD")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<OrdemCompra> findBySTATUSORD(@Param("STATUSORD") StatusOrdem STATUSORD);

    //POR VALOR
    @Query("SELECT o FROM OrdemCompra o WHERE o.valor = :VALOR")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<OrdemCompra> findByVALOR(@Param("VALOR") BigDecimal VALOR);

    //POR DATAPREV
    @Query("SELECT o FROM OrdemCompra o WHERE o.dataPrevisao = :DATAPREV")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<OrdemCompra> findByDATAPREV(@Param("DATAPREV") LocalDate DATAPREV);

    //POR DATAORDEM
    @Query("SELECT o FROM OrdemCompra o WHERE o.dataOrdem = :DATAORDEM")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<OrdemCompra> findByDATAORDEM(@Param("DATAORDEM") LocalDate DATAORDEM);

    //DATAENTRE
    @Query("SELECT o FROM OrdemCompra o WHERE o.dataEntrega = :DATAENTRE")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<OrdemCompra> findByDATAENTRE(@Param("DATAENTRE") LocalDate DATAENTRE);
  
}
