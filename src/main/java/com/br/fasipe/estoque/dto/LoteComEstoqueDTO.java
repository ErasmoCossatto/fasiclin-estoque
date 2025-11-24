package com.br.fasipe.estoque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO para retornar informações de lote com estoque disponível.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoteComEstoqueDTO {
    private Integer idLote;
    private String nomeLote;
    private Integer idProduto;
    private String nomeProduto;
    private LocalDate dataValidade;
    private Integer quantidadeDisponivel;
    private Integer idAlmoxarifado;
    private String nomeAlmoxarifado;
    private Boolean vencido;
    private Boolean proximoVencimento;
}
