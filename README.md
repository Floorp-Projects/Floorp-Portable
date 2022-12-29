# Floorp Portable

**注意: 現在サポートしているのはWindowsのみです。**

## 構築方法
### 1. Floorpを設置する。
coreディレクトリを作成して、中にFloorpのファイルを設置してください。

### 2. 各`.go`をビルドする
```
go build -ldflags="-H windowsgui" floorp.go
```
```
go build patcher.go
```

### 3. パッチを適用する
ビルドしたpatcher.exeを実行してパッチを適用します。

これで完了です。
ポータブル版の実行に必要なファイルとディレクトリは、`core`と`floorp.exe`です。
