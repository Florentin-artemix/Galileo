package com.galileo.embedding.provider;

import java.util.List;

public interface EmbeddingProvider {

    String getProviderName();

    String getModelName();

    int getDimension();

    float[] generateEmbedding(String text);

    List<float[]> generateEmbeddings(List<String> texts);
}
