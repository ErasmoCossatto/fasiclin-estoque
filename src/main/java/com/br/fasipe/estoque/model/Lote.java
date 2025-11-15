package com.br.fasipe.estoque.model;

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
@ToString(exclude = {"itensAlmoxarifados", "movimentacoesOrigem", "movimentacoesDestino"})
public class Lote implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDLOTE")
    private Integer id;

    @Column(name = "NOME_LOTE", nullable = false, length = 50)
    private String nomeLote;

    @Column(name = "DATA_FABRICACAO")
    private LocalDate dataFabricacao;

    @Column(name = "DATA_VALIDADE")
    private LocalDate dataValidade;

    @Column(name = "OBSERVACAO", length = 500)
    private String observacao;

    @OneToMany(mappedBy = "lote")
    private List<ItensAlmoxarifados> itensAlmoxarifados = new ArrayList<>();

    @OneToMany(mappedBy = "loteOrigem")
    private List<MovimentacaoAlmoxarifado> movimentacoesOrigem = new ArrayList<>();

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
