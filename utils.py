from PIL import Image
import requests
from io import BytesIO
import torch
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("clip-ViT-B-32")

def get_image_embedding(image_url):
    try:
        response = requests.get(image_url)
        image = Image.open(BytesIO(response.content)).convert("RGB")
        return model.encode(image, convert_to_tensor=True).tolist()
    except Exception as e:
        print(f"Image embedding failed: {e}")
        return None

def get_text_embedding(text):
    return model.encode(text, convert_to_tensor=True).tolist()
