package com.br.fasipe.estoque.MovimentacaoEstoque.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;
import com.br.fasipe.estoque.MovimentacaoEstoque.services.UsuarioService;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

/**
 * Controller para gerenciamento de usuários
 * Endpoints para controle de usuários do sistema
 */
@Slf4j
@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    /**
     * Lista todos os usuários
     * Endpoint principal para visualização de usuários
     */
    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        log.info("Listando todos os usuários");
        try {
            List<Usuario> usuarios = usuarioService.findAll();
            log.info("Encontrados {} usuários", usuarios.size());
            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            log.error("Erro ao listar usuários: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(List.of());
        }
    }

    /**
     * Busca usuário por ID
     * Endpoint para detalhamento de usuário específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarUsuarioPorId(@PathVariable Integer id) {
        log.info("Buscando usuário por ID: {}", id);
        try {
            Optional<Usuario> usuario = usuarioService.findById(id);
            return usuario.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erro ao buscar usuário ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Busca usuário por login
     * Endpoint para busca por login
     */
    @GetMapping("/login/{login}")
    public ResponseEntity<Usuario> buscarUsuarioPorLogin(@PathVariable String login) {
        log.info("Buscando usuário por login: {}", login);
        try {
            Optional<Usuario> usuario = usuarioService.findByLogin(login);
            return usuario.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erro ao buscar usuário por login {}: {}", login, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Cria um novo usuário
     * Endpoint para cadastro de usuários
     */
    @PostMapping
    public ResponseEntity<Usuario> criarUsuario(@RequestBody Usuario usuario) {
        log.info("Criando novo usuário: {}", usuario.getLogin());
        try {
            Usuario usuarioSalvo = usuarioService.save(usuario);
            return ResponseEntity.ok(usuarioSalvo);
        } catch (Exception e) {
            log.error("Erro ao criar usuário: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Atualiza um usuário existente
     * Endpoint para edição de informações do usuário
     */
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizarUsuario(@PathVariable Integer id, @RequestBody Usuario usuario) {
        log.info("Atualizando usuário ID: {}", id);
        try {
            usuario.setId(id);
            Usuario usuarioAtualizado = usuarioService.update(usuario);
            return ResponseEntity.ok(usuarioAtualizado);
        } catch (Exception e) {
            log.error("Erro ao atualizar usuário ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Remove um usuário
     * Endpoint para exclusão de usuários
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removerUsuario(@PathVariable Integer id) {
        log.info("Removendo usuário ID: {}", id);
        try {
            usuarioService.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Erro ao remover usuário ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Verifica se usuário existe
     * Endpoint para validação de existência
     */
    @GetMapping("/{id}/existe")
    public ResponseEntity<Boolean> verificarExistencia(@PathVariable Integer id) {
        log.info("Verificando existência do usuário ID: {}", id);
        try {
            boolean existe = usuarioService.existsById(id);
            return ResponseEntity.ok(existe);
        } catch (Exception e) {
            log.error("Erro ao verificar existência do usuário ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(false);
        }
    }

    /**
     * Conta total de usuários
     * Endpoint para estatísticas
     */
    @GetMapping("/total")
    public ResponseEntity<Long> contarUsuarios() {
        log.info("Contando total de usuários");
        try {
            long total = usuarioService.count();
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            log.error("Erro ao contar usuários: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(0L);
        }
    }
}