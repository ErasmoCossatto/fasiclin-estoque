package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "PESSOAFIS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "pessoa")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PessoaFisica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDPESSOAFIS")
    private Integer id;

    @NotNull(message = "A pessoa deve ser informada")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PESSOA", nullable = false, unique = true)
    private Pessoa pessoa;

    @NotBlank(message = "O CPF deve ser informado")
    @Size(min = 11, max = 11, message = "O CPF deve ter 11 dígitos")
    @Column(name = "CPFPESSOA", nullable = false, unique = true, length = 11)
    private String cpf;

    @NotBlank(message = "O nome deve ser informado")
    @Size(max = 100, message = "O nome não pode exceder 100 caracteres")
    @Column(name = "NOMEPESSOA", nullable = false, length = 100)
    private String nome;

    @NotNull(message = "A data de nascimento deve ser informada")
    @Column(name = "DATANASCPES", nullable = false)
    private LocalDate dataNascimento;

    @NotNull(message = "O sexo deve ser informado")
    @Enumerated(EnumType.STRING)
    @Column(name = "SEXOPESSOA", nullable = false)
    private Sexo sexo;

    @Column(name = "DATACRIACAO", nullable = false, updatable = false, insertable = false)
    private LocalDate dataCriacao;

    public enum Sexo {
        M, F
    }
}
