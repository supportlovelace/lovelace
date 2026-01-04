import os
import sys
import json
import argparse
import requests
import base64
import re
from parsel import Selector

def extract_digits(text):
    if not text: return None
    matches = re.findall(r'\d+', text.replace(',', ''))
    return int(matches[0]) if matches else None

def extract_pct(area, sentiment):
    """Extrait le pourcentage depuis le style 'width:calc(XX% - 0.3em)'"""
    style = area.css(f'.c-GlobalScoreGraph_indicator--{sentiment}::attr(style)').get()
    if style:
        match = re.search(r'(\d+\.?\d*)%', style)
        if match:
            return float(match.group(1))
    return None

def scrape_metacritic(slug):
    zyte_api_key = os.getenv("ZYTE_API_KEY")
    if not zyte_api_key:
        return {"slug": slug, "error": "ZYTE_API_KEY manquante"}

    api_url = "https://api.zyte.com/v1/extract"
    target_url = f"https://www.metacritic.com/game/{slug}/"

    result = {
        "slug": slug,
        "metascore": None,
        "critic_reviews_count": None,
        "metascore_positive_pct": None,
        "metascore_neutral_pct": None,
        "metascore_negative_pct": None,
        "user_score": None,
        "user_ratings_count": None,
        "user_score_positive_pct": None,
        "user_score_neutral_pct": None,
        "user_score_negative_pct": None
    }

    try:
        r = requests.post(api_url, auth=(zyte_api_key, ""), json={
            "url": target_url,
            "httpResponseBody": True,
            "geolocation": "US"
        }, timeout=30)
        r.raise_for_status()
        
        html = base64.b64decode(r.json().get("httpResponseBody")).decode("utf-8")
        sel = Selector(text=html)

        # A. CRITIC SCORE
        critic_area = sel.css('div[data-testid="critic-score-info"]')
        if critic_area:
            score_text = critic_area.css('.c-productScoreInfo_scoreNumber span::text').get()
            if score_text and score_text.strip().isdigit():
                result["metascore"] = int(score_text.strip())
            
            result["critic_reviews_count"] = extract_digits(critic_area.css('.c-productScoreInfo_reviewsTotal ::text').get())
            
            # Récupération des parts (graph)
            result["metascore_positive_pct"] = extract_pct(critic_area, "positive")
            result["metascore_neutral_pct"] = extract_pct(critic_area, "neutral")
            result["metascore_negative_pct"] = extract_pct(critic_area, "negative")

        # B. USER SCORE
        user_area = sel.css('div[data-testid="user-score-info"]')
        if user_area:
            score_text = user_area.css('.c-productScoreInfo_scoreNumber span::text').get()
            if score_text and score_text.strip().lower() != 'tbd':
                try: result["user_score"] = float(score_text.strip())
                except ValueError: pass
            
            result["user_ratings_count"] = extract_digits(user_area.css('.c-productScoreInfo_reviewsTotal ::text').get())
            
            # Récupération des parts (graph)
            result["user_score_positive_pct"] = extract_pct(user_area, "positive")
            result["user_score_neutral_pct"] = extract_pct(user_area, "neutral")
            result["user_score_negative_pct"] = extract_pct(user_area, "negative")

        return result

    except Exception as e:
        return {"slug": slug, "error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('slug')
    args = parser.parse_args()
    print(json.dumps(scrape_metacritic(args.slug)))