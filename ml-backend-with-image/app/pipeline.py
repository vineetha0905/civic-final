from app import storage, dataset
from app import image_classifier as ic
from app.text_rules import (
    is_abusive,
    detect_category,
    detect_urgency,
    CATEGORY_KEYWORDS
)
import warnings

warnings.filterwarnings("ignore", category=UserWarning, message=".*pkg_resources.*")


# ------------------------------------
# Image → Category reference
# ------------------------------------
IMAGE_TO_CATEGORY_MAP = {
    "Road & Traffic": [
        "road", "street", "pothole", "damaged road", "traffic", "accident"
    ],
    "Garbage & Sanitation": [
        "garbage", "trash", "waste", "dustbin", "sewage", "dead animal"
    ],
    "Water & Drainage": [
        "water", "flood", "drain", "pipe leak", "overflow"
    ],
    "Electricity": [
        "electricity", "power", "wire", "transformer", "short circuit"
    ],
    "Street Lighting": [
        "streetlight", "lamp", "light", "dark"
    ],
    "Public Safety": [
        "fire", "smoke", "gas leak", "collapse", "hazard"
    ],
    "Parks & Recreation": [
        "park", "garden", "tree", "playground"
    ]
}

GENERIC_IMAGE_LABELS = {
    "other", "road", "street", "outdoor",
    "outdoor space", "public space", "area", "scene"
}


# ------------------------------------
# Main pipeline
# ------------------------------------
def classify_report(report: dict):
    try:
        description = (report.get("description") or "").strip()
        if not description:
            return reject(report, "Description is required")

        category = detect_category(description)
        if category == "Other":
            return reject(report, "Unable to determine issue category")

        if is_abusive(description):
            return reject(report, "Abusive language detected", category)

        image_url = report.get("image_url")
        if image_url:
            if not image_matches_category(image_url, category):
                return reject(
                    report,
                    "Image does not match the issue description",
                    category
                )

        if image_url:
            if storage.is_duplicate_image(image_url, threshold=3, store=False):
                return reject(report, "Duplicate image detected", category)
            storage.is_duplicate_image(image_url, threshold=3, store=True)

        urgency = detect_urgency(description)
        priority = {
            "high": "urgent",
            "medium": "medium",
            "low": "low"
        }.get(urgency, "medium")

        result = {
            "report_id": report.get("report_id", "unknown"),
            "accept": True,
            "status": "accepted",
            "category": category,
            "department": category,
            "urgency": urgency,
            "priority": priority,
            "reason": "Report accepted successfully"
        }

        dataset.save_report({**report, **result})
        return result

    except Exception as e:
        return reject(report, f"Processing error: {str(e)}")


# ------------------------------------
# Image validation logic
# ------------------------------------
def image_matches_category(image_url: str, category: str) -> bool:
    try:
        image_label = ic.classify_image(image_url)
        image_label = str(image_label).lower().strip() if image_label else "other"

        allowed_labels = IMAGE_TO_CATEGORY_MAP.get(category, [])
        category_keywords = CATEGORY_KEYWORDS.get(category, [])

        for lbl in allowed_labels:
            if lbl in image_label or image_label in lbl:
                return True

        for kw in category_keywords:
            if kw in image_label:
                return True

        image_words = set(image_label.split())
        for lbl in allowed_labels:
            if image_words.intersection(lbl.split()):
                return True

        if image_label in GENERIC_IMAGE_LABELS:
            return True

        return False

    except Exception:
        # classifier failure → allow
        return True


# ------------------------------------
# Reject helper
# ------------------------------------
def reject(report, reason, category="Other"):
    result = {
        "report_id": report.get("report_id", "unknown"),
        "accept": False,
        "status": "rejected",
        "category": category,
        "department": category,
        "reason": reason
    }
    dataset.save_report({**report, **result})
    return result
