package com.br.fasipe.estoque.exception;

/**
 * Exceção lançada quando uma operação é inválida devido a regras de negócio.
 */
public class OperacaoInvalidaException extends RuntimeException {
    
    public OperacaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
