"""Link-preview crawlers and bots, from the shared list (shared/crawlers.txt,
copied to crawlers.json by scripts/sync_themes.py). Used to keep bot fetches
out of open tracking."""
import json
import re
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def _pattern():
    data = json.loads((Path(__file__).resolve().parent / 'crawlers.json').read_text(encoding='utf-8'))
    return re.compile('|'.join(re.escape(p) for p in data['patterns']), re.IGNORECASE)


def is_crawler(user_agent):
    return bool(_pattern().search(user_agent or ''))
