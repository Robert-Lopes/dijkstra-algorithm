from fastapi import APIRouter, UploadFile

api = APIRouter()

@api.post("/custo/")
def calcula_custo(file: UploadFile):
    return {'name': file.filename}