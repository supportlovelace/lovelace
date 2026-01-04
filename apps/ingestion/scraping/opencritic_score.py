import os
import sys
import json
import argparse
import requests
import base64
from parsel import Selector

def get_player_data(html):
    """Extrait la note ou le count du HTML fourni"""
    if not html:
        return None, None
    
    sel = Selector(text=html)
    player_orb_text = "".join(sel.css('app-open-score .inner-orb ::text').getall()).strip()
    
    if not player_orb_text:
        return None, None
        
    if '/' in player_orb_text:
        try:
            # Cas "12/20" (Count de votes)
            count = int(player_orb_text.split('/')[0])
            return None, count
        except (ValueError, IndexError):
            return None, None
    else:
        try:
            # Cas "70" (Note réelle)
            return float(player_orb_text), None
        except ValueError:
            return None, None

def scrape_opencritic(game_id):
    zyte_api_key = os.getenv("ZYTE_API_KEY")
    if not zyte_api_key:
        return {"id": game_id, "error": "ZYTE_API_KEY manquante"}

    api_url = "https://api.zyte.com/v1/extract"
    result = {
        "id": int(game_id),
        "name": None,
        "top_critic_average": None,
        "critics_recommend": None,
        "player_rating": None,
        "player_rating_count": None
    }

    # --- 1. APPEL API (JSON - Toujours rapide) ---
    try:
        r_api = requests.post(api_url, auth=(zyte_api_key, ""), json={
            "url": f"https://api.opencritic.com/api/game/{game_id}",
            "httpResponseBody": True
        }, timeout=30)
        
        if r_api.ok:
            data = json.loads(base64.b64decode(r_api.json()["httpResponseBody"]))
            result["name"] = data.get("name")
            if data.get("topCriticScore") not in [None, -1]:
                result["top_critic_average"] = int(round(data["topCriticScore"]))
            if data.get("percentRecommended") not in [None, -1]:
                result["critics_recommend"] = int(round(data["percentRecommended"]))
    except Exception as e:
        print(f"DEBUG API FAIL: {e}", file=sys.stderr)

    # --- 2. TENTATIVE WEB STATIQUE (Pas cher, rapide) ---
    opencritic_web_url = f"https://opencritic.com/game/{game_id}/slug"
    try:
        r_static = requests.post(api_url, auth=(zyte_api_key, ""), json={
            "url": opencritic_web_url,
            "httpResponseBody": True
        }, timeout=30)
        
        if r_static.ok:
            html = base64.b64decode(r_static.json()["httpResponseBody"]).decode("utf-8")
            rating, count = get_player_data(html)
            result["player_rating"] = rating
            result["player_rating_count"] = count
    except Exception as e:
        print(f"DEBUG STATIC FAIL: {e}", file=sys.stderr)

    # --- 3. SI PAS DE RATING -> APPEL WEB BROWSER (Cher, lent mais nécessaire pour le count) ---
    # Si on n'a ni note ni count après le statique (ou juste pas de note pour les SPA)
    if result["player_rating"] is None:
        try:
            print(f"DEBUG: Player rating not found in static, launching browser for ID {game_id}...", file=sys.stderr)
            r_browser = requests.post(api_url, auth=(zyte_api_key, ""), json={
                "url": opencritic_web_url,
                "browserHtml": True,
                "javascript": True
            }, timeout=60)
            
            if r_browser.ok:
                html = r_browser.json().get("browserHtml")
                rating, count = get_player_data(html)
                result["player_rating"] = rating
                result["player_rating_count"] = count
        except Exception as e:
            result["error"] = f"Browser scraping error: {str(e)}"

    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('id', type=int)
    args = parser.parse_args()
    print(json.dumps(scrape_opencritic(args.id)))
