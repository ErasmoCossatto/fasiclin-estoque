package com.br.fasipe.estoque.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade que representa a tabela SETOR do sistema.
 * Esta tabela armazena informações dos setores da instituição.
 */
@Entity
@Table(name = "SETOR")
@Getter
@Setter
@NoArgsConstructor
@ToString
public class Setor implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDSETOR")
    private Integer id;

    @Column(name = "NOMESETOR", nullable = false, length = 50)
    private String nomeSetor;

    @Column(name = "ID_TIPOPROFI")
    private Integer idTipoProfissional;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Setor)) return false;
        Setor setor = (Setor) o;
        return getId() != null && getId().equals(setor.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
