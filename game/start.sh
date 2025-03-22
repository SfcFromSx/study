#!/bin/bash

echo "Starting Space Quiz Shooter..."

# Check if Node.js is installed
if command -v node >/dev/null 2>&1; then
    echo "Starting Node.js server on port 8080..."
    node server.js
else
    echo "Node.js not found. Opening the game directly in the default browser..."
    
    # Determine the OS and open the browser accordingly
    case "$(uname -s)" in
        Darwin*)    # macOS
            open index.html
            ;;
        Linux*)     # Linux
            xdg-open index.html
            ;;
        CYGWIN*|MINGW*|MSYS*)  # Windows
            start index.html
            ;;
        *)
            echo "Unable to automatically open browser. Please open index.html manually."
            ;;
    esac
fi 