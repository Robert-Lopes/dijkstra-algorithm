from fastapi import APIRouter, UploadFile
from source.service.dijkstra import AlgorithmDijkstra, Grafo

api = APIRouter()

@api.post("/custo",
        summary="Calcula o custo de um caminho em um grafo")
def calcula_custo(verticeInicial: str, arquivoGrafo: UploadFile):
    grafo_definido = Grafo(arquivo=arquivoGrafo)
    
    service = AlgorithmDijkstra(grafo=grafo_definido)
    
    return service.grafo.lista_adjacencia