# Floorp Portable

**Note: It will only work with the upcoming release of Floorp 11.**

**Warning: This is currently a beta version. Unexpected problems may occur.**


## Requirements
* Windows
  * OS: 10, 11 (x86_64)
  * Memory: 8GB+
  * Disk Space: At least 2GB of free disk space.
* Linux
  * OS: x86_64
  * Memory: 4GB+
  * Disk Space: At least 2GB of free disk space.
  * Packages: bubblewrap, glibc, gtk+, libstdc++, xorg


## How to build
### 1. Install Floorp
Create a directory named "core" and place Floorp files in it.

### 2. Build
Windows
```
.\build.bat
```
Linux
```
./build.sh
```

### 3. Apply the patch
Run the built patcher.exe to apply the patch.

### 4. Now it is done
The files and directories required to run the portable version are `core` and `floorp.exe`.


## Container Runtime
Windows: [libportable](https://github.com/adonais/libportable)
Linux: [Bubblewrap](https://github.com/containers/bubblewrap)
