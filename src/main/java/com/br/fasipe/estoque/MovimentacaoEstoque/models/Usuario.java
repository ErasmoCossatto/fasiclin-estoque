package com.br.fasipe.estoque.MovimentacaoEstoque.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "USUARIO")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"profissional", "pessoaFisica"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Usuario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDUSUARIO")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_PROFISSIO")
    private Profissional profissional;

    @ManyToOne
    @JoinColumn(name = "ID_PESSOAFIS")
    private PessoaFisica pessoaFisica;

    @NotNull(message = "O login é obrigatório")
    @Size(max = 100, message = "O login não pode exceder 100 caracteres")
    @Column(name = "LOGUSUARIO", nullable = false, unique = true, length = 100)
    private String login;

    @NotNull(message = "A senha é obrigatória")
    @Size(max = 250, message = "A senha não pode exceder 250 caracteres")
    @Column(name = "SENHAUSUA", nullable = false, length = 250)
    private String senha;
}
