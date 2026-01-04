import os
import sys
import json
import argparse
import requests
import base64
import re

def scrape_epic_games(slug):
    zyte_api_key = os.getenv("ZYTE_API_KEY")
    if not zyte_api_key:
        return {"slug": slug, "error": "ZYTE_API_KEY manquante"}

    api_url = "https://api.zyte.com/v1/extract"
    product_url = f"https://store.epicgames.com/en-US/p/{slug}"

    result = {
        "slug": slug,
        "epic_rating": None,
        "epic_highlights": [],
        "sandbox_id": None
    }

    try:
        # --- ÉTAPE 1 : Récupérer le sandboxId ---
        r_page = requests.post(api_url, auth=(zyte_api_key, ""), json={
            "url": product_url,
            "httpResponseBody": True,
            "geolocation": "US"
        }, timeout=30)
        
        if not r_page.ok:
            return {"slug": slug, "error": f"Page access failed: {r_page.status_code}"}

        html = base64.b64decode(r_page.json()["httpResponseBody"]).decode("utf-8")
        
        ns_match = re.search(r'"namespace":"([a-f0-9]{32})"', html) or re.search(r'"sandboxId":"([a-f0-9]{32})"', html)
            
        if not ns_match:
            return {"slug": slug, "error": "sandboxId not found"}
            
        sandbox_id = ns_match.group(1)
        result["sandbox_id"] = sandbox_id

        # --- ÉTAPE 2 : Appel GraphQL ---
        graphql_url = "https://store.epicgames.com/graphql"
        sha256_hash = "452f59168f3c5dacccc5fa161b5bf13d14e2cee2f6c7075f7f836cf4e695e4d7"
        
        vars_json = json.dumps({"sandboxId": sandbox_id, "locale": "en-US"})
        ext_json = json.dumps({"persistedQuery": {"version": 1, "sha256Hash": sha256_hash}})
        
        full_gql_url = f"{graphql_url}?operationName=getProductResult&variables={vars_json}&extensions={ext_json}"

        r_gql = requests.post(api_url, auth=(zyte_api_key, ""), json={
            "url": full_gql_url,
            "httpResponseBody": True
        }, timeout=30)

        if r_gql.ok:
            gql_data = json.loads(base64.b64decode(r_gql.json()["httpResponseBody"]))
            polls_data = gql_data.get("data", {}).get("RatingsPolls", {}).get("getProductResult", {})
            
            result["epic_rating"] = polls_data.get("averageRating")
            
            poll_results = polls_data.get("pollResult", [])
            for poll in poll_results:
                loc = poll.get("localizations", {})
                result["epic_highlights"].append({
                    "title": loc.get("resultTitle"),
                    "prefix": loc.get("resultText"),
                    "total_votes": poll.get("total"),
                    "emoji_url": loc.get("resultEmoji")
                })

        return result

    except Exception as e:
        return {"slug": slug, "error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('slug')
    args = parser.parse_args()
    print(json.dumps(scrape_epic_games(args.slug)))