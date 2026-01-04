import os
import sys
import json
import argparse
import requests
import base64
from parsel import Selector

def scrape_ign_score(slug):
    zyte_api_key = os.getenv("ZYTE_API_KEY")
    if not zyte_api_key:
        return {"slug": slug, "ign_rating": None, "error": "ZYTE_API_KEY manquante"}

    api_url = "https://api.zyte.com/v1/extract"
    target_url = f"https://www.ign.com/games/{slug}"

    # On utilise httpResponseBody (statique) au lieu de browserHtml (navigateur lourd)
    # C'est 10x plus rapide si la donnée est dans le HTML source.
    payload = {
        "url": target_url,
        "httpResponseBody": True,
        # "geolocation": "US" # On peut l'enlever pour gagner encore un peu de temps si pas vital
    }

    try:
        r = requests.post(api_url, auth=(zyte_api_key, ""), json=payload, timeout=30)
        r.raise_for_status()
        
        res_json = r.json()
        # httpResponseBody est encodé en base64
        html_b64 = res_json.get("httpResponseBody")
        if not html_b64:
            return {"slug": slug, "ign_rating": None, "error": "Pas de corps HTTP"}
            
        html = base64.b64decode(html_b64).decode("utf-8")
        sel = Selector(text=html)
        
        score_text = sel.css('figure[data-cy="review-score"] figcaption ::text').get()

        if score_text:
            score_text = score_text.strip()
            
            # Gestion du cas "NR" (Not Rated)
            if score_text.upper() == "NR":
                return {"slug": slug, "ign_rating": None}
                
            try:
                clean_score = score_text.split('/')[0]
                return {"slug": slug, "ign_rating": float(clean_score)}
            except ValueError:
                return {"slug": slug, "ign_rating": None, "error": f"Parsing error: {score_text}"}
        
        return {"slug": slug, "ign_rating": None, "message": "Aucune note trouvée (peut-être pas de review)"}

    except Exception as e:
        return {"slug": slug, "ign_rating": None, "error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('slug')
    args = parser.parse_args()
    print(json.dumps(scrape_ign_score(args.slug)))
