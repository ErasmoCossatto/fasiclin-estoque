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

    // Modelo atualizado para compatibilidade com data.sql.bak
    @NotNull(message = "O nome é obrigatório")
    @Size(max = 100, message = "O nome não pode exceder 100 caracteres")
    @Column(name = "NOME", nullable = false, length = 100)
    private String nome;

    @NotNull(message = "O email é obrigatório")
    @Size(max = 100, message = "O email não pode exceder 100 caracteres")
    @Column(name = "EMAIL", nullable = false, unique = true, length = 100)
    private String email;

    @NotNull(message = "A senha é obrigatória")
    @Size(max = 250, message = "A senha não pode exceder 250 caracteres")
    @Column(name = "SENHA", nullable = false, length = 250)
    private String senha;

    @Column(name = "PERFIL", length = 50)
    private String perfil;

    @Column(name = "ATIVO")
    private Boolean ativo = true;

    // Manter compatibilidade com o modelo original (métodos auxiliares)
    public String getLogin() {
        return this.email; // Usar email como login
    }

    public void setLogin(String login) {
        this.email = login; // Mapear login para email
    }
}