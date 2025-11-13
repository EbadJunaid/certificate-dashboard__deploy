#!/bin/bash
echo "Starting Certificate Dashboard Frontend..."
echo
cd frontend || exit
python3 -m http.server 8080