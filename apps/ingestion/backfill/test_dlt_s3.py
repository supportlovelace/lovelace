import dlt
import os
from datetime import datetime

# --- CONFIGURATION MINIO ---
# On utilise l'IP Tailscale et le port mappé dans ton docker-compose (9005)
os.environ["DESTINATION__FILESYSTEM__BUCKET_URL"] = "s3://landing-zone"
os.environ["DESTINATION__FILESYSTEM__CREDENTIALS__ENDPOINT_URL"] = "http://100.90.85.26:9005"
os.environ["DESTINATION__FILESYSTEM__CREDENTIALS__AWS_ACCESS_KEY_ID"] = "minioadmin"
os.environ["DESTINATION__FILESYSTEM__CREDENTIALS__AWS_SECRET_ACCESS_KEY"] = "minioadmin"

# --- MOCK DATA SOURCE ---
@dlt.resource(name="steam_reviews")
def get_mock_reviews():
    yield [
        {
            "review_id": 1,
            "game_id": "ravenswatch_1",
            "author": "Gamer123",
            "content": "Amazing game, but needs more bosses.",
            "sentiment_score": 0.8,
            "timestamp": datetime.now().isoformat(),
            "hardware": {"gpu": "RTX 3080", "os": "Windows 11"}
        },
        {
            "review_id": 2,
            "game_id": "ravenswatch_1",
            "author": "SteamDeckUser",
            "content": "Crashes on startup on Linux.",
            "sentiment_score": 0.1,
            "timestamp": datetime.now().isoformat(),
            "hardware": {"gpu": "Steam Deck", "os": "SteamOS"}
        }
    ]

if __name__ == "__main__":
    # 1. Créer le pipeline
    pipeline = dlt.pipeline(
        pipeline_name="steam_ingestion",
        destination="filesystem",
        dataset_name="raw_data"
    )

    # 2. Lancer l'ingestion (DLT va créer le bucket s'il n'existe pas)
    # On force le format Parquet
    load_info = pipeline.run(
        get_mock_reviews(), 
        loader_file_format="parquet"
    )

    print(f"Pipeline finished successfully!")
    print(load_info)
