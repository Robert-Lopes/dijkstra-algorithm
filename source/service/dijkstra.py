import re
import heapq
from typing import Dict, Tuple, Any
from fastapi import UploadFile

class Grafo:
    '''
        Classe usada para representar um grafo por meio de uma lista de Adjacência
    '''
    def __init__(self, arquivo: UploadFile | None = None):
        self.lista_adjacencia: Dict[str, Dict]= {} 
        self.__validar_arquivo(arquivo=arquivo)

    def __validar_arquivo(self, arquivo: UploadFile) -> None:
        '''
            Método que recebe um arquivo .txt e o percorre para criar o grafo  
        '''
        if arquivo is None: 
            raise FileNotFoundError("O arquivo não pode ser nulo")
        
        linhas = arquivo.file.read().decode('utf-8').split("\n")
        
        for linha in linhas:
            lista_vertice = re.split(pattern=r":\s*|,\s*", string=linha)
            lista_vertice = [item for item in lista_vertice if re.match(r"^[A-Za-z][0-9]+$", item)]
            
            self.__add_edge(linha[0], lista_vertice)   
    
    def __add_edge(self, principal, lista_vertice) -> None:
        if principal not in self.lista_adjacencia:  
           self.lista_adjacencia[principal] = {}
        
        if not lista_vertice:
            return

        for vertice in lista_vertice:  
            vertice_ligado = str(vertice[0])   
            self.lista_adjacencia[principal][vertice_ligado] = int(vertice[1:])  

class AlgorithmDijkstra:
    '''
        Classe que recebe um grafo e possui calcula o menor caminho por meio do
        algoritmo de Dijkstra
    '''
    def __init__(self, grafo: Grafo):
        self.grafo: Grafo = grafo

    def obter_caminho_vertice(self, fonte: str) -> Tuple[Dict[str, Any], Dict[str, str]]:
        '''
            A partir de um vértice fonte, encontra o menor custo para cada destino
            e também o caminho percorrido.
        '''
        custo = {vertices: float("inf") for vertices in self.grafo.lista_adjacencia}
        custo[fonte] = 0

        predecessores = {vertices: None for vertices in self.grafo.lista_adjacencia}

        fila = [(0, fonte)]
        heapq.heapify(fila)

        no_visitados = set()

        while fila:
            custo_atual, no_atual = heapq.heappop(fila)

            if no_atual in no_visitados:
                continue
            no_visitados.add(no_atual)

            for neighbor, weight in self.grafo.lista_adjacencia[no_atual].items():
                tentative_distance = custo_atual + weight
                if tentative_distance < custo[neighbor]:
                    custo[neighbor] = tentative_distance
                    predecessores[neighbor] = no_atual
                    heapq.heappush(fila, (tentative_distance, neighbor))

        return custo, predecessores