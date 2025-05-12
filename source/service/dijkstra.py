import re
from typing import Dict
from fastapi import UploadFile
from heapq import heapify, heappop, heappush

class Grafo:
    '''
        Classe usada para representar um grafo por meio de uma lista de Adjacência
    '''
    def __init__(self, arquivo: UploadFile | None = None):
        self.lista_adjacencia: Dict[str, Dict]= {} 
        self.__validar_arquivo(arquivo=arquivo)

    def __validar_arquivo(self, arquivo: UploadFile):
        '''
            Método que recebe um arquivo .txt e percorre para criar o grafo  
        '''
        if arquivo is None: 
            raise FileNotFoundError("O arquivo não pode ser nulo")
        
        linhas = arquivo.file.read().decode('utf-8').split("\n")
        
        for linha in linhas:
            lista_vertice = re.split(pattern=r":\s*|,\s*", string=linha)
            self.__add_edge(lista_vertice[0], lista_vertice[1:])   
    
    def __add_edge(self, principal, lista_vertice):
        if principal not in self.lista_adjacencia:  
           self.lista_adjacencia[principal] = {}
        for vertice in lista_vertice:  
            vertice_ligado = str(vertice[0])   
            self.lista_adjacencia[principal][vertice_ligado] = int(vertice[1:])  

class AlgorithmDijkstra:
    def __init__(self, grafo: Grafo):
        self.grafo: Grafo = grafo