FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances système (si besoin de compiler certaines libs)
# Trigger build
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Installation de uv
RUN pip install uv

# Copie des requirements
COPY backfill/requirements.txt /app/requirements.txt

# Installation des dépendances avec uv (beaucoup plus rapide)
RUN uv pip install --system --no-cache -r /app/requirements.txt

# Copie du code source
# On copie tout le dossier 'ingestion' dans /app
COPY . /app

# Variable d'environnement pour que Python ne bufferise pas les logs (important pour Kestra)
ENV PYTHONUNBUFFERED=1

# Le point d'entrée par défaut (optionnel, Kestra surchargera la commande)
CMD ["python", "backfill/discord_dlt_pipeline.py"]

