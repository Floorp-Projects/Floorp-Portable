# Floorp Portable

**Note: Currently only Windows is supported. Also, the automatic update feature is not available for versions below 10.8.0.**

**Warning: This is currently a beta version. Unexpected problems may occur.**

The portable runtime uses [libportable](https://github.com/adonais/libportable).

## Requirements
* OS: Windows 10, 11 (x86_64) or Linux (x86_64, aarch64)
* Memory: 4GB+
* Disk Space: At least 2GB of free disk space.

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
