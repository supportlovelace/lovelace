import os
import praw
import psycopg2
from psycopg2.extras import Json

def sync_moderators():
    # 1. Config
    subreddit_name = os.getenv("SUBREDDIT")
    game_id = os.getenv("GAME_ID")
    db_url = os.getenv("DB_URL")
    
    # Reddit API Config
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "LovelaceIngestion/1.0 by reddit_user")

    if not all([subreddit_name, game_id, db_url, client_id, client_secret]):
        raise ValueError("Missing required environment variables (SUBREDDIT, GAME_ID, DB_URL, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)")

    print(f"🚀 Syncing moderators for r/{subreddit_name} using PRAW (Game: {game_id})")

    # 2. Authentification Reddit
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent
    )

    try:
        subreddit = reddit.subreddit(subreddit_name)
        # On récupère les modérateurs (PRAW gère la pagination et le rate limiting)
        moderators = list(subreddit.moderator())
        print(f"📦 Found {len(moderators)} moderators")
    except Exception as e:
        print(f"❌ Error fetching from Reddit API: {e}")
        raise e

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
            # PRAW ReditObject: mod est un objet 'Redditor' enrichi avec ses permissions
            username = mod.name
            user_id = f"t2_{mod.id}" # On préfixe manuellement si besoin, ou on utilise l'ID brut
            
            # Note: Dans moderators list, chaque objet a un attribut 'mod_permissions'
            permissions = getattr(mod, 'mod_permissions', [])
            # On cherche s'il a un flair sur le subreddit
            # (PRAW n'expose pas forcément le flair dans l'objet Redditor du menu modo directement)
            # On met 'Admin' par défaut, l'enrichissement fera le reste plus tard.
            role_name = "Admin"
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
                Json({"mod_permissions": permissions})
            ))
            role_id = cur.fetchone()[0]

            # 2. Upsert Member
            # On stocke le strict minimum, l'enrichissement fera le reste
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
                Json({"reddit_id": mod.id, "permissions": permissions})
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