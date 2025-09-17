package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.FetchType;
import jakarta.persistence.GenerationType;

import jakarta.validation.constraints.Size;


@Entity
@Table(name = "FORNECEDOR")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@ToString(exclude = {"pessoasJuridica"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDFORNECEDOR")
    private Integer id;

    @NotNull(message = "A pessoa jurídica deve ser informada.")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PESSOA", nullable = false, unique = true)
    @JsonIgnoreProperties({"fornecedor", "hibernateLazyInitializer", "handler"})
    private PessoaJuridica pessoasJuridica;

     @Size(max = 100)
    @Column(name = "REPRESENT", length = 100)
    private String representante;

    @Size(max = 15)
    @Column(name = "CONTREPRE", length = 15)
    private String contatoRepresentante;

    @Size(max = 250)
    @Column(name = "DECRICAO", length = 250)
    private String descricao;


    
}
