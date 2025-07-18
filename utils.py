from PIL import Image
import requests
from io import BytesIO
import torch
from sentence_transformers import SentenceTransformer, util
from langchain.text_splitter import RecursiveCharacterTextSplitter

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

def chunk_text(text, chunk_size=1000, overlap=200):
    """
    Splits text into chunks using LangChain's RecursiveCharacterTextSplitter.
    chunk_size and overlap are in characters by default.
    Returns a list of text chunks.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ".", "!", "?", " "]
    )
    return splitter.split_text(text)
