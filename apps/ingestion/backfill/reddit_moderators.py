import os
import requests
import psycopg2
from psycopg2.extras import execute_values

def sync_moderators():
    # 1. Config
    subreddit = os.getenv("SUBREDDIT")
    game_id = os.getenv("GAME_ID")
    db_url = os.getenv("DB_URL") # Format: postgresql://user:pass@host:port/db
    
    if not subreddit or not game_id or not db_url:
        raise ValueError("Missing SUBREDDIT, GAME_ID or DB_URL env vars")

    print(f"🚀 Syncing moderators for r/{subreddit} (Game: {game_id})")

    # 2. Fetch Reddit API
    headers = {"User-Agent": "LovelaceIngestion/1.0"}
    url = f"https://www.reddit.com/r/{subreddit}/about/moderators.json"
    
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    
    data = resp.json()
    moderators = data.get("data", {}).get("children", [])
    
    print(f"📦 Found {len(moderators)} moderators")

    # 3. Database Connection
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
        print(f"✅ Found GamePlatform ID: {game_platform_id}")

        for mod in moderators:
            # Structure Reddit: { name, id (t2_...), author_flair_text, mod_permissions, date }
            username = mod["name"]
            user_id = mod["id"] # t2_xyz
            flair = mod.get("author_flair_text")
            
            # 1. Gestion du Rôle
            # Si flair vide, on met 'Admin' par défaut
            role_name = flair if flair else "Admin"
            # Pour l'external_id du rôle, on utilise le nom du rôle car Reddit n'a pas d'ID de rôle fixe
            role_external_id = f"reddit_role_{role_name.lower()}"

            # Upsert Role
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
                psycopg2.extras.Json({"mod_permissions": mod.get("mod_permissions", [])})
            ))
            role_id = cur.fetchone()[0]

            # 2. Gestion du Membre
            # Upsert Member
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
                username, # Display name same as username initially
                psycopg2.extras.Json(mod) # On stocke tout le JSON brut dans metadata
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
