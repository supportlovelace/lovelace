FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances système (si besoin de compiler certaines libs)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copie des requirements (si tu en as un, sinon on installe direct)
# Pour l'instant on installe en direct pour faire simple, 
# mais idéalement tu devrais avoir un requirements.txt dans apps/ingestion
RUN pip install --no-cache-dir \
    dlt \
    discord.py \
    kafka-python \
    duckdb

# Copie du code source
# On copie tout le dossier 'ingestion' dans /app
COPY . /app

# Variable d'environnement pour que Python ne bufferise pas les logs (important pour Kestra)
ENV PYTHONUNBUFFERED=1

# Le point d'entrée par défaut (optionnel, Kestra surchargera la commande)
CMD ["python", "backfill/discord_dlt_pipeline.py"]

