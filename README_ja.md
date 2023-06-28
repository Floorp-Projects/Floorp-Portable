# Floorp Portable

**注意: 今後リリースされるFloorp 11でしか動作しません。**

**警告: これは現在ベータ版です。予期せぬトラブルが発生する可能性があります。**


## 要件
* Windows
  * OS: 10, 11 (x86_64)
  * メモリ: 8GB以上
  * ストレージ: 2GB以上の空き容量
* Linux
  * OS: x86_64
  * メモリ: 8GB以上
  * ストレージ: At least 2GB of free disk space.
  * パッケージ: bubblewrap, glibc, gtk+, libstdc++, xorg


## 構築方法
### 1. Floorpを設置する。
coreディレクトリを作成して、中にFloorpのファイルを設置してください。

### 2. ビルドする
Windows
```
.\build.bat
```
Linux
```
./build.sh
```

### 3. パッチを適用する
ビルドしたpatcher.exeを実行してパッチを適用します。

### 4. これで完了です。
ポータブル版の実行に必要なファイルとディレクトリは、`core`と`floorp.exe`です。


## コンテナーランタイム
Windows: [libportable](https://github.com/adonais/libportable)
Linux: [Bubblewrap](https://github.com/containers/bubblewrap)
