package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Future;



@Entity
@Table(name = "ITEM_ORDCOMP")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"ordemCompra", "produto"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ItemOrdemCompra {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDITEMORD")
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ORDCOMP", nullable = false)
    @JsonIgnoreProperties({"itens", "hibernateLazyInitializer", "handler"})
    private OrdemCompra ordemCompra;

    @NotNull(message = "O produto deve ser informado.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PRODUTO", nullable = false)
    @JsonIgnoreProperties({"itensOrdemCompra", "hibernateLazyInitializer", "handler"})
    private Produto produto;

    @Positive(message = "A quantidade deve ser maior que zero.")
    @Column(name = "QNTD", nullable = false)
    private int quantidade;

    @NotNull(message = "O valor do item é obrigatório.")
    @Positive(message = "O valor do item deve ser positivo.")
    @Column(name = "VALOR", nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @NotNull(message = "A data de vencimento é obrigatória.")
    @Future(message = "A data de vencimento deve ser no futuro.")
    @Column(name = "DATAVENC", nullable = false)
    private LocalDate dataVencimento;
}
