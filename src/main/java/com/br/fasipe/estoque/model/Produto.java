package com.br.fasipe.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Entidade que representa a tabela PRODUTO do sistema.
 * Esta tabela armazena as informações dos produtos disponíveis no estoque.
 */
@Entity
@Table(name = "PRODUTO")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"almoxarifado"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Produto implements Serializable {
    
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDPRODUTO")
    private Integer id;
    
    @Column(name = "NOME", nullable = false, length = 50)
    private String nome;
    
    @Column(name = "DESCRICAO", nullable = false, length = 250)
    private String descricao;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ALMOX")
    private Almoxarifado almoxarifado;
    
    @Column(name = "ID_UNMEDI")
    private Integer idUnidadeMedida;
    
    @Column(name = "CODBARRAS", length = 250)
    private String codigoBarras;
    
    @Column(name = "TEMPIDEAL", precision = 3, scale = 1)
    private BigDecimal temperaturaIdeal;
    
    @Column(name = "STQMAX", nullable = false)
    private Integer estoqueMaximo;
    
    @Column(name = "STQMIN", nullable = false)
    private Integer estoqueMinimo;
    
    @Column(name = "PNTPEDIDO", nullable = false)
    private Integer pontoPedido;
    
    // NOTA: Relacionamentos removidos pois o sistema migrou para usar a tabela ITEM
    // @OneToMany(mappedBy = "item")
    // private List<ItensAlmoxarifados> itensAlmoxarifados = new ArrayList<>();

    // @OneToMany(mappedBy = "item")
    // private List<MovimentacaoAlmoxarifado> movimentacoes = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Produto)) return false;
        Produto produto = (Produto) o;
        return getId() != null && getId().equals(produto.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
