from fastapi import FastAPI

class ApiManager:
    '''
    Classe para configuração da API
    '''
    def __init__(self) -> None:
        self.app = FastAPI()
        self.config_router()

    def config_router(self) -> None:
        '''
        Procedimento de configuração de rotas da API
        '''
        pass

    def get_app(self):
        return self.app
