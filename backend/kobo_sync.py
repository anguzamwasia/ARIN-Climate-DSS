import os
import urllib.request
import json
from datetime import datetime
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/arin_dss')
engine = create_engine(DATABASE_URL)
TOKEN = "62aa64263eb80725ee50b3b36b9010b2c1f48f07"
BASE_URL = "https://kf.kobotoolbox.org/api/v2/assets/"

KENYA_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
]

def extract_county(text):
    text_lower = text.lower()
    for county in KENYA_COUNTIES:
        if county.lower() in text_lower:
            return f"{county} County"
    return "Kenya"

def fetch_json(url):
    req = urllib.request.Request(url, headers={'Authorization': f'Token {TOKEN}'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

def _parse_kobo_fields(content_text):
    """Parse key:value lines from Kobo content_text into a flat dict."""
    fields = {}
    for line in content_text.splitlines():
        if ": " in line:
            key, _, val = line.partition(": ")
            # Strip group prefix (e.g. group_abc123/actual_key -> actual_key)
            short_key = key.strip().split("/")[-1].lower()
            fields[short_key] = val.strip()
    return fields

def generate_kobo_insights(content_text):
    """
    Rule-based insight generator — no external API required, no names stored.
    Outputs a structured 5-section summary matching the UI's section layout.
    Sections are separated by '||' so the frontend can split and render each.
    """
    f = _parse_kobo_fields(content_text)

    # --- Extract key fields (NO names collected for privacy) ---
    county     = f.get("name_of_county", "").replace("_", " ").capitalize() or "Kenya"
    sub_county = f.get("name_of_sub_county", "").replace("_", " ").capitalize()
    ward       = (f.get("_5_ii_name_of_ward", "") or f.get("_5_ii_name_of_ward_002", "")).replace("_", " ").capitalize()
    age        = f.get("_4_what_is_your_age_bracket", "").replace("_", " ")
    gender     = f.get("what_is_your_gender", "").capitalize()
    hh_gender  = f.get("_3_what_is_the_gende_f_the_household_head", "").capitalize()
    education  = f.get("_8_what_is_your_high_t_level_of_education", "").replace("_", " ").capitalize()
    occupation = f.get("what_is_your_occupation", "").replace("_", " ").capitalize()
    marital    = f.get("_7_what_is_your_marital_status", "").replace("_", " ").capitalize()

    land_owned = f.get("_10_do_you_own_this_land", "").capitalize()
    land_size  = f.get("_1_ii_what_is_the_size_of_your_land", "").replace("_", " ")
    farming    = f.get("_3_what_faming_syste_you_use_on_this_land", "").replace("_", " ")
    fertilizer = f.get("_4_i_if_yes_which_one", "").replace("_", " ")
    income     = f.get("_5_approximately_ho_n_your_farm_per_year", "").replace("_", " ")
    bags       = f.get("_6_how_many_bags_90_om_the_farm_per_year", "")
    farm_income = f.get("_7_what_is_your_appr_ual_farm_income_kes", "")

    vulnerability = f.get("_1_what_vulnerability_status_d", "").replace("_", " ")
    climate_impact = f.get("_2_how_has_climate_c_ividuals_communities", "")
    women_consulted = f.get("_7_are_women_youth_and_elder", "").capitalize()
    barriers_raw = f.get("what_barriers_prevent_marginal", "")
    barriers = [b.replace(" ", "").replace("_", " ").strip() for b in barriers_raw.split("lack") if b.strip()] if barriers_raw else []

    hazards_raw = f.get("_2_what_has_been_some_of_the_o", "")
    hazards = [h.replace("_", " ") for h in hazards_raw.split() if h] if hazards_raw else []
    hazard_explain = f.get("_3_explain_further_h_med_priority_sectors", "")

    adapt_raw = f.get("_2_what_type_of_climate_adapta", "")
    adaptations = [a.replace("_", " ") for a in adapt_raw.split() if a] if adapt_raw else []
    indigenous = f.get("_6_what_are_some_of_le_in_your_community", "")
    local_active = f.get("_13_are_local_communities_acti", "").capitalize()
    adapt_rate = f.get("_4_please_rate_the_e_daptation_strategies", "").replace("_", " ")

    sectors_raw = f.get("_1_what_are_the_priority_secto", "")
    sectors = [s.replace("_", " ") for s in sectors_raw.split() if s] if sectors_raw else []
    climate_info = f.get("_1_do_you_access_climate_infor", "").capitalize()
    info_freq    = f.get("_1_i_if_yes_indicat_on_in_your_community", "").replace("_", " ")

    # --- Derive topic label (2-3 words, no names) ---
    if hazards:
        topic = hazards[0].replace("_", " ").title() + " Impact"
    elif sectors:
        topic = sectors[0].replace("_", " ").title() + " Feedback"
    elif adaptations:
        topic = adaptations[0].replace("_", " ").title() + " Adaptation"
    elif farming:
        topic = farming.title() + " Farming"
    else:
        topic = "Climate Field Survey"

    # --- Section 1: Demographics ---
    s1_parts = []
    loc_parts = [p for p in [county + " County" if county else "", sub_county, ward] if p]
    if loc_parts:
        s1_parts.append(f"Location: {', '.join(loc_parts)}.")
    demo_parts = []
    if gender:     demo_parts.append(f"Gender: {gender}")
    if age:        demo_parts.append(f"Age bracket: {age}")
    if marital:    demo_parts.append(f"Marital status: {marital}")
    if education:  demo_parts.append(f"Education: {education}")
    if occupation: demo_parts.append(f"Occupation: {occupation.lower()}")
    if hh_gender:  demo_parts.append(f"Household head gender: {hh_gender}")
    if demo_parts:
        s1_parts.append(". ".join(demo_parts) + ".")
    sec1 = "Section 1 – Demographics & Participant Profile: " + (" ".join(s1_parts) if s1_parts else "No demographic details captured.")

    # --- Section 2: Land Ownership & Agricultural Systems ---
    s2_parts = []
    if land_owned: s2_parts.append(f"Land owned: {land_owned}.")
    if land_size and "acre" in land_size.lower(): s2_parts.append(f"Land size: {land_size}.")
    if farming:    s2_parts.append(f"Farming system: {farming}.")
    if fertilizer: s2_parts.append(f"Fertilizer use: {fertilizer}.")
    if income:     s2_parts.append(f"Estimated farm income: KES {income}/year.")
    if bags:       s2_parts.append(f"Harvest yield: approximately {bags}.")
    sec2 = "Section 2 – Land Ownership & Agricultural Systems: " + (" ".join(s2_parts) if s2_parts else "No land or farming data captured.")

    # --- Section 3: Climate Hazards & Vulnerability ---
    s3_parts = []
    if vulnerability: s3_parts.append(f"Vulnerability group: {vulnerability}.")
    if hazards:       s3_parts.append(f"Key hazards: {', '.join(h.title() for h in hazards[:5])}.")
    if climate_impact: s3_parts.append(f"Reported impact: {climate_impact}.")
    if hazard_explain: s3_parts.append(f"Further detail: {hazard_explain}.")
    if women_consulted: s3_parts.append(f"Women/youth consulted: {women_consulted}.")
    if barriers:       s3_parts.append(f"Barriers to participation: {'; '.join(barriers[:3])}.")
    sec3 = "Section 3 – Climate Hazards & Vulnerability: " + (" ".join(s3_parts) if s3_parts else "No hazard data captured.")

    # --- Section 4: Community Adaptation & Indigenous Practices ---
    s4_parts = []
    if adaptations:   s4_parts.append(f"Adaptation strategies: {', '.join(a.title() for a in adaptations[:4])}.")
    if adapt_rate:    s4_parts.append(f"Effectiveness rating: {adapt_rate}.")
    if local_active:  s4_parts.append(f"Community actively adapting: {local_active}.")
    if indigenous:    s4_parts.append(f"Indigenous practices: {indigenous}.")
    sec4 = "Section 4 – Community Adaptation & Indigenous Practices: " + (" ".join(s4_parts) if s4_parts else "No adaptation data captured.")

    # --- Section 5: Climate Finance, Access & Priority Sectors ---
    s5_parts = []
    if sectors:      s5_parts.append(f"Priority sectors: {', '.join(s.title() for s in sectors[:4])}.")
    if climate_info: s5_parts.append(f"Access to climate information: {climate_info}.")
    if info_freq:    s5_parts.append(f"Frequency of access: {info_freq}.")
    sec5 = "Section 5 – Climate Finance, Access & Priority Sectors: " + (" ".join(s5_parts) if s5_parts else "No finance or sector data captured.")

    insights = " || ".join([sec1, sec2, sec3, sec4, sec5])
    return topic, insights

def sync_kobo():
    print("Fetching assets...")
    assets_data = fetch_json(BASE_URL)
    if not assets_data or "results" not in assets_data:
        print("Failed to load assets")
        return

    forms = assets_data["results"]
    print(f"Found {len(forms)} forms. Syncing submissions (incremental)...")

    with engine.connect() as conn:
        new_count = 0
        for form in forms:
            uid = form.get("uid")
            title = form.get("name", "Unknown Form")

            data_url = f"{BASE_URL}{uid}/data/"
            submissions = fetch_json(data_url)

            if not submissions or "results" not in submissions:
                continue

            results = submissions["results"]
            print(f"Form '{title}' has {len(results)} submissions.")

            for sub in results:
                sub_id = sub.get("_id")
                sub_url = f"https://kf.kobotoolbox.org/#/forms/{uid}/data/{sub_id}"

                # Check if this submission already exists — skip if so
                existing = conn.execute(
                    text("SELECT id FROM documents WHERE url = :url AND source = 'KOBO'"),
                    {"url": sub_url}
                ).fetchone()

                if existing:
                    continue  # Already synced, skip to avoid OpenAI calls + noise

                # Compile content text from all keys
                content_chunks = []
                for k, v in sub.items():
                    if not k.startswith("_") and v:
                        content_chunks.append(f"{k}: {v}")

                content_text = "\n".join(content_chunks)
                scraped_at = sub.get("_submission_time")

                detected_county = extract_county(content_text)
                topic, insights = generate_kobo_insights(content_text)

                conn.execute(
                    text('''
                        INSERT INTO documents (title, url, type, country, source, scraped_at, content_text, body)
                        VALUES (:title, :url, :type, :country, :source, :scraped_at, :content_text, :body)
                    '''),
                    {
                        "title": f"{title} (Field Submission)",
                        "url": sub_url,
                        "type": topic,
                        "country": detected_county,
                        "source": "KOBO",
                        "scraped_at": scraped_at if scraped_at else datetime.utcnow().isoformat(),
                        "content_text": content_text,
                        "body": insights
                    }
                )
                new_count += 1

        conn.commit()
    print(f"Done syncing KoboToolbox data! {new_count} new submission(s) added.")

if __name__ == "__main__":
    sync_kobo()
