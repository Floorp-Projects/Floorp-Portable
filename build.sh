#!/bin/bash -e

os_name=$(uname)

function build_portable_runtime () {
  echo "Building portable runtime..."
  cd src/runtime
  if [[ "$os_name" == "Linux" ]]; then
    go build -ldflags="-s -w"
    cp ./floorp ../../floorp
  elif [[ "$os_name" == "MINGW64_NT"* ]]; then
    go build -ldflags="-H windowsgui -s -w"
    cp ./floorp.exe ../../floorp.exe
  else
    echo "Unsupported OS: $os_name"
    false
  fi
  cd ../..
}

function unzip_omni () {
  echo "Unzipping omni.ja ($1) ..."
  if [[ "$1" == "root" ]]; then
    /bin/bash -c 'unzip -q ./core/omni.ja -d ./omni_tmp_root; exit_code=$?; if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 2 ]; then exit $exit_code; fi'
  elif [[ "$1" == "browser" ]]; then
    /bin/bash -c 'unzip -q ./core/browser/omni.ja -d ./omni_tmp_browser; exit_code=$?; if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 2 ]; then exit $exit_code; fi'
  else
    echo "Unsupported omni type: $1"
    false
  fi
}

function zip_omni () {
  echo "Zipping omni.ja ($1) ..."
  if [[ "$1" == "root" ]]; then
    rm ./core/omni.ja
    cd omni_tmp_root
    if [[ "$os_name" == "MINGW64_NT"* ]]; then
      ../src/utils/7za.exe a -mx=0 -mtm- -tzip ../core/omni.ja *
    else
      zip -0DXqr ../core/omni.ja *
    fi
    cd ..
  elif [[ "$1" == "browser" ]]; then
    rm ./core/browser/omni.ja
    cd omni_tmp_browser
    if [[ "$os_name" == "MINGW64_NT"* ]]; then
      ../src/utils/7za.exe a -mx=0 -mtm- -tzip ../core/browser/omni.ja *
    else
      zip -0DXqr ../core/browser/omni.ja *
    fi
    cd ..
  else
    echo "Unsupported omni type: $1"
    false
  fi
}

function apply_patch () {
  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    jq_path="./src/utils/jq.exe"
  else
    jq_path="jq"
  fi

  for i in `seq $(cat ./src/patches.json | $jq_path -r "length")`; do
    patch_type=$(cat ./src/patches.json | $jq_path -r ".[$(($i - 1))].type")
    patch_filename=$(cat ./src/patches.json | $jq_path -r ".[$(($i - 1))].filename")

    echo "Applying $patch_filename (type: $patch_type) patch..."

    if [[ "$patch_type" == "root" ]]; then
      git apply --unsafe-paths --directory=omni_tmp_root "./src/patches/$patch_filename"
    elif [[ "$patch_type" == "browser" ]]; then
      git apply --unsafe-paths --directory=omni_tmp_browser "./src/patches/$patch_filename"
    else
      echo "Unsupported patch type: $patch_type"
      false
    fi
  done
}

function integration_portable_config () {
  echo "Copying config files..."
  mkdir -p ./core/distribution
  cp ./src/config/policies.json ./core/distribution

  cp ./src/config/portable-prefs.js ./core/defaults/pref/portable-prefs.js

  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    cp ./src/config/portable.ini ./core/portable.ini
  fi
}

function integration_portable_modules () {
  echo "Integrating portable modules..."
  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    ./src/utils/setdll64.exe //d:portable64.dll ./core/mozglue.dll
    cp ./src/utils/portable64.dll ./core/portable64.dll
    cp ./src/utils/libportable_LICENSE ./core/libportable_LICENSE
  elif [[ "$os_name" == "Linux" ]]; then
    # bubblewrap
    echo wip
  else
    echo "Unsupported OS: $os_name"
    false
  fi

  sed -i '1iimport "resource:///modules/portable/PortableStartup.sys.mjs";' ./omni_tmp_browser/modules/BrowserGlue.sys.mjs

  mkdir -p ./omni_tmp_browser/modules/portable
  cp -r ./src/browser-modules/* ./omni_tmp_browser/modules/portable/
}

function remove_unused_files () {
  echo "Removing unused files..."
  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    rm ./core/updater.exe
    rm ./core/default-browser-agent.exe
    rm -r ./core/uninstall
  elif [[ "$os_name" == "Linux" ]]; then
    rm ./core/updater
  else
    echo "Unsupported OS: $os_name"
    false
  fi
}

if [[ "$1" == "" ]]; then
  build_portable_runtime
  unzip_omni root
  unzip_omni browser
  apply_patch
  integration_portable_config
  integration_portable_modules
  zip_omni root
  zip_omni browser
  remove_unused_files
fi
