from fastapi import APIRouter, UploadFile, HTTPException
import logging
import re
from source.service.dijkstra import AlgorithmDijkstra, Grafo

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api = APIRouter()

#aqui eu adicionei algumas verificações e tratamentos de erros mais detalhados

@api.post("/custo", summary="Calcula o custo de um caminho em um grafo")
async def calcula_custo(verticeInicial: str, arquivoGrafo: UploadFile):
    logger.info(f"Recebido verticeInicial: {verticeInicial}, arquivo: {arquivoGrafo.filename}")
    
    try:
        if arquivoGrafo.content_type != "text/plain":
            logger.error("Arquivo não é .txt")
            raise HTTPException(status_code=400, detail="O arquivo deve ser um .txt")
        
        if not verticeInicial or not re.match(r"^[A-Za-z]$", verticeInicial):
            logger.error(f"Vértice inicial inválido: {verticeInicial}")
            raise HTTPException(status_code=400, detail="O vértice inicial deve ser uma única letra (ex.: A)")
        
        logger.info("Construindo grafo")
        grafo_definido = Grafo(arquivo=arquivoGrafo)
        
        if verticeInicial not in grafo_definido.lista_adjacencia:
            logger.error(f"Vértice inicial {verticeInicial} não encontrado no grafo")
            raise HTTPException(status_code=400, detail="Vértice inicial não encontrado no grafo")
        
        logger.info("Executando algoritmo de Dijkstra")
        service = AlgorithmDijkstra(grafo=grafo_definido)
        result = service.obter_caminho_vertice(fonte=verticeInicial)
        logger.info("Cálculo concluído com sucesso")
        
        return result
    except Exception as e:
        logger.error(f"Erro interno: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")