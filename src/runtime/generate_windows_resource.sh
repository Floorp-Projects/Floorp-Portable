#!/bin/bash

portable_version=${rev_short:-null}

../ico-encoder/ico-encoder -i "../../core/browser/VisualElements/VisualElements_150.png" -o icon.ico

goversioninfo -64 \
    -company="$app_vendor" \
    -copyright="Copyright (c) 2025 Ablaze" \
    -description="Portable version of $app_basename" \
    -file-version="$portable_version" \
    -icon="icon.ico" \
    -internal-name="portable-runtime" \
    -original-name="$app_name.exe" \
    -product-name="$app_basename Portable" \
    -product-version="$portable_version"
