import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "guidelens.db")

DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "dev-pi-secret-key")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

# SQLAlchemy compatibility for postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

GUARDIAN_NAME = os.environ.get("GUARDIAN_NAME", "Jane Doe (Primary Guardian)")
GUARDIAN_CONTACT = os.environ.get("GUARDIAN_CONTACT", "+1 (555) 019-2834 / @guardian_telegram")
PORT = int(os.environ.get("PORT", 8000))
