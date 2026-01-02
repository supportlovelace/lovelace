import os
import requests
import json
import base64
import psycopg2
from psycopg2.extras import Json

def sync_moderators():
    # 1. Config & Secrets
    subreddit = os.getenv("SUBREDDIT")
    game_id = os.getenv("GAME_ID")
    db_url = os.getenv("DB_URL")
    
    zyte_api_key = os.getenv("ZYTE_API_KEY")
    reddit_session = os.getenv("REDDIT_SESSION") # La valeur brute du cookie

    if not all([subreddit, game_id, db_url, zyte_api_key, reddit_session]):
        raise ValueError("Missing required env vars: SUBREDDIT, GAME_ID, DB_URL, ZYTE_API_KEY, REDDIT_SESSION")

    print(f"🚀 Ingestion Lovelace : Extraction de r/{subreddit} via Zyte API...")

    # 2. Appel API Zyte (Exactement comme ton script test)
    api_url = "https://api.zyte.com/v1/extract"
    target_url = f"https://www.reddit.com/r/{subreddit}/about/moderators.json"

    payload = {
        "url": target_url,
        "httpResponseBody": True,
        "geolocation": "FR",
        "requestCookies": [
            {"name": "reddit_session", "value": reddit_session, "domain": "www.reddit.com"}
        ],
        "customHttpRequestHeaders": [
            {"name": "User-Agent", "value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
        ]
    }

    try:
        r = requests.post(api_url, auth=(zyte_api_key, ""), json=payload, timeout=60)
        r.raise_for_status()
        
        res_json = r.json()
        raw_body = base64.b64decode(res_json["httpResponseBody"]).decode("utf-8")
        reddit_data = json.loads(raw_body)
        
        moderators = reddit_data.get("data", {}).get("children", [])
        print(f"📦 Found {len(moderators)} moderators via Zyte")

    except Exception as e:
        print(f"❌ Error during Zyte extraction: {e}")
        raise e

    # 3. Database Sync (Postgres)
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    try:
        # A. Récupérer le gamePlatformId pour Reddit
        cur.execute("""
            SELECT gp.id 
            FROM game_platforms gp
            JOIN platforms p ON gp.platform_id = p.id
            WHERE gp.game_id = %s AND p.slug = 'reddit'
            LIMIT 1
        """, (game_id,))
        
        row = cur.fetchone()
        if not row:
            raise ValueError(f"No Reddit platform configured for game {game_id}")
        
        game_platform_id = row[0]

        for mod in moderators:
            # mod est ici un dict direct du JSON Reddit : { name, id, author_flair_text, ... }
            username = mod["name"]
            user_id = mod["id"] # t2_...
            flair = mod.get("author_flair_text")
            
            role_name = flair if flair else "Admin"
            role_external_id = f"reddit_role_{role_name.lower()}"

            # 1. Upsert Role
            cur.execute("""
                INSERT INTO platform_roles (
                    id, game_platform_id, external_id, name, permissions, updated_at
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, NOW()
                )
                ON CONFLICT (game_platform_id, external_id) 
                DO UPDATE SET 
                    permissions = EXCLUDED.permissions,
                    updated_at = NOW()
                RETURNING id
            """, (
                game_platform_id, 
                role_external_id, 
                role_name, 
                Json({"mod_permissions": mod.get("mod_permissions", [])})
            ))
            role_id = cur.fetchone()[0]

            # 2. Upsert Member
            cur.execute("""
                INSERT INTO platform_members (
                    id, game_platform_id, external_id, username, display_name, metadata, updated_at
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, %s, NOW()
                )
                ON CONFLICT (game_platform_id, external_id) 
                DO UPDATE SET 
                    username = EXCLUDED.username,
                    metadata = platform_members.metadata || EXCLUDED.metadata,
                    updated_at = NOW()
                RETURNING id
            """, (
                game_platform_id,
                user_id,
                username,
                username,
                Json(mod) # JSON brut complet dans metadata
            ))
            member_id = cur.fetchone()[0]

            # 3. Liaison Membre <-> Rôle
            cur.execute("""
                INSERT INTO platform_member_roles (member_id, role_id)
                VALUES (%s, %s)
                ON CONFLICT (member_id, role_id) DO NOTHING
            """, (member_id, role_id))

        conn.commit()
        print("🎉 Sync complete!")

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    sync_moderators()
