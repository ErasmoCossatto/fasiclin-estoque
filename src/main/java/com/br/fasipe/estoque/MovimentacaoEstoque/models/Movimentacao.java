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

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "MOVIMENTACAO")
@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Movimentacao implements java.io.Serializable {
    private static final long serialVersionUID = 1L;

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
    private LocalDate dataMovimentacao;

    @Column(name = "HORARIO")
    private LocalTime horaMovimentacao;

    @NotNull(message = "O estoque deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_ESTOQUE", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Estoque estoque;

    // TODO: Usar variável global quando implementada
    // TEMPORÁRIO: Usa primeiro usuário do banco automaticamente para testes
    @NotNull(message = "O usuário deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_USUARIO", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @NotNull(message = "O setor de origem deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SETOR_ORIGEM", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Setor setorOrigem;

    @NotNull(message = "O setor de destino deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SETOR_DESTINO", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Setor setorDestino;

    public enum TipoMovimentacao {
        ENTRADA,
        SAIDA
    }
    
    // Método para obter o nome do produto através da relação com estoque
    public String getNomeProduto() {
        if (this.estoque != null && this.estoque.getProduto() != null) {
            return this.estoque.getProduto().getNome();
        }
        return "Produto não encontrado";
    }
    
    // Método para obter a descrição do produto através da relação com estoque
    public String getDescricaoProduto() {
        if (this.estoque != null && this.estoque.getProduto() != null) {
            return this.estoque.getProduto().getDescricao();
        }
        return "Descrição não encontrada";
    }
}
