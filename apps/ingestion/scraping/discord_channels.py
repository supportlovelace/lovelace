import os
import sys
import json
import dlt
import discord
import asyncio
from datetime import datetime
from typing import Any, Dict, Iterator, Iterable
from kafka import KafkaProducer

# --- CONFIGURATION ---
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:19092")
KAFKA_TOPIC = "discord_metadata"

# Metadata Lovelace pour le pipeline Connect
GAME_ID = os.getenv("GAME_ID")
STEP_SLUG = os.getenv("STEP_SLUG")
WORKFLOW_ID = os.getenv("WORKFLOW_ID")

if not DISCORD_TOKEN:
    print(json.dumps({"error": "DISCORD_TOKEN manquante"}))
    sys.exit(1)

# Discord Client
intents = discord.Intents.default()
client = discord.Client(intents=intents)

# --- CUSTOM DESTINATION : KAFKA (Style Backfill) ---
def json_serializer(obj):
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

@dlt.destination(batch_size=100, name="redpanda")
def kafka_destination(items: Iterable[Dict[str, Any]], table_schema: Any) -> None:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKERS,
        value_serializer=lambda v: json.dumps(v, default=json_serializer).encode('utf-8')
    )

    for item in items:
        # Enveloppe Lovelace pour le mapping universel dans Connect
        message = {
            "platform": "discord",
            "type": "channel",
            "gameId": GAME_ID,
            "stepSlug": STEP_SLUG,
            "workflowId": WORKFLOW_ID,
            "data": item
        }
        # On utilise l'ID Discord comme clé Kafka
        key = str(item.get("id", "")).encode('utf-8')
        producer.send(KAFKA_TOPIC, key=key, value=message)
    
    producer.flush()

# --- EXTRACTION ---
async def fetch_channels(guild_id: int):
    await client.login(DISCORD_TOKEN)
    try:
        guild = await client.fetch_guild(guild_id)
        channels = await guild.fetch_channels()
        
        results = []
        for ch in channels:
            results.append({
                "id": str(ch.id),
                "name": ch.name,
                "type": ch.type.value,
                "parent_id": str(ch.category_id) if ch.category_id else None,
                "position": ch.position,
                "nsfw": getattr(ch, 'nsfw', False),
                "topic": getattr(ch, 'topic', None)
            })
        return results
    finally:
        await client.close()

@dlt.resource(name="discord_channels", write_disposition="replace")
def discord_resource(guild_id: int):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    channels = loop.run_until_complete(fetch_channels(guild_id))
    # On stocke le count pour le print final
    os.environ["TOTAL_CHANNELS_COUNT"] = str(len(channels))
    yield channels

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing guildId argument"}))
        sys.exit(1)
        
    try:
        guild_id = int(sys.argv[1])
    except ValueError:
        print(json.dumps({"error": "guildId must be an integer"}))
        sys.exit(1)

    # Pipeline DLT
    pipeline = dlt.pipeline(
        pipeline_name="discord_onboarding_channels",
        destination=kafka_destination
    )

    info = pipeline.run(discord_resource(guild_id))
    
    # On renvoie le count à Kestra sur stdout
    print(json.dumps({
        "status": "success",
        "count": int(os.getenv("TOTAL_CHANNELS_COUNT", "0")),
        "load_info": str(info)
    }))