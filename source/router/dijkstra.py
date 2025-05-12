from fastapi import APIRouter, UploadFile
from source.service.dijkstra import AlgorithmDijkstra 

api = APIRouter()

@api.post("/custo",
        summary="Calcula o custo de um caminho em um grafo")
def calcula_custo(verticeInicial: str, grafo: UploadFile):
    service = AlgorithmDijkstra()
    return service.encontrar_caminho(grafo)