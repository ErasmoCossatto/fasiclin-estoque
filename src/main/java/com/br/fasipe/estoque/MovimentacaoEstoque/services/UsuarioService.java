package com.br.fasipe.estoque.MovimentacaoEstoque.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.br.fasipe.estoque.MovimentacaoEstoque.models.Usuario;
import com.br.fasipe.estoque.MovimentacaoEstoque.repository.UsuarioRepository;

import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public List<Usuario> findAll() {
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            log.info("UsuarioService.findAll() - Encontrados {} usuários", usuarios.size());
            return usuarios;
        } catch (Exception e) {
            log.error("Erro no UsuarioService.findAll(): {}", e.getMessage(), e);
            throw e;
        }
    }

    public Optional<Usuario> findById(Integer id) {
        try {
            return usuarioRepository.findById(id);
        } catch (Exception e) {
            log.error("Erro ao buscar usuário por ID {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    public Optional<Usuario> findByLogin(String login) {
        try {
            return usuarioRepository.findByLogin(login);
        } catch (Exception e) {
            log.error("Erro ao buscar usuário por login {}: {}", login, e.getMessage(), e);
            throw e;
        }
    }

    public Usuario save(Usuario usuario) {
        try {
            Usuario usuarioSalvo = usuarioRepository.save(usuario);
            log.info("Usuário {} salvo com sucesso", usuario.getLogin());
            return usuarioSalvo;
        } catch (Exception e) {
            log.error("Erro ao salvar usuário {}: {}", usuario.getLogin(), e.getMessage(), e);
            throw e;
        }
    }

    public Usuario update(Usuario usuario) {
        try {
            Usuario usuarioAtualizado = usuarioRepository.save(usuario);
            log.info("Usuário ID {} atualizado com sucesso", usuario.getId());
            return usuarioAtualizado;
        } catch (Exception e) {
            log.error("Erro ao atualizar usuário ID {}: {}", usuario.getId(), e.getMessage(), e);
            throw e;
        }
    }

    public void deleteById(Integer id) {
        try {
            usuarioRepository.deleteById(id);
            log.info("Usuário ID {} removido com sucesso", id);
        } catch (Exception e) {
            log.error("Erro ao remover usuário ID {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    public boolean existsById(Integer id) {
        try {
            return usuarioRepository.existsById(id);
        } catch (Exception e) {
            log.error("Erro ao verificar existência do usuário ID {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    public long count() {
        try {
            return usuarioRepository.count();
        } catch (Exception e) {
            log.error("Erro ao contar usuários: {}", e.getMessage(), e);
            throw e;
        }
    }
}