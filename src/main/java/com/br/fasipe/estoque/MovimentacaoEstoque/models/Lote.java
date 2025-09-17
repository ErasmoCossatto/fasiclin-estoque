package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;

import jakarta.persistence.FetchType;
import jakarta.persistence.GenerationType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Positive;

import jakarta.persistence.JoinColumn;

@Entity
@Table(name = "LOTE")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = { "ordemCompra" })
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDLOTE")
    private Integer id;

    @NotNull(message = "A ordem de compra deve ser informada.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ORDCOMP", nullable = false)
    @JsonIgnoreProperties({"lotes", "hibernateLazyInitializer", "handler"})
    private OrdemCompra ordemCompra;

    @NotNull(message = "A data de vencimento é obrigatória.")
    @Future(message = "A data de vencimento do lote deve ser no futuro.")
    @Column(name = "DATAVENC", nullable = false)
    private LocalDate dataVencimento;

    @Positive(message = "A quantidade do lote deve ser maior que zero.")
    @Column(name = "QNTD", nullable = false)
    private int quantidade;
}
