import feedparser
import os
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams, CollectionStatus
from utils import get_text_embedding, get_image_embedding, chunk_text
import uuid
from datetime import datetime
from newspaper import Article
import requests
from bs4 import BeautifulSoup

rss_urls = [
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    "https://timesofindia.indiatimes.com/rssfeedmostrecent.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/7098551.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/72258322.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/54829575.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/2647163.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/66949542.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/913168846.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms",
    "https://timesofindia.indiatimes.com/rssfeeds/2886704.cms",
    "https://timesofindia.indiatimes.com/rssfeedmostshared.cms",
    
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

    # Create an index for the 'type' field as a keyword
    try:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="type",
            field_schema="keyword"
        )
        print("Index on 'type' created.")
    except Exception as e:
        print(f"Index on 'type' may already exist or failed to create: {e}")

def get_full_article_text_bs(url):
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    # Try common selectors for Times of India
    article = soup.find('div', {'class': 'ga-headlines'})
    if not article:
        article = soup.find('div', {'class': 'article-content'})
    if not article:
        article = soup.find('article')
    if article:
        paragraphs = article.find_all('p')
        if paragraphs:
            return '\n'.join(p.get_text(strip=True) for p in paragraphs)
        else:
            return article.get_text(separator='\n', strip=True)
    # fallback: get all <p> tags in the page
    paragraphs = soup.find_all('p')
    return '\n'.join(p.get_text(strip=True) for p in paragraphs)

def process_feed():
    create_collection_if_not_exists()
    for url in rss_urls:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            article_id = str(uuid.uuid4())
            link = entry['link']
            pub_date = entry.get('published', str(datetime.now()))
            title = entry.get('title', '')
            summary = entry.get('summary', '')

            # Get image URL
            image_url = None
            for l in entry.get('links', []):
                if l.get('type') == 'image/jpeg' and l.get('rel') == 'enclosure':
                    image_url = l.get('href')
                    break

            # Get full article text using newspaper3k
            try:
                article = Article(link)
                article.download()
                article.parse()
                full_text = article.text
            except Exception as e:
                print(f"Failed to fetch article: {e}")
                full_text = title + ' ' + summary  # fallback

            # Chunk and embed text
            text_chunks = chunk_text(full_text, chunk_size=1500, overlap=400)
            for idx, chunk in enumerate(text_chunks):
                text_embedding = get_text_embedding(chunk)
                payload = {
                    "type": "text_chunk",
                    "article_id": article_id,
                    "chunk_index": idx,
                    "text": chunk,
                    "title": title,
                    "summary": summary,
                    "link": link,
                    "image_url": image_url,
                    "pub_date": pub_date,
                    "created_at": datetime.utcnow().isoformat()
                }
                point = PointStruct(id=str(uuid.uuid4()), vector=text_embedding, payload=payload)
                client.upsert(collection_name=COLLECTION_NAME, points=[point])

            # Embed and store image
            if image_url:
                image_embedding = get_image_embedding(image_url)
                if image_embedding:
                    payload = {
                        "type": "image",
                        "article_id": article_id,
                        "image_url": image_url,
                        "title": title,
                        "summary": summary,
                        "link": link,
                        "pub_date": pub_date,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    point = PointStruct(id=str(uuid.uuid4()), vector=image_embedding, payload=payload)
                    client.upsert(collection_name=COLLECTION_NAME, points=[point])

if __name__ == "__main__":
    process_feed()
