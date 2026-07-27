# fix_uploads.py
import os
import shutil

upload_dir = "/app/uploads"
if os.path.exists(upload_dir):
    for name in os.listdir(upload_dir):
        if "\\" in name:
            parts = name.split("\\")
            if parts[0] == "uploads":
                dest_rel = os.path.join(*parts[1:])
                src_path = os.path.join(upload_dir, name)
                dest_path = os.path.join(upload_dir, dest_rel)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                print(f"Renaming {name} -> {dest_rel}")
                shutil.move(src_path, dest_path)
    print("Done fixing uploads path issues.")
else:
    print("Uploads directory not found.")
