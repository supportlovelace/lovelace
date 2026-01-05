import os
import sys
import json
import requests

def fetch_discord_channels(guild_id, token):
    if not guild_id or not token:
        return {"error": "guildId or DISCORD_TOKEN missing"}

    url = f"https://discord.com/api/v10/guilds/{guild_id}/channels"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        channels = response.json()
        
        # On renvoie les données brutes, l'API Lovelace fera le tri
        return {
            "guildId": guild_id,
            "channels": channels,
            "count": len(channels)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Usage: python discord_channels.py <guild_id>
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing guildId argument"}))
        sys.exit(1)
        
    guild_id = sys.argv[1]
    token = os.getenv("DISCORD_TOKEN")
    
    result = fetch_discord_channels(guild_id, token)
    print(json.dumps(result))
