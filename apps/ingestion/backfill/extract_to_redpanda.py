import dlt
import json
import os
from datetime import datetime
from kafka import KafkaProducer
from dlt.common.typing import TDataItems
from dlt.common.schema import TTableSchema

# --- CONFIGURATION ---
REDPANDA_BROKERS = ["100.90.85.26:19092"] 

# Configuration S3 pour le STATE et les données brutes (Backup)
os.environ["DESTINATION__FILESYSTEM__BUCKET_URL"] = "s3://dlt-state-bucket"
os.environ["DESTINATION__FILESYSTEM__CREDENTIALS__ENDPOINT_URL"] = "http://100.90.85.26:9005"
os.environ["DESTINATION__FILESYSTEM__CREDENTIALS__AWS_ACCESS_KEY_ID"] = "minioadmin"
os.environ["DESTINATION__FILESYSTEM__CREDENTIALS__AWS_SECRET_ACCESS_KEY"] = "minioadmin"

# --- CUSTOM SIDE-EFFECT: REDPANDA ---
# On utilise un décorateur transformer ou simplement on envoie dans le yield
# Mais le plus propre avec dlt pour avoir le state S3 + Kafka Stream
# c'est d'utiliser S3 comme destination principale (pour le state)
# et d'envoyer à Kafka "en passant".

def send_to_redpanda(items):
    producer = KafkaProducer(
        bootstrap_servers=REDPANDA_BROKERS,
        value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8')
    )
    # On suppose ici un topic générique ou dérivé
    topic_name = "steam_reviews"
    
    for item in items:
        producer.send(topic_name, item)
    
    producer.flush()
    print(f"✅ Sent {len(items)} items to Redpanda")
    return items

# --- SOURCE ---
@dlt.resource(name="steam_reviews", write_disposition="append")
def get_steam_reviews(last_timestamp=dlt.sources.incremental("timestamp", initial_value="2024-01-01T00:00:00")):
    current_time = datetime.now().isoformat()
    
    # Mock data fetching
    new_data = [
        {
            "review_id": 103,
            "game_id": "ravenswatch",
            "author": "ScalableDev",
            "content": "S3 State backend is robust.",
            "sentiment": 1.0,
            "timestamp": current_time,
            "platform": "Steam"
        }
    ]
    
    # SIDE EFFECT: Envoyer à Redpanda IMMÉDIATEMENT
    # C'est ici qu'on fait le streaming temps réel
    if new_data:
        send_to_redpanda(new_data)
        yield new_data

if __name__ == "__main__":
    # On utilise S3 comme destination officielle.
    # Cela garantit que le STATE est stocké sur S3 et partagé entre les pods.
    # Les données seront AUSSI stockées sur S3 (Data Lake / Backup), ce qui est une bonne pratique.
    
    pipeline = dlt.pipeline(
        pipeline_name="steam_realtime_prod",
        destination="filesystem", 
        dataset_name="raw_events"
    )

    info = pipeline.run(get_steam_reviews)
    
    print("Pipeline finished!")
    print(info)
