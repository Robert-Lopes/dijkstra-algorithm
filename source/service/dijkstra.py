import re
from fastapi import UploadFile
from typing import Dict


class Grafo:
    def __init__(self, grafo: dict = {}):
       self.grafo = grafo  

    def validar_arquivo(self, arquivo: UploadFile):
        linhas = arquivo.file.read().decode('utf-8').split("\n")
        
        for linha in linhas:
            lista_vertice = re.split(pattern=r":\s*|,\s*", string=linha)

            if isinstance(lista_vertice[0], str) and len(lista_vertice[0]) == 1: 
                vertice_destaco = lista_vertice[0]
            else: 
                raise ValueError("O vertice destacado deve ser apenas uma letra")
            
            vertice_ponderados = lista_vertice[1:]
            print(vertice_ponderados)
   
    def add_edge(self, vertice1, vertice2, weight):
       if vertice1 not in self.grafo:  
           self.grafo[vertice1] = {}  
       self.grafo[vertice1][vertice2] = weight  

class AlgorithmDijkstra:
    def __init__(self):
        self.custo: int = 0
        self.verticeInicial : str | None = None

    def encontrar_caminho(self, arquivo: UploadFile):
        self.validar_arquivo(arquivo)