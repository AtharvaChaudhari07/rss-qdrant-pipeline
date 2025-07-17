import os
from qdrant_client import QdrantClient

QDRANT_URL = "https://ed04a38c-8d1c-4b40-9ba9-8d0e05111057.eu-west-1-0.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "news_data"
MAX_STORAGE_MB = 3500  # target usage in MB

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def get_storage_usage_mb():
    usage = client.get_collection(collection_name=COLLECTION_NAME).points_count
    # Assume 1 point = ~1KB for estimation
    return usage / 1024

def delete_old_data():
    if get_storage_usage_mb() > MAX_STORAGE_MB:
        print("Storage high. Deleting oldest 500 points.")
        client.scroll(collection_name=COLLECTION_NAME, limit=500, with_payload=True)
        ids = [point.id for point in client.scroll(COLLECTION_NAME, limit=500)[0]]
        client.delete(collection_name=COLLECTION_NAME, points_selector={"points": ids})

if __name__ == "__main__":
    delete_old_data()
