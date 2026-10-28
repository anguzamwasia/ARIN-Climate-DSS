# backend/app/services/transcriber.py
import os
import logging
import whisper  # Open-source engine running locally on your hardware
from app.services.audio_processor import compress_media_to_whisper_spec

logger = logging.getLogger("backend.app.services.transcriber")

# PRODUCTION PATH CONFIGURATION
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", DEFAULT_UPLOAD_DIR)

_MODEL_CACHE = {}

def get_whisper_model():
    if "model" not in _MODEL_CACHE:
        logger.info("Initializing free local Whisper engine into memory storage...")
        _MODEL_CACHE["model"] = whisper.load_model("base")
    return _MODEL_CACHE["model"]

DEFAULT_INITIAL_PROMPT = (
    "African Research and Impact Network (ARIN) research seminar, climate change, adaptation, "
    "e-cooking, electric cooking, EPC, electric pressure cooker, MECS, Modern Energy Cooking Services, "
    "biomass, firewood, charcoal, makaa, LPG, biogas, bioethanol, ugali, njahi, sukuma wiki, Nakuru, "
    "Kiamunyi, Kisumu, Makueni, Kakamega, Kawangware, Nairobi, Kenya, Kikuyu, HAP, household air pollution, "
    "clean cooking policy, CIDP."
)

def clean_and_format_transcript(raw_text: str) -> str:
    if not raw_text:
        return ""
    import re
    replacements = [
        (r'\b[aA][ -]cooking\b', 'e-cooking'),
        (r'\b[aA][ -]cooker\b', 'e-cooker'),
        (r'\bthe\s+APC\b', 'the EPC'),
        (r'\ban\s+APC\b', 'an EPC'),
        (r'\bthe\s+ABC\b', 'the EPC'),
        (r'\ban\s+ABC\b', 'an EPC'),
        (r'\bAPCs\b', 'EPCs'),
        (r'\bAPC\b', 'EPC'),
        (r'\b[gG]ugali\b', 'ugali'),
        (r'\ba\s+gully\b', 'ugali'),
        (r'\ba\s+gulley\b', 'ugali'),
        (r'\b[jJ]ahe\b', 'njahi'),
        (r'\b[jJ]ahey\b', 'njahi'),
        (r'\bNjahi\b', 'njahi'),
        (r'\bKekuyu\b', 'Kikuyu'),
        (r'\bKikuyo\b', 'Kikuyu'),
        (r'\bMaccweni\b', 'Makueni'),
        (r'\bMakuene\b', 'Makueni'),
        (r'\bMekuni\b', 'Makueni'),
        (r'\bKessimo\b', 'Kisumu'),
        (r'\bKisimu\b', 'Kisumu'),
        (r'\bNapura\b', 'Nakuru'),
        (r'\b[mM][aA][xX]\s+program\b', 'MECS program'),
        (r'\bmix\s+program\b', 'MECS program'),
        (r'\bjujicos?\b', 'jikos'),
        (r'\bmaka\b', 'makaa'),
        (r'\bAaron Okoth\b', 'Haron Okoth'),
        (r'\bHaron Okello\b', 'Haron Okoth'),
        (r'\b[bB]urmese\b', 'biomass'),
        (r'\bburgers and bioethanol\b', 'biogas and bioethanol'),
        (r'\bburgers\b', 'biogas'),
        (r'\bDeLarley\b', 'Delali'),
        (r'\bthe LARLY\b', 'Delali'),
        (r'\bDe Larry\b', 'Delali'),
        (r'\bIbris\b', 'Idris'),
        (r'\bIRIS\b', 'Idris'),
        (r'\bIris\b', 'Idris'),
        (r'\bhot bananas\b', 'hotplates'),
        (r'\bimproved,\s+improved\b', 'improved'),
        (r'\bthat is,\s+that is\b', 'that is'),
        (r'\bby then by the end of the day\b', 'by the end of the day'),
    ]
    res = raw_text
    for pattern, repl in replacements:
        res = re.sub(pattern, repl, res, flags=re.IGNORECASE if not pattern.isupper() else 0)
        
    # Compress repeating words (e.g. "word word word")
    res = re.sub(r'\b(\w+)(?:\s+\1){3,}\b', r'\1', res, flags=re.IGNORECASE)
    
    # Format into paragraphs of ~4 sentences
    sentences = re.split(r'(?<=[.?!])\s+', res)
    paragraphs = []
    current = []
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        current.append(s)
        if len(current) >= 4:
            paragraphs.append(" ".join(current))
            current = []
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)

def transcribe_community_audio(filename: str) -> str:
    """
    Core production service pipeline wrapper using FREE local Whisper engine.
    1. Resolves paths dynamically.
    2. Runs file size defense checks (compressing if > 24.5 MB to save RAM memory).
    3. Executes local speech recognition using the Whisper 'base' model footprint.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    input_file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(input_file_path):
        logger.error(f"Target media file does not exist at local path: {input_file_path}")
        raise FileNotFoundError(f"Media asset '{filename}' not found in uploads directory.")

    # Compress if file size is too heavy to prevent local computer memory lag
    processed_path = compress_media_to_whisper_spec(input_file_path)

    try:
        # Load local model footprint balance criteria
        local_model = get_whisper_model()
        
        logger.info(f"Processing local speech recognition tracking for: {os.path.basename(processed_path)}")
        
        # Execute transcription matrix natively on your PC hardware
        result_payload = local_model.transcribe(
            processed_path,
            language="en",
            temperature=0.0,
            fp16=False,
            condition_on_previous_text=False,
            initial_prompt=DEFAULT_INITIAL_PROMPT
        )
        
        raw_text = result_payload.get("text", "").strip()
        cleaned_text = clean_and_format_transcript(raw_text)
        logger.info(f"Local Whisper transcription completed successfully for {filename}")
        return cleaned_text

    except Exception as local_err:
        logger.error(f"Failed to execute local model transcription matrix: {local_err}")
        raise RuntimeError(f"Local speech pipeline processing error: {local_err}")
        
    finally:
        import gc
        gc.collect()
        # Clean up temporary artifact if compressor step generated a light MP3 file
        if processed_path != input_file_path and os.path.exists(processed_path):
            try:
                os.remove(processed_path)
                logger.info("Cleaned up temporary optimized media file artifact safely from workspace.")
            except Exception as clear_err:
                logger.warning(f"Unable to drop temporary artifact file reference: {clear_err}")