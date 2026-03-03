#!/bin/bash

echo "🚀 Starting Bot Installation..."

# -----------------------------
# 1️⃣ Update & Upgrade
# -----------------------------
echo "📦 Updating packages..."
pkg update -y && pkg upgrade -y || apt update -y && apt upgrade -y

# -----------------------------
# 2️⃣ Install Python & Pip
# -----------------------------
echo "🐍 Installing Python..."
pkg install python -y || apt install python3 -y
python3 -m ensurepip --upgrade

# Upgrade pip
python3 -m pip install --upgrade pip

# -----------------------------
# 3️⃣ Install Git & FFmpeg
# -----------------------------
echo "🔧 Installing Git & FFmpeg..."
pkg install git -y ffmpeg -y || apt install git -y ffmpeg -y

# -----------------------------
# 4️⃣ Install Python Libraries
# -----------------------------
echo "📚 Installing Python libraries..."
pip install -U discord.py yt-dlp

# -----------------------------
# 5️⃣ Setup Run Script
# -----------------------------
echo "🛠 Creating run script..."

cat <<EOL > run.sh
#!/bin/bash
while true
do
    python3 main.py
    echo "⚠ Bot crashed or stopped. Restarting in 5 seconds..."
    sleep 5
done
EOL

chmod +x run.sh

# -----------------------------
# 6️⃣ Instructions
# -----------------------------
echo "✅ Installation Completed!"
echo "Run your bot using: ./run.sh"
echo "Make sure your main.py, player.py, ui.py, config.py are in the same folder."