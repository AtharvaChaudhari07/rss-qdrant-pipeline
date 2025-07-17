import feedparser
import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams, CollectionStatus
from utils import get_text_embedding, get_image_embedding
import uuid
from datetime import datetime

rss_urls = [
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    "https://timesofindia.indiatimes.com/rssfeedmostrecent.cms"
]

QDRANT_URL = "https://ed04a38c-8d1c-4b40-9ba9-8d0e05111057.eu-west-1-0.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "news_data"

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def create_collection_if_not_exists():
    if not client.collection_exists(collection_name=COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=512, distance=Distance.COSINE),
        )
        print(f"Collection '{COLLECTION_NAME}' created.")
    else:
        print(f"Collection '{COLLECTION_NAME}' already exists.")

def process_feed():
    create_collection_if_not_exists()
    for url in rss_urls:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            text = entry.title + " " + entry.summary
            link = entry.link
            pub_date = entry.get("published", str(datetime.now()))
            image_url = entry.get("media_content", [{}])[0].get("url", None)

            text_embedding = get_text_embedding(text)
            image_embedding = get_image_embedding(image_url) if image_url else None

            vector = text_embedding
            if image_embedding:
                vector = [(x + y) / 2 for x, y in zip(text_embedding, image_embedding)]

            payload = {
                "title": entry.title,
                "summary": entry.summary,
                "link": link,
                "image_url": image_url,
                "pub_date": pub_date,
            }

            point = PointStruct(id=str(uuid.uuid4()), vector=vector, payload=payload)
            client.upsert(collection_name=COLLECTION_NAME, points=[point])

if __name__ == "__main__":
    process_feed()
