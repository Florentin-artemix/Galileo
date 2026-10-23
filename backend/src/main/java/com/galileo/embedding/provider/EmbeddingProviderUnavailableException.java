package com.galileo.embedding.provider;

/**
 * Exception levée lorsque le fournisseur d'embeddings (ex: Qwen) est indisponible,
 * non configuré ou retourne une réponse invalide/erreur HTTP.
 * Permet d'éviter l'utilisation silencieuse de vecteurs nuls (all-zeros).
 */
public class EmbeddingProviderUnavailableException extends RuntimeException {

    public EmbeddingProviderUnavailableException(String message) {
        super(message);
    }

    public EmbeddingProviderUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
