@echo off
echo === Deploy Arenas Sport -> VPS ===
set SSH_ASKPASS=/tmp/askpass.sh
set DISPLAY=:0
set GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=keyboard-interactive,password -o PubkeyAuthentication=no
git push vps main
echo === Listo ===
pause
