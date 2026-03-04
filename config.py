import os
import sys

TOKEN = os.getenv("TOKEN")

if not TOKEN:
    print("❌ ERROR: TOKEN environment variable not found!")
    sys.exit(1)

EMBED_COLOR = 0x2f3136
BOT_NAME = "UltraMusic"
FOOTER_TEXT = "UltraMusic • Premium Audio Experience"
DEFAULT_VOLUME = 0.7
