package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToMany;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.FutureOrPresent;


@Entity
@Table(name = "ORDEMCOMPRA")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "itens")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrdemCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDORDCOMP")
    private Integer id;

    @NotNull(message = "O status da ordem é obrigatório.")
    @Enumerated(EnumType.STRING)
    @Column(name = "STATUSORD", nullable = false)
    private StatusOrdem status;

    @NotNull(message = "O valor da ordem é obrigatório.")
    @Positive(message = "O valor da ordem deve ser positivo.")
    @Column(name = "VALOR", nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @NotNull(message = "A data de previsão é obrigatória.")
    @FutureOrPresent(message = "A data de previsão não pode ser no passado.")
    @Column(name = "DATAPREV", nullable = false)
    private LocalDate dataPrevisao;

    @NotNull(message = "A data da ordem é obrigatória.")
    @Column(name = "DATAORDEM", nullable = false)
    private LocalDate dataOrdem;

    @NotNull(message = "A data de entrega é obrigatória.")
    @Column(name = "DATAENTRE", nullable = false)
    private LocalDate dataEntrega;
    
    @OneToMany(mappedBy = "ordemCompra", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnoreProperties({"ordemCompra", "hibernateLazyInitializer", "handler"})
    private List<ItemOrdemCompra> itens = new ArrayList<>();

    public enum StatusOrdem {
        PEND, ANDA, CONC
    }
}
