# Lightweight CLIP-based image classifier with safe fallbacks.
from PIL import Image
import requests
import io
import threading

_clip_lock = threading.Lock()
_clip_model = None
_clip_processor = None
_available = False

def initialize_clip():
    global _clip_model, _clip_processor, _available
    try:
        from transformers import CLIPProcessor, CLIPModel
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _available = True
    except Exception as e:
        # Failed to load CLIP (no internet or packages). Continue with fallback.
        _available = False

def classify_image(image_url: str, candidate_labels=None) -> str:
    """Return best matching label from candidate_labels or 'other' on failure.
    CLIP model is loaded lazily (on first use) to save memory.
    """
    # Lazy load CLIP model if not already loaded
    global _clip_model, _clip_processor, _available
    if not _available and _clip_model is None:
        with _clip_lock:
            if not _available and _clip_model is None:
                initialize_clip()
    
    if candidate_labels is None:
        candidate_labels = [
     "road", "pothole", "crack", "broken road", "damaged road",
        "road caved", "road sinking", "uneven road",
        "traffic", "traffic jam", "congestion",
        "signal", "traffic signal", "junction", "crossroad",
        "accident", "collision", "crash", "hit",
        "speed breaker", "speed bump", "divider",
        "footpath", "sidewalk", "zebra crossing", "pedestrian",

        "garbage", "trash", "waste", "dump", "dumping",
        "garbage pile", "waste pile",
        "dirty", "filthy", "unclean",
        "bad smell", "toxic smell", "foul smell",
        "dustbin", "overflowing bin",
        "sanitation", "sewage", "sewer", "manhole",

        # DEAD ANIMAL (strict & safe)
        "dead", "dead animal", "animal carcass",
        "dead dog", "dead cat", "dead cow",
        "dead body",

        "mosquito", "flies", "infection", "disease",

        "water", "no water", "low pressure",
        "drinking water", "contaminated water",
        "leak", "leakage", "pipe leak",
        "pipe burst", "broken pipe",
        "drain", "drainage", "blocked drain",
        "overflow", "overflowing drain",
        "flood", "waterlogging", "stagnant water",
        "sewage water", "rain water",

        "electricity", "electric", "power",
        "no power", "power cut", "power outage",
        "wire", "cable", "pole", "electric pole",
        "transformer", "meter",
        "short circuit", "spark",
        "electrocution", "electric shock",
        "live wire",

        "streetlight", "street light", "lamp",
        "lamp post", "pole light",
        "not working", "broken light",
        "flickering", "dim light",
        "dark", "dark area", "no lighting",

         "fire", "smoke", "burning",
        "gas", "gas leak", "cylinder leak",
        "collapse", "building collapse",
        "wall collapse", "roof falling",
        "crime", "theft", "robbery",
        "violence", "fight", "assault",
        "hazard", "danger", "unsafe",
        "emergency", "life risk",

        "park", "garden", "playground",
        "children park", "public park",
        "bench", "swing", "slide",
        "walking track",
        "tree", "fallen tree", "tree fallen",
        "lawn", "grass", "maintenance",
        "broken fence"
    # # Roads & Transport
    # "pothole", "damaged road", "illegal parking", "broken footpath",
    # "traffic signal not working", "road accident", "road", "street", "traffic",
    # "speed breaker", "crosswalk", "footpath", "pavement",

    # # Sanitation & Waste
    # "garbage dump", "overflowing dustbin", "open drain", "sewage overflow",
    # "dead animal", "toilet issue", "garbage", "trash", "waste", "bin",
    # "sanitation", "dirty", "sewage", "cleanliness", "dustbin",

    # # Electricity & Lighting
    # "streetlight not working", "fallen electric pole", "loose wire", "power outage",
    # "streetlight", "lamp", "bulb", "pole", "light", "electric pole",
    # "street lamp", "lighting", "dark area", "electricity", "power",
    # "broken streetlight", "non-working light", "flickering light", "dim light",
    # "street lighting", "outdoor lighting", "public lighting", "night lighting",

    # # Water Supply & Flood
    # "waterlogging", "pipe burst", "no water supply", "drainage issue", "flood",
    # "drain", "drainage", "sewage", "sewer", "leak", "leaking", "leakage",
    # "pipe", "water", "overflow", "water supply", "drainage system",

    # # Environment & Public Spaces
    # "tree fallen", "illegal construction", "park maintenance", "encroachment",
    # "park", "garden", "playground", "tree", "bench", "grass", "lawn",
    # "recreation", "green space", "park area", "garden area", "flooded park",
    # "water in park", "park with water", "playground equipment", "walking path",
    # "fountain", "pond", "lake", "outdoor space", "public space",

    # # Safety & Emergency
    # "fire", "gas leak", "building collapse", "accident site",
    # "crime", "robbery", "theft", "violence", "hazard", "danger",
    # "safety", "harassment", "emergency", "accident",

    # # Noise & Pollution
    # "noise pollution", "air pollution", "industrial waste",

    # # General
    # "other"
]


    if not image_url:
        return "other"

    # If CLIP not available, use heuristic keywords from URL
    if not _available:
        url = image_url.lower()
        for lbl in candidate_labels:
            if lbl in url:
                return lbl
        return "other"

    try:
        resp = requests.get(image_url, timeout=5)
        resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        inputs = _clip_processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
        outputs = _clip_model(**inputs)
        logits_per_image = outputs.logits_per_image  # shape (1, num_labels)
        probs = logits_per_image.softmax(dim=1)
        best = int(probs.argmax().item())
        return candidate_labels[best]
    except Exception:
        return "other"
