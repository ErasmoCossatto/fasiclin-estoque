package com.br.fasipe.estoque.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Entidade que representa a tabela MOVIMENTACAO_ALMOXARIFADO do sistema.
 * Registra o histórico de todas as movimentações entre almoxarifados.
 */
@Entity
@Table(name = "MOVIMENTACAO_ALMOXARIFADO")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"almoxarifadoOrigem", "almoxarifadoDestino", "item", "loteOrigem", "loteDestino"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MovimentacaoAlmoxarifado implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDMOV")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IDALMOX_ORIGEM")
    private Almoxarifado almoxarifadoOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IDALMOX_DESTINO")
    private Almoxarifado almoxarifadoDestino;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "IDITEM", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @Column(name = "QUANTIDADE", nullable = false)
    private Integer quantidade;

    @Column(name = "DATA_MOV", nullable = false)
    private LocalDateTime dataMovimentacao;

    @Column(name = "RESPONSAVEL", nullable = false, length = 100)
    private String responsavel;

    @Column(name = "OBSERVACAO", length = 500)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IDLOTE_ORIGEM")
    private Lote loteOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IDLOTE_DESTINO")
    private Lote loteDestino;

    @PrePersist
    protected void onCreate() {
        if (dataMovimentacao == null) {
            dataMovimentacao = LocalDateTime.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MovimentacaoAlmoxarifado)) return false;
        MovimentacaoAlmoxarifado that = (MovimentacaoAlmoxarifado) o;
        return getId() != null && getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
