#!/bin/bash -e

os_name=$(uname)

function copy_to_dist () {
  mkdir dist
  cp -r ./core ./dist/
}

function build_portable_runtime () {
  echo "Building portable runtime..."
  cd src/runtime
  if [[ "$os_name" == "Linux" ]]; then
    go build -ldflags="-s -w"
    cp ./floorp ../../dist/floorp
  elif [[ "$os_name" == "MINGW64_NT"* ]]; then
    go install github.com/josephspurrier/goversioninfo/cmd/goversioninfo
    go generate
    go build -ldflags="-H windowsgui -s -w"
    cp ./floorp.exe ../../dist/floorp.exe
  else
    echo "Unsupported OS: $os_name"
    false
  fi
  cd ../..
  cp ./LICENSE ./dist/LICENSE
}

function build_bubblewrap () {
  cd ./src/bubblewrap
  meson setup _builddir
  meson compile -C _builddir
  cp ./_builddir/bwrap ../../dist/bwrap
  cp ./COPYING ../../dist/LICENSE_bwrap
  cd ../..
}

function unzip_omni () {
  echo "Unzipping omni.ja ($1) ..."
  if [[ "$1" == "root" ]]; then
    rm -rf ./omni_tmp_root
    /bin/bash -c 'unzip -q ./dist/core/omni.ja -d ./omni_tmp_root; exit_code=$?; if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 2 ]; then exit $exit_code; fi'
  elif [[ "$1" == "browser" ]]; then
    rm -rf ./omni_tmp_browser
    /bin/bash -c 'unzip -q ./dist/core/browser/omni.ja -d ./omni_tmp_browser; exit_code=$?; if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 2 ]; then exit $exit_code; fi'
  else
    echo "Unsupported omni type: $1"
    false
  fi
}

function zip_omni () {
  echo "Zipping omni.ja ($1) ..."
  if [[ "$1" == "root" ]]; then
    rm ./dist/core/omni.ja
    cd omni_tmp_root
    if [[ "$os_name" == "MINGW64_NT"* ]]; then
      ../src/utils/7za.exe a -mx=0 -mtm- -tzip ../dist/core/omni.ja *
    else
      zip -0DXqr ../dist/core/omni.ja *
    fi
    cd ..
  elif [[ "$1" == "browser" ]]; then
    rm ./dist/core/browser/omni.ja
    cd omni_tmp_browser
    if [[ "$os_name" == "MINGW64_NT"* ]]; then
      ../src/utils/7za.exe a -mx=0 -mtm- -tzip ../dist/core/browser/omni.ja *
    else
      zip -0DXqr ../dist/core/browser/omni.ja *
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
  mkdir -p ./dist/core/distribution
  cp ./src/config/policies.json ./dist/core/distribution

  cp ./src/config/portable-prefs.js ./dist/core/defaults/pref/portable-prefs.js

  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    cp ./src/config/portable.ini ./dist/core/portable.ini
  fi

  rev_short=$(git rev-parse --short HEAD)
  echo "${rev_short:-null}" > ./dist/core/portable_version.txt
}

function integration_portable_modules () {
  echo "Integrating portable modules..."
  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    ./src/utils/setdll64.exe //d:portable64.dll ./dist/core/mozglue.dll
    cp ./src/utils/portable64.dll ./dist/core/portable64.dll
    cp ./src/utils/libportable_LICENSE ./dist/core/libportable_LICENSE
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
    rm ./dist/core/updater.exe
    rm ./dist/core/default-browser-agent.exe
    rm -r ./dist/core/uninstall
  elif [[ "$os_name" == "Linux" ]]; then
    rm ./dist/core/updater
  else
    echo "Unsupported OS: $os_name"
    false
  fi
}

if [[ "$1" == "" ]]; then
  copy_to_dist
  build_portable_runtime
  if [[ "$os_name" == "Linux" ]]; then
    build_bubblewrap
  fi
  unzip_omni root
  unzip_omni browser
  apply_patch
  integration_portable_config
  integration_portable_modules
  zip_omni root
  zip_omni browser
  remove_unused_files
fi
