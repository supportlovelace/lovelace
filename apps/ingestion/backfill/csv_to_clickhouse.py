import os
import json
import pandas as pd
import dlt
import boto3
from io import BytesIO

def run_pipeline():
    # 1. Configuration S3
    s3_key = os.getenv("S3_KEY")
    s3_bucket = os.getenv("S3_BUCKET", "lovelace-imports")
    s3_endpoint = os.getenv("S3_ENDPOINT", "http://lovelace-s3:9000")
    s3_access_key = os.getenv("S3_ACCESS_KEY")
    s3_secret_key = os.getenv("S3_SECRET_KEY")
    
    # 2. Configuration Métier
    target_table = os.getenv("TARGET_TABLE")
    game_id = os.getenv("GAME_ID")
    mapping_str = os.getenv("MAPPING_JSON", "{}")
    
    # 3. Configuration ClickHouse (pour DLT)
    # On injecte les credentials dans l'environnement attendu par DLT
    os.environ["DESTINATION__CLICKHOUSE__CREDENTIALS__USERNAME"] = os.getenv("CH_USER", "default")
    os.environ["DESTINATION__CLICKHOUSE__CREDENTIALS__PASSWORD"] = os.getenv("CH_PASSWORD", "")
    os.environ["DESTINATION__CLICKHOUSE__CREDENTIALS__HOST"] = os.getenv("CH_HOST", "lovelace-clickhouse")
    os.environ["DESTINATION__CLICKHOUSE__CREDENTIALS__DATABASE"] = os.getenv("CH_DB", "default")
    os.environ["DESTINATION__CLICKHOUSE__CREDENTIALS__PORT"] = os.getenv("CH_PORT", "8123")

    if not s3_key or not target_table:
        raise ValueError("❌ Missing S3_KEY or TARGET_TABLE environment variables")

    print(f"🚀 Starting CSV ingestion for {target_table} (Game: {game_id})")

    # 4. Téléchargement depuis S3
    s3 = boto3.client(
        "s3",
        endpoint_url=s3_endpoint,
        aws_access_key_id=s3_access_key,
        aws_secret_access_key=s3_secret_key
    )

    print(f"📥 Downloading {s3_key} from {s3_bucket}...")
    obj = s3.get_object(Bucket=s3_bucket, Key=s3_key)
    df = pd.read_csv(BytesIO(obj["Body"].read()))
    
    print(f"✅ Loaded {len(df)} rows.")

    # 5. Application du Mapping
    try:
        mapping = json.loads(mapping_str)
        if mapping:
            print(f"🔄 Applying mapping: {mapping}")
            # Le mapping est supposé être : { "Nom Colonne CSV": "nom_colonne_clickhouse" }
            df.rename(columns=mapping, inplace=True)
    except Exception as e:
        print(f"⚠️ Error parsing MAPPING_JSON: {e}")

    # 6. Ajout du game_id
    if game_id:
        df["game_id"] = game_id
    
    # Nettoyage automatique des noms de colonnes pour ClickHouse (snake_case)
    df.columns = [c.strip().replace(' ', '_').lower() for c in df.columns]

    # 7. Ingestion via DLT
    pipeline = dlt.pipeline(
        pipeline_name=f"csv_import_{target_table}",
        destination="clickhouse",
        dataset_name="ingestion_bronze" 
    )

    print(f"📤 Sending data to ClickHouse table: {target_table}...")
    load_info = pipeline.run(
        df,
        table_name=target_table,
        write_disposition="append"
    )

    print(load_info)
    print(f"🎉 Ingestion de {len(df)} lignes terminée !")

if __name__ == "__main__":
    run_pipeline()