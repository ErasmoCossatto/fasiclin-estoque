package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import jakarta.persistence.Column;
import jakarta.persistence.GenerationType;
import jakarta.persistence.FetchType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "ALMOXARIFADO")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"setor"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Almoxarifado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDALMOX")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SETOR", nullable = false)
    @JsonIgnoreProperties({"almoxarifados", "hibernateLazyInitializer", "handler"})
    private Setor setor;

    @Column(name = "NOMEALMO", nullable = false, unique = true, length = 100)
    private String nome;

}
