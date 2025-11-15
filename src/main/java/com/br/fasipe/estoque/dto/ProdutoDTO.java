package com.br.fasipe.estoque.dto;

import com.br.fasipe.estoque.model.Produto;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO para retornar dados de Produto sem referências circulares
 */
@Getter
@Setter
public class ProdutoDTO {
    private Integer id;
    private String nome;
    private String descricao;
    private Integer almoxarifadoId;
    private String almoxarifadoNome;
    private Integer idUnidadeMedida;
    private String codigoBarras;
    private BigDecimal temperaturaIdeal;
    private Integer estoqueMaximo;
    private Integer estoqueMinimo;
    private Integer pontoPedido;

    public static ProdutoDTO fromEntity(Produto produto) {
        ProdutoDTO dto = new ProdutoDTO();
        dto.setId(produto.getId());
        dto.setNome(produto.getNome());
        dto.setDescricao(produto.getDescricao());
        dto.setIdUnidadeMedida(produto.getIdUnidadeMedida());
        dto.setCodigoBarras(produto.getCodigoBarras());
        dto.setTemperaturaIdeal(produto.getTemperaturaIdeal());
        dto.setEstoqueMaximo(produto.getEstoqueMaximo());
        dto.setEstoqueMinimo(produto.getEstoqueMinimo());
        dto.setPontoPedido(produto.getPontoPedido());
        
        if (produto.getAlmoxarifado() != null) {
            dto.setAlmoxarifadoId(produto.getAlmoxarifado().getId());
            dto.setAlmoxarifadoNome(produto.getAlmoxarifado().getNomeAlmoxarifado());
        }
        
        return dto;
    }
}
