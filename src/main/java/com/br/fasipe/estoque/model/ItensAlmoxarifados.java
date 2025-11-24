package com.br.fasipe.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;

/**
 * Entidade que representa a tabela ITENS_ALMOXARIFADOS do sistema.
 * Controla o saldo atual de cada produto por almoxarifado e lote.
 */
@Entity
@Table(name = "ITENS_ALMOXARIFADOS", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"IDALMOX", "IDITEM", "IDLOTE"}))
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"almoxarifado", "item", "lote"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ItensAlmoxarifados implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDITEM_ALMOX")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IDALMOX", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Almoxarifado almoxarifado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IDITEM", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IDLOTE", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Lote lote;

    @Column(name = "QUANTIDADE", nullable = false)
    private Integer quantidade = 0;

    @Column(name = "ESTOQUE_MINIMO")
    private Integer estoqueMinimo;

    @Column(name = "ESTOQUE_MAXIMO")
    private Integer estoqueMaximo;

    @Column(name = "ATIVO", nullable = false)
    private Boolean ativo = true;

    /**
     * Verifica se o estoque está abaixo do mínimo.
     */
    public boolean isAbaixoMinimo() {
        return estoqueMinimo != null && quantidade < estoqueMinimo;
    }

    /**
     * Verifica se o estoque está acima do máximo.
     */
    public boolean isAcimaMaximo() {
        return estoqueMaximo != null && quantidade > estoqueMaximo;
    }

    /**
     * Adiciona quantidade ao estoque.
     */
    public void adicionarQuantidade(Integer qtd) {
        this.quantidade += qtd;
    }

    /**
     * Remove quantidade do estoque.
     */
    public void removerQuantidade(Integer qtd) {
        this.quantidade -= qtd;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ItensAlmoxarifados)) return false;
        ItensAlmoxarifados that = (ItensAlmoxarifados) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
