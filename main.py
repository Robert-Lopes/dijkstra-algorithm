from source.config.ApiManager import ApiManager

def app() -> None:
   app = ApiManager()

   return app.get_app()

if __name__ == "__main__":
    app()
