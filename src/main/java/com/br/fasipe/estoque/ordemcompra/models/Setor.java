package com.br.fasipe.estoque.ordemcompra.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Column;
import jakarta.persistence.GenerationType;

@Entity
@Table(name = "SETOR")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Setor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDSETOR")
    private Integer id;

    // Temporariamente usando Integer em vez de Profissional
    // até que a entidade Profissional seja criada
    @Column(name = "ID_PROFISSIO", nullable = false)
    private Integer idProfissional;

    @Column(name = "NOMESETOR", nullable = false, unique = true, length = 50)
    private String nome;
}