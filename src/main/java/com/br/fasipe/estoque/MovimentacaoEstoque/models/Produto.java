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

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "PRODUTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = { "almoxarifado", "unidadeMedida" })
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDPRODUTO")
    private Integer id;

    @NotBlank(message = "O nome do produto não pode ser vazio.")
    @Size(max = 50, message = "O nome do produto não pode exceder 50 caracteres.")
    @Column(name = "NOME", nullable = false, length = 50)
    private String nome;

    @NotBlank(message = "A descrição do produto não pode ser vazia.")
    @Size(max = 250, message = "A descrição não pode exceder 250 caracteres.")
    @Column(name = "DESCRICAO", nullable = false, length = 250)
    private String descricao;

    @NotNull(message = "O almoxarifado deve ser informado.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ALMOX")
    @JsonIgnoreProperties({"produtos", "hibernateLazyInitializer", "handler"})
    private Almoxarifado almoxarifado;

    @NotNull(message = "A unidade de medida deve ser informada.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_UNMEDI", nullable = false)
    @JsonIgnoreProperties({"produtos", "hibernateLazyInitializer", "handler"})
    private UnidadeMedida unidadeMedida;

    @NotBlank(message = "O código de barras não pode ser vazio.")
    @Size(max = 50, message = "O código de barras não pode exceder 50 caracteres.")
    @Column(name = "CODBARRAS", nullable = false, length = 50, unique = true)
    private String codBarras;
    
    @Column(name = "TEMPIDEAL", precision = 3, scale = 1)
    private BigDecimal tempIdeal;
    
    @NotNull(message = "O estoque máximo deve ser informado.")
    @Column(name = "STQMAX", nullable = false)
    private Integer stqMax;
    
    @NotNull(message = "O estoque mínimo deve ser informado.")
    @Column(name = "STQMIN", nullable = false)
    private Integer stqMin;
    
    @NotNull(message = "O ponto de pedido deve ser informado.")
    @Column(name = "PNTPEDIDO", nullable = false)
    private Integer ptnPedido;
}
