package com.br.fasipe.estoque.MovimentacaoEstoque.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Fornecedor;
import com.br.fasipe.estoque.MovimentacaoEstoque.models.PessoaJuridica;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.QueryHint;
import java.util.List;



@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, Integer> {
    
    //Por IDFORNECEDOR
    @Query("SELECT f FROM Fornecedor f WHERE f.id = :id")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Fornecedor> findAllFornecedoresByID(@Param("id") Integer id);

    //POR ID_PESSOA
    @Query("SELECT f FROM Fornecedor f WHERE f.pessoasJuridica.id = :idPessoaJuridica")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Fornecedor> findAllFornecedoresByIDPessoa(@Param("idPessoaJuridica") Integer idPessoaJuridica);


    //por representante
    @Query("SELECT f FROM Fornecedor f WHERE f.representante = :representante")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Fornecedor> findAllFornecedoresByRepresentante(@Param("representante") String representante);

    //por contatoRepresentante
    @Query("SELECT f FROM Fornecedor f WHERE f.contatoRepresentante = :contatoRepresentante")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Fornecedor> findAllFornecedoresByContatoRepresentante(@Param("contatoRepresentante") String contatoRepresentante);

    //por descricao
    @Query("SELECT f FROM Fornecedor f WHERE f.descricao = :descricao")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    List<Fornecedor> findAllFornecedoresByDescricao(@Param("descricao") String descricao);

    //CREATE FORNECEDOR
    @Query("INSERT INTO Fornecedor (pessoasJuridica, representante, contatoRepresentante, descricao) VALUES (:pessoasJuridica, :representante, :contatoRepresentante, :descricao)")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    void createFornecedor(@Param("pessoasJuridica") PessoaJuridica pessoasJuridica, @Param("representante") String representante, @Param("contatoRepresentante") String contatoRepresentante, @Param("descricao") String descricao);

    //UPDATE FORNECEDOR
    @Query("UPDATE Fornecedor f SET f.pessoasJuridica = :pessoasJuridica, f.representante = :representante, f.contatoRepresentante = :contatoRepresentante, f.descricao = :descricao WHERE f.id = :id")
    @QueryHints({
        @QueryHint(name = "org.hibernate.readOnly", value = "true"),
        @QueryHint(name = "org.hibernate.fetchSize", value = "50"),
        @QueryHint(name = "org.hibernate.cacheable", value = "true"),
        @QueryHint(name = "jakarta.persistence.cache.storeMode", value = "USE"),
        @QueryHint(name = "jakarta.persistence.cache.retrieveMode", value = "USE"), 
        @QueryHint(name = "jakarta.persistence.query.timeout", value = "2000")
    })
    void updateFornecedor(@Param("id") Integer id, @Param("pessoasJuridica") PessoaJuridica pessoasJuridica, @Param("representante") String representante, @Param("contatoRepresentante") String contatoRepresentante, @Param("descricao") String descricao);
    
}
