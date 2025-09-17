package com.br.fasipe.estoque.MovimentacaoEstoque.models;

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
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "PROFISSIONAL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"pessoaFisica", "supervisor", "conselhoProfissional"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Profissional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IDPROFISSIO")
    private Integer id;

    @NotNull(message = "A pessoa física deve ser informada")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_PESSOAFIS", nullable = false)
    private PessoaFisica pessoaFisica;

    @NotNull(message = "O tipo de profissional deve ser informado")
    @Enumerated(EnumType.STRING)
    @Column(name = "TIPOPROFI", nullable = false)
    private TipoProfissional tipoProfissional;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_SUPPROFI")
    private Profissional supervisor;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUSPROFI")
    private StatusProfissional statusProfissional;

    @NotNull(message = "O conselho profissional deve ser informado")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ID_CONSEPROFI", nullable = false)
    private ConselhoProfissional conselhoProfissional;

    public enum TipoProfissional {
        _1("1"), _2("2"), _3("3"), _4("4");
        
        private String codigo;
        
        TipoProfissional(String codigo) {
            this.codigo = codigo;
        }
        
        public String getCodigo() {
            return codigo;
        }
    }

    public enum StatusProfissional {
        _1("1"), _2("2"), _3("3");
        
        private String codigo;
        
        StatusProfissional(String codigo) {
            this.codigo = codigo;
        }
        
        public String getCodigo() {
            return codigo;
        }
    }
}
