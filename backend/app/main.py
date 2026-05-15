from fastapi import FastAPI

app = FastAPI(title='Campo Libre API')

@app.get('/')
def healthcheck():
    return {
        'status': 'ok',
        'service': 'campo-libre-api'
    }
