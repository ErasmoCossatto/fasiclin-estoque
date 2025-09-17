package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "CONSEPROFI")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ConselhoProfissional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDCONSEPROFI")
    private Integer id;

    @NotNull(message = "A descrição do conselho é obrigatória")
    @Column(name = "DESCRICAO", nullable = false, unique = true, length = 100)
    private String descricao;

    @NotNull(message = "A abreviação do conselho é obrigatória")
    @Column(name = "ABREVCONS", nullable = false, unique = true, length = 10)
    private String abreviacao;
}
