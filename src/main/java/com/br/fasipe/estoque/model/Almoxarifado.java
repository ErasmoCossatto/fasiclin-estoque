package com.br.fasipe.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade que representa a tabela ALMOXARIFADO do sistema.
 * Armazena informações sobre os almoxarifados/depósitos.
 */
@Entity
@Table(name = "ALMOXARIFADO")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"itensAlmoxarifados", "movimentacoesOrigem", "movimentacoesDestino", "produtos"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Almoxarifado implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDALMOX")
    private Integer id;

    @Column(name = "NOMEALMO", nullable = false, length = 100)
    private String nomeAlmoxarifado;

    @Column(name = "LOCALIZACAO", length = 250)
    private String localizacao;

    @Column(name = "TELEFONE_CONTATO", length = 20)
    private String telefoneContato;

    @Column(name = "EMAIL_CONTATO", length = 100)
    private String emailContato;

    @Column(name = "ATIVO", nullable = false, length = 1)
    @Convert(converter = BooleanToCharConverter.class)
    private Boolean ativo = true;

    @JsonIgnore
    @OneToMany(mappedBy = "almoxarifado")
    private List<ItensAlmoxarifados> itensAlmoxarifados = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "almoxarifadoOrigem")
    private List<MovimentacaoAlmoxarifado> movimentacoesOrigem = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "almoxarifadoDestino")
    private List<MovimentacaoAlmoxarifado> movimentacoesDestino = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "almoxarifado")
    private List<Produto> produtos = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Almoxarifado)) return false;
        Almoxarifado that = (Almoxarifado) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
