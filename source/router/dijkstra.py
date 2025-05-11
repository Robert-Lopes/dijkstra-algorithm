from fastapi import APIRouter, UploadFile
from source.service.dijkstra import AlgorithmDijkstra 

api = APIRouter()
service = AlgorithmDijkstra()

@api.post("/custo",
        summary="Calcula o custo de um caminho em um grafo")
def calcula_custo(verticeInicial: str, grafo: UploadFile):
    return service.encontrar_caminho(grafo)