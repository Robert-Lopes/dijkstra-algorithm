import re
import heapq
from typing import Dict, Tuple, Any, List, Optional
from fastapi import UploadFile

class Grafo:
    '''
        Classe usada para representar um grafo por meio de uma lista de Adjacência
    '''
    def __init__(self, arquivo: UploadFile | None = None):
        self.lista_adjacencia: Dict[str, Dict] = {}
        self.__validar_arquivo(arquivo=arquivo)

    #fiz uma alteração aqui tambem, pois a construção do grafo ignorava a existencia de mais de um nó
    
    def __validar_arquivo(self, arquivo: UploadFile) -> None:
        '''
            Método que recebe um arquivo .txt e o percorre para criar o grafo
        '''
        if arquivo is None:
            raise FileNotFoundError("O arquivo não pode ser nulo")
        
        linhas = arquivo.file.read().decode('utf-8').splitlines()
        
        # Inicializar todos os vértices (origem e destino)
        for linha in linhas:
            if not linha.strip():
                continue
            parts = re.split(r":\s*", linha, 1)
            if len(parts) != 2:
                continue
            origem = parts[0]
            if origem and re.match(r"^[A-Za-z]$", origem):
                self.lista_adjacencia[origem] = self.lista_adjacencia.get(origem, {})
                destinos = re.split(r",\s*", parts[1]) if parts[1] else []
                for destino in destinos:
                    if re.match(r"^[A-Za-z][0-9]+$", destino):
                        vertice_ligado = destino[0]
                        self.lista_adjacencia[vertice_ligado] = self.lista_adjacencia.get(vertice_ligado, {})
        
        # Adicionar arestas
        for linha in linhas:
            if not linha.strip():
                continue
            parts = re.split(r":\s*", linha, 1)
            if len(parts) != 2:
                continue
            origem = parts[0]
            if not (origem and re.match(r"^[A-Za-z]$", origem)):
                continue
            destinos = re.split(r",\s*", parts[1]) if parts[1] else []
            lista_vertice = [item for item in destinos if re.match(r"^[A-Za-z][0-9]+$", item)]
            self.__add_edge(origem, lista_vertice)

    def __add_edge(self, principal: str, lista_vertice: List[str]) -> None:
        if not lista_vertice:
            return
        for vertice in lista_vertice:
            vertice_ligado = str(vertice[0])
            try:
                peso = int(vertice[1:])
                self.lista_adjacencia[principal][vertice_ligado] = peso
            except ValueError:
                pass 

class AlgorithmDijkstra:
    '''
        Classe que recebe um grafo e calcula o menor caminho por meio do
        algoritmo de Dijkstra
    '''
    def __init__(self, grafo: Grafo):
        self.grafo: Grafo = grafo

    def obter_caminho_vertice(self, fonte: str) -> Dict[str, Any]:
        '''
            A partir de um vértice fonte, encontra o menor custo para cada destino
            e também o caminho percorrido, retornando no formato JSON especificado.
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

        caminhos = self.reconstruir_todos_caminhos(predecessores=predecessores, fonte=fonte)
        
        # Fiz uma alteração aqui na resposta, para me retornar um json, no formato que o front esperava
        response = {
            "startNode": fonte,
            "paths": []
        }
        
        for target, path in caminhos.items():
            if path and target != fonte:  
                response["paths"].append({
                    "target": target,
                    "path": path,
                    "cost": custo[target] if custo[target] != float("inf") else None
                })
        
        return response
    
    def reconstruir_todos_caminhos(self, predecessores: Dict[str, Optional[str]], fonte: str) -> Dict[str, Optional[List[str]]]:
        caminhos = {}

        for destino in predecessores:
            caminho = []
            atual = destino
            
            while atual is not None:
                caminho.append(atual)
                atual = predecessores[atual]
            caminho.reverse()
        
            if caminho and caminho[0] == fonte:
                caminhos[destino] = caminho
            else:
                caminhos[destino] = None 

        return caminhos