package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.*;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.*;

import lombok.extern.slf4j.Slf4j;

/**
 * Controller para criação de dados de teste
 * Usado apenas em desenvolvimento
 */
@Slf4j
@RestController
@RequestMapping("/api/dados-teste")
@CrossOrigin(origins = "*")
public class DadosTesteController {

    @Autowired
    private UsuarioService usuarioService;
    
    @Autowired
    private SetorService setorService;
    
    @Autowired
    private MovimentacaoService movimentacaoService;

    /**
     * Cria dados básicos de teste em todas as entidades
     */
    @PostMapping("/criar-todos")
    public ResponseEntity<String> criarTodosDadosTeste() {
        log.info("Iniciando criação de dados de teste completos");
        try {
            StringBuilder resultado = new StringBuilder();
            
            // Criar usuários de teste
            resultado.append(criarUsuariosTeste());
            resultado.append("\n");
            
            // Criar setores de teste
            resultado.append(criarSetoresTeste());
            resultado.append("\n");
            
            // Criar movimentações de teste
            movimentacaoService.criarDadosTeste();
            resultado.append("Movimentações de teste criadas com sucesso!");
            
            return ResponseEntity.ok(resultado.toString());
        } catch (Exception e) {
            log.error("Erro ao criar dados de teste: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Erro ao criar dados de teste: " + e.getMessage());
        }
    }

    /**
     * Cria apenas usuários de teste
     */
    @PostMapping("/usuarios")
    public ResponseEntity<String> criarUsuariosTeste() {
        try {
            // Verificar se já existem usuários
            if (usuarioService.count() > 0) {
                return ResponseEntity.ok("Usuários de teste já existem no banco de dados");
            }

            // Criar usuários básicos
            Usuario admin = new Usuario();
            admin.setLogin("admin");
            admin.setSenha("admin123");
            usuarioService.save(admin);

            Usuario user1 = new Usuario();
            user1.setLogin("user1");
            user1.setSenha("user123");
            usuarioService.save(user1);

            Usuario user2 = new Usuario();
            user2.setLogin("user2");
            user2.setSenha("user123");
            usuarioService.save(user2);

            return ResponseEntity.ok("Usuários de teste criados com sucesso!");
        } catch (Exception e) {
            log.error("Erro ao criar usuários de teste: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Erro ao criar usuários de teste: " + e.getMessage());
        }
    }

    /**
     * Cria apenas setores de teste
     */
    @PostMapping("/setores")
    public ResponseEntity<String> criarSetoresTeste() {
        try {
            // Verificar se já existem setores
            if (setorService.count() > 0) {
                return ResponseEntity.ok("Setores de teste já existem no banco de dados");
            }

            // Criar setores básicos
            Setor almoxarifado = new Setor();
            almoxarifado.setNome("Almoxarifado Central");
            almoxarifado.setIdProfissional(1);
            setorService.save(almoxarifado);

            Setor farmacia = new Setor();
            farmacia.setNome("Farmácia");
            farmacia.setIdProfissional(1);
            setorService.save(farmacia);

            Setor enfermaria = new Setor();
            enfermaria.setNome("Enfermaria");
            enfermaria.setIdProfissional(1);
            setorService.save(enfermaria);

            Setor uti = new Setor();
            uti.setNome("UTI");
            uti.setIdProfissional(1);
            setorService.save(uti);

            return ResponseEntity.ok("Setores de teste criados com sucesso!");
        } catch (Exception e) {
            log.error("Erro ao criar setores de teste: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Erro ao criar setores de teste: " + e.getMessage());
        }
    }

    /**
     * Remove todos os dados de teste
     */
    @DeleteMapping("/limpar-todos")
    public ResponseEntity<String> limparDadosTeste() {
        log.info("Limpando dados de teste");
        try {
            // Aqui você pode adicionar lógica para limpar dados de teste
            // Por segurança, não implemento remoção automática
            return ResponseEntity.ok("Funcionalidade de limpeza não implementada por segurança");
        } catch (Exception e) {
            log.error("Erro ao limpar dados de teste: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Erro ao limpar dados de teste: " + e.getMessage());
        }
    }

    /**
     * Verifica status dos dados no banco
     */
    @GetMapping("/status")
    public ResponseEntity<String> verificarStatus() {
        try {
            StringBuilder status = new StringBuilder();
            status.append("Status dos dados no banco:\n");
            status.append("- Usuários: ").append(usuarioService.count()).append("\n");
            status.append("- Setores: ").append(setorService.count()).append("\n");
            
            return ResponseEntity.ok(status.toString());
        } catch (Exception e) {
            log.error("Erro ao verificar status: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Erro ao verificar status: " + e.getMessage());
        }
    }
}