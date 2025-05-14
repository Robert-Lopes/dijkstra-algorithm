import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from source.router.dijkstra import api as DijkstraRouter

class ApiManager:
    '''
    Classe para configuração da API
    '''
    def __init__(self) -> None:
        self.app = FastAPI(title="Algoritmo de Dijkstra - API",
                           version="0.1.0")
        self.__config_cors()
        self.__config_router()
        self.__define_description()
        
        
    #adicionei a politica de cors para aceitar requisição do front
    def __config_cors(self) -> None:
        '''
        Configura o middleware CORS para permitir requisições do frontend
        '''
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        


    def __config_router(self) -> None:
        '''
        Procedimento de configuração de rotas da API
        '''
        self.app.include_router(router=DijkstraRouter, tags=['Dijkstra'])

    def __define_description(self):
        with open('docs/description.md', mode="r", encoding='utf-8') as file_description:
            self.app.description = file_description.read()

    def get_app(self):
        return self.app