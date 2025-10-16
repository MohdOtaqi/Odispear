# Unity Platform - Agora Voice Chat Deployment Script
# This script will SSH into your AWS server and configure Agora credentials

Write-Host "🎤 Unity Platform - Agora Voice Chat Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$SERVER = "ubuntu@16.171.225.46"
$AGORA_APP_ID = "90323a9c98fc45b2922bca94a9f08fbb"
$AGORA_CERTIFICATE = "b4a91481752d4a22bcdd43fb2bcac015"

Write-Host "Server: $SERVER" -ForegroundColor Yellow
Write-Host "App ID: $AGORA_APP_ID" -ForegroundColor Yellow
Write-Host ""

# Create the SSH command
$sshCommand = @"
cd /var/www/Odispear/unity-platform/backend

# Check if Agora variables already exist
if grep -q "AGORA_APP_ID" .env; then
    echo "⚠️  Agora credentials already exist in .env"
    echo "Updating existing values..."
    sed -i 's/^AGORA_APP_ID=.*/AGORA_APP_ID=$AGORA_APP_ID/' .env
    sed -i 's/^AGORA_APP_CERTIFICATE=.*/AGORA_APP_CERTIFICATE=$AGORA_CERTIFICATE/' .env
else
    echo "Adding Agora credentials to .env..."
    echo "" >> .env
    echo "# Voice Chat (Agora)" >> .env
    echo "AGORA_APP_ID=$AGORA_APP_ID" >> .env
    echo "AGORA_APP_CERTIFICATE=$AGORA_CERTIFICATE" >> .env
fi

# Install Agora SDK if not present
echo ""
echo "📦 Checking Agora SDK..."
if ! npm list agora-access-token > /dev/null 2>&1; then
    echo "Installing Agora SDK..."
    npm install agora-access-token
else
    echo "✅ Agora SDK already installed"
fi

# Rebuild backend
echo ""
echo "🔨 Building backend..."
npm run build

# Restart PM2
echo ""
echo "🔄 Restarting services..."
pm2 restart all

echo ""
echo "✅ Agora Voice Chat is now configured!"
echo ""
echo "Test it at: http://16.171.225.46"
echo "1. Login to your account"
echo "2. Join a server"
echo "3. Click on a voice channel"
echo "4. Allow microphone access"
echo "5. Start talking!"
"@

Write-Host "Connecting to AWS server..." -ForegroundColor Green
Write-Host ""

# Execute SSH command
ssh $SERVER $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Agora Voice Chat is configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open http://16.171.225.46" -ForegroundColor White
    Write-Host "2. Login to your account" -ForegroundColor White
    Write-Host "3. Go to a server with voice channels" -ForegroundColor White
    Write-Host "4. Click on a voice channel name" -ForegroundColor White
    Write-Host "5. Allow microphone when prompted" -ForegroundColor White
    Write-Host "6. Voice chat should connect!" -ForegroundColor White
    Write-Host ""
    Write-Host "🎤 Voice features now enabled:" -ForegroundColor Green
    Write-Host "   ✅ Join voice channels" -ForegroundColor White
    Write-Host "   ✅ Mute/Unmute microphone" -ForegroundColor White
    Write-Host "   ✅ Deafen/Undeafen audio" -ForegroundColor White
    Write-Host "   ✅ See other users in voice" -ForegroundColor White
    Write-Host "   ✅ Audio level indicators" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Please check your SSH connection and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Cyan
    Write-Host "1. SSH into server: ssh $SERVER" -ForegroundColor White
    Write-Host "2. Edit .env: nano /var/www/Odispear/unity-platform/backend/.env" -ForegroundColor White
    Write-Host "3. Add these lines:" -ForegroundColor White
    Write-Host "   AGORA_APP_ID=$AGORA_APP_ID" -ForegroundColor Gray
    Write-Host "   AGORA_APP_CERTIFICATE=$AGORA_CERTIFICATE" -ForegroundColor Gray
    Write-Host "4. Save and restart: pm2 restart all" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
