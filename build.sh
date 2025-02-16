#!/bin/bash -e

os_name=$(uname)

app_name="${PORTABLE_APP_NAME:-floorp}"
app_basename="${PORTABLE_APP_BASENAME:-Floorp}"
profile="${PORTABLE_APP_PROFLE:-Floorp}"

go_default_ldflags="-X 'gomodules.AppName=${app_name}' -X 'gomodules.AppBaseName=${app_basename}' -X 'gomodules.Profile=${profile}'"

function copy_to_dist () {
  mkdir dist
  cp -r ./core ./dist/
}

function prepare_gomodules () {
  echo "Preparing gomodules..."
  cd src/gomodules
  go generate
  cd ../..
}

function build_portable_runtime () {
  echo "Building portable runtime..."
  if [[ "$os_name" == "Linux" ]]; then
    cd src/runtime
    go generate
    CGO_ENABLED=1 go build -ldflags="${go_default_ldflags} -s -w"
    cp ./portable-runtime "../../dist/${app_name}"
  elif [[ "$os_name" == "MINGW64_NT"* ]]; then
    cd src/ico-encoder
    go build

    cd ../runtime
    go install github.com/josephspurrier/goversioninfo/cmd/goversioninfo
    go generate
    CGO_ENABLED=1 go build -ldflags="${go_default_ldflags} -H windowsgui -s -w"
    cp ./portable-runtime.exe "../../dist/${app_name}.exe"
  else
    echo "Unsupported OS: $os_name"
    false
  fi
  cd ../..
  cp ./LICENSE ./dist/LICENSE
}

function build_container_runtime () {
  echo "Building container runtime..."
  if [[ "$os_name" == "Linux" ]]; then
    cd src/container-linux
    go build -ldflags="${go_default_ldflags} -s -w"
    cp ./container-linux ../../dist/core/container-linux
  elif [[ "$os_name" == "MINGW64_NT"* ]]; then
    cd src/libportable-ng
    make
    cp ./libportable-ng/libportable-ng.dll ../../dist/core/libportable-ng.dll
  else
    echo "Unsupported OS: $os_name"
    false
  fi
  cd ../..
}

function unzip_omni () {
  echo "Unzipping omni.ja ($1) ..."
  if [[ "$1" == "root" ]]; then
    rm -rf ./omni_tmp_root
    /bin/bash -c 'unzip -q ./core/omni.ja -d ./omni_tmp_root; exit_code=$?; if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 2 ]; then exit $exit_code; fi'
  elif [[ "$1" == "browser" ]]; then
    rm -rf ./omni_tmp_browser
    /bin/bash -c 'unzip -q ./core/browser/omni.ja -d ./omni_tmp_browser; exit_code=$?; if [ "$exit_code" -ne 0 ] && [ "$exit_code" -ne 2 ]; then exit $exit_code; fi'
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
      7z a -mx=0 -mtm- -tzip ../dist/core/omni.ja *
    else
      zip -0DXqr ../dist/core/omni.ja *
    fi
    cd ..
  elif [[ "$1" == "browser" ]]; then
    rm ./dist/core/browser/omni.ja
    cd omni_tmp_browser
    if [[ "$os_name" == "MINGW64_NT"* ]]; then
      7z a -mx=0 -mtm- -tzip ../dist/core/browser/omni.ja *
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
  echo "Applying patches..."

  type jq > /dev/null
  type seq > /dev/null

  for i in `seq $(cat ./src/patches.json | jq -r "length")`; do
    patch_type=$(cat ./src/patches.json | jq -r ".[$(($i - 1))].type")
    patch_filename=$(cat ./src/patches.json | jq -r ".[$(($i - 1))].filename")

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

  sed -i '1iimport "resource:///modules/portable/PortableStartup.sys.mjs";' ./omni_tmp_browser/modules/BrowserGlue.sys.mjs

  app_constants=$(cat ./src/AppConstants.sys.mjs)
  app_constants_original=$(cat ./omni_tmp_root/modules/AppConstants.sys.mjs)
  rm ./omni_tmp_root/modules/AppConstants.sys.mjs
  while read line; do
    if [[ "$line" == '/* insert AppConstants.sys.mjs code */' ]]; then
      while read line_orig; do
        echo "$line_orig" >> ./omni_tmp_root/modules/AppConstants.sys.mjs
      done <<< "$app_constants_original"
    else
      echo "$line" >> ./omni_tmp_root/modules/AppConstants.sys.mjs
    fi
  done <<< "$app_constants"
  sed -i 's/export var AppConstants/const AppConstantsOriginal/' ./omni_tmp_root/modules/AppConstants.sys.mjs
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
    cd ./src/setdll
    make
    cp ./setdll.exe ../../dist/core/setdll.exe

    cd ../../dist/core
    ./setdll.exe //d:libportable-ng.dll mozglue.dll
    rm ./setdll.exe
    cd ../..
  elif [[ "$os_name" == "Linux" ]]; then
    # Reserved for future use
    :
  else
    echo "Unsupported OS: $os_name"
    false
  fi

  mkdir -p ./omni_tmp_browser/modules/portable
  cp -r ./src/browser-modules/* ./omni_tmp_browser/modules/portable/
  mkdir -p ./omni_tmp_browser/modules/portable/l10n
  cp -r ./l10n/* ./omni_tmp_browser/modules/portable/l10n/
  cp ./CREDITS.md ./omni_tmp_browser/modules/portable/CREDITS.md
}

function remove_unused_files () {
  echo "Removing unused files..."
  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    rm -f ./dist/core/updater.exe
    rm -f ./dist/core/default-browser-agent.exe
    rm -rf ./dist/core/uninstall
    rm -f ./dist/core/maintenanceservice.exe
    rm -f ./dist/core/maintenanceservice_installer.exe
  elif [[ "$os_name" == "Linux" ]]; then
    rm  -f ./dist/core/updater
  else
    echo "Unsupported OS: $os_name"
    false
  fi
}

function remove_cache () {
  echo "Removing caches..."
  if [[ "$os_name" == "MINGW64_NT"* ]]; then
    rm -rf ./dist/data/Cache
  elif [[ "$os_name" == "Linux" ]]; then
    rm -rf ./dist/data/.cache
  else
    echo "Unsupported OS: $os_name"
    false
  fi
}

if [[ "$1" == "" ]]; then
  copy_to_dist
  prepare_gomodules
  build_portable_runtime
  build_container_runtime
  unzip_omni root
  unzip_omni browser
  apply_patch
  integration_portable_config
  integration_portable_modules
  zip_omni root
  zip_omni browser
  remove_unused_files
elif [[ "$1" == "update-modules" ]]; then
  unzip_omni root
  unzip_omni browser
  apply_patch
  integration_portable_config
  integration_portable_modules
  zip_omni root
  zip_omni browser
  remove_unused_files
  remove_cache
elif [[ "$1" == "create-patch" ]]; then
  unzip_omni root
  unzip_omni browser

  cd omni_tmp_root
  git init
  git add .
  git commit -m "initial"
  cd ..

  cd omni_tmp_browser
  git init
  git add .
  git commit -m "initial"
  cd ..
elif [[ "$1" == "clean" ]]; then
  rm -rf dist
  if [[ "$os_name" == "Linux" ]]; then
    rm -f ./src/runtime/portable-runtime
    rm -f ./src/container-linux/container-linux
  elif [[ "$os_name" == "MINGW64_NT"* ]]; then
    rm -f ./src/runtime/portable-runtime.exe
    cd src/libportable-ng
    make clean
    cd ../..

    cd src/setdll
    make clean
    cd ../..
  else
    echo "Unsupported OS: $os_name"
    false
  fi
fi
