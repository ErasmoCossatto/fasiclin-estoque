package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.validation.constraints.NotNull;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "MOVIMENTACAO")
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Movimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDMOVIMENTACAO")
    private Integer id;

    @NotNull(message = "O tipo de movimentação deve ser informado")
    @Enumerated(EnumType.STRING)
    @Column(name = "TIPOMOVIM", nullable = false)
    private TipoMovimentacao tipoMovimentacao;

    @NotNull(message = "A quantidade da movimentação deve ser informada")
    @Column(name = "QTDMOVIM", nullable = false)
    private Integer quantidade;

    @NotNull(message = "A data da movimentação deve ser informada")
    @Column(name = "DATAMOVIM", nullable = false)
    private LocalDateTime dataMovimentacao;

    @NotNull(message = "O estoque da movimentação deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ESTOQUE", nullable = false)
    private Estoque estoque;

    @NotNull(message = "O usuário da movimentação deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_USUARIO", nullable = false)
    private Usuario usuario;

    @NotNull(message = "O setor de origem da movimentação deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SETOR_ORIGEM", nullable = false)
    private Setor setorOrigem;

    @NotNull(message = "O setor de destino da movimentação deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SETOR_DESTINO", nullable = false)
    private Setor setorDestino;

    public enum TipoMovimentacao {
        ENTRADA,
        SAIDA
    }
}
