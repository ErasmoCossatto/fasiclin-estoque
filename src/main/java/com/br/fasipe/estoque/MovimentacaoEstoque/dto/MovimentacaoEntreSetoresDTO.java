package com.br.fasipe.estoque.MovimentacaoEstoque.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para movimentação de produtos entre setores
 * Usado na API para receber dados do frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovimentacaoEntreSetoresDTO {
    
    @NotNull(message = "O produto deve ser informado")
    private Integer idProduto;
    
    @NotNull(message = "O setor de origem deve ser informado")
    private Integer idSetorOrigem;
    
    @NotNull(message = "O setor de destino deve ser informado")
    private Integer idSetorDestino;
    
    @NotNull(message = "A quantidade deve ser informada")
    @Positive(message = "A quantidade deve ser positiva")
    private Integer quantidade;
    
    @NotNull(message = "O tipo de movimentação deve ser informado")
    private String tipoMovimentacao;
    
    // TODO: Remover nullable quando implementar variável global de usuário
    // @NotNull(message = "O usuário deve ser informado")
    private Integer idUsuario;
    
    // Campo opcional para observações
    private String observacao;
}