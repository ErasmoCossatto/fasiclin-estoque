package com.br.fasipe.estoque.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisições de transferência de lote entre almoxarifados.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferenciaLoteDTO {
    private Integer idLoteOrigem;
    private Integer idAlmoxOrigem;
    private Integer idAlmoxDestino;
    private Integer quantidade;
    private String responsavel;
    private String observacao;
}
