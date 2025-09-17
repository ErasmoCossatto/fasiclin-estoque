package com.br.fasipe.estoque.MovimentacaoEstoque.repository;

import org.springframework.stereotype.Repository;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Almoxarifado;

import org.springframework.data.jpa.repository.JpaRepository;

import jakarta.persistence.QueryHint;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

import org.springframework.data.jpa.repository.QueryHints;
import java.util.List;



@Repository
public interface AlmoxarifadoRepository extends JpaRepository<Almoxarifado, Integer> {
    
    //por IDALMOX
    @Query("SELECT a FROM Almoxarifado a WHERE a.id = :IDALMOX")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<Almoxarifado> findByIDALMOX(@Param("IDALMOX") Integer IDALMOX);

    //por ID_SETOR
    @Query("SELECT a FROM Almoxarifado a WHERE a.setor.id = :ID_SETOR")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<Almoxarifado> findByID_SETOR(@Param("ID_SETOR") Integer ID_SETOR);

    //por NOMEALMO
    @Query("SELECT a FROM Almoxarifado a WHERE a.nome = :NOMEALMO")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    Optional<Almoxarifado> findByNOMEALMO(@Param("NOMEALMO") String NOMEALMO);

    //Criar Almoxarifaco
    @Query("INSERT INTO Almoxarifado (nome, setor) VALUES (:NOMEALMO, :ID_SETOR)")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    void createAlmoxarifado(@Param("NOMEALMO") String NOMEALMO, @Param("ID_SETOR") Integer ID_SETOR);

    //Atualizar Almoxarifado
    @Query("UPDATE Almoxarifado a SET a.nome = :NOMEALMO, a.setor = :ID_SETOR WHERE a.id = :IDALMOX")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    void updateAlmoxarifado(@Param("IDALMOX") Integer IDALMOX, @Param("NOMEALMO") String NOMEALMO, @Param("ID_SETOR") Integer ID_SETOR);

    //Deletar Almoxarifado
    @Query("DELETE FROM Almoxarifado a WHERE a.id = :IDALMOX")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    void deleteAlmoxarifado(@Param("IDALMOX") Integer IDALMOX);

    //Listar todos os Almoxarifados
    @Query("SELECT a FROM Almoxarifado a")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Almoxarifado> findAllAlmoxarifados();

    //Listar todos os Almoxarifados por Setor
    @Query("SELECT a FROM Almoxarifado a WHERE a.setor.id = :ID_SETOR")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Almoxarifado> findAllAlmoxarifadosBySetor(@Param("ID_SETOR") Integer ID_SETOR);

    //Listar todos os Almoxarifados por Nome
    @Query("SELECT a FROM Almoxarifado a WHERE a.nome = :NOMEALMO")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Almoxarifado> findAllAlmoxarifadosByNome(@Param("NOMEALMO") String NOMEALMO);

    //Listar todos os Almoxarifados por ID
    @Query("SELECT a FROM Almoxarifado a WHERE a.id = :IDALMOX")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Almoxarifado> findAllAlmoxarifadosByID(@Param("IDALMOX") Integer IDALMOX);



}
