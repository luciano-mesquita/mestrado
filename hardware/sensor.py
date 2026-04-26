import time
import board
import busio
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
import json
import os
import statistics  # Importado para o filtro de mediana
from threading import Lock

# Configuração de Hardware
i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c)
ads.gain = 2/3
chan = AnalogIn(ads, ADS.P0)
_sensor_lock = Lock()

# Constante de Calibração Ratiométrica (Baseada nos seus 4.965V)
VOLTAGEM_FONTE = 4.965 
SENSIBILIDADE_PA = (VOLTAGEM_FONTE * 0.2) / 1000.0 

def carregar_config():
    CONFIG_PATH = "configs.json"
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    return {"offset": 0.4090} # Valor médio observado nos seus logs

def get_pressure():
    """Retorna a pressão em Pascal com Mediana e Filtro de Ruído Negativo."""
    with _sensor_lock:
        config = carregar_config()
        offset_calibrado = config.get("offset", 0.4090)
        
        # Coleta de 15 amostras rápidas para aplicar o filtro de Mediana
        # Isso expulsa os picos de ruído de -8 Pa que ocorrem intermitentemente
        leituras_inst = []
        for _ in range(15):
            leituras_inst.append(chan.voltage)
            time.sleep(0.005) 
        
        v_estavel = statistics.median(leituras_inst)
        
        # Cálculo da pressão em Pascal
        pressao_pa = (v_estavel - offset_calibrado) / SENSIBILIDADE_PA
        
        # FILTRO DE REPOUSO E CLIP NEGATIVO
        # Qualquer valor abaixo de 0.5 Pa é considerado ruído ou deriva térmica
        if pressao_pa < 0.5: 
            pressao_pa = 0.0
            
        return round(pressao_pa, 4)

if __name__ == "__main__":
    print(f"Monitorando... Sensibilidade Real: {SENSIBILIDADE_PA:.6f} V/Pa")
    try:
        while True:
            print(f"Pressão: {get_pressure():.2f} Pa")
            time.sleep(1.0)
    except KeyboardInterrupt:
        pass
