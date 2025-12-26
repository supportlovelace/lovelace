import dlt
import os
from datetime import datetime

# --- CONFIGURATION STAGING (MINIO) ---
# Trino a besoin que dlt dépose d'abord les fichiers dans S3
os.environ["STAGING__FILESYSTEM__BUCKET_URL"] = "s3://landing-zone"
os.environ["STAGING__FILESYSTEM__CREDENTIALS__ENDPOINT_URL"] = "http://100.90.85.26:9005"
os.environ["STAGING__FILESYSTEM__CREDENTIALS__AWS_ACCESS_KEY_ID"] = "minioadmin"
os.environ["STAGING__FILESYSTEM__CREDENTIALS__AWS_SECRET_ACCESS_KEY"] = "minioadmin"

# --- CONFIGURATION DESTINATION (TRINO) ---
# dlt va se connecter à Trino pour gérer les tables automatiquement
# Format: trino://user@host:port/catalog/schema
os.environ["DESTINATION__TRINO__CREDENTIALS"] = "trino://admin@100.90.85.26:8083/iceberg/raw_data"

# --- MOCK DATA SOURCE ---
@dlt.resource(name="steam_reviews", write_disposition="append")
def get_mock_reviews():
    yield [
        {
            "review_id": 101,
            "game_id": "ravenswatch_1",
            "author": "Antoine",
            "content": "Automated ingestion is banger!",
            "sentiment_score": 0.95,
            "timestamp": datetime.now().isoformat(),
            "new_feature_column": "This was added automatically!" # On simule une nouvelle colonne
        }
    ]

if __name__ == "__main__":
    # 1. Créer le pipeline avec la destination TRINO
    pipeline = dlt.pipeline(
        pipeline_name="steam_to_trino",
        destination="trino",
        staging="filesystem", # Obligatoire pour charger dans Trino via S3
        dataset_name="raw_data"
    )

    # 2. Lancer l'ingestion
    # dlt va créer la table 'steam_reviews' dans le schéma 'raw_data' du catalogue 'iceberg'
    load_info = pipeline.run(get_mock_reviews())

    print(f"Pipeline finished! dlt has managed the Trino schema for you.")
    print(load_info)
