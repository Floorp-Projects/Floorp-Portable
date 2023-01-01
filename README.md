# Floorp Portable

**Note: Currently only Windows is supported.**

## How to build
### 1. Install Floorp
Create a directory named "core" and place Floorp files in it.

### 2. Build each `.go`
```
go build -ldflags="-H windowsgui" floorp.go
```
```
go build patcher.go
```

### 3. Apply the patch
Run the built patcher.exe to apply the patch.

### 4. Now it is done
The files and directories required to run the portable version are `core` and `floorp.exe`.
