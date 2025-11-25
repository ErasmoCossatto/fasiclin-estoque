package com.br.fasipe.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade que representa a tabela LOTE do sistema.
 * Armazena informações sobre lotes de produtos, incluindo datas de fabricação e validade.
 */
@Entity
@Table(name = "LOTE")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"item", "itensAlmoxarifados", "movimentacoesOrigem", "movimentacoesDestino"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lote implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDLOTE")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IDITEM", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @Column(name = "ID_ORDCOMP")
    private Integer idOrdemCompra;

    @Column(name = "QNTD")
    private Integer quantidade;

    @Column(name = "NOME_LOTE", nullable = false, length = 50)
    private String nomeLote;

    @Column(name = "DATA_FABRICACAO")
    private LocalDate dataFabricacao;

    @Column(name = "DATAVENC")
    private LocalDate dataValidade;

    @Column(name = "DATA_VALIDADE")
    private LocalDate dataValidadeOriginal;

    @PrePersist
    @PreUpdate
    public void sincronizarDatas() {
        if (this.dataValidade != null && this.dataValidadeOriginal == null) {
            this.dataValidadeOriginal = this.dataValidade;
        } else if (this.dataValidadeOriginal != null && this.dataValidade == null) {
            this.dataValidade = this.dataValidadeOriginal;
        } else if (this.dataValidade != null) {
            this.dataValidadeOriginal = this.dataValidade;
        }
    }

    @Column(name = "OBSERVACAO", length = 500)
    private String observacao;

    @JsonIgnore
    @OneToMany(mappedBy = "lote")
    private List<ItensAlmoxarifados> itensAlmoxarifados = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "loteOrigem")
    private List<MovimentacaoAlmoxarifado> movimentacoesOrigem = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "loteDestino")
    private List<MovimentacaoAlmoxarifado> movimentacoesDestino = new ArrayList<>();

    /**
     * Verifica se o lote está vencido.
     */
    public boolean isVencido() {
        if (dataValidade == null) {
            return false;
        }
        return LocalDate.now().isAfter(dataValidade);
    }

    /**
     * Verifica se o lote está próximo do vencimento (30 dias).
     */
    public boolean isProximoVencimento() {
        if (dataValidade == null) {
            return false;
        }
        return LocalDate.now().plusDays(30).isAfter(dataValidade);
    }

    /**
     * Verifica se há quantidade disponível suficiente no lote.
     */
    public boolean temQuantidadeDisponivel(Integer qtdSolicitada) {
        return quantidade != null && quantidade >= qtdSolicitada;
    }

    /**
     * Reduz a quantidade do lote.
     */
    public void reduzirQuantidade(Integer qtd) {
        if (quantidade == null) {
            quantidade = 0;
        }
        quantidade -= qtd;
    }

    /**
     * Adiciona quantidade ao lote.
     */
    public void adicionarQuantidade(Integer qtd) {
        if (quantidade == null) {
            quantidade = 0;
        }
        quantidade += qtd;
    }

    /**
     * Cria um novo lote derivado deste (para split em transferências parciais).
     */
    public Lote criarLoteDerivado(Integer qtdTransferida) {
        Lote novoLote = new Lote();
        novoLote.setItem(this.item);
        novoLote.setIdOrdemCompra(this.idOrdemCompra);
        novoLote.setQuantidade(qtdTransferida);
        novoLote.setNomeLote(this.nomeLote + " (Split)");
        novoLote.setDataFabricacao(this.dataFabricacao);
        novoLote.setDataValidade(this.dataValidade);
        novoLote.setObservacao("Derivado do lote " + this.id);
        return novoLote;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Lote)) return false;
        Lote lote = (Lote) o;
        return getId() != null && getId().equals(lote.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
