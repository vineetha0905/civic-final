import streamlit as st
import uuid
from app.pipeline import classify_report

st.set_page_config(page_title="Civic ML", layout="centered")
st.title("Civic ML Report Classification")

description = st.text_area("Report description")
uploaded_image = st.file_uploader(
    "Upload an image (optional)",
    type=["jpg", "jpeg", "png"]
)

if st.button("Submit"):
    if not description.strip():
        st.warning("Please enter a description")
    else:
        data = {
            "report_id": str(uuid.uuid4()),
            "description": description,
            "category": "unknown",   # dummy category for UI
            "image_url": None,
            "user_id": "streamlit-user"
        }

        result = classify_report(data)
        st.success(result)
