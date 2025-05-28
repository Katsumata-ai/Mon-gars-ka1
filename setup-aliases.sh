#!/bin/bash

# Script pour configurer des alias pratiques pour MANGAKA AI
echo "🚀 Configuration des alias pour MANGAKA AI..."

# Ajouter les alias au fichier de configuration du shell
SHELL_CONFIG=""
if [ -f ~/.bashrc ]; then
    SHELL_CONFIG=~/.bashrc
elif [ -f ~/.zshrc ]; then
    SHELL_CONFIG=~/.zshrc
elif [ -f ~/.config/fish/config.fish ]; then
    SHELL_CONFIG=~/.config/fish/config.fish
fi

if [ -n "$SHELL_CONFIG" ]; then
    echo "" >> $SHELL_CONFIG
    echo "# MANGAKA AI Aliases" >> $SHELL_CONFIG
    echo "alias mangaka='cd /workspace/MANGAKA-AI'" >> $SHELL_CONFIG
    echo "alias mangaka-dev='cd /workspace/MANGAKA-AI && npm run dev'" >> $SHELL_CONFIG
    echo "alias mangaka-app='cd /workspace/MANGAKA-AI/mangaka-ai'" >> $SHELL_CONFIG
    echo "alias mangaka-build='cd /workspace/MANGAKA-AI && npm run build'" >> $SHELL_CONFIG
    
    echo "✅ Alias ajoutés à $SHELL_CONFIG"
    echo ""
    echo "🎯 Utilisez maintenant :"
    echo "  mangaka-dev    # Lance le serveur de dev"
    echo "  mangaka        # Va à la racine du projet"
    echo "  mangaka-app    # Va dans le dossier de l'app"
    echo "  mangaka-build  # Build le projet"
    echo ""
    echo "⚠️  Redémarrez votre terminal ou tapez 'source $SHELL_CONFIG'"
else
    echo "❌ Impossible de détecter le fichier de configuration du shell"
fi
