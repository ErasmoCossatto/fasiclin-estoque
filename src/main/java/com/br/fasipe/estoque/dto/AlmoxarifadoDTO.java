package com.br.fasipe.estoque.dto;

import com.br.fasipe.estoque.model.Almoxarifado;
import lombok.Getter;
import lombok.Setter;

/**
 * DTO para retornar dados de Almoxarifado sem referências circulares
 */
@Getter
@Setter
public class AlmoxarifadoDTO {
    private Integer id;
    private String nome;
    private String descricao;
    private String localizacao;
    private String telefoneContato;
    private String emailContato;
    private Boolean ativo;

    public static AlmoxarifadoDTO fromEntity(Almoxarifado almoxarifado) {
        AlmoxarifadoDTO dto = new AlmoxarifadoDTO();
        dto.setId(almoxarifado.getId());
        dto.setNome(almoxarifado.getNomeAlmoxarifado());
        dto.setDescricao(almoxarifado.getNomeAlmoxarifado());
        dto.setLocalizacao(almoxarifado.getLocalizacao());
        dto.setTelefoneContato(almoxarifado.getTelefoneContato());
        dto.setEmailContato(almoxarifado.getEmailContato());
        dto.setAtivo(almoxarifado.getAtivo());
        
        return dto;
    }
}
