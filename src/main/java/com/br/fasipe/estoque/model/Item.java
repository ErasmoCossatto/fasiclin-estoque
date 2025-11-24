package com.br.fasipe.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;

import java.io.Serializable;

/**
 * Entidade que representa a tabela ITEM do sistema.
 */
@Entity
@Table(name = "ITEM")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Item implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDITEM")
    private Integer id;

    @Column(name = "NOMEITEM", length = 100)
    private String nomeItem;

    @Column(name = "DESCRICAO", length = 250)
    private String descricao;

    @Column(name = "UNIDADE_MEDIDA", length = 20)
    private String unidadeMedida;

    @Column(name = "ATIVO", length = 1)
    private String ativo;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Item)) return false;
        Item item = (Item) o;
        return getId() != null && getId().equals(item.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
