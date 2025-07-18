import os
from qdrant_client import QdrantClient

QDRANT_URL = "https://ed04a38c-8d1c-4b40-9ba9-8d0e05111057.eu-west-1-0.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "news_data"


client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

DELETE_BATCH_SIZE = 500

def delete_oldest_points(batch_size=DELETE_BATCH_SIZE):
    print(f"Deleting {batch_size} oldest points.")
    # Scroll and sort by 'created_at' ascending (oldest first)
    scroll_result, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=batch_size,
        with_payload=True,
        # Uncomment the next line if your Qdrant version supports sorting
        sort=[{"key": "created_at", "order": "asc"}]
    )
    ids = [point.id for point in scroll_result]
    if ids:
        client.delete(collection_name=COLLECTION_NAME, points_selector={"points": ids})
        print(f"Deleted {len(ids)} oldest points.")
    else:
        print("No points found to delete.")

if __name__ == "__main__":
    delete_oldest_points()
