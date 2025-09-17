package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "PESSOAJUR")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PessoaJuridica {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDPESSOAJUR")
    private Integer id;
    
    @Column(name = "ID_PESSOA", nullable = false, unique = true)
    private Integer idPessoa;

    @Column(name = "CNPJ", nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(name = "RAZSOCIAL", nullable = false, length = 100)
    private String razaoSocial;

    @Column(name = "NOMEFAN", nullable = false, length = 100)
    private String nomeFantasia;

    @Column(name = "CNAE", length = 7)
    private String cnae;
}
