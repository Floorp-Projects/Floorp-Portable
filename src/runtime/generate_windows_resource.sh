#!/bin/bash

app_name="${PORTABLE_APP_NAME:-floorp}"
app_basename="${PORTABLE_APP_BASENAME:-Floorp}"
app_vendor="${PORTABLE_APP_VENDOR:-Ablaze}"

rev_short=$(git rev-parse --short HEAD)
portable_version=${rev_short:-null}

goversioninfo -64 \
    -company="$app_vendor" \
    -copyright="Copyright (c) 2025 Ablaze" \
    -description="Portable version of $app_basename" \
    -file-version="$portable_version" \
    -icon="../../core/browser/chrome/icons/default/default128.png" \
    -internal-name="portable-runtime" \
    -original-name="$app_name.exe" \
    -product-name="$app_basename Portable" \
    -product-version="$portable_version"
