# Floorp Portable
***Portable version of Floorp***


## Requirements
* [Pre-built binaries](https://github.com/Floorp-Projects/Floorp-Portable/releases)
  * Windows
    * OS: 10, 11
    * Architecture: x86_64
    * Memory: 8GB+
    * Disk Space: At least 2GB of free disk space.
  * Linux
    * Architecture: x86_64, aarch64
    * Memory: 8GB+
    * Disk Space: At least 2GB of free disk space.
    * Packages: glibc, gtk+, libstdc++, xorg
* Build from source
  * Windows
    * OS Version: 10, 11
    * Architecture: x86_64
    * Memory: 8GB+
    * Disk Space: At least 4GB of free disk space.
    * Softwares: MSYS2
    * Packages: make, mingw-w64-x86_64-gcc, mingw-w64-x86_64-go, git, unzip, mingw-w64-x86_64-7zip, mingw-w64-x86_64-jq
  * Linux
    * Architecture: x86_64, aarch64
    * Memory: 8GB+
    * Disk Space: At least 2GB of free disk space.
    * Packages: glibc, gtk+, libstdc++, xorg, git, unzip, zip, jq, golang 1.23+


## How to build

### 1. Install requirements
#### Windows
1. Run MSYS2 MinGW64 Shell
2. Install packages
   ```
   pacman -Syu make mingw-w64-x86_64-gcc mingw-w64-x86_64-go git unzip mingw-w64-x86_64-7zip mingw-w64-x86_64-jq
   ```

#### Linux
1. Run Bash
2. Install packages

   Use the package manager of each distribution to install [packages](#requirements).

### 2. Get Floorp-Portable source code
```
git clone --recursive https://github.com/Floorp-Projects/Floorp-Portable
cd Floorp-Portable
```

### 3. Install Floorp
Create a directory named `core` and place Floorp files in it.

#### Windows
```
curl -L "https://github.com/Floorp-Projects/Floorp/releases/latest/download/floorp-win64.installer.exe" -o floorp-win64.installer.exe
7z x floorp-win64.installer.exe '-ir!core'
```

#### Linux
```
export FLOORP_VERSION="{version}" # Replace "{version}" with latest floorp version, for example: `export FLOORP_VERSION="11.19.1"`
curl -L "https://github.com/Floorp-Projects/Floorp/releases/download/v${FLOORP_VERSION}/floorp-${FLOORP_VERSION}.linux-$(uname -m).tar.bz2" -o floorp-files.tar.bz2
mkdir core
tar -xvf floorp-files.tar.bz2 -C core --strip-components 1
```

### 4. Build
```
./build.sh
```

### 5. Now it is done
The files or directories required to run are those in the `dist` directory.


## Contributions

### Translate
#### For English (en-US)
Please submit a pull request

#### Otherwise
Use Crowdin: https://crowdin.com/project/floorp-portable
