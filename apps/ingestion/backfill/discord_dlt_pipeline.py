import os
import json
import dlt
import discord
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Iterator, Iterable
from kafka import KafkaProducer

# --- CONFIGURATION ---
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
if not DISCORD_TOKEN:
    raise ValueError("❌ La variable d'environnement DISCORD_TOKEN est manquante.")

try:
    GUILD_ID = int(os.getenv("GUILD_ID", "0"))
except ValueError:
    raise ValueError("❌ La variable GUILD_ID doit être un entier.")

if GUILD_ID == 0:
    raise ValueError("❌ La variable d'environnement GUILD_ID est manquante.")

# Kafka Config
KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "localhost:19092")
KAFKA_TOPIC = "ingestion-discord"

# Date Range
START_DATE = datetime(2023, 1, 1, tzinfo=timezone.utc)
END_DATE = datetime(2025, 12, 31, tzinfo=timezone.utc)

# Discord Client
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

# --- CUSTOM DESTINATION : REDPANDA ---
def json_serializer(obj):
    if isinstance(obj, (datetime,)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

@dlt.destination(batch_size=100, name="redpanda")
def kafka_destination(items: Iterable[Dict[str, Any]], table_schema: Any) -> None:
    """
    Cette fonction reçoit des lots (batchs) d'items depuis DLT
    et les envoie dans Redpanda.
    """
    # Initialisation du Producer (une fois par worker/batch idéalement, mais ici ok)
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKERS,
        value_serializer=lambda v: json.dumps(v, default=json_serializer).encode('utf-8')
    )

    count = 0
    for item in items:
        # On utilise l'ID du message comme clé pour garantir l'ordre/unicité partition
        key = str(item.get("id", "")).encode('utf-8')
        
        # Envoi asynchrone
        producer.send(KAFKA_TOPIC, key=key, value=item)
        count += 1
    
    # On force l'envoi du batch
    producer.flush()
    print(f"   📤 Batch envoyé à Redpanda ({count} items) -> Topic: {KAFKA_TOPIC}")


# --- EXTRACTION (SOURCE) ---
def serialize_message(msg: discord.Message) -> Dict[str, Any]:
    return {
        "id": str(msg.id),
        "channel_id": str(msg.channel.id),
        "channel_name": getattr(msg.channel, 'name', 'unknown'),
        "guild_id": str(msg.guild.id) if msg.guild else None,
        "author": {
            "id": str(msg.author.id),
            "name": msg.author.name,
            "discriminator": msg.author.discriminator,
            "bot": msg.author.bot,
            "display_name": msg.author.display_name
        },
        "content": msg.content,
        "created_at": msg.created_at, # DLT gère les dates, mais pour JSON direct c'est mieux
        "edited_at": msg.edited_at,
        # Pour éviter que DLT ne normalise (éclate) ces champs, on pourrait les dumper en string
        # Mais ici avec notre destination custom, on reçoit le DICT complet, donc on s'en fiche !
        # DLT ne va PAS éclater les tables car on intercepte les items avant l'écriture DB.
        "attachments": [
            {"id": str(a.id), "url": a.url, "filename": a.filename, "content_type": a.content_type} 
            for a in msg.attachments
        ],
        "embeds": [e.to_dict() for e in msg.embeds],
        "reactions": [
            {"emoji": str(r.emoji), "count": r.count} for r in msg.reactions
        ],
        "mentions": [str(u.id) for u in msg.mentions],
        "source": "backfill-dlt"
    }

async def fetch_discord_messages(guild_id: int, start: datetime, end: datetime):
    await client.login(DISCORD_TOKEN)
    try:
        guild = await client.fetch_guild(guild_id)
        print(f"✅ Connecté au serveur : {guild.name}")
        channels = await guild.fetch_channels()
        text_channels = [c for c in channels if isinstance(c, discord.TextChannel)]
        
        print(f"🔍 Scan de {len(text_channels)} salons...")
        
        for channel in text_channels:
            print(f"  👉 Lecture de #{channel.name}...")
            count = 0
            try:
                async for message in channel.history(after=start, before=end, limit=None):
                    count += 1
                    yield serialize_message(message)
                print(f"     ✅ Total #{channel.name}: {count} messages")
            except discord.Forbidden:
                print(f"  ❌ Accès interdit à #{channel.name}")
            except Exception as e:
                print(f"  ❌ Erreur #{channel.name}: {e}")
    finally:
        await client.close()

@dlt.resource(name="discord_messages", write_disposition="append")
def discord_source():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    generator = fetch_discord_messages(GUILD_ID, START_DATE, END_DATE)
    try:
        while True:
            yield loop.run_until_complete(generator.__anext__())
    except StopAsyncIteration:
        pass
    finally:
        loop.close()

if __name__ == "__main__":
    # Pipeline
    pipeline = dlt.pipeline(
        pipeline_name="discord_to_kafka",
        dataset_name="ingestion_data",
        # C'est ici la magie : on passe notre fonction Python comme destination
        destination=kafka_destination 
    )

    print(f"🚀 Démarrage Backfill -> Redpanda ({KAFKA_BROKERS})")
    
    # On lance !
    # Note: On peut désactiver le "state" full si on veut juste streamer, 
    # mais DLT va quand même tracker ce qu'il a chargé.
    info = pipeline.run(discord_source())
    
    print(info)
    print("✅ Terminé !")